-- ============================================================================
-- MIGRATION: Création du système de dépôt de films physiques
-- Date: 2025-11-16
-- Description: Workflow de dépôt postal de Blu-ray/DVD avec suivi
--              Conforme aux CGV Art. 2.1, 5
-- ============================================================================

-- ============================================================================
-- PARTIE 1: TABLE DES DÉPÔTS DE FILMS
-- ============================================================================

-- Table film_deposits: Suivi des envois postaux de films physiques
-- Workflow: sent → received → digitizing → completed (ou rejected)
CREATE TABLE IF NOT EXISTS film_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Utilisateur qui envoie le film
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Numéro de tracking unique (généré automatiquement)
  tracking_number TEXT UNIQUE NOT NULL,

  -- Informations sur le film envoyé
  film_title TEXT NOT NULL,
  support_type TEXT NOT NULL CHECK (support_type IN ('Blu-ray', 'DVD')),

  -- Informations optionnelles (aide à l'identification)
  tmdb_id INT,
  additional_notes TEXT,

  -- Statut du dépôt
  status TEXT NOT NULL DEFAULT 'sent' CHECK (
    status IN ('sent', 'received', 'digitizing', 'completed', 'rejected')
  ),

  -- Dates du workflow
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  received_at TIMESTAMP,
  digitized_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Raison de rejet (si status = 'rejected')
  rejection_reason TEXT,

  -- Référence au registre de propriété (une fois validé et numérisé)
  registry_id UUID REFERENCES films_registry(id) ON DELETE SET NULL,

  -- Référence au film (movie_id) créé ou trouvé dans la base
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,

  -- Admin qui a traité le dépôt
  processed_by_admin_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS film_deposits_user_idx ON film_deposits(user_id);
CREATE INDEX IF NOT EXISTS film_deposits_status_idx ON film_deposits(status);
CREATE INDEX IF NOT EXISTS film_deposits_tracking_idx ON film_deposits(tracking_number);

-- Trigger de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_film_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER film_deposits_updated_at_trigger
  BEFORE UPDATE ON film_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_film_deposits_updated_at();

-- Commentaires
COMMENT ON TABLE film_deposits IS 'Suivi des dépôts de films physiques envoyés par les utilisateurs (CGV Art. 2.1, 5)';
COMMENT ON COLUMN film_deposits.tracking_number IS 'Numéro de tracking unique généré automatiquement (format: WC-YYYYMMDD-XXXXX)';
COMMENT ON COLUMN film_deposits.status IS 'sent = envoyé par user, received = réceptionné par admin, digitizing = en cours de numérisation, completed = ajouté au registre, rejected = refusé';
COMMENT ON COLUMN film_deposits.rejection_reason IS 'Raison du refus (état défectueux, contenu non conforme, etc.)';

-- ============================================================================
-- PARTIE 2: FONCTION HELPER - Génération du numéro de tracking
-- ============================================================================

-- Fonction pour générer un numéro de tracking unique
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
  v_tracking_number TEXT;
  v_random_suffix TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un suffixe aléatoire de 5 chiffres
    v_random_suffix := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Format: WC-YYYYMMDD-XXXXX
    v_tracking_number := 'WC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || v_random_suffix;

    -- Vérifier l'unicité
    SELECT EXISTS(
      SELECT 1 FROM film_deposits WHERE tracking_number = v_tracking_number
    ) INTO v_exists;

    -- Si unique, sortir de la boucle
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_tracking_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 3: RPC - Créer une demande de dépôt de film
-- ============================================================================

-- RPC: Créer une demande de dépôt (génère tracking number)
CREATE OR REPLACE FUNCTION create_film_deposit(
  p_user_id UUID,
  p_film_title TEXT,
  p_support_type TEXT,
  p_tmdb_id INT DEFAULT NULL,
  p_additional_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_deposit_id UUID;
  v_tracking_number TEXT;
BEGIN
  -- Validation du type de support
  IF p_support_type NOT IN ('Blu-ray', 'DVD') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_support_type',
      'message', 'Type de support invalide. Valeurs acceptées: Blu-ray, DVD'
    );
  END IF;

  -- Générer le numéro de tracking
  v_tracking_number := generate_tracking_number();

  -- Créer le dépôt
  INSERT INTO film_deposits (
    user_id,
    tracking_number,
    film_title,
    support_type,
    tmdb_id,
    additional_notes,
    status,
    sent_at
  )
  VALUES (
    p_user_id,
    v_tracking_number,
    p_film_title,
    p_support_type,
    p_tmdb_id,
    p_additional_notes,
    'sent',
    NOW()
  )
  RETURNING id INTO v_deposit_id;

  RETURN json_build_object(
    'success', true,
    'deposit_id', v_deposit_id,
    'tracking_number', v_tracking_number,
    'message', 'Demande de dépôt créée. Numéro de suivi: ' || v_tracking_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unexpected_error',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 4: RPC ADMIN - Marquer un dépôt comme reçu
-- ============================================================================

-- RPC: Marquer un dépôt comme reçu (accès admin uniquement)
CREATE OR REPLACE FUNCTION admin_mark_deposit_received(
  p_deposit_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est admin
  SELECT is_admin INTO v_is_admin
  FROM user_profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Accès réservé aux administrateurs'
    );
  END IF;

  -- Vérifier que le dépôt existe et est au statut 'sent'
  IF NOT EXISTS (
    SELECT 1 FROM film_deposits
    WHERE id = p_deposit_id AND status = 'sent'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'deposit_not_found',
      'message', 'Dépôt introuvable ou déjà traité'
    );
  END IF;

  -- Marquer comme reçu
  UPDATE film_deposits
  SET
    status = 'received',
    received_at = NOW(),
    processed_by_admin_id = p_admin_id
  WHERE id = p_deposit_id;

  RETURN json_build_object(
    'success', true,
    'deposit_id', p_deposit_id,
    'message', 'Dépôt marqué comme reçu'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5: RPC ADMIN - Rejeter un dépôt
-- ============================================================================

-- RPC: Rejeter un dépôt (film en mauvais état, contenu non conforme, etc.)
CREATE OR REPLACE FUNCTION admin_reject_deposit(
  p_deposit_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est admin
  SELECT is_admin INTO v_is_admin
  FROM user_profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Accès réservé aux administrateurs'
    );
  END IF;

  -- Vérifier que le dépôt existe et est au statut 'sent' ou 'received'
  IF NOT EXISTS (
    SELECT 1 FROM film_deposits
    WHERE id = p_deposit_id AND status IN ('sent', 'received')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'deposit_not_found',
      'message', 'Dépôt introuvable ou déjà traité'
    );
  END IF;

  -- Marquer comme rejeté
  UPDATE film_deposits
  SET
    status = 'rejected',
    rejection_reason = p_rejection_reason,
    processed_by_admin_id = p_admin_id,
    received_at = COALESCE(received_at, NOW())
  WHERE id = p_deposit_id;

  RETURN json_build_object(
    'success', true,
    'deposit_id', p_deposit_id,
    'message', 'Dépôt rejeté: ' || p_rejection_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 6: RPC ADMIN - Finaliser un dépôt (ajout au registre)
-- ============================================================================

-- RPC: Finaliser un dépôt (numérisation terminée → ajout au registre)
CREATE OR REPLACE FUNCTION admin_complete_deposit(
  p_deposit_id UUID,
  p_admin_id UUID,
  p_movie_id UUID  -- ID du film dans la table movies (créé ou trouvé)
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_deposit RECORD;
  v_registry_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est admin
  SELECT is_admin INTO v_is_admin
  FROM user_profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Accès réservé aux administrateurs'
    );
  END IF;

  -- Récupérer le dépôt
  SELECT * INTO v_deposit
  FROM film_deposits
  WHERE id = p_deposit_id
    AND status IN ('received', 'digitizing');

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'deposit_not_found',
      'message', 'Dépôt introuvable ou pas au bon statut'
    );
  END IF;

  -- Créer l'entrée dans le registre de propriété
  INSERT INTO films_registry (
    movie_id,
    current_owner_id,
    physical_support_type,
    deposit_date,
    acquisition_date,
    acquisition_method
  )
  VALUES (
    p_movie_id,
    v_deposit.user_id,
    v_deposit.support_type,
    v_deposit.sent_at,
    NOW(),
    'deposit'
  )
  RETURNING id INTO v_registry_id;

  -- Mettre à jour le dépôt
  UPDATE film_deposits
  SET
    status = 'completed',
    completed_at = NOW(),
    registry_id = v_registry_id,
    movie_id = p_movie_id,
    processed_by_admin_id = p_admin_id
  WHERE id = p_deposit_id;

  RETURN json_build_object(
    'success', true,
    'deposit_id', p_deposit_id,
    'registry_id', v_registry_id,
    'message', 'Dépôt finalisé et ajouté au registre de propriété'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unexpected_error',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 7: RPC - Consultation des dépôts
-- ============================================================================

-- RPC: Obtenir les dépôts d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_deposits(p_user_id UUID)
RETURNS TABLE (
  deposit_id UUID,
  tracking_number TEXT,
  film_title TEXT,
  support_type TEXT,
  status TEXT,
  sent_at TIMESTAMP,
  received_at TIMESTAMP,
  completed_at TIMESTAMP,
  rejection_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id AS deposit_id,
    fd.tracking_number,
    fd.film_title,
    fd.support_type,
    fd.status,
    fd.sent_at,
    fd.received_at,
    fd.completed_at,
    fd.rejection_reason
  FROM film_deposits fd
  WHERE fd.user_id = p_user_id
  ORDER BY fd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC ADMIN: Obtenir tous les dépôts en attente de traitement
CREATE OR REPLACE FUNCTION admin_get_pending_deposits(p_admin_id UUID)
RETURNS TABLE (
  deposit_id UUID,
  tracking_number TEXT,
  user_email TEXT,
  film_title TEXT,
  support_type TEXT,
  status TEXT,
  sent_at TIMESTAMP,
  additional_notes TEXT
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
    up.email AS user_email,
    fd.film_title,
    fd.support_type,
    fd.status,
    fd.sent_at,
    fd.additional_notes
  FROM film_deposits fd
  JOIN user_profiles up ON up.id = fd.user_id
  WHERE fd.status IN ('sent', 'received', 'digitizing')
  ORDER BY fd.sent_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 8: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur film_deposits
ALTER TABLE film_deposits ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres dépôts
CREATE POLICY "Users can view their own deposits"
  ON film_deposits FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Les admins peuvent voir tous les dépôts
CREATE POLICY "Admins can view all deposits"
  ON film_deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Seule la RPC create_film_deposit peut créer des dépôts
CREATE POLICY "Only RPC can create deposits"
  ON film_deposits FOR INSERT
  USING (false)
  WITH CHECK (false);

-- Policy: Seules les RPC admin peuvent modifier les dépôts
CREATE POLICY "Only admin RPC can modify deposits"
  ON film_deposits FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
