-- ============================================================================
-- MISE À JOUR CRON JOB - Basculer vers viewing_sessions
-- Date: 2025-11-21
-- ============================================================================

-- ÉTAPE 1: Supprimer l'ancien cron (travaille sur table obsolète 'emprunts')
-- ============================================================================
SELECT cron.unschedule('expire-rentals-hourly');

-- Résultat attendu: unschedule = true


-- ÉTAPE 2: Créer le nouveau cron (travaille sur nouvelle table 'viewing_sessions')
-- ============================================================================
SELECT cron.schedule(
  'expire-sessions-hourly',  -- Nouveau nom
  '0 * * * *',               -- Toutes les heures à la minute 0
  $$SELECT expire_overdue_sessions()$$  -- Nouvelle fonction
);

-- Résultat attendu: schedule = 2 (ou un autre numéro, c'est l'ID du job)


-- ÉTAPE 3: Vérifier que le nouveau cron est actif
-- ============================================================================
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'expire-sessions-hourly';

-- Résultat attendu:
-- jobid | jobname                 | schedule  | command                           | active
-- ------|-------------------------|-----------|-----------------------------------|-------
-- 2     | expire-sessions-hourly  | 0 * * * * | SELECT expire_overdue_sessions()  | t


-- ÉTAPE 4: Tester manuellement la fonction
-- ============================================================================
SELECT expire_overdue_sessions();

-- Résultat attendu: Un nombre (0 si aucune session expirée, N si N sessions expirées)


-- ÉTAPE 5: Vérifier qu'il n'y a plus qu'un seul cron actif
-- ============================================================================
SELECT
  jobname,
  schedule,
  command,
  active
FROM cron.job
ORDER BY jobname;

-- Résultat attendu: Une seule ligne avec 'expire-sessions-hourly'


-- ============================================================================
-- NOTES
-- ============================================================================
-- ✅ L'ancien cron 'expire-rentals-hourly' travaillait sur la table 'emprunts' (obsolète)
-- ✅ Le nouveau cron 'expire-sessions-hourly' travaille sur 'viewing_sessions' (actuel)
-- ✅ Prochaine exécution: À la prochaine heure pile (ex: 01:00, 02:00, etc.)
-- ============================================================================
