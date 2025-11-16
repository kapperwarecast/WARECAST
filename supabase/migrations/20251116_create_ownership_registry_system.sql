-- ============================================================================
-- MIGRATION: Création du système de registre de propriété
-- Date: 2025-11-16
-- Description: Transformation du modèle de location vers propriété individuelle
--              Conforme aux CGU/CGV 2.0 (système d'échange entre propriétaires)
-- ============================================================================

-- ============================================================================
-- PARTIE 1: REGISTRE DE PROPRIÉTÉ DES FILMS PHYSIQUES
-- ============================================================================

-- Table films_registry: Registre des exemplaires physiques déposés
-- 1 ligne = 1 Blu-ray ou 1 DVD physique déposé chez WARECAST
-- Chaque exemplaire a UN propriétaire unique à un instant T
CREATE TABLE IF NOT EXISTS films_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence au film (métadonnées TMDB)
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,

  -- Propriétaire actuel de cet exemplaire physique
  current_owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,

  -- Type de support physique déposé
  physical_support_type TEXT NOT NULL CHECK (physical_support_type IN ('Blu-ray', 'DVD')),

  -- Date de dépôt initial chez WARECAST
  deposit_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Date d'acquisition par le propriétaire actuel
  acquisition_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Méthode d'acquisition par le propriétaire actuel
  acquisition_method TEXT NOT NULL CHECK (
    acquisition_method IN ('deposit', 'exchange', 'sponsorship', 'redistribution', 'legacy_migration')
  ),

  -- Propriétaire précédent (si transfert)
  previous_owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Date du dernier transfert de propriété
  transfer_date TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS films_registry_owner_idx ON films_registry(current_owner_id);
CREATE INDEX IF NOT EXISTS films_registry_movie_idx ON films_registry(movie_id);
CREATE INDEX IF NOT EXISTS films_registry_acquisition_idx ON films_registry(acquisition_method);

-- Trigger de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_films_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER films_registry_updated_at_trigger
  BEFORE UPDATE ON films_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_films_registry_updated_at();

-- Commentaires
COMMENT ON TABLE films_registry IS 'Registre de propriété des exemplaires physiques (Blu-ray/DVD) déposés chez WARECAST. Conforme CGV Art. 2.2';
COMMENT ON COLUMN films_registry.movie_id IS 'Référence au film (métadonnées TMDB) - Plusieurs exemplaires peuvent partager le même movie_id';
COMMENT ON COLUMN films_registry.current_owner_id IS 'Propriétaire actuel de cet exemplaire physique - Unique à un instant T';
COMMENT ON COLUMN films_registry.physical_support_type IS 'Type de support physique déposé (Blu-ray ou DVD)';
COMMENT ON COLUMN films_registry.acquisition_method IS 'Comment le propriétaire actuel a acquis cet exemplaire (deposit=dépôt initial, exchange=échange, sponsorship=parrainage, redistribution=compte supprimé)';

-- ============================================================================
-- PARTIE 2: HISTORIQUE DES TRANSFERTS DE PROPRIÉTÉ
-- ============================================================================

-- Table ownership_history: Traçabilité complète de tous les transferts
-- Permet de prouver la chaîne de propriété (conformité légale)
CREATE TABLE IF NOT EXISTS ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence à l'exemplaire dans le registre
  film_registry_id UUID NOT NULL REFERENCES films_registry(id) ON DELETE CASCADE,

  -- Ancien propriétaire (NULL si dépôt initial)
  from_owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Nouveau propriétaire
  to_owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,

  -- Type de transfert
  transfer_type TEXT NOT NULL CHECK (
    transfer_type IN ('exchange', 'sponsorship', 'redistribution', 'initial_deposit')
  ),

  -- Date du transfert
  transfer_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Référence optionnelle à l'échange (si transfer_type = 'exchange')
  exchange_id UUID,  -- Sera lié à film_exchanges plus tard

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes pour recherche rapide
CREATE INDEX IF NOT EXISTS ownership_history_film_idx ON ownership_history(film_registry_id);
CREATE INDEX IF NOT EXISTS ownership_history_from_owner_idx ON ownership_history(from_owner_id);
CREATE INDEX IF NOT EXISTS ownership_history_to_owner_idx ON ownership_history(to_owner_id);
CREATE INDEX IF NOT EXISTS ownership_history_transfer_type_idx ON ownership_history(transfer_type);

-- Commentaires
COMMENT ON TABLE ownership_history IS 'Historique complet de tous les transferts de propriété. Garantit la traçabilité légale';
COMMENT ON COLUMN ownership_history.transfer_type IS 'Type de transfert: exchange (échange bilatéral), sponsorship (don parrain), redistribution (compte supprimé), initial_deposit (dépôt initial)';

-- ============================================================================
-- PARTIE 3: FONCTION HELPER - Enregistrer un transfert de propriété
-- ============================================================================

-- Fonction pour enregistrer automatiquement un transfert dans l'historique
CREATE OR REPLACE FUNCTION record_ownership_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Si changement de propriétaire
  IF OLD.current_owner_id IS DISTINCT FROM NEW.current_owner_id THEN
    -- Enregistrer dans l'historique
    INSERT INTO ownership_history (
      film_registry_id,
      from_owner_id,
      to_owner_id,
      transfer_type,
      transfer_date
    ) VALUES (
      NEW.id,
      OLD.current_owner_id,
      NEW.current_owner_id,
      NEW.acquisition_method,  -- Le type de transfert est dans acquisition_method
      NEW.transfer_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui enregistre automatiquement chaque transfert
CREATE TRIGGER record_ownership_transfer_trigger
  AFTER UPDATE ON films_registry
  FOR EACH ROW
  WHEN (OLD.current_owner_id IS DISTINCT FROM NEW.current_owner_id)
  EXECUTE FUNCTION record_ownership_transfer();

-- ============================================================================
-- PARTIE 4: FONCTIONS RPC - Consultation du registre
-- ============================================================================

-- RPC: Obtenir tous les films possédés par un utilisateur
CREATE OR REPLACE FUNCTION get_user_films(p_user_id UUID)
RETURNS TABLE (
  registry_id UUID,
  movie_id UUID,
  movie_title TEXT,
  physical_support_type TEXT,
  acquisition_date TIMESTAMP,
  acquisition_method TEXT,
  deposit_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.id AS registry_id,
    fr.movie_id,
    m.titre_francais AS movie_title,
    fr.physical_support_type,
    fr.acquisition_date,
    fr.acquisition_method,
    fr.deposit_date
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.current_owner_id = p_user_id
  ORDER BY fr.acquisition_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir le propriétaire actuel d'un film spécifique
CREATE OR REPLACE FUNCTION get_film_owner(p_registry_id UUID)
RETURNS TABLE (
  owner_id UUID,
  owner_email TEXT,
  acquisition_date TIMESTAMP,
  acquisition_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.current_owner_id AS owner_id,
    up.email AS owner_email,
    fr.acquisition_date,
    fr.acquisition_method
  FROM films_registry fr
  JOIN user_profiles up ON up.id = fr.current_owner_id
  WHERE fr.id = p_registry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir l'historique complet de propriété d'un film
CREATE OR REPLACE FUNCTION get_film_ownership_history(p_registry_id UUID)
RETURNS TABLE (
  transfer_id UUID,
  from_owner_email TEXT,
  to_owner_email TEXT,
  transfer_type TEXT,
  transfer_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oh.id AS transfer_id,
    from_up.email AS from_owner_email,
    to_up.email AS to_owner_email,
    oh.transfer_type,
    oh.transfer_date
  FROM ownership_history oh
  LEFT JOIN user_profiles from_up ON from_up.id = oh.from_owner_id
  JOIN user_profiles to_up ON to_up.id = oh.to_owner_id
  WHERE oh.film_registry_id = p_registry_id
  ORDER BY oh.transfer_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur films_registry
ALTER TABLE films_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres films
CREATE POLICY "Users can view their own films"
  ON films_registry FOR SELECT
  USING (current_owner_id = auth.uid());

-- Policy: Les utilisateurs peuvent voir tous les films (pour proposer échanges)
CREATE POLICY "Users can view all films in registry"
  ON films_registry FOR SELECT
  USING (true);

-- Policy: Seules les RPC functions peuvent INSERT/UPDATE/DELETE
CREATE POLICY "Only RPC functions can modify registry"
  ON films_registry FOR ALL
  USING (false)
  WITH CHECK (false);

-- Activer RLS sur ownership_history
ALTER TABLE ownership_history ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir l'historique des films qui leur ont appartenu
CREATE POLICY "Users can view history of their films"
  ON ownership_history FOR SELECT
  USING (
    from_owner_id = auth.uid()
    OR to_owner_id = auth.uid()
  );

-- Policy: Seuls les triggers peuvent écrire dans l'historique
CREATE POLICY "Only triggers can write to history"
  ON ownership_history FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
