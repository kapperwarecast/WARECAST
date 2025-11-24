-- ============================================================================
-- MIGRATION: Création fonctions RPC utilitaires pour viewing_sessions
-- Date: 2025-11-20
-- Description: Fonctions helper pour vérifier disponibilité par registry_id
--              et récupérer sessions actives avec détails
-- ============================================================================

-- ============================================================================
-- FONCTION 1: Vérifier disponibilité d'une copie physique spécifique
-- ============================================================================

CREATE OR REPLACE FUNCTION is_registry_available(p_registry_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Une copie est disponible si aucune session active n'existe dessus
  RETURN NOT EXISTS(
    SELECT 1
    FROM viewing_sessions
    WHERE registry_id = p_registry_id
      AND statut = 'en_cours'
      AND return_date > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_registry_available IS 'Vérifie si une copie physique spécifique (registry_id) est disponible pour échange/visionnage';

-- ============================================================================
-- FONCTION 2: Récupérer les sessions actives d'un utilisateur avec détails
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_active_sessions(p_user_id UUID)
RETURNS TABLE (
  session_id UUID,
  registry_id UUID,
  movie_id UUID,
  movie_title TEXT,
  physical_support_type TEXT,
  session_type TEXT,
  amount_paid NUMERIC,
  session_start_date TIMESTAMP,
  return_date TIMESTAMP,
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vs.id AS session_id,
    vs.registry_id,
    vs.movie_id,
    m.titre_francais AS movie_title,
    fr.physical_support_type,
    vs.session_type,
    vs.amount_paid,
    vs.session_start_date,
    vs.return_date,
    (vs.return_date - NOW()) AS time_remaining
  FROM viewing_sessions vs
  JOIN films_registry fr ON fr.id = vs.registry_id
  JOIN movies m ON m.id = vs.movie_id
  WHERE vs.user_id = p_user_id
    AND vs.statut = 'en_cours'
    AND vs.return_date > NOW()
  ORDER BY vs.return_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_active_sessions IS 'Récupère toutes les sessions actives d''un utilisateur avec détails complets (film, registry, temps restant)';

-- ============================================================================
-- FONCTION 3: Récupérer disponibilité d'un film (toutes copies)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_movie_availability(p_movie_id UUID)
RETURNS TABLE (
  registry_id UUID,
  current_owner_id UUID,
  owner_email TEXT,
  physical_support_type TEXT,
  is_available BOOLEAN,
  active_session_id UUID,
  session_return_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.id AS registry_id,
    fr.current_owner_id,
    up.email AS owner_email,
    fr.physical_support_type,
    NOT EXISTS(
      SELECT 1
      FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
    ) AS is_available,
    (
      SELECT vs.id
      FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
      LIMIT 1
    ) AS active_session_id,
    (
      SELECT vs.return_date
      FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
      LIMIT 1
    ) AS session_return_date
  FROM films_registry fr
  LEFT JOIN user_profiles up ON up.id = fr.current_owner_id
  WHERE fr.movie_id = p_movie_id
  ORDER BY fr.acquisition_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_movie_availability IS 'Récupère la disponibilité de toutes les copies physiques d''un film donné (support multi-copies)';

-- ============================================================================
-- FONCTION 4: Expirer les sessions dépassées
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_overdue_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Marquer comme expirées les sessions dépassant 48h
  UPDATE viewing_sessions
  SET
    statut = 'expiré',
    updated_at = NOW()
  WHERE statut = 'en_cours'
    AND return_date < NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_overdue_sessions IS 'Marque comme expirées les sessions dépassant la date de retour (48h). À appeler périodiquement via cron.';

-- ============================================================================
-- FONCTION 5: Statistiques utilisateur
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_viewing_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_sessions INTEGER;
  v_active_sessions INTEGER;
  v_completed_sessions INTEGER;
  v_expired_sessions INTEGER;
  v_total_spent NUMERIC;
BEGIN
  -- Compter les différents types de sessions
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE statut = 'en_cours'),
    COUNT(*) FILTER (WHERE statut = 'rendu'),
    COUNT(*) FILTER (WHERE statut = 'expiré'),
    COALESCE(SUM(amount_paid), 0)
  INTO
    v_total_sessions,
    v_active_sessions,
    v_completed_sessions,
    v_expired_sessions,
    v_total_spent
  FROM viewing_sessions
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'total_sessions', v_total_sessions,
    'active_sessions', v_active_sessions,
    'completed_sessions', v_completed_sessions,
    'expired_sessions', v_expired_sessions,
    'total_spent', v_total_spent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_viewing_stats IS 'Retourne les statistiques de visionnage d''un utilisateur (nombre de sessions, montant dépensé, etc.)';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
