-- ============================================
-- MIGRATIONS SQL SUPABASE - Optimisation Performance Warecast
-- ============================================
-- 
-- IMPORTANT : Ces migrations doivent être exécutées dans Supabase Dashboard
-- Aller sur : Supabase Dashboard → SQL Editor → New Query
-- 
-- Copier-coller chaque section et exécuter
-- 
-- ⚠️ FAIRE UN BACKUP avant d'exécuter
-- ============================================

-- ============================================
-- MIGRATION 1 : Colonne random_order pour tri efficace
-- Phase 1, Tâche 1.2
-- Gain attendu : -80% latence sur tri aléatoire
-- ============================================

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

DROP TRIGGER IF EXISTS movies_random_order_trigger ON movies;
CREATE TRIGGER movies_random_order_trigger
BEFORE INSERT ON movies
FOR EACH ROW
EXECUTE FUNCTION set_random_order();

-- Vérifier que ça fonctionne
-- SELECT COUNT(*) FROM movies WHERE random_order IS NOT NULL;
-- Devrait retourner le nombre total de films


-- ============================================
-- MIGRATION 2 : Indexes full-text search (trigram)
-- Phase 1, Tâche 1.3
-- Gain attendu : -70% temps sur recherches textuelles
-- ============================================

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

-- Vérifier que les indexes existent
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('movies', 'actors', 'directors');


-- ============================================
-- MIGRATION 3 : Full-text search avec tsvector
-- Phase 2, Tâche 2.2
-- Gain attendu : -60% latence recherche, 1 requête au lieu de 3
-- ============================================

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

-- Vérifier que ça fonctionne
-- SELECT COUNT(*) FROM movies WHERE search_vector IS NOT NULL;
-- SELECT * FROM search_movies('Inception', NULL, NULL, NULL, FALSE, 1, 5);


-- ============================================
-- MIGRATION 4 : Indexes composites pour requêtes fréquentes
-- Phase 2, Tâche 2.4
-- Gain attendu : -40% temps sur requêtes rental/subscription
-- ============================================

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

-- Vérifier que les indexes existent
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('emprunts', 'user_abonnements', 'movie_actors', 'movie_directors');


-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier toutes les colonnes ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'movies' 
  AND column_name IN ('random_order', 'search_vector');
-- Devrait retourner 2 lignes

-- Vérifier tous les indexes créés
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('movies', 'actors', 'directors', 'emprunts', 'user_abonnements', 'movie_actors', 'movie_directors')
ORDER BY tablename, indexname;
-- Devrait retourner ~20 indexes

-- Vérifier que pg_trgm est activé
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
-- Devrait retourner 1 ligne

-- Vérifier que la fonction RPC existe
SELECT proname FROM pg_proc WHERE proname = 'search_movies';
-- Devrait retourner 1 ligne


-- ============================================
-- ROLLBACK (Si besoin d'annuler)
-- ============================================

/*
-- ATTENTION : Exécuter uniquement si vous voulez ANNULER toutes les migrations

-- Supprimer indexes
DROP INDEX IF EXISTS movies_random_order_idx;
DROP INDEX IF EXISTS movies_titre_francais_trgm_idx;
DROP INDEX IF EXISTS movies_titre_original_trgm_idx;
DROP INDEX IF EXISTS actors_nom_complet_trgm_idx;
DROP INDEX IF EXISTS directors_nom_complet_trgm_idx;
DROP INDEX IF EXISTS movies_statut_idx;
DROP INDEX IF EXISTS movies_copies_disponibles_idx;
DROP INDEX IF EXISTS movies_annee_sortie_idx;
DROP INDEX IF EXISTS movies_langue_vo_idx;
DROP INDEX IF EXISTS movies_search_vector_idx;
DROP INDEX IF EXISTS emprunts_movie_status_idx;
DROP INDEX IF EXISTS emprunts_user_status_idx;
DROP INDEX IF EXISTS emprunts_user_movie_idx;
DROP INDEX IF EXISTS user_abonnements_user_status_idx;
DROP INDEX IF EXISTS movie_actors_movie_idx;
DROP INDEX IF EXISTS movie_directors_movie_idx;
DROP INDEX IF EXISTS emprunts_date_retour_idx;

-- Supprimer colonnes
ALTER TABLE movies DROP COLUMN IF EXISTS random_order;
ALTER TABLE movies DROP COLUMN IF EXISTS search_vector;

-- Supprimer fonctions
DROP FUNCTION IF EXISTS refresh_random_order();
DROP FUNCTION IF EXISTS set_random_order();
DROP FUNCTION IF EXISTS movies_update_search_vector();
DROP FUNCTION IF EXISTS search_movies(TEXT, TEXT[], INT, TEXT, BOOLEAN, INT, INT);

-- Supprimer triggers
DROP TRIGGER IF EXISTS movies_random_order_trigger ON movies;
DROP TRIGGER IF EXISTS movies_search_vector_update ON movies;

-- Note : pg_trgm extension n'est pas supprimée (utilisée potentiellement ailleurs)
*/


-- ============================================
-- MAINTENANCE RECOMMANDÉE
-- ============================================

-- Régénérer random_order tous les jours (via cron job Supabase)
-- SELECT cron.schedule(
--   'refresh-random-order-daily',
--   '0 3 * * *',  -- 3h du matin tous les jours
--   $$ SELECT refresh_random_order(); $$
-- );

-- Analyser les tables pour optimiser le query planner
-- ANALYZE movies;
-- ANALYZE actors;
-- ANALYZE directors;
-- ANALYZE emprunts;
-- ANALYZE user_abonnements;


-- ============================================
-- FIN DES MIGRATIONS
-- ============================================
-- Date de création : 26 octobre 2025
-- Version : 1.0
-- Auteur : Claude (Optimisation performance Warecast)
-- ============================================
