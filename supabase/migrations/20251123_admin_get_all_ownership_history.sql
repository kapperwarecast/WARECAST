-- Fonction pour récupérer l'historique complet des transferts de films (pour l'admin)
CREATE OR REPLACE FUNCTION admin_get_all_ownership_history(
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  transfer_id UUID,
  film_title TEXT,
  film_slug TEXT,
  physical_support_type TEXT,
  from_owner_id UUID,
  from_owner_prenom TEXT,
  from_owner_nom TEXT,
  from_owner_username TEXT,
  to_owner_id UUID,
  to_owner_prenom TEXT,
  to_owner_nom TEXT,
  to_owner_username TEXT,
  transfer_type TEXT,
  transfer_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oh.id AS transfer_id,
    m.title_fr AS film_title,
    m.slug AS film_slug,
    fr.physical_support_type,
    oh.from_owner_id,
    from_up.prenom AS from_owner_prenom,
    from_up.nom AS from_owner_nom,
    from_up.username AS from_owner_username,
    oh.to_owner_id,
    to_up.prenom AS to_owner_prenom,
    to_up.nom AS to_owner_nom,
    to_up.username AS to_owner_username,
    oh.transfer_type,
    oh.transfer_date
  FROM ownership_history oh
  JOIN films_registry fr ON fr.id = oh.film_registry_id
  JOIN movies m ON m.id = fr.movie_id
  LEFT JOIN user_profiles from_up ON from_up.id = oh.from_owner_id
  JOIN user_profiles to_up ON to_up.id = oh.to_owner_id
  ORDER BY oh.transfer_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION admin_get_all_ownership_history IS
'Récupère l''historique complet des transferts de films pour l''interface admin. Inclut les informations sur les films, les propriétaires précédents et actuels.';
