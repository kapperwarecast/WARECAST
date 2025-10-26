-- ================================================================================================
-- MIGRATIONS À EXÉCUTER MANUELLEMENT DANS SUPABASE DASHBOARD
-- ================================================================================================
-- Instructions :
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Copier-coller chaque section ci-dessous
-- 3. Exécuter une par une
-- 4. Vérifier qu'il n'y a pas d'erreur
-- ================================================================================================

-- ================================================================================================
-- PHASE 1 - TÂCHE 1.2 : Colonne random_order pour tri aléatoire efficace
-- ================================================================================================
-- Gain attendu : -80% latence sur tri aléatoire (de ~1s à ~200ms)
-- ================================================================================================

-- Ajouter colonne random_order
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS random_order FLOAT DEFAULT random();

-- Peupler avec des valeurs aléatoires pour les films existants
UPDATE movies SET random_order = random() WHERE random_order IS NULL;

-- Index pour tri rapide
CREATE INDEX IF NOT EXISTS movies_random_order_idx
ON movies(random_order);

-- Fonction pour régénérer l'ordre (à appeler 1x/jour via cron)
CREATE OR REPLACE FUNCTION refresh_random_order()
RETURNS void AS $$
BEGIN
  UPDATE movies SET random_order = random();
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nouveaux films
CREATE OR REPLACE FUNCTION set_random_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.random_order IS NULL THEN
    NEW.random_order := random();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_random_order_trigger
BEFORE INSERT ON movies
FOR EACH ROW
EXECUTE FUNCTION set_random_order();

-- ================================================================================================
-- PHASE 1 - TÂCHE 1.3 : Indexes full-text search
-- ================================================================================================
-- Gain attendu : -70% de temps sur recherches textuelles
-- ================================================================================================

-- Activer l'extension trigram pour recherches ILIKE rapides
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes GIN pour recherches textuelles
CREATE INDEX IF NOT EXISTS movies_titre_francais_trgm_idx
ON movies USING gin(titre_francais gin_trgm_ops);

CREATE INDEX IF NOT EXISTS movies_titre_original_trgm_idx
ON movies USING gin(titre_original gin_trgm_ops);

CREATE INDEX IF NOT EXISTS actors_nom_complet_trgm_idx
ON actors USING gin(nom_complet gin_trgm_ops);

CREATE INDEX IF NOT EXISTS directors_nom_complet_trgm_idx
ON directors USING gin(nom_complet gin_trgm_ops);

-- Index sur les colonnes fréquemment filtrées
CREATE INDEX IF NOT EXISTS movies_statut_idx ON movies(statut);
CREATE INDEX IF NOT EXISTS movies_copies_disponibles_idx ON movies(copies_disponibles);
CREATE INDEX IF NOT EXISTS movies_annee_sortie_idx ON movies(annee_sortie);
CREATE INDEX IF NOT EXISTS movies_langue_vo_idx ON movies(langue_vo);

-- ================================================================================================
-- FIN DES MIGRATIONS PHASE 1
-- ================================================================================================

-- ================================================================================================
-- PHASE 2 - TÂCHE 2.2 : Full-text search avec tsvector
-- ================================================================================================
-- Gain attendu : -60% latence sur recherches, requêtes passent de 3 à 1
-- ================================================================================================

-- Ajouter colonne search_vector
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Index GIN pour recherche ultra-rapide
CREATE INDEX IF NOT EXISTS movies_search_vector_idx
ON movies USING gin(search_vector);

-- Fonction pour mettre à jour le vecteur de recherche
CREATE OR REPLACE FUNCTION movies_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Combiner tous les champs pertinents avec pondération
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.titre_francais, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.titre_original, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.synopsis, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir search_vector à jour
DROP TRIGGER IF EXISTS movies_search_vector_update ON movies;
CREATE TRIGGER movies_search_vector_update
BEFORE INSERT OR UPDATE ON movies
FOR EACH ROW
EXECUTE FUNCTION movies_update_search_vector();

-- Peupler search_vector pour films existants
UPDATE movies SET search_vector =
  setweight(to_tsvector('french', coalesce(titre_francais, '')), 'A') ||
  setweight(to_tsvector('french', coalesce(titre_original, '')), 'B') ||
  setweight(to_tsvector('french', coalesce(synopsis, '')), 'C')
WHERE search_vector IS NULL;

-- Fonction RPC pour recherche rapide
CREATE OR REPLACE FUNCTION search_movies(
  search_query TEXT,
  filter_genres TEXT[] DEFAULT NULL,
  filter_decade INT DEFAULT NULL,
  filter_language TEXT DEFAULT NULL,
  filter_available_only BOOLEAN DEFAULT FALSE,
  page_number INT DEFAULT 1,
  page_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  titre_francais TEXT,
  titre_original TEXT,
  poster_local_path TEXT,
  annee_sortie INT,
  duree INT,
  langue_vo TEXT,
  copies_disponibles INT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.titre_francais,
    m.titre_original,
    m.poster_local_path,
    m.annee_sortie,
    m.duree,
    m.langue_vo,
    m.copies_disponibles,
    ts_rank(m.search_vector, to_tsquery('french', search_query)) as rank
  FROM movies m
  WHERE
    m.statut = 'en ligne'
    AND m.search_vector @@ to_tsquery('french', search_query)
    AND (filter_genres IS NULL OR m.genres && filter_genres)
    AND (filter_decade IS NULL OR (m.annee_sortie >= filter_decade AND m.annee_sortie <= filter_decade + 9))
    AND (filter_language IS NULL OR m.langue_vo = filter_language)
    AND (NOT filter_available_only OR m.copies_disponibles > 0)
  ORDER BY rank DESC
  LIMIT page_limit
  OFFSET (page_number - 1) * page_limit;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- PHASE 2 - TÂCHE 2.4 : Indexes composites
-- ================================================================================================
-- Gain attendu : -40% temps sur requêtes rental/subscription
-- ================================================================================================

-- Indexes composites pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS emprunts_movie_status_idx
ON emprunts(movie_id, statut);

CREATE INDEX IF NOT EXISTS emprunts_user_status_idx
ON emprunts(user_id, statut);

CREATE INDEX IF NOT EXISTS emprunts_user_movie_idx
ON emprunts(user_id, movie_id);

CREATE INDEX IF NOT EXISTS user_abonnements_user_status_idx
ON user_abonnements(user_id, statut);

CREATE INDEX IF NOT EXISTS movie_actors_movie_idx
ON movie_actors(movie_id);

CREATE INDEX IF NOT EXISTS movie_directors_movie_idx
ON movie_directors(movie_id);

-- Index sur date_expiration pour les requêtes de vérification
CREATE INDEX IF NOT EXISTS emprunts_date_retour_idx
ON emprunts(date_retour) WHERE statut = 'en_cours';

-- ================================================================================================
-- FIN DES MIGRATIONS PHASE 2
-- ================================================================================================
