-- ============================================================================
-- MIGRATION: Créer RPC get_movie_access_info pour simplifier l'affichage du bouton Play
-- Date: 2025-11-24
-- Description: RPC lecture seule qui retourne toutes les infos nécessaires
--              pour déterminer l'apparence du bouton Play (bleu/orange/barré)
-- ============================================================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS get_movie_access_info(UUID, UUID);

-- Créer la fonction RPC
CREATE OR REPLACE FUNCTION get_movie_access_info(
  p_user_id UUID,
  p_movie_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
STABLE  -- Lecture seule, optimisation PostgreSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active_session BOOLEAN;
  v_owns_film BOOLEAN;
  v_is_available BOOLEAN;
BEGIN

  -- ============================================================================
  -- 1. User a-t-il une session active sur CE film ?
  -- ============================================================================
  -- Vérifie si l'utilisateur a une session en cours sur n'importe quelle copie de ce film
  SELECT EXISTS(
    SELECT 1
    FROM viewing_sessions vs
    JOIN films_registry fr ON fr.id = vs.registry_id
    WHERE vs.user_id = p_user_id
      AND fr.movie_id = p_movie_id
      AND vs.statut = 'en_cours'
      AND vs.return_date > NOW()
  ) INTO v_has_active_session;

  -- ============================================================================
  -- 2. User possède-t-il une copie de ce film ?
  -- ============================================================================
  -- Vérifie si l'utilisateur est propriétaire d'au moins une copie physique
  SELECT EXISTS(
    SELECT 1
    FROM films_registry
    WHERE movie_id = p_movie_id
      AND current_owner_id = p_user_id
  ) INTO v_owns_film;

  -- ============================================================================
  -- 3. Au moins UNE copie disponible (sans session active) ?
  -- ============================================================================
  -- Vérifie s'il existe au moins une copie physique qui n'est pas en cours de visionnage
  SELECT EXISTS(
    SELECT 1
    FROM films_registry fr
    WHERE fr.movie_id = p_movie_id
      AND NOT EXISTS(
        SELECT 1
        FROM viewing_sessions vs
        WHERE vs.registry_id = fr.id
          AND vs.statut = 'en_cours'
          AND vs.return_date > NOW()
      )
  ) INTO v_is_available;

  -- ============================================================================
  -- Retourner les 3 infos sous forme JSON
  -- ============================================================================
  RETURN json_build_object(
    'hasActiveSession', v_has_active_session,
    'ownsFilm', v_owns_film,
    'isAvailable', v_is_available
  );

END;
$$;

-- ============================================================================
-- Commentaire pour documentation
-- ============================================================================
COMMENT ON FUNCTION get_movie_access_info(UUID, UUID) IS
'Retourne les informations nécessaires pour déterminer l''apparence du bouton Play.
- hasActiveSession: User a une session active sur ce film (peut reprendre gratuitement)
- ownsFilm: User possède une copie de ce film (peut regarder gratuitement)
- isAvailable: Au moins une copie disponible (peut échanger/louer)

Utilisé uniquement pour l''affichage (STABLE), pas pour les actions (voir rent_or_access_movie).';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_movie_access_info(UUID, UUID) TO authenticated;
