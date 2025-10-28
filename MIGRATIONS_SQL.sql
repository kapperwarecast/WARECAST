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
-- MIGRATION 5 : Triggers de gestion des copies
-- Phase 3 - Gestion automatique des copies disponibles
-- Gain attendu : Intégrité des données, synchronisation copies
-- ============================================

-- Fonction appelée lors de la création d'un emprunt
-- Décrémente automatiquement copies_disponibles
CREATE OR REPLACE FUNCTION handle_rental_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Décrémenter les copies disponibles quand un emprunt est créé avec statut 'en_cours'
  IF NEW.statut = 'en_cours' THEN
    UPDATE movies
    SET copies_disponibles = copies_disponibles - 1
    WHERE id = NEW.movie_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction appelée lors du retour d'un emprunt
-- Incrémente automatiquement copies_disponibles
CREATE OR REPLACE FUNCTION handle_rental_return()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter les copies disponibles quand le statut passe de 'en_cours' à 'rendu' ou 'expiré'
  IF OLD.statut = 'en_cours' AND (NEW.statut = 'rendu' OR NEW.statut = 'expiré') THEN
    UPDATE movies
    SET copies_disponibles = copies_disponibles + 1
    WHERE id = OLD.movie_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la création d'emprunts
DROP TRIGGER IF EXISTS rental_created_trigger ON emprunts;
CREATE TRIGGER rental_created_trigger
AFTER INSERT ON emprunts
FOR EACH ROW
EXECUTE FUNCTION handle_rental_created();

-- Trigger pour le retour d'emprunts
DROP TRIGGER IF EXISTS rental_return_trigger ON emprunts;
CREATE TRIGGER rental_return_trigger
AFTER UPDATE ON emprunts
FOR EACH ROW
EXECUTE FUNCTION handle_rental_return();

-- Vérifier que les triggers fonctionnent
-- Test : INSERT INTO emprunts (...) - devrait décrémenter copies_disponibles
-- Test : UPDATE emprunts SET statut='rendu' - devrait incrémenter copies_disponibles


-- ============================================
-- MIGRATION 6 : Expiration automatique des emprunts
-- Phase 3 - Retour automatique après 48h
-- Gain attendu : Intégrité des données, libération automatique des copies
-- ============================================

-- Fonction pour marquer les emprunts expirés automatiquement
CREATE OR REPLACE FUNCTION expire_overdue_rentals()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Marquer tous les emprunts dont la date de retour est dépassée
  UPDATE emprunts
  SET statut = 'expiré',
      updated_at = NOW()
  WHERE statut = 'en_cours'
    AND date_retour < NOW();

  -- Retourner le nombre de lignes affectées (pour logs)
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Fonction helper pour vérifier les emprunts expirés (sans modification)
CREATE OR REPLACE FUNCTION count_overdue_rentals()
RETURNS INTEGER AS $$
DECLARE
  count_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_rows
  FROM emprunts
  WHERE statut = 'en_cours'
    AND date_retour < NOW();

  RETURN count_rows;
END;
$$ LANGUAGE plpgsql;

-- Vérifier combien d'emprunts sont actuellement expirés
-- SELECT count_overdue_rentals();

-- Pour tester manuellement l'expiration
-- SELECT expire_overdue_rentals();


-- ============================================
-- MIGRATION 7 : Nettoyage des données historiques
-- Phase 3 - Correction des emprunts expirés existants
-- IMPORTANT : À exécuter UNE SEULE FOIS après avoir créé les triggers
-- ============================================

-- ⚠️ ATTENTION : Cette migration va modifier des données existantes
-- Elle doit être exécutée APRÈS les migrations 5 et 6

-- Étape 1 : Marquer tous les emprunts expirés comme 'expiré'
-- Les triggers handle_rental_return vont automatiquement incrémenter copies_disponibles
DO $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Compter les emprunts à expirer
  SELECT COUNT(*) INTO expired_count
  FROM emprunts
  WHERE statut = 'en_cours'
    AND date_retour < NOW();

  RAISE NOTICE 'Nombre d''emprunts à expirer : %', expired_count;

  -- Marquer comme expirés (les triggers vont libérer les copies automatiquement)
  UPDATE emprunts
  SET statut = 'expiré',
      updated_at = NOW()
  WHERE statut = 'en_cours'
    AND date_retour < NOW();

  RAISE NOTICE 'Emprunts expirés avec succès : %', expired_count;
END $$;

-- Étape 2 : Vérification et recalcul des copies disponibles (sécurité)
-- Cette étape est optionnelle mais recommandée pour vérifier la cohérence
DO $$
DECLARE
  movie_record RECORD;
  expected_copies INTEGER;
  current_copies INTEGER;
BEGIN
  FOR movie_record IN SELECT id, nombre_copies, copies_disponibles FROM movies
  LOOP
    -- Calculer le nombre attendu de copies disponibles
    SELECT movie_record.nombre_copies - COUNT(*)
    INTO expected_copies
    FROM emprunts
    WHERE movie_id = movie_record.id
      AND statut = 'en_cours';

    current_copies := movie_record.copies_disponibles;

    -- Si incohérence, corriger
    IF expected_copies != current_copies THEN
      RAISE NOTICE 'Film % : Correction % -> %',
        movie_record.id,
        current_copies,
        expected_copies;

      UPDATE movies
      SET copies_disponibles = expected_copies
      WHERE id = movie_record.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Vérification et recalcul terminés';
END $$;

-- Vérifier le résultat
SELECT
  COUNT(*) as total_emprunts_expired
FROM emprunts
WHERE statut = 'expiré';

SELECT
  COUNT(*) as total_emprunts_en_cours
FROM emprunts
WHERE statut = 'en_cours';

-- Vérifier qu'aucun film n'a de copies négatives
SELECT
  id,
  titre_francais,
  nombre_copies,
  copies_disponibles
FROM movies
WHERE copies_disponibles < 0 OR copies_disponibles > nombre_copies;
-- Devrait retourner 0 lignes


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

-- Vérifier que les fonctions de gestion des emprunts existent
SELECT proname FROM pg_proc WHERE proname IN (
  'handle_rental_created',
  'handle_rental_return',
  'expire_overdue_rentals',
  'count_overdue_rentals'
);
-- Devrait retourner 4 lignes

-- Vérifier que les triggers existent
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname IN ('rental_created_trigger', 'rental_return_trigger')
  AND tgrelid = 'emprunts'::regclass;
-- Devrait retourner 2 lignes


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
DROP TRIGGER IF EXISTS rental_created_trigger ON emprunts;
DROP TRIGGER IF EXISTS rental_return_trigger ON emprunts;

-- Supprimer fonctions de gestion des emprunts
DROP FUNCTION IF EXISTS handle_rental_created();
DROP FUNCTION IF EXISTS handle_rental_return();
DROP FUNCTION IF EXISTS expire_overdue_rentals();
DROP FUNCTION IF EXISTS count_overdue_rentals();

-- Note : pg_trgm extension n'est pas supprimée (utilisée potentiellement ailleurs)
-- Note : La migration 7 (nettoyage) ne peut pas être rollback automatiquement
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
-- MIGRATION 8 : Fonction RPC rent_or_access_movie
-- Pour gestion des locations et emprunts avec abonnement
-- Appelée par le webhook Stripe et l'API de location
-- ============================================

CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_copies_disponibles INT;
  v_type_emprunt TEXT;
  v_montant_paye NUMERIC;
  v_existing_rental_id UUID;
  v_new_rental_id UUID;
  v_user_has_subscription BOOLEAN;
BEGIN
  -- Vérifier si le film a des copies disponibles
  SELECT copies_disponibles INTO v_copies_disponibles
  FROM movies
  WHERE id = p_movie_id;

  -- Si le film n'existe pas
  IF v_copies_disponibles IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non trouvé',
      'code', 'MOVIE_NOT_FOUND'
    );
  END IF;

  -- Si aucune copie disponible
  IF v_copies_disponibles <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucune copie disponible pour ce film',
      'code', 'NO_COPIES_AVAILABLE'
    );
  END IF;

  -- Vérifier si l'utilisateur a un abonnement actif
  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND statut = 'actif'
      AND date_expiration > NOW()
  ) INTO v_user_has_subscription;

  -- Déterminer le type d'emprunt et le montant
  IF v_user_has_subscription THEN
    v_type_emprunt := 'abonnement';
    v_montant_paye := 0;

    -- Si abonné, libérer l'emprunt en cours (rotation automatique)
    SELECT id INTO v_existing_rental_id
    FROM emprunts
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
      AND type_emprunt = 'abonnement'
    LIMIT 1;

    IF v_existing_rental_id IS NOT NULL THEN
      -- Marquer l'ancien emprunt comme rendu
      -- Le trigger handle_rental_return va automatiquement incrémenter copies_disponibles
      UPDATE emprunts
      SET statut = 'rendu',
          updated_at = NOW()
      WHERE id = v_existing_rental_id;
    END IF;
  ELSE
    v_type_emprunt := 'location';
    -- Récupérer le montant depuis le payment si disponible
    IF p_payment_id IS NOT NULL THEN
      SELECT amount INTO v_montant_paye
      FROM payments
      WHERE id = p_payment_id;
    ELSE
      v_montant_paye := 1.5; -- Valeur par défaut
    END IF;
  END IF;

  -- Créer le nouvel emprunt
  -- Le trigger handle_rental_created va automatiquement décrémenter copies_disponibles
  INSERT INTO emprunts (
    user_id,
    movie_id,
    statut,
    type_emprunt,
    montant_paye,
    date_emprunt,
    date_retour,
    payment_id,
    created_at,
    updated_at
  )
  VALUES (
    p_auth_user_id,
    p_movie_id,
    'en_cours',
    v_type_emprunt,
    v_montant_paye,
    NOW(),
    NOW() + INTERVAL '48 hours',
    p_payment_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_rental_id;

  -- Retourner succès
  RETURN json_build_object(
    'success', true,
    'rental_id', v_new_rental_id,
    'type', v_type_emprunt,
    'date_retour', NOW() + INTERVAL '48 hours',
    'previous_rental_returned', v_existing_rental_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner les détails
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$ LANGUAGE plpgsql;

-- Vérifier que la fonction existe
-- SELECT proname FROM pg_proc WHERE proname = 'rent_or_access_movie';
-- Devrait retourner 1 ligne

-- Test de la fonction (à décommenter pour tester)
-- SELECT rent_or_access_movie(
--   'user-uuid-here'::UUID,
--   'movie-uuid-here'::UUID,
--   'payment-uuid-here'::UUID
-- );


-- ============================================
-- FIN DES MIGRATIONS
-- ============================================
-- Date de création : 26 octobre 2025
-- Version : 1.1
-- Auteur : Claude (Optimisation performance Warecast + Webhook Stripe fix)
-- ============================================
