-- Migration: Ajouter un trigger pour assigner automatiquement un film de bienvenue
-- Description: Appelle automatiquement assign_welcome_film() lors de la création d'un nouvel utilisateur

-- Fonction trigger qui appelle assign_welcome_film
CREATE OR REPLACE FUNCTION trigger_assign_welcome_film()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Appeler la fonction assign_welcome_film pour le nouvel utilisateur
  -- On ignore le résultat JSON car le trigger ne peut pas le retourner
  PERFORM assign_welcome_film(NEW.id);

  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table user_profiles
-- Se déclenche APRÈS l'insertion d'un nouvel utilisateur
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_welcome_film();

-- Commentaires pour la documentation
COMMENT ON FUNCTION trigger_assign_welcome_film() IS
  'Fonction trigger qui assigne automatiquement un film de bienvenue à chaque nouvel utilisateur';

COMMENT ON TRIGGER on_user_profile_created ON user_profiles IS
  'Déclenche l''attribution automatique d''un film de bienvenue lors de la création d''un profil utilisateur';
