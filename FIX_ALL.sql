-- ============================================================================
-- SCRIPT DE CORRECTION COMPLET - À EXÉCUTER DANS SQL EDITOR SUPABASE
-- Date: 2025-11-22
-- URL: https://supabase.com/dashboard/project/mjzbuxztvxivtyhocmkw/sql/new
--
-- Ce script corrige 2 problèmes :
-- 1. Users non-abonnés : paiement sans session créée
-- 2. Users abonnés : erreur contrainte CHECK ownership_history
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : Correction contrainte CHECK ownership_history
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE ownership_history
DROP CONSTRAINT IF EXISTS ownership_history_transfer_type_check;

-- Recréer la contrainte avec toutes les valeurs nécessaires
ALTER TABLE ownership_history
ADD CONSTRAINT ownership_history_transfer_type_check
CHECK (
  transfer_type IN (
    'exchange',           -- Échange bilatéral de films
    'sponsorship',        -- Parrainage (don d'un film à nouveau user)
    'redistribution',     -- Redistribution administrative
    'initial_deposit',    -- Dépôt initial (legacy)
    'deposit',            -- Dépôt de film physique
    'legacy_migration'    -- Migration données anciennes
  )
);

-- ============================================================================
-- PARTIE 2 : Réparation session orpheline (paiement sans viewing_session)
-- ============================================================================

DO $$
DECLARE
  v_payment_id UUID := '1441d69f-b162-48d2-99d9-1b3a01748e20';
  v_user_id UUID;
  v_movie_id UUID;
  v_registry_id UUID;
  v_session_exists BOOLEAN;
  v_payment_completed_at TIMESTAMP;
BEGIN

  RAISE NOTICE '=== RÉPARATION SESSION ORPHELINE ===';

  -- 1. Récupérer infos paiement (movie_id depuis JSON)
  SELECT
    user_id,
    (payment_intent_data->>'movie_id')::UUID,
    completed_at
  INTO v_user_id, v_movie_id, v_payment_completed_at
  FROM payments
  WHERE id = v_payment_id
    AND status = 'succeeded'
    AND payment_type = 'rental';

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Paiement non trouvé';
    RETURN;
  END IF;

  IF v_movie_id IS NULL THEN
    RAISE WARNING 'movie_id introuvable dans payment_intent_data';
    RETURN;
  END IF;

  -- 2. Vérifier si session existe déjà
  SELECT EXISTS(
    SELECT 1 FROM viewing_sessions WHERE payment_id = v_payment_id
  ) INTO v_session_exists;

  IF v_session_exists THEN
    RAISE NOTICE 'Session déjà existante - SKIP';
    RETURN;
  END IF;

  -- 3. Récupérer registry_id (copie physique)
  SELECT fr.id INTO v_registry_id
  FROM films_registry fr
  WHERE fr.movie_id = v_movie_id
  ORDER BY
    CASE WHEN fr.current_owner_id = v_user_id THEN 0 ELSE 1 END,
    fr.acquisition_date ASC
  LIMIT 1;

  IF v_registry_id IS NULL THEN
    RAISE WARNING 'Aucune copie physique trouvée';
    RETURN;
  END IF;

  -- 4. Créer la session manquante
  INSERT INTO viewing_sessions (
    user_id, registry_id, movie_id, statut, session_type, amount_paid,
    payment_id, session_start_date, return_date, created_at, updated_at
  )
  VALUES (
    v_user_id,
    v_registry_id,
    v_movie_id,
    CASE
      WHEN v_payment_completed_at < (NOW() - INTERVAL '48 hours') THEN 'expiré'
      ELSE 'en_cours'
    END,
    'unit',
    1.50,
    v_payment_id,
    v_payment_completed_at,
    v_payment_completed_at + INTERVAL '48 hours',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Session créée avec succès !';
  RAISE NOTICE 'User: %, Movie: %, Registry: %', v_user_id, v_movie_id, v_registry_id;

END $$;

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier la session créée
SELECT
  vs.id,
  vs.user_id,
  vs.statut,
  vs.session_type,
  vs.amount_paid,
  vs.return_date,
  m.titre_francais,
  CASE
    WHEN vs.statut = 'en_cours' AND vs.return_date > NOW() THEN '✅ SESSION ACTIVE'
    WHEN vs.statut = 'expiré' THEN '⏰ SESSION EXPIRÉE'
    ELSE '❌ SESSION TERMINÉE'
  END AS status
FROM viewing_sessions vs
JOIN movies m ON m.id = vs.movie_id
WHERE vs.payment_id = '1441d69f-b162-48d2-99d9-1b3a01748e20';

-- Vérifier d'autres paiements orphelins potentiels
SELECT
  p.id,
  p.user_id,
  (p.payment_intent_data->>'movie_title') AS film_title,
  p.amount,
  p.completed_at,
  CASE
    WHEN vs.id IS NULL THEN '❌ AUCUNE SESSION'
    ELSE '✅ SESSION EXISTE'
  END AS session_status
FROM payments p
LEFT JOIN viewing_sessions vs ON vs.payment_id = p.id
WHERE p.payment_type = 'rental'
  AND p.status = 'succeeded'
  AND p.completed_at > '2025-11-20'
ORDER BY p.completed_at DESC
LIMIT 10;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- Si tout s'est bien passé :
-- 1. Contrainte CHECK mise à jour ✅
-- 2. Session créée pour payment_id 1441d69f-... ✅
-- 3. L'utilisateur peut maintenant accéder au player ✅
-- 4. Les échanges fonctionnent pour les abonnés ✅

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
