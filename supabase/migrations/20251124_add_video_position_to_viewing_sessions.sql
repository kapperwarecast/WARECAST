-- ============================================================================
-- MIGRATION: Ajout colonnes de sauvegarde position vidéo
-- Date: 2025-11-24
-- Description:
--   Restore la fonctionnalité de reprise de lecture vidéo
--   Ajoute position_seconds et last_watched_at à viewing_sessions
--
--   Contexte:
--   - Anciennes colonnes dans table "emprunts" (migration 20251028)
--   - Code frontend DÉJÀ implémenté (hook use-video-position, modale, etc.)
--   - Manquait uniquement les colonnes DB
-- ============================================================================

-- Ajouter colonne position_seconds (position de lecture en secondes)
ALTER TABLE viewing_sessions
ADD COLUMN IF NOT EXISTS position_seconds INTEGER DEFAULT 0;

-- Ajouter colonne last_watched_at (timestamp dernière lecture)
ALTER TABLE viewing_sessions
ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMP WITH TIME ZONE;

-- Contrainte: Position toujours positive ou nulle
ALTER TABLE viewing_sessions
ADD CONSTRAINT check_viewing_sessions_position_positive
CHECK (position_seconds >= 0);

-- Index pour requêtes de reprise (user_id + movie_id + statut actif + position > 0)
-- Optimise la recherche de sessions avec position sauvegardée
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_resume_position
ON viewing_sessions(user_id, movie_id, statut)
WHERE statut = 'en_cours' AND position_seconds > 0;

-- Commentaires documentation
COMMENT ON COLUMN viewing_sessions.position_seconds IS
'Position de lecture vidéo en secondes (0 = début, > 0 = reprise possible).
Sauvegardée automatiquement toutes les 10s pendant la lecture.';

COMMENT ON COLUMN viewing_sessions.last_watched_at IS
'Timestamp de la dernière mise à jour de position.
Utilisé pour expiration (position ignorée si > 30 jours).';

-- ============================================================================
-- VÉRIFICATION ET LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Colonne position_seconds ajoutée à viewing_sessions';
  RAISE NOTICE '✅ Colonne last_watched_at ajoutée à viewing_sessions';
  RAISE NOTICE '✅ Contrainte check_viewing_sessions_position_positive créée';
  RAISE NOTICE '✅ Index idx_viewing_sessions_resume_position créé';
  RAISE NOTICE '';
  RAISE NOTICE 'La fonctionnalité de reprise de lecture vidéo est maintenant activée !';
  RAISE NOTICE 'Workflow:';
  RAISE NOTICE '  1. User regarde vidéo → Sauvegarde auto toutes les 10s';
  RAISE NOTICE '  2. User ferme la page';
  RAISE NOTICE '  3. User rouvre le film → Modale "Reprendre à XX:XX"';
  RAISE NOTICE '  4. User clique "Reprendre" → Vidéo démarre au bon timestamp';
END $$;
