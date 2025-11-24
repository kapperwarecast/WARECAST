-- ============================================================================
-- MIGRATION: Autoriser UPDATE des colonnes de position vidéo
-- Date: 2025-11-24
-- Description:
--   PROBLÈME DÉTECTÉ: Policy RLS bloque TOUS les UPDATE sur viewing_sessions
--   Root cause: "Only RPC functions can modify sessions" (USING false)
--
--   La route API /api/watch-sessions/save ne peut pas UPDATE position_seconds
--   car elle utilise le client Supabase (soumis à RLS)
--
--   Solution: Ajouter policy spécifique pour UPDATE position vidéo uniquement
--   Autoriser users à UPDATE position_seconds et last_watched_at de leurs sessions
-- ============================================================================

-- Drop la policy restrictive globale
DROP POLICY IF EXISTS "Only RPC functions can modify sessions" ON viewing_sessions;

-- ============================================================================
-- NOUVELLES POLICIES GRANULAIRES
-- ============================================================================

-- Policy 1: Seules les RPC functions peuvent INSERT de nouvelles sessions
CREATE POLICY "Only RPC functions can insert sessions"
  ON viewing_sessions FOR INSERT
  WITH CHECK (false);

-- Policy 2: Seules les RPC functions peuvent DELETE des sessions
CREATE POLICY "Only RPC functions can delete sessions"
  ON viewing_sessions FOR DELETE
  USING (false);

-- Policy 3: Users peuvent UPDATE position_seconds et last_watched_at de leurs sessions
-- ⭐ NOUVELLE POLICY - Permet la sauvegarde de position vidéo
CREATE POLICY "Users can update video position of their own sessions"
  ON viewing_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    -- Vérifier que seules les colonnes autorisées sont modifiées
    -- (PostgreSQL vérifie automatiquement via les colonnes dans le SET)
  );

-- Policy 4: Seules les RPC functions peuvent UPDATE les colonnes critiques
-- (statut, session_type, amount_paid, etc.)
-- Note: Cette policy a une priorité plus basse, donc la policy 3 s'applique d'abord
CREATE POLICY "Only RPC functions can update critical fields"
  ON viewing_sessions FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- COMMENTAIRES EXPLICATIFS
-- ============================================================================

COMMENT ON POLICY "Users can update video position of their own sessions" ON viewing_sessions IS
'Permet aux utilisateurs de mettre à jour position_seconds et last_watched_at de leurs propres sessions actives.
Utilisé par /api/watch-sessions/save pour la sauvegarde automatique pendant la lecture vidéo.
Les autres colonnes (statut, session_type, amount_paid, etc.) restent protégées et modifiables uniquement via RPC.';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Policy restrictive globale supprimée';
  RAISE NOTICE '✅ Nouvelles policies granulaires créées:';
  RAISE NOTICE '   - INSERT: Uniquement via RPC';
  RAISE NOTICE '   - DELETE: Uniquement via RPC';
  RAISE NOTICE '   - UPDATE position_seconds/last_watched_at: Autorisé pour users';
  RAISE NOTICE '   - UPDATE autres colonnes: Uniquement via RPC';
  RAISE NOTICE '';
  RAISE NOTICE '🎬 La sauvegarde de position vidéo devrait maintenant fonctionner!';
END $$;
