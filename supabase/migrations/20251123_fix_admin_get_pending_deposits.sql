-- Migration: Corriger la fonction admin_get_pending_deposits
-- Problème: La colonne 'email' n'existe pas dans user_profiles (elle est dans auth.users)
-- Solution: Retourner user_id et user_name, récupérer emails côté API

CREATE OR REPLACE FUNCTION admin_get_pending_deposits(p_admin_id UUID)
RETURNS TABLE (
  deposit_id UUID,
  tracking_number TEXT,
  user_id UUID,           -- Ajouté pour récupérer email après
  user_name TEXT,         -- Changé de user_email à user_name
  film_title TEXT,
  support_type TEXT,
  status TEXT,
  sent_at TIMESTAMP,
  notes TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est admin
  SELECT is_admin INTO v_is_admin
  FROM user_profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    fd.id AS deposit_id,
    fd.tracking_number,
    fd.user_id,                                    -- Retourne user_id pour récupération email
    (up.prenom || ' ' || up.nom) AS user_name,    -- Construit nom complet depuis user_profiles
    fd.film_title,
    fd.support_type,
    fd.status,
    fd.sent_at,
    fd.additional_notes AS notes
  FROM film_deposits fd
  JOIN user_profiles up ON up.id = fd.user_id
  WHERE fd.status IN ('sent', 'received', 'digitizing')
  ORDER BY fd.sent_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire explicatif
COMMENT ON FUNCTION admin_get_pending_deposits IS 'Récupère les dépôts en attente pour l''admin. Les emails doivent être récupérés séparément via auth.admin.getUserById()';
