-- ============================================================================
-- MIGRATION: Fix get_movie_access_info - isAvailable logic
-- Date: 2025-11-24
-- Description:
--   PROBLÈME: User avec session active voit signe barré sur page de détail
--   Root cause: isAvailable compte la session de l'user comme "occupée"
--
--   Scénario buggé:
--   - User A a session active sur Fantastic Mr. Fox
--   - Page "Mes films": Bouton "Continuer la lecture" ✅
--   - Page de détail: Signe barré ❌ (car isAvailable = false)
--
--   Solution: Exclure les sessions de l'user actuel dans le calcul de isAvailable
--   → Une copie est disponible si elle n'a PAS de session par QUELQU'UN D'AUTRE
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS get_movie_access_info(UUID, UUID);

-- Create with CORRECT availability logic
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
  -- 3. Au moins UNE copie disponible (sans session active PAR QUELQU'UN D'AUTRE) ?
  -- ============================================================================
  -- ✅ FIX: Exclure les sessions de l'user actuel (AND vs.user_id != p_user_id)
  -- Logique: "disponible" = pas de session active PAR QUELQU'UN D'AUTRE
  -- → Si l'user a sa propre session active, la copie reste "disponible pour lui"
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
          AND vs.user_id != p_user_id  -- ✅ FIX: Ignorer sessions de l'user actuel
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
- isAvailable: Au moins une copie disponible pour QUELQU''UN D''AUTRE (pas de session par autre user)

FIX: isAvailable ignore maintenant les sessions de l''utilisateur actuel.
→ Si user a session active sur sa copie, isAvailable = true (car disponible pour lui)

Utilisé uniquement pour l''affichage (STABLE), pas pour les actions (voir rent_or_access_movie).';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_movie_access_info(UUID, UUID) TO authenticated;
