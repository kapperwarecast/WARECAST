-- ============================================================================
-- SCRIPT DE RÉPARATION IMMÉDIATE
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/mjzbuxztvxivtyhocmkw/sql/new
-- ============================================================================

-- ÉTAPE 1 : Vérifier si la table viewing_sessions existe
SELECT 'VÉRIFICATION TABLE viewing_sessions' AS etape;
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'viewing_sessions'
) AS table_exists;

-- ÉTAPE 2 : Vérifier le paiement orphelin
SELECT 'VÉRIFICATION PAIEMENT' AS etape;
SELECT
  id,
  user_id,
  payment_type,
  amount,
  status,
  (payment_intent_data->>'movie_id')::UUID AS movie_id,
  completed_at
FROM payments
WHERE id = '1441d69f-b162-48d2-99d9-1b3a01748e20';

-- ÉTAPE 3 : Vérifier si une session existe déjà
SELECT 'VÉRIFICATION SESSION EXISTANTE' AS etape;
SELECT COUNT(*) AS sessions_count
FROM viewing_sessions
WHERE payment_id = '1441d69f-b162-48d2-99d9-1b3a01748e20';

-- ÉTAPE 4 : Créer la session manquante (SI AUCUNE SESSION N'EXISTE)
-- ⚠️ ATTENTION : Exécutez seulement si sessions_count = 0 ci-dessus
SELECT 'CRÉATION SESSION MANQUANTE' AS etape;

DO $$
DECLARE
  v_payment_id UUID := '1441d69f-b162-48d2-99d9-1b3a01748e20';
  v_user_id UUID;
  v_movie_id UUID;
  v_registry_id UUID;
  v_session_exists BOOLEAN;
  v_payment_completed_at TIMESTAMP;
  v_session_statut TEXT;
BEGIN

  RAISE NOTICE '=== DÉBUT RÉPARATION PAIEMENT ORPHELIN ===';

  -- 1. Récupérer les infos du paiement (movie_id depuis JSON)
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
    RAISE EXCEPTION 'Paiement % non trouvé ou non succeeded', v_payment_id;
  END IF;

  RAISE NOTICE 'Paiement trouvé - User: %, Movie: %, Completed: %',
    v_user_id, v_movie_id, v_payment_completed_at;

  -- 2. Vérifier session existante
  SELECT EXISTS(
    SELECT 1 FROM viewing_sessions
    WHERE payment_id = v_payment_id
  ) INTO v_session_exists;

  IF v_session_exists THEN
    RAISE NOTICE 'Session déjà existante - SKIP';
    RETURN;
  END IF;

  -- 3. Récupérer registry_id (copie physique du film)
  SELECT fr.id
  INTO v_registry_id
  FROM films_registry fr
  WHERE fr.movie_id = v_movie_id
    -- Prioriser copie appartenant à l'user (si échange a fonctionné)
    AND (fr.current_owner_id = v_user_id OR TRUE)
  ORDER BY
    CASE WHEN fr.current_owner_id = v_user_id THEN 0 ELSE 1 END,
    fr.acquisition_date ASC
  LIMIT 1;

  IF v_registry_id IS NULL THEN
    RAISE EXCEPTION 'Aucune copie physique trouvée pour movie_id %', v_movie_id;
  END IF;

  RAISE NOTICE 'Registry ID trouvé: %', v_registry_id;

  -- 4. Déterminer statut session (en_cours ou expiré)
  IF v_payment_completed_at < (NOW() - INTERVAL '48 hours') THEN
    v_session_statut := 'expiré';
    RAISE NOTICE 'Session sera marquée EXPIRÉE (paiement > 48h)';
  ELSE
    v_session_statut := 'en_cours';
    RAISE NOTICE 'Session sera marquée EN_COURS';
  END IF;

  -- 5. Créer la session
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
    v_user_id,
    v_registry_id,
    v_movie_id,
    v_session_statut,
    'unit',  -- Paiement unitaire 1,50€
    1.50,
    v_payment_id,
    v_payment_completed_at,
    v_payment_completed_at + INTERVAL '48 hours',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Session créée avec succès !';
  RAISE NOTICE '=== FIN RÉPARATION ===';

END $$;

-- ÉTAPE 5 : Vérifier que la session a bien été créée
SELECT 'VÉRIFICATION SESSION CRÉÉE' AS etape;
SELECT
  vs.id,
  vs.user_id,
  vs.statut,
  vs.session_type,
  vs.amount_paid,
  vs.session_start_date,
  vs.return_date,
  m.titre_francais AS film_title,
  CASE
    WHEN vs.statut = 'en_cours' AND vs.return_date > NOW() THEN 'SESSION ACTIVE ✅'
    WHEN vs.statut = 'expiré' THEN 'SESSION EXPIRÉE (>48h)'
    ELSE 'SESSION TERMINÉE'
  END AS status_description
FROM viewing_sessions vs
JOIN movies m ON m.id = vs.movie_id
WHERE vs.payment_id = '1441d69f-b162-48d2-99d9-1b3a01748e20';

-- ÉTAPE 6 : Vérifier tous les paiements sans session (optionnel)
SELECT 'AUTRES PAIEMENTS ORPHELINS ?' AS etape;
SELECT
  p.id AS payment_id,
  p.user_id,
  p.amount,
  p.completed_at,
  m.titre_francais AS film_title,
  CASE
    WHEN vs.id IS NULL THEN '❌ AUCUNE SESSION'
    ELSE '✅ SESSION EXISTE'
  END AS session_status
FROM payments p
LEFT JOIN movies m ON m.id = (p.payment_intent_data->>'movie_id')::UUID
LEFT JOIN viewing_sessions vs ON vs.payment_id = p.id
WHERE p.payment_type = 'rental'
  AND p.status = 'succeeded'
  AND p.completed_at > '2025-11-20'  -- Depuis migration viewing_sessions
ORDER BY p.completed_at DESC;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- Si tout s'est bien passé, vous devriez voir :
-- 1. table_exists = TRUE
-- 2. Paiement avec status = 'succeeded'
-- 3. sessions_count = 1 (après exécution)
-- 4. Session créée avec tous les détails
-- 5. status_description = "SESSION ACTIVE ✅" ou "SESSION EXPIRÉE"

-- L'utilisateur peut maintenant :
-- - Accéder au player de film (/movie-player/[slug])
-- - Voir le film pendant 48h (si session active)
-- - OU re-demander une nouvelle session (si expirée)

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
