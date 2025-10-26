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
-- Note : Les migrations de la PHASE 2 et PHASE 3 seront ajoutées plus tard si nécessaire
-- ================================================================================================
