-- ============================================================================
-- MIGRATION: Fix rent_or_access_movie - Complete avec echanges automatiques
-- Date: 2025-11-17
-- Description: Correction du RPC pour gerer les echanges automatiques
--              avec types d'emprunt corrects (unitaire/abonnement uniquement)
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
      'existing_rental', false,
      'owns_film', true
    );
  END IF;

  -- ========================================================================
  -- ETAPE 3: User ne possede PAS le film → Verifier disponibilite
  -- ========================================================================

  -- Verifier si le proprietaire actuel a une session active
  SELECT NOT EXISTS(
    SELECT 1 FROM emprunts
    WHERE user_id = v_film_owner_id
      AND movie_id = p_movie_id
      AND statut = 'en_cours'
      AND date_retour > NOW()
  ) INTO v_film_available;

  IF NOT v_film_available THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Le film est actuellement en cours de lecture par son proprietaire',
      'code', 'FILM_NOT_AVAILABLE'
    );
  END IF;

  -- ========================================================================
  -- ETAPE 4: Trouver automatiquement un film disponible de l utilisateur
  -- ========================================================================

  SELECT fr.id INTO v_user_film_to_exchange_id
  FROM films_registry fr
  WHERE fr.current_owner_id = p_auth_user_id
    AND fr.id != v_registry_id  -- Pas le meme film
    AND NOT EXISTS(
      -- Film pas en cours de lecture par l utilisateur
      SELECT 1 FROM emprunts e
      WHERE e.movie_id = fr.movie_id
        AND e.user_id = p_auth_user_id
        AND e.statut = 'en_cours'
        AND e.date_retour > NOW()
    )
  ORDER BY fr.acquisition_date ASC  -- Le plus ancien en premier
  LIMIT 1;

  IF v_user_film_to_exchange_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous n avez aucun film disponible a echanger (tous en cours de lecture)',
      'code', 'NO_FILM_TO_EXCHANGE'
    );
  END IF;

  -- ========================================================================
  -- ETAPE 5: Verifier abonnement OU paiement
  -- ========================================================================

  -- Verifier si paiement fourni et succeeded
  IF p_payment_id IS NOT NULL THEN
    SELECT status INTO v_payment_status
    FROM payments
    WHERE id = p_payment_id
      AND user_id = p_auth_user_id;

    IF v_payment_status IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Paiement introuvable',
        'code', 'PAYMENT_NOT_FOUND'
      );
    END IF;

    IF v_payment_status != 'succeeded' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Le paiement n a pas ete confirme',
        'code', 'PAYMENT_NOT_SUCCEEDED'
      );
    END IF;

    -- Paiement valide
    v_user_has_subscription := false;
    v_type_emprunt := 'unitaire'; -- Paiement 1.50 euros
    v_montant_paye := 1.5;
  ELSE
    -- Verifier abonnement
    SELECT EXISTS(
      SELECT 1 FROM user_abonnements
      WHERE user_id = p_auth_user_id
        AND (statut = 'actif' OR (statut = 'resilie' AND date_expiration > NOW()))
    ) INTO v_user_has_subscription;

    IF NOT v_user_has_subscription THEN
      -- Non-abonne et pas de paiement → requires_payment
      RETURN json_build_object(
        'success', false,
        'requires_payment', true,
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
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange'
  WHERE id = v_registry_id;

  -- Film offert : utilisateur → proprietaire du film demande
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = v_film_owner_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange'
  WHERE id = v_user_film_to_exchange_id;

  -- Creer entree d echange dans l historique
  INSERT INTO film_exchanges (
    initiator_id,
    recipient_id,
    film_offered_id,
    film_requested_id,
    status,
    proposed_at,
    responded_at,
    completed_at,
    payment_id
  )
  VALUES (
    p_auth_user_id,
    v_film_owner_id,
    v_user_film_to_exchange_id,
    v_registry_id,
    'completed',
    NOW(),
    NOW(),
    NOW(),
    p_payment_id
  )
  RETURNING id INTO v_exchange_id;

  -- Mettre a jour l historique de propriete avec l ID d echange
  UPDATE ownership_history
  SET exchange_id = v_exchange_id
  WHERE film_registry_id IN (v_registry_id, v_user_film_to_exchange_id)
    AND transfer_date >= NOW() - INTERVAL '1 second';

  -- ========================================================================
  -- ETAPE 8: Creer session de lecture sur le nouveau film possede
  -- ========================================================================

  INSERT INTO emprunts (
    user_id,
    movie_id,
    statut,
    type_emprunt,
    montant_paye,
    date_emprunt,
    date_retour,
    payment_id,
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
    p_payment_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_rental_id;

  -- ========================================================================
  -- ETAPE 9: Retourner le resultat
  -- ========================================================================

  RETURN json_build_object(
    'success', true,
    'emprunt_id', v_new_rental_id,
    'rental_type', CASE
      WHEN v_type_emprunt = 'abonnement' THEN 'subscription'
      WHEN v_type_emprunt = 'unitaire' THEN 'paid'
      ELSE v_type_emprunt
    END,
    'amount_charged', v_montant_paye,
    'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
    'previous_rental_released', v_existing_rental_id IS NOT NULL,
    'previous_rental_id', v_existing_rental_id,
    'existing_rental', false,
    'exchange_performed', true,
    'exchange_id', v_exchange_id,
    'owns_film', true  -- Maintenant user possede le film
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

COMMENT ON FUNCTION rent_or_access_movie IS 'Point d entree unique pour lecture de films : gere propriete, echange automatique, et sessions de lecture (48h)';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
