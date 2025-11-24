-- ============================================================================
-- MIGRATION: Fix RPC subscription accent check
-- Date: 2025-11-18
-- Description: Fix ÉTAPE 5 to accept both 'résilié' (with accent) and
--              'resilie' (without accent) for cancelled subscriptions
-- Bug: Users with 'résilié' status were being asked for payment despite
--      having valid subscription until expiration date
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
  v_type_emprunt TEXT;
  v_montant_paye NUMERIC;

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
    FROM emprunts
    WHERE user_id = p_auth_user_id
      AND movie_id = p_movie_id
      AND statut = 'en_cours'
      AND date_retour > NOW()
    LIMIT 1;

    -- Session existe déjà → la retourner
    IF v_existing_rental_id IS NOT NULL THEN
      RETURN json_build_object(
        'success', true,
        'emprunt_id', v_existing_rental_id,
        'rental_type', 'subscription',
        'amount_charged', 0,
        'existing_rental', true,
        'owns_film', true
      );
    END IF;

    -- ROTATION: Fermer toute session active sur un AUTRE film
    UPDATE emprunts
    SET statut = 'rendu',
        updated_at = NOW()
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
      AND movie_id != p_movie_id;

    -- Créer nouvelle session (gratuite car propriétaire)
    INSERT INTO emprunts (
      user_id, movie_id, statut, type_emprunt, montant_paye,
      date_emprunt, date_retour, created_at, updated_at
    )
    VALUES (
      p_auth_user_id, p_movie_id, 'en_cours', 'abonnement', 0,
      NOW(), NOW() + INTERVAL '48 hours', NOW(), NOW()
    )
    RETURNING id INTO v_new_rental_id;

    RETURN json_build_object(
      'success', true,
      'emprunt_id', v_new_rental_id,
      'rental_type', 'subscription',
      'amount_charged', 0,
      'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
      'owns_film', true
    );

  END IF;

  -- =========================================================================
  -- ÉTAPE 3: USER NE POSSÈDE PAS → Vérifier disponibilité DU FILM DEMANDÉ
  -- =========================================================================

  -- FIX: Vérifier si le propriétaire regarde CE FILM SPÉCIFIQUE
  SELECT NOT EXISTS(
    SELECT 1 FROM emprunts
    WHERE user_id = v_film_owner_id
      AND movie_id = p_movie_id  -- ← FIX: Vérifier ce film spécifique
      AND statut = 'en_cours'
      AND date_retour > NOW()
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
      SELECT 1 FROM emprunts e
      WHERE e.user_id = p_auth_user_id
        AND e.movie_id = fr.movie_id
        AND e.statut = 'en_cours'
        AND e.date_retour > NOW()
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
  -- ÉTAPE 5: Vérifier abonnement OU paiement (FIX: Accepter les deux variantes d'accent)
  -- =========================================================================

  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND (statut = 'actif' OR (statut IN ('résilié', 'resilie') AND date_expiration > NOW()))
  ) INTO v_user_has_subscription;

  IF v_user_has_subscription THEN
    v_type_emprunt := 'abonnement';
    v_montant_paye := 0;
  ELSIF p_payment_id IS NOT NULL THEN
    -- Note: Validation du paiement à implémenter selon votre système
    -- Pour l'instant, on accepte si payment_id fourni
    v_type_emprunt := 'unitaire';
    v_montant_paye := 1.50;
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
    UPDATE emprunts
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

  -- c) Enregistrer l'échange (schéma correct: initiator_id, recipient_id, etc.)
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
    'completed',  -- Échange instantané
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

  -- IMPORTANT: Récupérer le movie_id depuis films_registry après transfert
  SELECT movie_id INTO v_final_movie_id
  FROM films_registry
  WHERE id = v_registry_id;

  INSERT INTO emprunts (
    user_id, movie_id, statut, type_emprunt, montant_paye,
    date_emprunt, date_retour, created_at, updated_at
  )
  VALUES (
    p_auth_user_id,
    v_final_movie_id,  -- Le bon movie_id !
    'en_cours',
    v_type_emprunt,
    v_montant_paye,
    NOW(),
    NOW() + INTERVAL '48 hours',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_rental_id;

  -- Retourner succès avec détails de l'échange
  RETURN json_build_object(
    'success', true,
    'emprunt_id', v_new_rental_id,
    'rental_type', v_type_emprunt,
    'amount_charged', v_montant_paye,
    'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
    'exchange_performed', true,
    'exchange_id', v_exchange_id,
    'owns_film', true
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
COMMENT ON FUNCTION rent_or_access_movie IS 'RPC pour créer sessions et gérer échanges instantanés - Fix subscription accent check (résilié/resilie)';
