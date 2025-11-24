-- ============================================================================
-- MIGRATION: Cleanup table emprunts et vue de compatibilité
-- Date: 2025-11-20
-- Description: Supprime l'ancienne table emprunts et la vue de compatibilité
--              ATTENTION: À exécuter UNIQUEMENT après avoir vérifié que:
--              1. Toutes les données ont été migrées vers viewing_sessions
--              2. Tous les codes frontend/backend utilisent viewing_sessions
--              3. Les tests de régression sont passés
-- ============================================================================

-- ============================================================================
-- VÉRIFICATIONS PRÉALABLES
-- ============================================================================

-- Vérifier que viewing_sessions existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'viewing_sessions') THEN
    RAISE EXCEPTION 'Table viewing_sessions introuvable. Assurez-vous d''avoir exécuté la migration 20251120_create_viewing_sessions_table.sql';
  END IF;
END $$;

-- Comparer le nombre de lignes (diagnostic)
DO $$
DECLARE
  v_emprunts_count INTEGER;
  v_viewing_sessions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_emprunts_count FROM emprunts;
  SELECT COUNT(*) INTO v_viewing_sessions_count FROM viewing_sessions;

  RAISE NOTICE '=================================================';
  RAISE NOTICE 'DIAGNOSTIC AVANT SUPPRESSION';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Lignes dans emprunts: %', v_emprunts_count;
  RAISE NOTICE 'Lignes dans viewing_sessions: %', v_viewing_sessions_count;

  IF v_emprunts_count > v_viewing_sessions_count THEN
    RAISE WARNING 'ATTENTION: emprunts contient plus de lignes que viewing_sessions!';
    RAISE WARNING 'Différence: % lignes', v_emprunts_count - v_viewing_sessions_count;
    RAISE WARNING 'Vérifiez la migration des données avant de continuer';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 1: SUPPRIMER LA VUE DE COMPATIBILITÉ
-- ============================================================================

-- Supprimer la vue emprunts (créée dans 20251120_create_viewing_sessions_table.sql)
DROP VIEW IF EXISTS emprunts CASCADE;

RAISE NOTICE 'Vue de compatibilité "emprunts" supprimée';

-- ============================================================================
-- PARTIE 2: SUPPRIMER POLICIES RLS SUR EMPRUNTS
-- ============================================================================

-- Lister et supprimer toutes les policies sur emprunts (si elles existent encore)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'emprunts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON emprunts', policy_record.policyname);
    RAISE NOTICE 'Policy supprimée: %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- PARTIE 3: SUPPRIMER TRIGGERS SUR EMPRUNTS
-- ============================================================================

-- Supprimer les triggers (si existants)
DROP TRIGGER IF EXISTS emprunts_updated_at_trigger ON emprunts;
DROP FUNCTION IF EXISTS update_emprunts_updated_at();

RAISE NOTICE 'Triggers sur emprunts supprimés';

-- ============================================================================
-- PARTIE 4: SUPPRIMER LA TABLE EMPRUNTS
-- ============================================================================

-- Supprimer la table emprunts définitivement
-- CASCADE pour supprimer automatiquement les dépendances (indexes, contraintes)
DROP TABLE IF EXISTS emprunts CASCADE;

RAISE NOTICE 'Table emprunts supprimée définitivement';

-- ============================================================================
-- PARTIE 5: RAPPORT FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'CLEANUP TERMINÉ';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Ancienne table emprunts supprimée';
  RAISE NOTICE 'Nouvelle table viewing_sessions active';
  RAISE NOTICE 'Migration complète: emprunts → viewing_sessions';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Régénérer types TypeScript: npx supabase gen types typescript';
  RAISE NOTICE '2. Tester l''application complètement';
  RAISE NOTICE '3. Vérifier logs Realtime (channels viewing_sessions)';
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
