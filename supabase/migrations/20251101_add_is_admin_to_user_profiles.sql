-- Migration: Ajouter la colonne is_admin à user_profiles
-- Date: 2025-11-01
-- Description: Permet d'identifier les administrateurs du site

-- Ajouter la colonne is_admin avec valeur par défaut FALSE
ALTER TABLE user_profiles
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Créer un index pour optimiser les requêtes filtrant par is_admin
CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin)
WHERE is_admin = TRUE;

-- Commentaire de la colonne pour documentation
COMMENT ON COLUMN user_profiles.is_admin IS 'Indique si l''utilisateur a les droits d''administrateur du site';

-- Note: Les RLS policies existantes continuent de s'appliquer
-- Les utilisateurs peuvent lire leur propre profil (incluant is_admin)
-- Seul le service role peut modifier is_admin
