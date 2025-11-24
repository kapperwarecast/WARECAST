-- ================================================================
-- Migration: Corriger search_movies - ajouter tous les champs
-- Date: 2025-11-17
-- Description:
--   La fonction search_movies ne retournait pas tous les champs
--   nécessaires, notamment le slug qui est critique pour les URLs.
--   Cette migration retourne maintenant tous les champs de la
--   table movies au lieu de lister seulement quelques champs.
-- ================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS search_movies(TEXT, TEXT[], INT, TEXT, BOOLEAN, INT, INT);

-- Créer la nouvelle fonction qui retourne tous les champs de movies
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
  tmdb_id INT,
  titre_francais TEXT,
  titre_original TEXT,
  duree INT,
  genres TEXT[],
  langue_vo TEXT,
  annee_sortie INT,
  synopsis TEXT,
  note_tmdb NUMERIC,
  poster_local_path TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  subtitle_path TEXT,
  lien_vimeo TEXT,
  statut TEXT,
  random_order FLOAT8,
  search_vector TSVECTOR,
  slug TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.tmdb_id,
    m.titre_francais,
    m.titre_original,
    m.duree,
    m.genres,
    m.langue_vo,
    m.annee_sortie,
    m.synopsis,
    m.note_tmdb,
    m.poster_local_path,
    m.created_at,
    m.updated_at,
    m.subtitle_path,
    m.lien_vimeo,
    m.statut,
    m.random_order,
    m.search_vector,
    m.slug,
    ts_rank(m.search_vector, to_tsquery('french', search_query)) as rank
  FROM movies m
  WHERE
    m.statut = 'en ligne'
    AND m.search_vector @@ to_tsquery('french', search_query)
    AND (filter_genres IS NULL OR m.genres && filter_genres)
    AND (filter_decade IS NULL OR (m.annee_sortie >= filter_decade AND m.annee_sortie <= filter_decade + 9))
    AND (filter_language IS NULL OR m.langue_vo = filter_language)
    -- REMOVED: copies_disponibles check (no longer exists in ownership system)
    -- All films are "available" since availability depends on ownership, not copies
  ORDER BY rank DESC
  LIMIT page_limit
  OFFSET (page_number - 1) * page_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_movies IS
'Recherche full-text dans les films avec filtres optionnels.
Retourne tous les champs de la table movies incluant le slug pour les URLs.
La disponibilité dépend maintenant du système de propriété (films_registry).';
