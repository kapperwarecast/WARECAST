-- ============================================================================
-- MIGRATION: Add p_registry_id parameter to rent_or_access_movie
-- Date: 2025-11-23
-- Description: Support pour multi-copies physiques du même film
--
-- Ajout d'un paramètre optionnel p_registry_id qui permet de spécifier
-- exactement quelle copie physique utiliser quand l'utilisateur en possède plusieurs.
--
-- Si p_registry_id est fourni, le RPC utilisera cette copie directement.
-- Sinon, comportement existant (sélection automatique par movie_id).
-- ============================================================================

-- Drop old function signature
DROP FUNCTION IF EXISTS rent_or_access_movie(UUID, UUID, UUID);

-- Create new function with registry_id parameter
CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_registry_id UUID DEFAULT NULL,  -- ✅ NOUVEAU: Spécifier quelle copie physique
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Si p_registry_id fourni (owned film), utiliser directement
  IF p_registry_id IS NOT NULL THEN
    SELECT
      fr.id,
      fr.current_owner_id,
      (fr.current_owner_id = p_auth_user_id) AS owns_film
    INTO v_registry_id, v_film_owner_id, v_user_owns_film
    FROM films_registry fr
    WHERE fr.id = p_registry_id
      AND fr.movie_id = p_movie_id;

    IF v_registry_id IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Copie physique introuvable',
        'code', 'REGISTRY_NOT_FOUND'
      );
    END IF;
  ELSE
    -- Sinon, sélection automatique par movie_id (comportement existant)
    SELECT
      fr.id,
      fr.current_owner_id,
      (fr.current_owner_id = p_auth_user_id) AS owns_film
    INTO v_registry_id, v_film_owner_id, v_user_owns_film
    FROM films_registry fr
    WHERE fr.movie_id = p_movie_id
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
  END IF;

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

    -- Vérifier si session existante sur CETTE copie physique
    SELECT id INTO v_existing_rental_id
    FROM viewing_sessions
    WHERE user_id = p_auth_user_id
      AND registry_id = v_registry_id
      AND statut = 'en_cours'
      AND return_date > NOW()
    LIMIT 1;

    -- Session existe déjà → la retourner
    IF v_existing_rental_id IS NOT NULL THEN
      RETURN json_build_object(
        'success', true,
        'session_id', v_existing_rental_id,
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
      AND registry_id != v_registry_id;

    -- Créer nouvelle session (gratuite car propriétaire)
    INSERT INTO viewing_sessions (
      user_id, registry_id, movie_id, statut, session_type, amount_paid,
      session_start_date, return_date
    )
    VALUES (
      p_auth_user_id, v_registry_id, p_movie_id, 'en_cours', 'subscription', 0,
      NOW(), NOW() + INTERVAL '48 hours'
    )
    RETURNING id INTO v_new_rental_id;

    RETURN json_build_object(
      'success', true,
      'session_id', v_new_rental_id,
      'rental_type', 'subscription',
      'amount_charged', 0,
      'expires_at', NOW() + INTERVAL '48 hours',
      'previous_rental_released', true,
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
      'error', 'Film actuellement regardé par son propriétaire',
      'code', 'FILM_NOT_AVAILABLE'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 4: ROTATION AVANT SÉLECTION (pour utilisateurs payants)
  -- ============================================================================

  UPDATE viewing_sessions
  SET statut = 'rendu',
      updated_at = NOW()
  WHERE user_id = p_auth_user_id
    AND statut = 'en_cours';

  -- ============================================================================
  -- ÉTAPE 5: Sélectionner film de l'utilisateur à offrir (échange)
  -- ============================================================================

  SELECT fr.id, fr.movie_id
  INTO v_offered_registry_id, v_offered_film_id
  FROM films_registry fr
  WHERE fr.current_owner_id = p_auth_user_id
    AND fr.id != v_registry_id
    AND NOT EXISTS(
      SELECT 1 FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
    )
  ORDER BY fr.acquisition_date ASC
  LIMIT 1;

  IF v_offered_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun film disponible à échanger',
      'code', 'NO_FILM_TO_EXCHANGE'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 6: Vérifier abonnement ou paiement
  -- ============================================================================

  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND statut IN ('actif', 'résilié')
      AND date_expiration > NOW()
  ) INTO v_user_has_subscription;

  IF v_user_has_subscription THEN
    v_session_type := 'subscription';
    v_amount_paid := 0;
  ELSIF p_payment_id IS NOT NULL THEN
    SELECT status = 'succeeded' INTO v_payment_valid
    FROM payments
    WHERE id = p_payment_id;

    IF NOT v_payment_valid THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Paiement non confirmé',
        'code', 'PAYMENT_NOT_SUCCEEDED'
      );
    END IF;

    v_session_type := 'unit';
    v_amount_paid := 1.5;
  ELSE
    RETURN json_build_object(
      'success', false,
      'requires_payment_choice', true,
      'code', 'PAYMENT_REQUIRED'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 7: ÉCHANGE INSTANTANÉ (transfert bilatéral)
  -- ============================================================================

  UPDATE films_registry SET current_owner_id = p_auth_user_id WHERE id = v_registry_id;
  UPDATE films_registry SET current_owner_id = v_film_owner_id WHERE id = v_offered_registry_id;

  INSERT INTO ownership_history (registry_id, from_user_id, to_user_id, transfer_type)
  VALUES (v_registry_id, v_film_owner_id, p_auth_user_id, 'exchange');

  INSERT INTO ownership_history (registry_id, from_user_id, to_user_id, transfer_type)
  VALUES (v_offered_registry_id, p_auth_user_id, v_film_owner_id, 'exchange');

  INSERT INTO film_exchanges (
    initiator_id, recipient_id, initiator_film_id, recipient_film_id,
    status, completed_at
  )
  VALUES (
    p_auth_user_id, v_film_owner_id, v_offered_film_id, p_movie_id,
    'completed', NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- ============================================================================
  -- ÉTAPE 8: Créer session sur le film ACQUIS
  -- ============================================================================

  INSERT INTO viewing_sessions (
    user_id, registry_id, movie_id, statut, session_type, amount_paid,
    session_start_date, return_date, payment_id
  )
  VALUES (
    p_auth_user_id, v_registry_id, p_movie_id, 'en_cours', v_session_type, v_amount_paid,
    NOW(), NOW() + INTERVAL '48 hours', p_payment_id
  )
  RETURNING id INTO v_new_rental_id;

  RETURN json_build_object(
    'success', true,
    'session_id', v_new_rental_id,
    'rental_type', v_session_type,
    'amount_charged', v_amount_paid,
    'expires_at', NOW() + INTERVAL '48 hours',
    'exchange_performed', true,
    'exchange_id', v_exchange_id,
    'registry_id', v_registry_id
  );

END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION rent_or_access_movie IS 'Crée une session de visionnage (48h) sur un film. Support multi-copies via p_registry_id optionnel. Effectue échange automatique si nécessaire.';
