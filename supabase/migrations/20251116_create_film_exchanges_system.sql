-- ============================================================================
-- MIGRATION: Création du système d'échanges de films entre utilisateurs
-- Date: 2025-11-16
-- Description: Échanges bilatéraux définitifs entre propriétaires
--              Conforme aux CGU Art. 4 et CGV Art. 6
-- ============================================================================

-- ============================================================================
-- PARTIE 1: TABLE DES ÉCHANGES DE FILMS
-- ============================================================================

-- Table film_exchanges: Propositions d'échange entre 2 utilisateurs
-- User A propose son Film X contre Film Y de User B
CREATE TABLE IF NOT EXISTS film_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Initiateur de l'échange (celui qui propose)
  initiator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Destinataire de la proposition
  recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Film proposé par l'initiateur (qu'il va céder)
  film_offered_id UUID NOT NULL REFERENCES films_registry(id) ON DELETE CASCADE,

  -- Film demandé au destinataire (qu'il souhaite obtenir)
  film_requested_id UUID NOT NULL REFERENCES films_registry(id) ON DELETE CASCADE,

  -- Statut de l'échange
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'refused', 'cancelled', 'completed')
  ),

  -- Date de la proposition
  proposed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Date de la réponse (acceptation/refus)
  responded_at TIMESTAMP,

  -- Date de finalisation (transfert effectif de propriété)
  completed_at TIMESTAMP,

  -- Paiement associé (si initiateur non-abonné : 1,50€)
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Contraintes de cohérence
  CHECK (initiator_id != recipient_id),
  CHECK (film_offered_id != film_requested_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS film_exchanges_initiator_idx ON film_exchanges(initiator_id);
CREATE INDEX IF NOT EXISTS film_exchanges_recipient_idx ON film_exchanges(recipient_id);
CREATE INDEX IF NOT EXISTS film_exchanges_status_idx ON film_exchanges(status);
CREATE INDEX IF NOT EXISTS film_exchanges_film_offered_idx ON film_exchanges(film_offered_id);
CREATE INDEX IF NOT EXISTS film_exchanges_film_requested_idx ON film_exchanges(film_requested_id);

-- Trigger de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_film_exchanges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER film_exchanges_updated_at_trigger
  BEFORE UPDATE ON film_exchanges
  FOR EACH ROW
  EXECUTE FUNCTION update_film_exchanges_updated_at();

-- Commentaires
COMMENT ON TABLE film_exchanges IS 'Propositions d''échange de films entre utilisateurs propriétaires (CGU Art. 4, CGV Art. 6)';
COMMENT ON COLUMN film_exchanges.status IS 'pending = en attente, accepted = accepté (pré-transfert), refused = refusé, cancelled = annulé par initiateur, completed = transfert effectué';
COMMENT ON COLUMN film_exchanges.payment_id IS 'Paiement de 1,50€ si initiateur non-abonné (CGU Art. 4.2)';

-- ============================================================================
-- PARTIE 2: RPC - Proposer un échange de film
-- ============================================================================

-- RPC: Proposer un échange de film à un autre utilisateur
CREATE OR REPLACE FUNCTION propose_film_exchange(
  p_initiator_id UUID,
  p_recipient_id UUID,
  p_film_offered_id UUID,
  p_film_requested_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_exchange_id UUID;
  v_initiator_has_subscription BOOLEAN;
  v_requires_payment BOOLEAN;
  v_offered_film_movie_title TEXT;
  v_requested_film_movie_title TEXT;
BEGIN
  -- ÉTAPE 1: Validation - L'initiateur possède bien le film offert
  IF NOT EXISTS (
    SELECT 1 FROM films_registry
    WHERE id = p_film_offered_id
      AND current_owner_id = p_initiator_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_film_owner',
      'message', 'Vous ne possédez pas ce film'
    );
  END IF;

  -- ÉTAPE 2: Validation - Le destinataire possède bien le film demandé
  IF NOT EXISTS (
    SELECT 1 FROM films_registry
    WHERE id = p_film_requested_id
      AND current_owner_id = p_recipient_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'recipient_not_owner',
      'message', 'Le destinataire ne possède pas le film demandé'
    );
  END IF;

  -- ÉTAPE 3: Validation - Pas d'échange en attente entre ces 2 users pour ces films
  IF EXISTS (
    SELECT 1 FROM film_exchanges
    WHERE initiator_id = p_initiator_id
      AND recipient_id = p_recipient_id
      AND film_offered_id = p_film_offered_id
      AND film_requested_id = p_film_requested_id
      AND status = 'pending'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'exchange_already_pending',
      'message', 'Une proposition d''échange est déjà en attente pour ces films'
    );
  END IF;

  -- ÉTAPE 4: Vérifier si l'initiateur a un abonnement actif
  SELECT EXISTS(
    SELECT 1 FROM user_abonnements ua
    JOIN abonnements a ON a.id = ua.abonnement_id
    WHERE ua.user_id = p_initiator_id
      AND (ua.statut = 'actif' OR (ua.statut = 'résilié' AND ua.date_expiration > NOW()))
  ) INTO v_initiator_has_subscription;

  -- ÉTAPE 5: Déterminer si paiement nécessaire (1,50€ si non-abonné)
  v_requires_payment := NOT v_initiator_has_subscription;

  -- ÉTAPE 6: Obtenir les titres des films pour le message
  SELECT m.titre_francais INTO v_offered_film_movie_title
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.id = p_film_offered_id;

  SELECT m.titre_francais INTO v_requested_film_movie_title
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.id = p_film_requested_id;

  -- ÉTAPE 7: Créer la proposition d'échange
  INSERT INTO film_exchanges (
    initiator_id,
    recipient_id,
    film_offered_id,
    film_requested_id,
    status,
    proposed_at
  )
  VALUES (
    p_initiator_id,
    p_recipient_id,
    p_film_offered_id,
    p_film_requested_id,
    'pending',
    NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- ÉTAPE 8: Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'exchange_id', v_exchange_id,
    'requires_payment', v_requires_payment,
    'amount', CASE WHEN v_requires_payment THEN 1.50 ELSE 0 END,
    'offered_film_title', v_offered_film_movie_title,
    'requested_film_title', v_requested_film_movie_title,
    'message', 'Proposition d''échange envoyée : "' || v_offered_film_movie_title || '" contre "' || v_requested_film_movie_title || '"'
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
-- PARTIE 3: RPC - Accepter un échange de film
-- ============================================================================

-- RPC: Accepter une proposition d'échange (transfert automatique de propriété)
CREATE OR REPLACE FUNCTION accept_film_exchange(p_exchange_id UUID, p_recipient_id UUID)
RETURNS JSON AS $$
DECLARE
  v_exchange RECORD;
  v_offered_film_title TEXT;
  v_requested_film_title TEXT;
BEGIN
  -- ÉTAPE 1: Récupérer l'échange
  SELECT * INTO v_exchange
  FROM film_exchanges
  WHERE id = p_exchange_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'exchange_not_found',
      'message', 'Proposition d''échange introuvable ou déjà traitée'
    );
  END IF;

  -- ÉTAPE 2: Vérifier que les 2 utilisateurs possèdent toujours leurs films
  IF NOT EXISTS (
    SELECT 1 FROM films_registry
    WHERE id = v_exchange.film_offered_id
      AND current_owner_id = v_exchange.initiator_id
  ) THEN
    -- L'initiateur ne possède plus le film offert → Annuler l'échange
    UPDATE film_exchanges
    SET status = 'cancelled', responded_at = NOW()
    WHERE id = p_exchange_id;

    RETURN json_build_object(
      'success', false,
      'error', 'film_no_longer_available',
      'message', 'Le film proposé n''est plus disponible'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM films_registry
    WHERE id = v_exchange.film_requested_id
      AND current_owner_id = p_recipient_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'you_no_longer_own_film',
      'message', 'Vous ne possédez plus le film demandé'
    );
  END IF;

  -- ÉTAPE 3: Obtenir les titres des films
  SELECT m.titre_francais INTO v_offered_film_title
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.id = v_exchange.film_offered_id;

  SELECT m.titre_francais INTO v_requested_film_title
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.id = v_exchange.film_requested_id;

  -- ÉTAPE 4: TRANSFERT DE PROPRIÉTÉ (opération atomique)

  -- 4a. Film offert : initiator → recipient
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = v_exchange.recipient_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange'
  WHERE id = v_exchange.film_offered_id;

  -- 4b. Film demandé : recipient → initiator
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = v_exchange.initiator_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange'
  WHERE id = v_exchange.film_requested_id;

  -- ÉTAPE 5: Mettre à jour le statut de l'échange
  UPDATE film_exchanges
  SET
    status = 'completed',
    responded_at = NOW(),
    completed_at = NOW()
  WHERE id = p_exchange_id;

  -- ÉTAPE 6: Enregistrer les références d'échange dans l'historique
  -- (le trigger record_ownership_transfer_trigger s'en occupe automatiquement)
  UPDATE ownership_history
  SET exchange_id = p_exchange_id
  WHERE film_registry_id IN (v_exchange.film_offered_id, v_exchange.film_requested_id)
    AND transfer_date = NOW();

  -- ÉTAPE 7: Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'exchange_id', p_exchange_id,
    'offered_film_title', v_offered_film_title,
    'requested_film_title', v_requested_film_title,
    'message', 'Échange accepté ! Vous avez échangé "' || v_requested_film_title || '" contre "' || v_offered_film_title || '"'
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
-- PARTIE 4: RPC - Refuser un échange de film
-- ============================================================================

-- RPC: Refuser une proposition d'échange
CREATE OR REPLACE FUNCTION refuse_film_exchange(p_exchange_id UUID, p_recipient_id UUID)
RETURNS JSON AS $$
BEGIN
  -- Vérifier que l'échange existe et est en attente
  IF NOT EXISTS (
    SELECT 1 FROM film_exchanges
    WHERE id = p_exchange_id
      AND recipient_id = p_recipient_id
      AND status = 'pending'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'exchange_not_found',
      'message', 'Proposition d''échange introuvable ou déjà traitée'
    );
  END IF;

  -- Marquer comme refusé
  UPDATE film_exchanges
  SET status = 'refused', responded_at = NOW()
  WHERE id = p_exchange_id;

  RETURN json_build_object(
    'success', true,
    'exchange_id', p_exchange_id,
    'message', 'Proposition d''échange refusée'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5: RPC - Annuler une proposition d'échange
-- ============================================================================

-- RPC: Annuler une proposition d'échange (par l'initiateur)
CREATE OR REPLACE FUNCTION cancel_film_exchange(p_exchange_id UUID, p_initiator_id UUID)
RETURNS JSON AS $$
BEGIN
  -- Vérifier que l'échange existe et est en attente
  IF NOT EXISTS (
    SELECT 1 FROM film_exchanges
    WHERE id = p_exchange_id
      AND initiator_id = p_initiator_id
      AND status = 'pending'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'exchange_not_found',
      'message', 'Proposition d''échange introuvable ou déjà traitée'
    );
  END IF;

  -- Marquer comme annulé
  UPDATE film_exchanges
  SET status = 'cancelled', responded_at = NOW()
  WHERE id = p_exchange_id;

  RETURN json_build_object(
    'success', true,
    'exchange_id', p_exchange_id,
    'message', 'Proposition d''échange annulée'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 6: RPC - Consultation des échanges
-- ============================================================================

-- RPC: Obtenir les propositions d'échange reçues (en attente)
CREATE OR REPLACE FUNCTION get_pending_exchange_requests(p_user_id UUID)
RETURNS TABLE (
  exchange_id UUID,
  initiator_email TEXT,
  offered_film_title TEXT,
  requested_film_title TEXT,
  proposed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id AS exchange_id,
    up.email AS initiator_email,
    m_offered.titre_francais AS offered_film_title,
    m_requested.titre_francais AS requested_film_title,
    fe.proposed_at
  FROM film_exchanges fe
  JOIN user_profiles up ON up.id = fe.initiator_id
  JOIN films_registry fr_offered ON fr_offered.id = fe.film_offered_id
  JOIN movies m_offered ON m_offered.id = fr_offered.movie_id
  JOIN films_registry fr_requested ON fr_requested.id = fe.film_requested_id
  JOIN movies m_requested ON m_requested.id = fr_requested.movie_id
  WHERE fe.recipient_id = p_user_id
    AND fe.status = 'pending'
  ORDER BY fe.proposed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir les propositions d'échange envoyées (en attente)
CREATE OR REPLACE FUNCTION get_pending_exchange_proposals(p_user_id UUID)
RETURNS TABLE (
  exchange_id UUID,
  recipient_email TEXT,
  offered_film_title TEXT,
  requested_film_title TEXT,
  proposed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id AS exchange_id,
    up.email AS recipient_email,
    m_offered.titre_francais AS offered_film_title,
    m_requested.titre_francais AS requested_film_title,
    fe.proposed_at
  FROM film_exchanges fe
  JOIN user_profiles up ON up.id = fe.recipient_id
  JOIN films_registry fr_offered ON fr_offered.id = fe.film_offered_id
  JOIN movies m_offered ON m_offered.id = fr_offered.movie_id
  JOIN films_registry fr_requested ON fr_requested.id = fe.film_requested_id
  JOIN movies m_requested ON m_requested.id = fr_requested.movie_id
  WHERE fe.initiator_id = p_user_id
    AND fe.status = 'pending'
  ORDER BY fe.proposed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur film_exchanges
ALTER TABLE film_exchanges ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les échanges où ils sont impliqués
CREATE POLICY "Users can view their exchanges"
  ON film_exchanges FOR SELECT
  USING (
    initiator_id = auth.uid()
    OR recipient_id = auth.uid()
  );

-- Policy: Seules les RPC functions peuvent créer/modifier des échanges
CREATE POLICY "Only RPC can modify exchanges"
  ON film_exchanges FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
