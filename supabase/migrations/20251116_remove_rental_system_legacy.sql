-- ============================================================================
-- MIGRATION: Suppression du système de location (Legacy)
-- Date: 2025-11-16
-- Description: Nettoyage des composants de l'ancien système de location
--              (triggers, fonctions, colonnes) maintenant obsolètes
--              avec le nouveau modèle de propriété et d'échange
-- ============================================================================

-- ============================================================================
-- PARTIE 1: SUPPRESSION DES TRIGGERS DE GESTION DES COPIES
-- ============================================================================

-- Note: Ces triggers automatiques sont remplacés par le système de propriété
-- où chaque exemplaire physique est unique (films_registry) et les échanges
-- sont gérés de manière atomique dans les RPC functions

-- Supprimer le trigger de création de location (décrément copies_disponibles)
DROP TRIGGER IF EXISTS on_rental_created ON emprunts;
DROP TRIGGER IF EXISTS rental_created_trigger ON emprunts;

-- Supprimer le trigger de retour de location (incrément copies_disponibles)
DROP TRIGGER IF EXISTS on_rental_return ON emprunts;
DROP TRIGGER IF EXISTS rental_return_trigger ON emprunts;

-- ============================================================================
-- PARTIE 2: SUPPRESSION DES FONCTIONS TRIGGERS
-- ============================================================================

-- Supprimer la fonction de gestion de création de location
DROP FUNCTION IF EXISTS handle_rental_created();

-- Supprimer la fonction de gestion de retour de location
DROP FUNCTION IF EXISTS handle_rental_return();

-- ============================================================================
-- PARTIE 3: SUPPRESSION DES COLONNES DE COPIES (movies)
-- ============================================================================

-- Note: Avec le nouveau système de films_registry, le concept de "copies"
-- change complètement :
-- - Ancien modèle: 1 ligne dans movies = N copies virtuelles partagées
-- - Nouveau modèle: 1 ligne dans films_registry = 1 exemplaire physique unique
-- Donc nombre_copies et copies_disponibles n'ont plus de sens

-- Vérifier si les colonnes existent avant de les supprimer
DO $$
BEGIN
  -- Supprimer nombre_copies si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'nombre_copies'
  ) THEN
    ALTER TABLE movies DROP COLUMN nombre_copies;
    RAISE NOTICE 'Colonne nombre_copies supprimée de movies';
  ELSE
    RAISE NOTICE 'Colonne nombre_copies n''existe pas dans movies';
  END IF;

  -- Supprimer copies_disponibles si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'copies_disponibles'
  ) THEN
    ALTER TABLE movies DROP COLUMN copies_disponibles;
    RAISE NOTICE 'Colonne copies_disponibles supprimée de movies';
  ELSE
    RAISE NOTICE 'Colonne copies_disponibles n''existe pas dans movies';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 4: COMMENTAIRES DE DOCUMENTATION
-- ============================================================================

-- Documenter le changement de modèle dans les métadonnées de la table movies
COMMENT ON TABLE movies IS 'Catalogue de films (métadonnées TMDB uniquement). Les exemplaires physiques sont dans films_registry (1 ligne = 1 Blu-ray/DVD physique unique). Ancien système de copies virtuelles remplacé par système de propriété individuelle.';

-- ============================================================================
-- PARTIE 5: VÉRIFICATION POST-MIGRATION (Optionnel)
-- ============================================================================

-- Fonction de vérification que tous les composants legacy sont supprimés
CREATE OR REPLACE FUNCTION verify_legacy_cleanup()
RETURNS TABLE (
  check_name TEXT,
  item_exists BOOLEAN,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Vérifier triggers supprimés
  SELECT
    'Trigger on_rental_created'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'on_rental_created'
    ),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_rental_created')
      THEN '✅ Supprimé'
      ELSE '❌ Existe encore'
    END;

  RETURN QUERY
  SELECT
    'Trigger on_rental_return'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'on_rental_return'
    ),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_rental_return')
      THEN '✅ Supprimé'
      ELSE '❌ Existe encore'
    END;

  RETURN QUERY
  -- Vérifier fonctions supprimées
  SELECT
    'Function handle_rental_created'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'handle_rental_created'
    ),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_rental_created')
      THEN '✅ Supprimé'
      ELSE '❌ Existe encore'
    END;

  RETURN QUERY
  SELECT
    'Function handle_rental_return'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'handle_rental_return'
    ),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_rental_return')
      THEN '✅ Supprimé'
      ELSE '❌ Existe encore'
    END;

  RETURN QUERY
  -- Vérifier colonnes supprimées
  SELECT
    'Column movies.nombre_copies'::TEXT,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'movies' AND column_name = 'nombre_copies'
    ),
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'movies' AND column_name = 'nombre_copies'
      )
      THEN '✅ Supprimé'
      ELSE '❌ Existe encore'
    END;

  RETURN QUERY
  SELECT
    'Column movies.copies_disponibles'::TEXT,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'movies' AND column_name = 'copies_disponibles'
    ),
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'movies' AND column_name = 'copies_disponibles'
      )
      THEN '✅ Supprimé'
      ELSE '❌ Existe encore'
    END;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON FUNCTION verify_legacy_cleanup IS 'Fonction de vérification post-migration. Exécuter SELECT * FROM verify_legacy_cleanup() pour vérifier que tous les composants legacy sont bien supprimés.';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Pour vérifier que tout est bien nettoyé, exécutez:
-- SELECT * FROM verify_legacy_cleanup();
-- Tous les status doivent afficher "✅ Supprimé"
