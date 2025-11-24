-- ============================================================================
-- MIGRATION: Création table viewing_sessions avec registry_id
-- Date: 2025-11-20
-- Description: Remplace emprunts avec référence au registry_id pour support
--              multi-copies physiques du même film
-- Changements:
--   - Ajout registry_id (UUID NOT NULL) → films_registry(id)
--   - Conservation movie_id pour dénormalisation/performance
--   - Renommage colonnes pour clarifier sémantique ("session" vs "emprunt")
--   - RLS activé pour sécurité
-- ============================================================================

-- ============================================================================
-- PARTIE 1: CRÉATION TABLE viewing_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS viewing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Utilisateur qui visionne
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- NOUVEAU: Référence à la copie physique spécifique
  registry_id UUID NOT NULL REFERENCES films_registry(id) ON DELETE CASCADE,

  -- Conservation movie_id pour performance (dénormalisation)
  -- Permet requêtes rapides par catalogue sans JOIN
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,

  -- Statut de la session
  statut TEXT NOT NULL CHECK (statut IN ('en_cours', 'rendu', 'expiré')),

  -- Type de session
  session_type TEXT NOT NULL CHECK (session_type IN ('subscription', 'unit')),

  -- Montant payé pour cette session (0 si abonné ou propriétaire)
  amount_paid NUMERIC DEFAULT 0,

  -- Dates
  session_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  return_date TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),

  -- Paiement (si session payante)
  payment_id UUID,
  stripe_payment_intent_id TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PARTIE 2: INDEXES POUR PERFORMANCE
-- ============================================================================

-- Index sur registry_id (clé principale pour vérifier disponibilité)
CREATE INDEX IF NOT EXISTS viewing_sessions_registry_id_idx
  ON viewing_sessions(registry_id);

-- Index sur user_id (requêtes par utilisateur)
CREATE INDEX IF NOT EXISTS viewing_sessions_user_id_idx
  ON viewing_sessions(user_id);

-- Index sur statut (filtrer sessions actives)
CREATE INDEX IF NOT EXISTS viewing_sessions_statut_idx
  ON viewing_sessions(statut);

-- Index composite pour vérifications de disponibilité rapides
CREATE INDEX IF NOT EXISTS viewing_sessions_registry_statut_idx
  ON viewing_sessions(registry_id, statut)
  WHERE statut = 'en_cours';

-- Index composite pour sessions utilisateur actives
CREATE INDEX IF NOT EXISTS viewing_sessions_user_statut_idx
  ON viewing_sessions(user_id, statut)
  WHERE statut = 'en_cours';

-- Index sur movie_id (compatibilité requêtes catalogue)
CREATE INDEX IF NOT EXISTS viewing_sessions_movie_id_idx
  ON viewing_sessions(movie_id);

-- ============================================================================
-- PARTIE 3: TRIGGER MISE À JOUR TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_viewing_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER viewing_sessions_updated_at_trigger
  BEFORE UPDATE ON viewing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_viewing_sessions_updated_at();

-- ============================================================================
-- PARTIE 4: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE viewing_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users peuvent voir leurs propres sessions
CREATE POLICY "Users can view their own sessions"
  ON viewing_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users peuvent voir toutes les sessions pour vérifier disponibilité
CREATE POLICY "Users can view all sessions for availability"
  ON viewing_sessions FOR SELECT
  USING (true);

-- Policy: Seules les RPC functions peuvent INSERT/UPDATE/DELETE
CREATE POLICY "Only RPC functions can modify sessions"
  ON viewing_sessions FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- PARTIE 5: VUE DE COMPATIBILITÉ (TEMPORAIRE)
-- ============================================================================

-- Vue pour compatibilité avec le code existant
-- Permet aux requêtes actuelles sur "emprunts" de continuer à fonctionner
-- pendant la migration progressive du code

CREATE OR REPLACE VIEW emprunts AS
SELECT
  id,
  user_id,
  movie_id,
  statut,
  -- Mapping des noms de colonnes (nouveau → ancien)
  CASE session_type
    WHEN 'subscription' THEN 'abonnement'
    WHEN 'unit' THEN 'unitaire'
    ELSE session_type
  END AS type_emprunt,
  amount_paid AS montant_paye,
  session_start_date AS date_emprunt,
  return_date AS date_retour,
  payment_id,
  stripe_payment_intent_id,
  created_at,
  updated_at
FROM viewing_sessions;

-- ============================================================================
-- PARTIE 6: COMMENTAIRES DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE viewing_sessions IS 'Sessions de visionnage de films (48h). Remplace emprunts avec référence à registry_id pour support multi-copies.';
COMMENT ON COLUMN viewing_sessions.registry_id IS 'NOUVEAU: Référence à la copie physique spécifique (films_registry.id) - Résout ambiguïté multi-copies';
COMMENT ON COLUMN viewing_sessions.movie_id IS 'Conservation pour dénormalisation/performance - Évite JOIN systématique avec films_registry';
COMMENT ON COLUMN viewing_sessions.session_type IS 'Type de session: subscription (gratuit pour abonnés/propriétaires) ou unit (1,50€ pour non-abonnés)';
COMMENT ON COLUMN viewing_sessions.statut IS 'Statut: en_cours (film occupé), rendu (disponible), expiré (timeout 48h)';
COMMENT ON COLUMN viewing_sessions.amount_paid IS 'Montant payé: 0 si abonné/propriétaire, 1.50 si paiement unitaire';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
