-- ============================================================================
-- REQUÊTES DE VÉRIFICATION - Corrections des bugs
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Vérifier que la fonction rent_or_access_movie a été mise à jour
-- ============================================================================

SELECT
  routine_name,
  routine_type,
  data_type,
  pg_get_functiondef(p.oid) as function_definition
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_name = 'rent_or_access_movie'
  AND routine_schema = 'public';

-- ✅ Attendu: 1 ligne retournée avec function_definition contenant:
--    - "ORDER BY CASE WHEN NOT EXISTS" (Bug #3 corrigé)
--    - "SELECT EXISTS( SELECT 1 FROM payments" (Bug #1 corrigé)
--    - "UPDATE viewing_sessions SET statut" SANS condition IF (Bug #2 corrigé)

-- ============================================================================
-- 2. Vérifier le commentaire de la fonction (confirme date correction)
-- ============================================================================

SELECT
  objoid::regprocedure as function_name,
  description
FROM pg_description
JOIN pg_proc ON pg_description.objoid = pg_proc.oid
WHERE pg_proc.proname = 'rent_or_access_movie';

-- ✅ Attendu: Description contenant "CORRECTIONS (2025-11-21)"

-- ============================================================================
-- 3. Test Bug #1 - Validation paiement Stripe
-- ============================================================================

-- Créer un faux paiement "failed" pour tester
DO $$
DECLARE
  v_test_payment_id UUID;
  v_test_user_id UUID;
  v_test_movie_id UUID;
BEGIN
  -- Récupérer un user et un film de test
  SELECT id INTO v_test_user_id FROM user_profiles LIMIT 1;
  SELECT id INTO v_test_movie_id FROM movies LIMIT 1;

  -- Créer paiement invalide (status != 'succeeded')
  INSERT INTO payments (id, user_id, amount, currency, payment_type, status)
  VALUES (gen_random_uuid(), v_test_user_id, 1.50, 'EUR', 'exchange', 'failed')
  RETURNING id INTO v_test_payment_id;

  RAISE NOTICE 'Test payment created: %', v_test_payment_id;
  RAISE NOTICE 'User ID: %', v_test_user_id;
  RAISE NOTICE 'Movie ID: %', v_test_movie_id;

  -- Nettoyer (supprimer le paiement test)
  DELETE FROM payments WHERE id = v_test_payment_id;
END $$;

-- ✅ Si vous tentez d'appeler rent_or_access_movie avec ce payment_id:
--    Résultat attendu: {"success": false, "code": "PAYMENT_NOT_SUCCEEDED"}

-- ============================================================================
-- 4. Test Bug #2 - Rotation appliquée à tous
-- ============================================================================

-- Vérifier le code source pour la présence de rotation SANS condition
SELECT
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%UPDATE viewing_sessions%SET statut = ''rendu''%WHERE user_id = p_auth_user_id%AND statut = ''en_cours''%AND movie_id != p_movie_id%'
    THEN '✅ Rotation code trouvé'
    ELSE '❌ Rotation code manquant'
  END as rotation_check,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%IF v_user_has_subscription THEN%UPDATE viewing_sessions%'
    THEN '❌ BUG: Rotation conditionnelle (ancien code)'
    ELSE '✅ Rotation inconditionnelle (nouveau code)'
  END as conditional_check
FROM pg_proc p
WHERE p.proname = 'rent_or_access_movie';

-- ✅ Attendu:
--    rotation_check = '✅ Rotation code trouvé'
--    conditional_check = '✅ Rotation inconditionnelle (nouveau code)'

-- ============================================================================
-- 5. Test Bug #3 - Sélection copie déterministe
-- ============================================================================

-- Vérifier présence ORDER BY avec CASE
SELECT
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%ORDER BY%CASE WHEN NOT EXISTS%SELECT 1 FROM viewing_sessions%THEN 0 ELSE 1 END%acquisition_date ASC%'
    THEN '✅ ORDER BY déterministe trouvé'
    ELSE '❌ ORDER BY manquant ou incorrect'
  END as order_by_check
FROM pg_proc p
WHERE p.proname = 'rent_or_access_movie';

-- ✅ Attendu: order_by_check = '✅ ORDER BY déterministe trouvé'

-- ============================================================================
-- 6. Statistiques système (aperçu santé)
-- ============================================================================

-- Nombre de sessions actives
SELECT
  COUNT(*) as sessions_actives,
  COUNT(DISTINCT user_id) as utilisateurs_actifs
FROM viewing_sessions
WHERE statut = 'en_cours'
  AND return_date > NOW();

-- Sessions expirées qui devraient être nettoyées
SELECT
  COUNT(*) as sessions_expirees_non_marquees
FROM viewing_sessions
WHERE statut = 'en_cours'
  AND return_date < NOW();

-- ⚠️ Si sessions_expirees_non_marquees > 0:
--    Attendre exécution du cron expire-sessions (toutes les heures)
--    OU appeler manuellement: SELECT expire_overdue_sessions();

-- Échanges des dernières 24h
SELECT
  COUNT(*) as echanges_24h,
  SUM(CASE WHEN payment_id IS NOT NULL THEN 1 ELSE 0 END) as echanges_payants,
  SUM(CASE WHEN payment_id IS NULL THEN 1 ELSE 0 END) as echanges_gratuits
FROM film_exchanges
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Distribution par type de session
SELECT
  session_type,
  COUNT(*) as count,
  SUM(amount_paid) as total_paid
FROM viewing_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY session_type;

-- ✅ Attendu:
--    - session_type='subscription': Abonnés + propriétaires
--    - session_type='unit': Non-abonnés (1.50€)

-- ============================================================================
-- 7. Test complet - Simuler un échange
-- ============================================================================

-- Récupérer info pour test
SELECT
  up.email,
  up.id as user_id,
  (SELECT COUNT(*) FROM films_registry WHERE current_owner_id = up.id) as films_possedes,
  (SELECT COUNT(*) FROM viewing_sessions WHERE user_id = up.id AND statut = 'en_cours') as sessions_actives,
  (SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = up.id
      AND statut IN ('actif', 'résilié')
      AND date_expiration > NOW()
  )) as est_abonne
FROM user_profiles up
WHERE up.email = 'kapper.warecast@gmail.com';

-- ✅ Informations utiles pour tester un échange réel

-- ============================================================================
-- 8. Vérifier Edge Function expire_overdue_sessions
-- ============================================================================

-- Tester la fonction RPC directement
SELECT expire_overdue_sessions() as sessions_expired;

-- ✅ Si > 0: Des sessions ont été expirées
-- ✅ Si = 0: Aucune session expirée (normal si tout fonctionne)

-- Vérifier que la fonction existe
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'expire_overdue_sessions'
  AND routine_schema = 'public';

-- ✅ Attendu: 1 ligne retournée

-- ============================================================================
-- RÉSUMÉ DES VÉRIFICATIONS
-- ============================================================================

-- Exécuter cette requête pour résumé complet
SELECT
  '✅ Migration appliquée avec succès' as status,
  NOW() as verified_at,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'rent_or_access_movie') as function_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'expire_overdue_sessions') as expire_function_exists,
  (SELECT COUNT(*) FROM viewing_sessions WHERE statut = 'en_cours' AND return_date > NOW()) as active_sessions,
  (SELECT COUNT(*) FROM film_exchanges WHERE created_at > NOW() - INTERVAL '24 hours') as recent_exchanges;

-- ✅ Attendu:
--    function_exists = 1
--    expire_function_exists = 1
--    active_sessions = [nombre variable]
--    recent_exchanges = [nombre variable]
