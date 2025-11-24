-- ============================================================================
-- MIGRATION: Réparation paiement orphelin
-- Date: 2025-11-22
-- Description: Crée manuellement la session de visionnage pour le paiement
--              1441d69f-b162-48d2-99d9-1b3a01748e20 qui n'a pas créé de session
--              à cause de l'ancienne RPC utilisant table emprunts (inexistante)
-- Utilisateur: kapper.warecast+17@gmail.com (ce6d14f2-9ca8-4bc1-bdc1-77085b9123ad)
-- ============================================================================

DO $$
DECLARE
  v_payment_id UUID := '1441d69f-b162-48d2-99d9-1b3a01748e20';
  v_user_id UUID;
  v_movie_id UUID;
  v_registry_id UUID;
  v_session_exists BOOLEAN;
BEGIN

  RAISE NOTICE 'DÉBUT RÉPARATION PAIEMENT ORPHELIN';

  -- 1. Vérifier que le paiement existe et récupérer les détails (movie_id depuis JSON)
  SELECT
    user_id,
    (payment_intent_data->>'movie_id')::UUID
  INTO v_user_id, v_movie_id
  FROM payments
  WHERE id = v_payment_id
    AND status = 'succeeded'
    AND payment_type = 'rental';

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Paiement % non trouvé ou non succeeded', v_payment_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Paiement trouvé - User: %, Movie: %', v_user_id, v_movie_id;

  -- 2. Vérifier si une session existe déjà (au cas où)
  SELECT EXISTS(
    SELECT 1 FROM viewing_sessions
    WHERE payment_id = v_payment_id
  ) INTO v_session_exists;

  IF v_session_exists THEN
    RAISE NOTICE 'Session déjà existante pour ce paiement - SKIP';
    RETURN;
  END IF;

  -- 3. Récupérer la copie physique (registry_id) du film
  --    On prend la première copie disponible appartenant à l'utilisateur après échange
  SELECT fr.id
  INTO v_registry_id
  FROM films_registry fr
  WHERE fr.movie_id = v_movie_id
    AND fr.current_owner_id = v_user_id
  LIMIT 1;

  -- Si l'utilisateur ne possède pas le film, on prend n'importe quelle copie
  -- (car l'échange a peut-être échoué)
  IF v_registry_id IS NULL THEN
    SELECT fr.id
    INTO v_registry_id
    FROM films_registry fr
    WHERE fr.movie_id = v_movie_id
    LIMIT 1;
  END IF;

  IF v_registry_id IS NULL THEN
    RAISE WARNING 'Aucune copie physique trouvée pour movie_id %', v_movie_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Registry ID trouvé: %', v_registry_id;

  -- 4. Créer la session de visionnage manquante
  --    Session de 48h à partir du moment du paiement (ou maintenant si expirée)
  INSERT INTO viewing_sessions (
    user_id,
    registry_id,
    movie_id,
    statut,
    session_type,
    amount_paid,
    payment_id,
    session_start_date,
    return_date,
    created_at,
    updated_at
  )
  SELECT
    v_user_id,
    v_registry_id,
    v_movie_id,
    -- Si le paiement date de plus de 48h, session expirée
    CASE
      WHEN p.completed_at < (NOW() - INTERVAL '48 hours') THEN 'expiré'
      ELSE 'en_cours'
    END,
    'unit',  -- Paiement unitaire 1,50€
    1.50,
    v_payment_id,
    -- Date de début = moment du paiement
    p.completed_at,
    -- Date de retour = paiement + 48h
    p.completed_at + INTERVAL '48 hours',
    NOW(),
    NOW()
  FROM payments p
  WHERE p.id = v_payment_id;

  RAISE NOTICE 'Session créée avec succès pour payment_id %', v_payment_id;

END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE viewing_sessions IS
'Sessions de visionnage de films (48h). Remplace table emprunts depuis Nov 2025.
IMPORTANT: Toujours créer sessions via RPC rent_or_access_movie, sauf réparations.';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
