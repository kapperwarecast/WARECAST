-- ============================================================================
-- MIGRATION: Réparation automatique de TOUS les paiements orphelins
-- Date: 2025-11-22
-- Description: Crée automatiquement les sessions de visionnage pour tous les
--              paiements succeeded/completed qui n'ont pas de session associée
--
-- Cause: Le webhook Stripe essayait de mettre status='succeeded' mais la
--        contrainte CHECK n'acceptait que 'completed'. L'UPDATE échouait
--        silencieusement et rent_or_access_movie n'était jamais appelé.
-- ============================================================================

DO $$
DECLARE
  orphan_payment RECORD;
  v_registry_id UUID;
  v_session_exists BOOLEAN;
  v_session_status TEXT;
  v_user_has_films BOOLEAN;
  repaired_count INT := 0;
  skipped_count INT := 0;
BEGIN

  RAISE NOTICE 'DÉBUT RÉPARATION DES PAIEMENTS ORPHELINS';

  -- Parcourir tous les paiements orphelins
  FOR orphan_payment IN
    SELECT
      p.id AS payment_id,
      p.user_id,
      (p.payment_intent_data->>'movie_id')::UUID AS movie_id,
      p.payment_intent_data->>'movie_title' AS movie_title,
      p.completed_at,
      p.amount
    FROM payments p
    WHERE p.status = 'completed'
      AND p.payment_type = 'rental'
      AND NOT EXISTS (
        SELECT 1 FROM viewing_sessions vs
        WHERE vs.payment_id = p.id
      )
    ORDER BY p.completed_at ASC
  LOOP

    RAISE NOTICE 'Traitement paiement % - User: %, Movie: %',
      orphan_payment.payment_id,
      orphan_payment.user_id,
      orphan_payment.movie_title;

    -- Vérifier si l'utilisateur possède au moins un film (nécessaire pour échange)
    SELECT EXISTS(
      SELECT 1 FROM films_registry
      WHERE current_owner_id = orphan_payment.user_id
    ) INTO v_user_has_films;

    IF NOT v_user_has_films THEN
      RAISE WARNING 'SKIP - User % n''a aucun film pour échanger', orphan_payment.user_id;
      skipped_count := skipped_count + 1;
      CONTINUE;
    END IF;

    -- Vérifier si l'utilisateur possède déjà ce film (après échange manuel ou autre)
    SELECT fr.id
    INTO v_registry_id
    FROM films_registry fr
    WHERE fr.movie_id = orphan_payment.movie_id
      AND fr.current_owner_id = orphan_payment.user_id
    LIMIT 1;

    IF v_registry_id IS NULL THEN
      -- L'utilisateur ne possède pas le film → Tenter l'échange via RPC
      RAISE NOTICE 'Appel rent_or_access_movie pour paiement %', orphan_payment.payment_id;

      BEGIN
        PERFORM rent_or_access_movie(
          orphan_payment.user_id,
          orphan_payment.movie_id,
          orphan_payment.payment_id
        );

        RAISE NOTICE 'SUCCESS - Session créée via RPC pour paiement %', orphan_payment.payment_id;
        repaired_count := repaired_count + 1;

      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'ERREUR RPC pour paiement %: %', orphan_payment.payment_id, SQLERRM;
          skipped_count := skipped_count + 1;
      END;

    ELSE
      -- L'utilisateur possède déjà le film → Créer session manquante directement
      RAISE NOTICE 'User possède déjà le film, création session directe';

      -- Déterminer le statut de la session basé sur la date de paiement
      IF orphan_payment.completed_at < (NOW() - INTERVAL '48 hours') THEN
        v_session_status := 'expiré';
      ELSE
        v_session_status := 'en_cours';
      END IF;

      INSERT INTO viewing_sessions (
        user_id,
        registry_id,
        movie_id,
        statut,
        session_type,
        amount_paid,
        payment_id,
        session_start_date,
        return_date,
        created_at,
        updated_at
      )
      VALUES (
        orphan_payment.user_id,
        v_registry_id,
        orphan_payment.movie_id,
        v_session_status,
        'unit',  -- Paiement unitaire
        orphan_payment.amount,
        orphan_payment.payment_id,
        orphan_payment.completed_at,
        orphan_payment.completed_at + INTERVAL '48 hours',
        NOW(),
        NOW()
      );

      RAISE NOTICE 'SUCCESS - Session créée directement pour paiement %', orphan_payment.payment_id;
      repaired_count := repaired_count + 1;

    END IF;

  END LOOP;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'RÉPARATION TERMINÉE';
  RAISE NOTICE 'Paiements réparés: %', repaired_count;
  RAISE NOTICE 'Paiements ignorés: %', skipped_count;
  RAISE NOTICE '=================================================================';

END $$;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Compter les paiements orphelins restants
SELECT
  COUNT(*) AS orphan_payments_remaining,
  'Paiements orphelins restants après réparation' AS description
FROM payments p
WHERE p.status = 'completed'
  AND p.payment_type = 'rental'
  AND NOT EXISTS (
    SELECT 1 FROM viewing_sessions vs
    WHERE vs.payment_id = p.id
  );

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
