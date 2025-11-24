-- ============================================================================
-- MIGRATION: Mise à jour RPC rent_or_access_movie pour viewing_sessions
-- Date: 2025-11-20
-- Description: Remplace toutes références emprunts → viewing_sessions
--              Ajoute registry_id dans les INSERT
--              Mapping colonnes et valeurs (abonnement→subscription, etc.)
-- ============================================================================

CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  -- Variables de base
  v_registry_id UUID;
  v_film_owner_id UUID;
  v_user_owns_film BOOLEAN;

  -- Variables pour l'échange
  v_user_film_registry_id UUID;
  v_film_available BOOLEAN;
  v_exchange_id UUID;

  -- Variables pour session et paiement
  v_existing_rental_id UUID;
  v_new_rental_id UUID;
  v_user_has_subscription BOOLEAN;
  v_session_type TEXT;
  v_amount_paid NUMERIC;

  -- Variables pour le film après échange
  v_final_movie_id UUID;
BEGIN

  -- =========================================================================
  -- ÉTAPE 1: Récupérer informations du film demandé
  -- =========================================================================

  SELECT
    fr.id,
    fr.current_owner_id,
    (fr.current_owner_id = p_auth_user_id) AS owns_film
  INTO v_registry_id, v_film_owner_id, v_user_owns_film
  FROM films_registry fr
  WHERE fr.movie_id = p_movie_id
  LIMIT 1;

  -- Film pas encore déposé dans le système
  IF v_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non disponible dans le registre',
      'code', 'FILM_NOT_IN_REGISTRY'
    );
  END IF;

  -- =========================================================================
  -- ÉTAPE 2: SI USER POSSÈDE LE FILM → Session directe
  -- =========================================================================

  IF v_user_owns_film THEN

    -- Vérifier si session existe déjà sur CE film
    SELECT id INTO v_existing_rental_id
    FROM viewing_sessions
    WHERE user_id = p_auth_user_id
      AND movie_id = p_movie_id
      AND statut = 'en_cours'
      AND return_date > NOW()
    LIMIT 1;

    -- Session existe déjà → la retourner
    IF v_existing_rental_id IS NOT NULL THEN
      RETURN json_build_object(
        'success', true,
        'emprunt_id', v_existing_rental_id,
        'rental_type', 'subscription',
        'amount_charged', 0,
        'existing_rental', true,
        'owns_film', true,
        'registry_id', v_registry_id
      );
    END IF;

    -- ROTATION: Fermer toute session active sur un AUTRE film
    UPDATE viewing_sessions
    SET statut = 'rendu',
        updated_at = NOW()
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
      AND movie_id != p_movie_id;

    -- Créer nouvelle session (gratuite car propriétaire)
    INSERT INTO viewing_sessions (
      user_id, registry_id, movie_id, statut, session_type, amount_paid,
      session_start_date, return_date, created_at, updated_at
    )
    VALUES (
      p_auth_user_id, v_registry_id, p_movie_id, 'en_cours', 'subscription', 0,
      NOW(), NOW() + INTERVAL '48 hours', NOW(), NOW()
    )
    RETURNING id INTO v_new_rental_id;

    RETURN json_build_object(
      'success', true,
      'emprunt_id', v_new_rental_id,
      'rental_type', 'subscription',
      'amount_charged', 0,
      'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
      'owns_film', true,
      'registry_id', v_registry_id
    );

  END IF;

  -- =========================================================================
  -- ÉTAPE 3: USER NE POSSÈDE PAS → Vérifier disponibilité DU FILM DEMANDÉ
  -- =========================================================================

  -- Vérifier si la copie physique spécifique est en cours de visionnage
  SELECT NOT EXISTS(
    SELECT 1 FROM viewing_sessions
    WHERE registry_id = v_registry_id
      AND statut = 'en_cours'
      AND return_date > NOW()
  ) INTO v_film_available;

  IF NOT v_film_available THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film actuellement indisponible (en cours de lecture par le propriétaire)',
      'code', 'FILM_NOT_AVAILABLE'
    );
  END IF;

  -- =========================================================================
  -- ÉTAPE 4: Sélectionner automatiquement film de l'user à offrir
  -- =========================================================================

  SELECT fr.id INTO v_user_film_registry_id
  FROM films_registry fr
  WHERE fr.current_owner_id = p_auth_user_id
    AND fr.movie_id != p_movie_id
    -- Film pas actuellement en session
    AND NOT EXISTS(
      SELECT 1 FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
    )
  ORDER BY fr.acquisition_date ASC
  LIMIT 1;

  IF v_user_film_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun film disponible pour l''échange',
      'code', 'NO_FILM_TO_EXCHANGE'
    );
  END IF;

  -- =========================================================================
  -- ÉTAPE 5: Vérifier abonnement OU paiement
  -- =========================================================================

  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND (statut = 'actif' OR (statut IN ('résilié', 'resilie') AND date_expiration > NOW()))
  ) INTO v_user_has_subscription;

  IF v_user_has_subscription THEN
    v_session_type := 'subscription';
    v_amount_paid := 0;
  ELSIF p_payment_id IS NOT NULL THEN
    v_session_type := 'unit';
    v_amount_paid := 1.50;
  ELSE
    -- Ni abonné ni paiement → demander paiement
    RETURN json_build_object(
      'success', false,
      'requires_payment_choice', true,
      'amount', 1.50,
      'code', 'PAYMENT_REQUIRED'
    );
  END IF;

  -- =========================================================================
  -- ÉTAPE 6: Fermer ancienne session si abonné (rotation)
  -- =========================================================================

  IF v_user_has_subscription THEN
    UPDATE viewing_sessions
    SET statut = 'rendu',
        updated_at = NOW()
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours';
  END IF;

  -- =========================================================================
  -- ÉTAPE 7: ÉCHANGE INSTANTANÉ ATOMIQUE
  -- =========================================================================

  -- a) Transfert film demandé: propriétaire actuel → utilisateur
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = p_auth_user_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange',
    updated_at = NOW()
  WHERE id = v_registry_id;

  -- b) Transfert film offert: utilisateur → ancien propriétaire
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = v_film_owner_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange',
    updated_at = NOW()
  WHERE id = v_user_film_registry_id;

  -- c) Enregistrer l'échange
  INSERT INTO film_exchanges (
    initiator_id,
    recipient_id,
    film_offered_id,
    film_requested_id,
    status,
    proposed_at,
    responded_at,
    completed_at,
    payment_id,
    created_at,
    updated_at
  )
  VALUES (
    p_auth_user_id,
    v_film_owner_id,
    v_user_film_registry_id,
    v_registry_id,
    'completed',
    NOW(),
    NOW(),
    NOW(),
    p_payment_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- =========================================================================
  -- ÉTAPE 8: Créer session sur le film MAINTENANT POSSÉDÉ
  -- =========================================================================

  -- Récupérer le movie_id depuis films_registry après transfert
  SELECT movie_id INTO v_final_movie_id
  FROM films_registry
  WHERE id = v_registry_id;

  INSERT INTO viewing_sessions (
    user_id, registry_id, movie_id, statut, session_type, amount_paid,
    session_start_date, return_date, created_at, updated_at, payment_id
  )
  VALUES (
    p_auth_user_id,
    v_registry_id,
    v_final_movie_id,
    'en_cours',
    v_session_type,
    v_amount_paid,
    NOW(),
    NOW() + INTERVAL '48 hours',
    NOW(),
    NOW(),
    p_payment_id
  )
  RETURNING id INTO v_new_rental_id;

  -- Retourner succès avec détails de l'échange
  RETURN json_build_object(
    'success', true,
    'emprunt_id', v_new_rental_id,
    'rental_type', v_session_type,
    'amount_charged', v_amount_paid,
    'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
    'exchange_performed', true,
    'exchange_id', v_exchange_id,
    'owns_film', true,
    'registry_id', v_registry_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION rent_or_access_movie IS 'RPC pour créer sessions et gérer échanges instantanés - Utilise viewing_sessions avec registry_id pour support multi-copies';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
