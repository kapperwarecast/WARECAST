-- ============================================================================
-- MIGRATION: Fix payment status check (succeeded → completed)
-- Date: 2025-11-24
-- Description:
--   RÉGRESSION DÉTECTÉE: Le refactor du 24/11 a annulé le fix du 22/11
--
--   Problème: Non-abonnés peuvent payer mais l'échange ne se fait pas
--   Root cause: RPC vérifie status = 'succeeded' mais webhook définit 'completed'
--
--   Webhook (app/api/stripe/webhook/route.ts:57): status = 'completed'
--   RPC (ligne 242): SELECT status = 'succeeded' ❌
--
--   Solution: Restaurer le fix de 20251122_fix_payment_status_completed.sql
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS rent_or_access_movie(UUID, UUID, UUID, UUID);

-- Create with CORRECT payment status check
CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_registry_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Infos d'accès (via RPC existant)
  v_access_info JSON;
  v_has_active_session BOOLEAN;
  v_owns_film BOOLEAN;
  v_is_available BOOLEAN;

  -- Copie physique sélectionnée (REQUESTED)
  v_registry_id UUID;
  v_film_owner_id UUID;

  -- Échange - OFFERED film (REGISTRY ID uniquement, pas movie_id)
  v_offered_registry_id UUID;

  -- Session et paiement
  v_existing_rental_id UUID;
  v_new_rental_id UUID;
  v_user_has_subscription BOOLEAN;
  v_session_type TEXT;
  v_amount_paid NUMERIC;
  v_payment_valid BOOLEAN := FALSE;
  v_exchange_id UUID;
BEGIN

  -- ============================================================================
  -- ÉTAPE 0: Récupérer infos d'accès (via RPC existant)
  -- ============================================================================

  SELECT get_movie_access_info(p_auth_user_id, p_movie_id)
  INTO v_access_info;

  v_has_active_session := (v_access_info->>'hasActiveSession')::BOOLEAN;
  v_owns_film := (v_access_info->>'ownsFilm')::BOOLEAN;
  v_is_available := (v_access_info->>'isAvailable')::BOOLEAN;

  -- ============================================================================
  -- ÉTAPE 1: Si session active existante → Retourner directement
  -- ============================================================================

  IF v_has_active_session THEN
    SELECT vs.id, fr.id INTO v_existing_rental_id, v_registry_id
    FROM viewing_sessions vs
    JOIN films_registry fr ON fr.id = vs.registry_id
    WHERE vs.user_id = p_auth_user_id
      AND fr.movie_id = p_movie_id
      AND vs.statut = 'en_cours'
      AND vs.return_date > NOW()
    LIMIT 1;

    RETURN json_build_object(
      'success', true,
      'session_id', v_existing_rental_id,
      'rental_type', 'subscription',
      'amount_charged', 0,
      'existing_rental', true,
      'owns_film', v_owns_film,
      'registry_id', v_registry_id
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 2: Sélectionner copie physique (avec ou sans registry_id)
  -- ============================================================================

  IF p_registry_id IS NOT NULL THEN
    -- Copie explicite fournie
    SELECT fr.id, fr.current_owner_id
    INTO v_registry_id, v_film_owner_id
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
    -- Sélection automatique (copie disponible prioritaire)
    SELECT fr.id, fr.current_owner_id
    INTO v_registry_id, v_film_owner_id
    FROM films_registry fr
    WHERE fr.movie_id = p_movie_id
      AND NOT EXISTS(
        SELECT 1 FROM viewing_sessions vs
        WHERE vs.registry_id = fr.id
          AND vs.statut = 'en_cours'
          AND vs.return_date > NOW()
      )
    ORDER BY fr.acquisition_date ASC
    LIMIT 1;

    -- Fallback: Copie occupée (pour retour d'erreur détaillé)
    IF v_registry_id IS NULL THEN
      SELECT fr.id, fr.current_owner_id
      INTO v_registry_id, v_film_owner_id
      FROM films_registry fr
      WHERE fr.movie_id = p_movie_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non disponible dans le registre',
      'code', 'FILM_NOT_IN_REGISTRY'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 3: Si user possède le film → Session directe (SKIP échange)
  -- ============================================================================

  IF v_owns_film THEN
    -- Rotation: Fermer autres sessions actives
    UPDATE viewing_sessions
    SET statut = 'rendu', updated_at = NOW()
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
      AND registry_id != v_registry_id;

    -- Créer session gratuite
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
  -- ÉTAPE 4: Vérifier disponibilité (via RPC déjà appelé)
  -- ============================================================================

  IF NOT v_is_available THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film actuellement regardé par son propriétaire',
      'code', 'FILM_NOT_AVAILABLE'
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 5: Rotation avant échange (pour utilisateurs payants)
  -- ============================================================================

  UPDATE viewing_sessions
  SET statut = 'rendu', updated_at = NOW()
  WHERE user_id = p_auth_user_id
    AND statut = 'en_cours';

  -- ============================================================================
  -- ÉTAPE 6: Sélectionner film à offrir (échange)
  -- ============================================================================

  -- ✅ FIX: Sélectionner UNIQUEMENT le registry_id (pas besoin de movie_id)
  -- film_exchanges.film_offered_id attend films_registry.id
  SELECT fr.id
  INTO v_offered_registry_id
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
  -- ÉTAPE 7: Vérifier abonnement ou paiement
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
    -- ✅ FIX CRITIQUE: Vérifier 'completed' (pas 'succeeded')
    -- Le webhook Stripe définit status = 'completed' (app/api/stripe/webhook/route.ts:57)
    SELECT COALESCE(
      (SELECT status = 'completed' FROM payments WHERE id = p_payment_id),
      FALSE
    ) INTO v_payment_valid;

    IF NOT v_payment_valid THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Paiement non confirmé ou introuvable',
        'code', 'PAYMENT_NOT_SUCCEEDED',
        'payment_id', p_payment_id
      );
    END IF;

    v_session_type := 'unit';
    v_amount_paid := 1.5;
  ELSE
    RETURN json_build_object(
      'success', false,
      'requires_payment_choice', true,
      'code', 'PAYMENT_REQUIRED',
      'amount', 1.5
    );
  END IF;

  -- ============================================================================
  -- ÉTAPE 8: ÉCHANGE INSTANTANÉ (transfert bilatéral)
  -- ============================================================================

  -- Mettre à jour transfer_date + acquisition_method pour trigger
  UPDATE films_registry
  SET current_owner_id = p_auth_user_id,
      transfer_date = NOW(),
      acquisition_method = 'exchange'
  WHERE id = v_registry_id;

  UPDATE films_registry
  SET current_owner_id = v_film_owner_id,
      transfer_date = NOW(),
      acquisition_method = 'exchange'
  WHERE id = v_offered_registry_id;

  -- Le trigger record_ownership_transfer() gère ownership_history automatiquement

  -- ✅ FIX FINAL: Utiliser REGISTRY IDs pour respecter FK constraints
  -- film_offered_id → films_registry(id) [PAS movies(id)]
  -- film_requested_id → films_registry(id) [PAS movies(id)]
  INSERT INTO film_exchanges (
    initiator_id,
    recipient_id,
    film_offered_id,      -- ✅ films_registry.id
    film_requested_id,    -- ✅ films_registry.id
    status,
    completed_at
  )
  VALUES (
    p_auth_user_id,           -- Initiator
    v_film_owner_id,          -- Recipient (previous owner)
    v_offered_registry_id,    -- ✅ CORRECT: Registry ID of offered film
    v_registry_id,            -- ✅ CORRECT: Registry ID of requested film
    'completed',
    NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- ============================================================================
  -- ÉTAPE 9: Créer session sur film acquis
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

-- ============================================================================
-- BLOC EXCEPTION GLOBAL
-- ============================================================================
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'INTERNAL_ERROR',
      'sqlstate', SQLSTATE,
      'hint', CASE
        WHEN SQLSTATE = '23503' THEN 'Violation de clé étrangère (donnée référencée manquante)'
        WHEN SQLSTATE = '23505' THEN 'Violation d''unicité (enregistrement dupliqué)'
        WHEN SQLSTATE = '42P01' THEN 'Table ou relation introuvable'
        WHEN SQLSTATE = '22P02' THEN 'Format UUID invalide'
        WHEN SQLSTATE = '23502' THEN 'Violation de contrainte NOT NULL'
        ELSE 'Erreur SQL inattendue - consultez les logs PostgreSQL'
      END
    );
END;
$$;

COMMENT ON FUNCTION rent_or_access_movie(UUID, UUID, UUID, UUID) IS
'Point d''entrée unique pour créer sessions de visionnage (48h).
Support multi-copies via p_registry_id optionnel.
Effectue échange automatique si nécessaire.
Réutilise get_movie_access_info pour éviter duplication.
Utilise trigger pour ownership_history.
FIX RÉGRESSION: Restaure payment status = ''completed'' (webhook Stripe).';

GRANT EXECUTE ON FUNCTION rent_or_access_movie(UUID, UUID, UUID, UUID) TO authenticated;
