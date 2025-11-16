-- ============================================================================
-- MIGRATION: Distribution des films pour tests
-- Date: 2025-11-16
-- Description: Crée 413 exemplaires physiques (un par film) et les distribue
--              équitablement entre 3 utilisateurs pour tester les échanges
-- ============================================================================

-- IDs des 3 utilisateurs
-- adrienkapper@gmail.com : 436af50a-cc0b-4462-b5d5-7ceba8789448 (138 films)
-- comesd@yahoo.fr        : e5854b0a-c1e7-4e1d-8ad5-913067f25c3a (138 films)
-- kapper.warecast@gmail.com : 4aed9057-1cea-4be0-ae82-739e0c2da9a0 (137 films)

INSERT INTO films_registry (
  id,
  movie_id,
  current_owner_id,
  physical_support_type,
  acquisition_method,
  deposit_date,
  acquisition_date,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() AS id,
  movie_id,
  CASE
    WHEN (row_num - 1) % 3 = 0 THEN '436af50a-cc0b-4462-b5d5-7ceba8789448'::uuid  -- adrienkapper@gmail.com
    WHEN (row_num - 1) % 3 = 1 THEN 'e5854b0a-c1e7-4e1d-8ad5-913067f25c3a'::uuid  -- comesd@yahoo.fr
    ELSE '4aed9057-1cea-4be0-ae82-739e0c2da9a0'::uuid  -- kapper.warecast@gmail.com
  END AS current_owner_id,
  CASE
    WHEN (row_num - 1) % 2 = 0 THEN 'Blu-ray'
    ELSE 'DVD'
  END AS physical_support_type,
  'deposit' AS acquisition_method,
  NOW() AS deposit_date,
  NOW() AS acquisition_date,
  NOW() AS created_at,
  NOW() AS updated_at
FROM (
  SELECT
    id AS movie_id,
    ROW_NUMBER() OVER (ORDER BY id) AS row_num
  FROM movies
) AS numbered_movies;

-- Vérification : Afficher la distribution
DO $$
DECLARE
  user1_count INTEGER;
  user2_count INTEGER;
  user3_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user1_count
  FROM films_registry
  WHERE current_owner_id = '436af50a-cc0b-4462-b5d5-7ceba8789448';

  SELECT COUNT(*) INTO user2_count
  FROM films_registry
  WHERE current_owner_id = 'e5854b0a-c1e7-4e1d-8ad5-913067f25c3a';

  SELECT COUNT(*) INTO user3_count
  FROM films_registry
  WHERE current_owner_id = '4aed9057-1cea-4be0-ae82-739e0c2da9a0';

  SELECT COUNT(*) INTO total_count FROM films_registry;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Distribution des films terminée :';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'adrienkapper@gmail.com : % films', user1_count;
  RAISE NOTICE 'comesd@yahoo.fr        : % films', user2_count;
  RAISE NOTICE 'kapper.warecast@gmail.com : % films', user3_count;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'TOTAL                  : % films', total_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
