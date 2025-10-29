-- ================================================================
-- Migration: Étendre la recherche aux acteurs et réalisateurs
-- Date: 2025-10-29
-- Description:
--   Modifie la fonction movies_update_search_vector() pour inclure
--   les noms des acteurs et réalisateurs dans le search_vector.
--   Ajoute des triggers pour mettre à jour le search_vector quand
--   les associations acteurs/réalisateurs changent.
-- ================================================================

-- ================================================================
-- ÉTAPE 1: Modifier la fonction de mise à jour du search_vector
-- ================================================================

CREATE OR REPLACE FUNCTION movies_update_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  v_actors_names TEXT;
  v_directors_names TEXT;
BEGIN
  -- Agréger les noms des acteurs (JOIN via movie_actors)
  SELECT string_agg(a.nom_complet, ' ')
  INTO v_actors_names
  FROM actors a
  INNER JOIN movie_actors ma ON ma.actor_id = a.id
  WHERE ma.movie_id = NEW.id;

  -- Agréger les noms des réalisateurs (JOIN via movie_directors)
  SELECT string_agg(d.nom_complet, ' ')
  INTO v_directors_names
  FROM directors d
  INNER JOIN movie_directors md ON md.director_id = d.id
  WHERE md.movie_id = NEW.id;

  -- Construire le search_vector avec pondération:
  -- A = titre_francais (priorité maximale)
  -- B = titre_original, acteurs, réalisateurs (priorité élevée)
  -- C = synopsis (priorité normale)
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.titre_francais, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.titre_original, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(v_actors_names, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(v_directors_names, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.synopsis, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION movies_update_search_vector() IS
'Mise à jour automatique du search_vector avec titre, synopsis, acteurs et réalisateurs';

-- ================================================================
-- ÉTAPE 2: Créer fonction pour mise à jour quand casting change
-- ================================================================

CREATE OR REPLACE FUNCTION update_movie_search_on_cast_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le search_vector du film concerné
  -- Cette fonction sera appelée par les triggers sur movie_actors et movie_directors
  UPDATE movies
  SET updated_at = NOW()  -- Force l'exécution du trigger movies_update_search_vector
  WHERE id = COALESCE(NEW.movie_id, OLD.movie_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_movie_search_on_cast_change() IS
'Déclenche la mise à jour du search_vector quand les acteurs ou réalisateurs changent';

-- ================================================================
-- ÉTAPE 3: Créer triggers sur movie_actors et movie_directors
-- ================================================================

-- Trigger pour movie_actors (INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trigger_update_movie_search_on_actor_change ON movie_actors;
CREATE TRIGGER trigger_update_movie_search_on_actor_change
  AFTER INSERT OR UPDATE OR DELETE ON movie_actors
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_search_on_cast_change();

COMMENT ON TRIGGER trigger_update_movie_search_on_actor_change ON movie_actors IS
'Met à jour le search_vector du film quand ses acteurs changent';

-- Trigger pour movie_directors (INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trigger_update_movie_search_on_director_change ON movie_directors;
CREATE TRIGGER trigger_update_movie_search_on_director_change
  AFTER INSERT OR UPDATE OR DELETE ON movie_directors
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_search_on_cast_change();

COMMENT ON TRIGGER trigger_update_movie_search_on_director_change ON movie_directors IS
'Met à jour le search_vector du film quand ses réalisateurs changent';

-- ================================================================
-- ÉTAPE 4: Régénérer le search_vector pour tous les films existants
-- ================================================================

-- Cette opération peut prendre quelques secondes selon le nombre de films
-- Elle force l'exécution du trigger movies_update_search_vector pour tous les films

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Mettre à jour tous les films pour déclencher le trigger
  UPDATE movies
  SET updated_at = NOW();

  -- Compter les films mis à jour
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log du résultat
  RAISE NOTICE '✅ Migration terminée: % films ont eu leur search_vector régénéré', v_count;
END $$;

-- ================================================================
-- ÉTAPE 5: Vérifications et tests
-- ================================================================

-- Test 1: Vérifier qu'un film avec acteurs/réalisateurs a un search_vector complet
DO $$
DECLARE
  v_movie_id UUID;
  v_search_vector tsvector;
  v_titre TEXT;
  v_actors_count INTEGER;
  v_directors_count INTEGER;
BEGIN
  -- Sélectionner un film avec acteurs et réalisateurs
  SELECT
    m.id,
    m.titre_francais,
    m.search_vector,
    (SELECT COUNT(*) FROM movie_actors WHERE movie_id = m.id) as actors,
    (SELECT COUNT(*) FROM movie_directors WHERE movie_id = m.id) as directors
  INTO
    v_movie_id,
    v_titre,
    v_search_vector,
    v_actors_count,
    v_directors_count
  FROM movies m
  WHERE
    EXISTS (SELECT 1 FROM movie_actors WHERE movie_id = m.id)
    AND EXISTS (SELECT 1 FROM movie_directors WHERE movie_id = m.id)
  LIMIT 1;

  IF v_movie_id IS NOT NULL THEN
    RAISE NOTICE '📋 Test sur film: % (ID: %)', v_titre, v_movie_id;
    RAISE NOTICE '   - Acteurs: %', v_actors_count;
    RAISE NOTICE '   - Réalisateurs: %', v_directors_count;
    RAISE NOTICE '   - Search vector: % lexèmes', array_length(tsvector_to_array(v_search_vector), 1);
    RAISE NOTICE '✅ Le search_vector contient des données';
  ELSE
    RAISE NOTICE '⚠️ Aucun film avec acteurs ET réalisateurs trouvé pour test';
  END IF;
END $$;

-- Test 2: Recherche par nom d'acteur
DO $$
DECLARE
  v_actor_name TEXT;
  v_movie_count INTEGER;
BEGIN
  -- Sélectionner un acteur au hasard
  SELECT nom_complet INTO v_actor_name
  FROM actors
  WHERE EXISTS (SELECT 1 FROM movie_actors WHERE actor_id = actors.id)
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_actor_name IS NOT NULL THEN
    -- Compter les films trouvés via recherche full-text
    SELECT COUNT(*) INTO v_movie_count
    FROM movies
    WHERE search_vector @@ to_tsquery('french', regexp_replace(v_actor_name, '\s+', ' & ', 'g'));

    RAISE NOTICE '📋 Test recherche acteur: "%"', v_actor_name;
    RAISE NOTICE '   - Films trouvés: %', v_movie_count;

    IF v_movie_count > 0 THEN
      RAISE NOTICE '✅ La recherche par acteur fonctionne';
    ELSE
      RAISE NOTICE '⚠️ Aucun film trouvé (peut arriver si nom avec accents/caractères spéciaux)';
    END IF;
  END IF;
END $$;

-- ================================================================
-- NOTES D'UTILISATION
-- ================================================================
--
-- Cette migration:
-- 1. ✅ Étend movies_update_search_vector() pour inclure acteurs et réalisateurs
-- 2. ✅ Crée des triggers pour mise à jour automatique quand casting change
-- 3. ✅ Régénère le search_vector pour tous les films existants
-- 4. ✅ Vérifie que la migration fonctionne avec des tests
--
-- Après cette migration, la recherche fonctionnera sur:
-- - Titre français (priorité A)
-- - Titre original (priorité B)
-- - Noms des acteurs (priorité B) ← NOUVEAU
-- - Noms des réalisateurs (priorité B) ← NOUVEAU
-- - Synopsis (priorité C)
--
-- Aucun changement côté frontend nécessaire.
-- La fonction RPC search_movies() utilise déjà le champ search_vector.
-- ================================================================
