-- ============================================================================
-- MIGRATION: Correction Bug #1 - Validation paiement Stripe
-- Date: 2025-11-21
-- Description: Ajoute validation du paiement Stripe dans rent_or_access_movie
--              pour empêcher échanges frauduleux avec payment_id invalides
-- Bug: Scénario #27 - Aucune vérification payments.status = 'succeeded'
-- ============================================================================

-- Recréer le RPC rent_or_access_movie avec validation paiement
CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registry_id UUID;
  v_film_owner_id UUID;
  v_user_owns_film BOOLEAN;
  v_film_available BOOLEAN;
  v_offered_film_id UUID;
  v_offered_registry_id UUID;
  v_user_has_subscription BOOLEAN;
  v_session_type TEXT;
  v_amount_paid NUMERIC;
  v_new_rental_id UUID;
  v_existing_rental_id UUID;
  v_exchange_id UUID;
  v_payment_valid BOOLEAN;
BEGIN

  -- ============================================================================
  -- ÉTAPE 1: Récupérer informations du film demandé
  -- ============================================================================

  SELECT
    fr.id,
    fr.current_owner_id,
    (fr.current_owner_id = p_auth_user_id) AS owns_film
  INTO v_registry_id, v_film_owner_id, v_user_owns_film
  FROM films_registry fr
  WHERE fr.movie_id = p_movie_id
  -- ✅ BUG #3 CORRIGÉ: ORDER BY déterministe
  ORDER BY
    -- Prioriser copies disponibles (sans session active)
    CASE WHEN NOT EXISTS(
      SELECT 1 FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
      AND vs.statut = 'en_cours'
      AND vs.return_date > NOW()
    ) THEN 0 ELSE 1 END,
    -- Puis la plus ancienne
    fr.acquisition_date ASC
  LIMIT 1;

  IF v_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non disponible dans le registre',
      'code', 'FILM_NOT_IN_REGISTRY'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 2: SI USER POSSÈDE LE FILM → Session directe (SKIP échange)
  -- ============================================================================

  IF v_user_owns_film THEN

    -- Vérifier si session existante
    SELECT id INTO v_existing_rental_id
    FROM viewing_sessions
    WHERE user_id = p_auth_user_id
      AND registry_id = v_registry_id
      AND statut = 'en_cours'
      AND return_date > NOW();

    IF v_existing_rental_id IS NOT NULL THEN
      RETURN json_build_object(
        'success', true,
        'emprunt_id', v_existing_rental_id,
        'existing_rental', true,
        'owns_film', true
      );
    END IF;

    -- Rotation: Fermer toute session active sur un AUTRE film
    UPDATE viewing_sessions
    SET statut = 'rendu', updated_at = NOW()
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

  -- ============================================================================
  -- ÉTAPE 3: Vérifier disponibilité du film demandé
  -- ============================================================================

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

  -- ============================================================================
  -- ÉTAPE 4: Sélectionner film de l'utilisateur à offrir en échange
  -- ============================================================================

  SELECT fr.id, fr.id
  INTO v_offered_film_id, v_offered_registry_id
  FROM films_registry fr
  WHERE fr.current_owner_id = p_auth_user_id
    AND NOT EXISTS(
      SELECT 1 FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
    )
  ORDER BY fr.acquisition_date ASC
  LIMIT 1;

  IF v_offered_film_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun film disponible pour l''échange',
      'code', 'NO_FILM_TO_EXCHANGE'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 5: Vérifier abonnement OU paiement
  -- ============================================================================

  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND statut IN ('actif', 'résilié', 'resilie')
      AND date_expiration > NOW()
  ) INTO v_user_has_subscription;

  IF v_user_has_subscription THEN
    v_session_type := 'subscription';
    v_amount_paid := 0;
  ELSE
    -- 🔴 BUG #1 CORRIGÉ: Validation paiement Stripe
    IF p_payment_id IS NOT NULL THEN

      -- Vérifier que le paiement existe, est succeeded, et appartient au user
      SELECT EXISTS(
        SELECT 1 FROM payments
        WHERE id = p_payment_id
          AND user_id = p_auth_user_id
          AND status = 'succeeded'
      ) INTO v_payment_valid;

      IF NOT v_payment_valid THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Paiement invalide ou non confirmé',
          'code', 'PAYMENT_NOT_SUCCEEDED'
        );
      END IF;

      v_session_type := 'unit';
      v_amount_paid := 1.50;
    ELSE
      RETURN json_build_object(
        'success', false,
        'requires_payment_choice', true,
        'amount', 1.50,
        'code', 'PAYMENT_REQUIRED'
      );
    END IF;
  END IF;

  -- ============================================================================
  -- ÉTAPE 6: Rotation - Fermer session active (POUR TOUS)
  -- ============================================================================

  -- 🟠 BUG #2 CORRIGÉ: Rotation appliquée à TOUS (abonnés + non-abonnés)
  -- Garantit règle "1 film à la fois" pour tous les utilisateurs
  UPDATE viewing_sessions
  SET statut = 'rendu', updated_at = NOW()
  WHERE user_id = p_auth_user_id
    AND statut = 'en_cours'
    AND movie_id != p_movie_id;

  -- ============================================================================
  -- ÉTAPE 7: Échange instantané (transfert bilatéral atomique)
  -- ============================================================================

  -- Transfert de propriété bilatéral
  UPDATE films_registry
  SET current_owner_id = p_auth_user_id,
      previous_owner_id = v_film_owner_id,
      transfer_date = NOW(),
      updated_at = NOW()
  WHERE id = v_registry_id;

  UPDATE films_registry
  SET current_owner_id = v_film_owner_id,
      previous_owner_id = p_auth_user_id,
      transfer_date = NOW(),
      updated_at = NOW()
  WHERE id = v_offered_registry_id;

  -- Historique de propriété (2 transferts)
  INSERT INTO ownership_history (
    film_registry_id, from_owner_id, to_owner_id, transfer_type, transfer_date, created_at
  )
  VALUES
    (v_registry_id, v_film_owner_id, p_auth_user_id, 'exchange', NOW(), NOW()),
    (v_offered_registry_id, p_auth_user_id, v_film_owner_id, 'exchange', NOW(), NOW());

  -- Enregistrer l'échange
  INSERT INTO film_exchanges (
    initiator_id, recipient_id, film_requested_id, film_offered_id,
    status, proposed_at, completed_at, payment_id, created_at, updated_at
  )
  VALUES (
    p_auth_user_id, v_film_owner_id, v_registry_id, v_offered_registry_id,
    'completed', NOW(), NOW(), p_payment_id, NOW(), NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- ============================================================================
  -- ÉTAPE 8: Créer session de lecture sur film nouvellement possédé
  -- ============================================================================

  INSERT INTO viewing_sessions (
    user_id, registry_id, movie_id, statut, session_type, amount_paid,
    session_start_date, return_date, payment_id, created_at, updated_at
  )
  VALUES (
    p_auth_user_id, v_registry_id, p_movie_id, 'en_cours', v_session_type, v_amount_paid,
    NOW(), NOW() + INTERVAL '48 hours', p_payment_id, NOW(), NOW()
  )
  RETURNING id INTO v_new_rental_id;

  -- ============================================================================
  -- RETOUR SUCCÈS
  -- ============================================================================

  RETURN json_build_object(
    'success', true,
    'emprunt_id', v_new_rental_id,
    'registry_id', v_registry_id,
    'exchange_performed', true,
    'exchange_id', v_exchange_id,
    'rental_type', v_session_type,
    'amount_charged', v_amount_paid,
    'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
    'owns_film', true
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'INTERNAL_ERROR'
  );
END;
$$;

-- ============================================================================
-- COMMENTAIRES ET NOTES
-- ============================================================================

COMMENT ON FUNCTION rent_or_access_movie IS
'Point d''entrée UNIQUE pour lecture films possédés ET échanges instantanés.
CORRECTIONS APPLIQUÉES (2025-11-21):
- Bug #1: Validation paiement Stripe (ligne 197-211)
- Bug #2: Rotation pour TOUS les utilisateurs (ligne 225-231)
- Bug #3: Sélection copie déterministe avec ORDER BY (ligne 44-54)';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
