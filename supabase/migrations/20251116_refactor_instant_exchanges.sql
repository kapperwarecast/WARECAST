-- ============================================================================
-- MIGRATION: Refonte système d'échanges → Échanges instantanés
-- Date: 2025-11-16
-- Description: Suppression du système proposition/acceptation
--              Implémentation des échanges instantanés sans accord propriétaire
-- ============================================================================

-- ============================================================================
-- PARTIE 1: SUPPRESSION DES RPC OBSOLÈTES
-- ============================================================================

-- Drop RPC de proposition/acceptation/refus
DROP FUNCTION IF EXISTS propose_film_exchange(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS refuse_film_exchange(UUID, UUID);
DROP FUNCTION IF EXISTS cancel_film_exchange(UUID, UUID);
DROP FUNCTION IF EXISTS get_pending_exchange_requests(UUID);
DROP FUNCTION IF EXISTS get_pending_exchange_proposals(UUID);

-- ============================================================================
-- PARTIE 2: MODIFICATION TABLE FILM_EXCHANGES
-- ============================================================================

-- Modifier la table pour simplifier les statuts
-- On garde uniquement 'completed' pour l'historique
ALTER TABLE film_exchanges
  DROP CONSTRAINT IF EXISTS film_exchanges_status_check;

-- Nouveau constraint : statut = 'completed' uniquement
ALTER TABLE film_exchanges
  ADD CONSTRAINT film_exchanges_status_check
  CHECK (status IN ('completed'));

-- Mettre à jour les colonnes pour refléter le modèle instantané
COMMENT ON TABLE film_exchanges IS 'Historique des échanges instantanés de films (CGU Art. 4, CGV Art. 6)';
COMMENT ON COLUMN film_exchanges.status IS 'completed = échange effectué (instantané)';
COMMENT ON COLUMN film_exchanges.initiator_id IS 'Utilisateur qui a initié l''échange (celui qui prend le film)';
COMMENT ON COLUMN film_exchanges.recipient_id IS 'Utilisateur dont le film est pris (propriétaire original)';

-- ============================================================================
-- PARTIE 3: NOUVEAU RPC - ÉCHANGE INSTANTANÉ
-- ============================================================================

-- RPC: Échange instantané de films (sans accord du propriétaire)
CREATE OR REPLACE FUNCTION instant_film_exchange(
  p_user_id UUID,                -- Utilisateur qui initie l'échange
  p_requested_film_id UUID,      -- Film que l'utilisateur veut obtenir
  p_offered_film_id UUID,        -- Film que l'utilisateur offre en échange
  p_payment_id UUID DEFAULT NULL -- ID du paiement Stripe (si non-abonné)
)
RETURNS JSON AS $$
DECLARE
  v_exchange_id UUID;
  v_requested_film_owner_id UUID;
  v_offered_film_owner_id UUID;
  v_user_has_subscription BOOLEAN;
  v_requires_payment BOOLEAN;
  v_requested_film_title TEXT;
  v_offered_film_title TEXT;
  v_requested_film_has_active_session BOOLEAN;
  v_offered_film_has_active_session BOOLEAN;
  v_payment_status TEXT;
BEGIN
  -- ========================================================================
  -- ÉTAPE 1: Vérifier que l'utilisateur possède le film offert
  -- ========================================================================
  SELECT current_owner_id INTO v_offered_film_owner_id
  FROM films_registry
  WHERE id = p_offered_film_id;

  IF v_offered_film_owner_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'offered_film_not_found',
      'message', 'Le film offert n''existe pas dans le registre'
    );
  END IF;

  IF v_offered_film_owner_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_film_owner',
      'message', 'Vous ne possédez pas le film offert'
    );
  END IF;

  -- ========================================================================
  -- ÉTAPE 2: Vérifier que le film demandé existe et récupérer le propriétaire
  -- ========================================================================
  SELECT current_owner_id INTO v_requested_film_owner_id
  FROM films_registry
  WHERE id = p_requested_film_id;

  IF v_requested_film_owner_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'requested_film_not_found',
      'message', 'Le film demandé n''existe pas dans le registre'
    );
  END IF;

  -- ========================================================================
  -- ÉTAPE 3: Vérifier disponibilité - Aucune session active
  -- ========================================================================

  -- Vérifier si le film demandé a une session active (propriétaire actuel)
  SELECT EXISTS(
    SELECT 1 FROM emprunts
    WHERE movie_id = (SELECT movie_id FROM films_registry WHERE id = p_requested_film_id)
      AND user_id = v_requested_film_owner_id
      AND statut = 'en_cours'
      AND date_retour > NOW()
  ) INTO v_requested_film_has_active_session;

  IF v_requested_film_has_active_session THEN
    RETURN json_build_object(
      'success', false,
      'error', 'film_not_available',
      'message', 'Le film demandé est actuellement en cours de lecture par son propriétaire'
    );
  END IF;

  -- Vérifier si le film offert a une session active
  SELECT EXISTS(
    SELECT 1 FROM emprunts
    WHERE movie_id = (SELECT movie_id FROM films_registry WHERE id = p_offered_film_id)
      AND user_id = p_user_id
      AND statut = 'en_cours'
      AND date_retour > NOW()
  ) INTO v_offered_film_has_active_session;

  IF v_offered_film_has_active_session THEN
    RETURN json_build_object(
      'success', false,
      'error', 'offered_film_occupied',
      'message', 'Le film offert est actuellement en cours de lecture'
    );
  END IF;

  -- ========================================================================
  -- ÉTAPE 4: Vérifier abonnement OU paiement
  -- ========================================================================

  -- Si un payment_id est fourni, vérifier qu'il est succeeded
  IF p_payment_id IS NOT NULL THEN
    SELECT status INTO v_payment_status
    FROM payments
    WHERE id = p_payment_id
      AND user_id = p_user_id;

    IF v_payment_status IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'payment_not_found',
        'message', 'Paiement introuvable'
      );
    END IF;

    IF v_payment_status != 'succeeded' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'payment_not_succeeded',
        'message', 'Le paiement n''a pas été confirmé'
      );
    END IF;

    -- Paiement valide → skip subscription check, continuer le transfert
    v_requires_payment := false;
  ELSE
    -- Pas de payment_id → vérifier abonnement
    SELECT EXISTS(
      SELECT 1 FROM user_abonnements ua
      JOIN abonnements a ON a.id = ua.abonnement_id
      WHERE ua.user_id = p_user_id
        AND (ua.statut = 'actif' OR (ua.statut = 'résilié' AND ua.date_expiration > NOW()))
    ) INTO v_user_has_subscription;

    v_requires_payment := NOT v_user_has_subscription;

    -- Si paiement requis, retourner avant le transfert
    IF v_requires_payment THEN
      -- Récupérer les titres pour le message
      SELECT m.titre_francais INTO v_requested_film_title
      FROM films_registry fr
      JOIN movies m ON m.id = fr.movie_id
      WHERE fr.id = p_requested_film_id;

      SELECT m.titre_francais INTO v_offered_film_title
      FROM films_registry fr
      JOIN movies m ON m.id = fr.movie_id
      WHERE fr.id = p_offered_film_id;

      RETURN json_build_object(
        'success', false,
        'requires_payment', true,
        'amount', 1.50,
        'requested_film_title', v_requested_film_title,
        'offered_film_title', v_offered_film_title,
        'message', 'Paiement requis : 1,50€ pour échanger "' || v_offered_film_title || '" contre "' || v_requested_film_title || '"'
      );
    END IF;
  END IF;

  -- ========================================================================
  -- ÉTAPE 5: TRANSFERT INSTANTANÉ DE PROPRIÉTÉ (transaction atomique)
  -- ========================================================================

  -- Récupérer les titres des films
  SELECT m.titre_francais INTO v_requested_film_title
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.id = p_requested_film_id;

  SELECT m.titre_francais INTO v_offered_film_title
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  WHERE fr.id = p_offered_film_id;

  -- 5a. Film demandé : propriétaire actuel → utilisateur
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = p_user_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange'
  WHERE id = p_requested_film_id;

  -- 5b. Film offert : utilisateur → propriétaire du film demandé
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = v_requested_film_owner_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'exchange'
  WHERE id = p_offered_film_id;

  -- ========================================================================
  -- ÉTAPE 6: Créer l'entrée d'échange (historique)
  -- ========================================================================
  INSERT INTO film_exchanges (
    initiator_id,
    recipient_id,
    film_offered_id,
    film_requested_id,
    status,
    proposed_at,
    responded_at,
    completed_at
  )
  VALUES (
    p_user_id,
    v_requested_film_owner_id,
    p_offered_film_id,
    p_requested_film_id,
    'completed',
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_exchange_id;

  -- ========================================================================
  -- ÉTAPE 7: Mettre à jour l'historique de propriété avec l'ID d'échange
  -- ========================================================================
  UPDATE ownership_history
  SET exchange_id = v_exchange_id
  WHERE film_registry_id IN (p_requested_film_id, p_offered_film_id)
    AND transfer_date = NOW();

  -- ========================================================================
  -- ÉTAPE 8: Retourner le résultat de l'échange
  -- ========================================================================
  RETURN json_build_object(
    'success', true,
    'exchange_id', v_exchange_id,
    'requested_film_title', v_requested_film_title,
    'offered_film_title', v_offered_film_title,
    'message', 'Échange effectué : vous possédez maintenant "' || v_requested_film_title || '"'
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

-- Commentaire
COMMENT ON FUNCTION instant_film_exchange IS 'Échange instantané de films sans accord du propriétaire (CGU Art. 4)';

-- ============================================================================
-- PARTIE 4: NOUVEAU RPC - RÉCUPÉRER FILMS DISPONIBLES POUR ÉCHANGE
-- ============================================================================

-- RPC: Obtenir la liste des films disponibles pour échange
-- Un film est disponible si son propriétaire n'a PAS de session active
CREATE OR REPLACE FUNCTION get_available_films_for_exchange(p_user_id UUID)
RETURNS TABLE (
  registry_id UUID,
  movie_id UUID,
  movie_title TEXT,
  owner_id UUID,
  owner_email TEXT,
  physical_support_type TEXT,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.id AS registry_id,
    m.id AS movie_id,
    m.titre_francais AS movie_title,
    fr.current_owner_id AS owner_id,
    up.email AS owner_email,
    fr.physical_support_type,
    -- Film disponible si propriétaire n'a PAS de session active
    NOT EXISTS(
      SELECT 1 FROM emprunts e
      WHERE e.movie_id = m.id
        AND e.user_id = fr.current_owner_id
        AND e.statut = 'en_cours'
        AND e.date_retour > NOW()
    ) AS is_available
  FROM films_registry fr
  JOIN movies m ON m.id = fr.movie_id
  JOIN user_profiles up ON up.id = fr.current_owner_id
  WHERE fr.current_owner_id != p_user_id  -- Exclure mes propres films
  ORDER BY m.titre_francais;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_available_films_for_exchange IS 'Liste des films disponibles pour échange (propriétaire sans session active)';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
