-- ============================================================================
-- MIGRATION: Fix rent_or_access_movie - Session rotation et payment field
-- Date: 2025-11-17
-- Description:
--   - BUG 1: Ajouter rotation de session pour films possédés
--   - BUG 2: Corriger requires_payment → requires_payment_choice
-- ============================================================================

CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_registry_id UUID;
  v_film_owner_id UUID;
  v_user_owns_film BOOLEAN;
  v_film_available BOOLEAN;
  v_user_film_to_exchange_id UUID;
  v_type_emprunt TEXT;
  v_montant_paye NUMERIC;
  v_existing_rental_id UUID;
  v_new_rental_id UUID;
  v_user_has_subscription BOOLEAN;
  v_exchange_id UUID;
  v_payment_status TEXT;
BEGIN
  -- ========================================================================
  -- ETAPE 1: Verifier si l utilisateur possede deja le film
  -- ========================================================================
  SELECT
    fr.id,
    fr.current_owner_id,
    (fr.current_owner_id = p_auth_user_id) AS owns_film
  INTO v_registry_id, v_film_owner_id, v_user_owns_film
  FROM films_registry fr
  WHERE fr.movie_id = p_movie_id
  LIMIT 1;

  -- Si le film n est pas dans le registre (pas encore depose)
  IF v_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non disponible dans le registre',
      'code', 'FILM_NOT_IN_REGISTRY'
    );
  END IF;

  -- ========================================================================
  -- ETAPE 2: Si user possede le film → Session de lecture directe (gratuite)
  -- ========================================================================
  IF v_user_owns_film THEN
    -- Verifier si user a deja une session en cours sur CE film
    SELECT id INTO v_existing_rental_id
    FROM emprunts
    WHERE user_id = p_auth_user_id
      AND movie_id = p_movie_id
      AND statut = 'en_cours'
      AND date_retour > NOW()
    LIMIT 1;

    -- Si session existe deja, la retourner
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

    -- FIX BUG 1: Liberer toute session active sur un AUTRE film possédé
    -- Cette rotation s'applique pour TOUS les utilisateurs (pas seulement abonnés)
    UPDATE emprunts
    SET statut = 'rendu',
        updated_at = NOW()
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
      AND movie_id != p_movie_id;

    -- Creer nouvelle session de lecture (gratuite car proprietaire)
    INSERT INTO emprunts (
      user_id,
      movie_id,
      statut,
      type_emprunt,
      montant_paye,
      date_emprunt,
      date_retour,
      created_at,
      updated_at
    )
    VALUES (
      p_auth_user_id,
      p_movie_id,
      'en_cours',
      'abonnement', -- Gratuit comme un abonne
      0,
      NOW(),
      NOW() + INTERVAL '48 hours',
      NOW(),
      NOW()
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

  -- ========================================================================
  -- ETAPE 3: Verifier disponibilite du film (propriétaire n a pas session active)
  -- ========================================================================
  SELECT NOT EXISTS(
    SELECT 1 FROM emprunts
    WHERE user_id = v_film_owner_id
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

  -- ========================================================================
  -- ETAPE 4: Selectionner automatiquement film de l utilisateur a offrir
  -- ========================================================================
  SELECT fr.id INTO v_user_film_to_exchange_id
  FROM films_registry fr
  WHERE fr.current_owner_id = p_auth_user_id
    AND fr.movie_id != p_movie_id
    AND NOT EXISTS(
      SELECT 1 FROM emprunts e
      WHERE e.user_id = p_auth_user_id
        AND e.movie_id = fr.movie_id
        AND e.statut = 'en_cours'
        AND e.date_retour > NOW()
    )
  ORDER BY fr.acquisition_date ASC
  LIMIT 1;

  IF v_user_film_to_exchange_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun film disponible pour l''échange',
      'code', 'NO_FILM_TO_EXCHANGE'
    );
  END IF;

  -- ========================================================================
  -- ETAPE 5: Verifier abonnement OU paiement
  -- ========================================================================
  IF p_payment_id IS NOT NULL THEN
    -- Verifier statut paiement Stripe
    SELECT metadata->>'status' INTO v_payment_status
    FROM stripe_payments
    WHERE id = p_payment_id
      AND user_id = p_auth_user_id;

    IF v_payment_status IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Paiement non trouvé',
        'code', 'PAYMENT_NOT_FOUND'
      );
    END IF;

    IF v_payment_status != 'succeeded' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Paiement non confirmé',
        'code', 'PAYMENT_NOT_SUCCEEDED'
      );
    END IF;

    v_type_emprunt := 'unitaire'; -- Paiement 1.50€
    v_montant_paye := 1.50;
  ELSE
    -- Verifier abonnement
    SELECT EXISTS(
      SELECT 1 FROM user_abonnements
      WHERE user_id = p_auth_user_id
        AND (statut = 'actif' OR (statut = 'resilie' AND date_expiration > NOW()))
    ) INTO v_user_has_subscription;

    IF NOT v_user_has_subscription THEN
      -- FIX BUG 2: Corriger requires_payment → requires_payment_choice
      RETURN json_build_object(
        'success', false,
        'requires_payment_choice', true,
        'amount', 1.50,
        'code', 'PAYMENT_REQUIRED'
      );
    END IF;

    v_type_emprunt := 'abonnement'; -- Gratuit pour abonne
    v_montant_paye := 0;
  END IF;

  -- ========================================================================
  -- ETAPE 6: Liberer ancienne session si abonne (rotation)
  -- ========================================================================

  IF v_user_has_subscription THEN
    SELECT id INTO v_existing_rental_id
    FROM emprunts
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
    LIMIT 1;

    IF v_existing_rental_id IS NOT NULL THEN
      UPDATE emprunts
      SET statut = 'rendu',
          updated_at = NOW()
      WHERE id = v_existing_rental_id;
    END IF;
  END IF;

  -- ========================================================================
  -- ETAPE 7: ECHANGE AUTOMATIQUE INSTANTANE
  -- ========================================================================

  -- Transfert bilateral de propriete
  -- Film demande : proprietaire actuel → utilisateur
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = p_auth_user_id,
    updated_at = NOW()
  WHERE id = v_registry_id;

  -- Film offert : utilisateur → ancien proprietaire du film demande
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = v_film_owner_id,
    updated_at = NOW()
  WHERE id = v_user_film_to_exchange_id;

  -- Enregistrer l echange
  INSERT INTO film_exchanges (
    requester_id,
    requested_film_id,
    offered_film_id,
    status,
    created_at,
    completed_at
  )
  VALUES (
    p_auth_user_id,
    v_registry_id,
    v_user_film_to_exchange_id,
    'completed',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- Historique proprietaire film demande
  INSERT INTO ownership_history (
    registry_id,
    from_user_id,
    to_user_id,
    transfer_type,
    exchange_id,
    created_at
  )
  VALUES (
    v_registry_id,
    v_film_owner_id,
    p_auth_user_id,
    'exchange',
    v_exchange_id,
    NOW()
  );

  -- Historique proprietaire film offert
  INSERT INTO ownership_history (
    registry_id,
    from_user_id,
    to_user_id,
    transfer_type,
    exchange_id,
    created_at
  )
  VALUES (
    v_user_film_to_exchange_id,
    p_auth_user_id,
    v_film_owner_id,
    'exchange',
    v_exchange_id,
    NOW()
  );

  -- ========================================================================
  -- ETAPE 8: Creer session de lecture sur le film POSSEDE (apres echange)
  -- ========================================================================
  INSERT INTO emprunts (
    user_id,
    movie_id,
    statut,
    type_emprunt,
    montant_paye,
    date_emprunt,
    date_retour,
    created_at,
    updated_at
  )
  VALUES (
    p_auth_user_id,
    p_movie_id,
    'en_cours',
    v_type_emprunt,
    v_montant_paye,
    NOW(),
    NOW() + INTERVAL '48 hours',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_rental_id;

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
