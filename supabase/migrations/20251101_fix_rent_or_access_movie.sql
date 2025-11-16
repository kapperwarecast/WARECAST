-- ============================================
-- MIGRATION : Correction RPC rent_or_access_movie
-- Date : 01 novembre 2025
-- Objectif :
--   1. Accepter les abonnements résiliés encore valides
--   2. Aligner les noms de champs avec les types TypeScript
-- ============================================

CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_copies_disponibles INT;
  v_type_emprunt TEXT;
  v_montant_paye NUMERIC;
  v_existing_rental_id UUID;
  v_new_rental_id UUID;
  v_user_has_subscription BOOLEAN;
BEGIN
  -- Vérifier si le film a des copies disponibles
  SELECT copies_disponibles INTO v_copies_disponibles
  FROM movies
  WHERE id = p_movie_id;

  -- Si le film n'existe pas
  IF v_copies_disponibles IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non trouvé',
      'code', 'MOVIE_NOT_FOUND'
    );
  END IF;

  -- Si aucune copie disponible
  IF v_copies_disponibles <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucune copie disponible pour ce film',
      'code', 'NO_COPIES_AVAILABLE'
    );
  END IF;

  -- ✅ CORRECTION 1 : Vérifier si l'utilisateur a un abonnement actif OU résilié encore valide
  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND (
        statut = 'actif'  -- Abonnement actif (pas de vérif date pour éviter race condition)
        OR (statut = 'résilié' AND date_expiration > NOW())  -- Résilié mais période payée restante
      )
  ) INTO v_user_has_subscription;

  -- Déterminer le type d'emprunt et le montant
  IF v_user_has_subscription THEN
    v_type_emprunt := 'abonnement';
    v_montant_paye := 0;

    -- Si abonné, libérer l'emprunt en cours (rotation automatique)
    SELECT id INTO v_existing_rental_id
    FROM emprunts
    WHERE user_id = p_auth_user_id
      AND statut = 'en_cours'
      AND type_emprunt = 'abonnement'
    LIMIT 1;

    IF v_existing_rental_id IS NOT NULL THEN
      -- Marquer l'ancien emprunt comme rendu
      -- Le trigger handle_rental_return va automatiquement incrémenter copies_disponibles
      UPDATE emprunts
      SET statut = 'rendu',
          updated_at = NOW()
      WHERE id = v_existing_rental_id;
    END IF;
  ELSE
    v_type_emprunt := 'unitaire';
    -- Récupérer le montant depuis le payment si disponible
    IF p_payment_id IS NOT NULL THEN
      SELECT amount INTO v_montant_paye
      FROM payments
      WHERE id = p_payment_id;
    ELSE
      v_montant_paye := 1.5; -- Valeur par défaut
    END IF;
  END IF;

  -- Créer le nouvel emprunt
  -- Le trigger handle_rental_created va automatiquement décrémenter copies_disponibles
  INSERT INTO emprunts (
    user_id,
    movie_id,
    statut,
    type_emprunt,
    montant_paye,
    date_emprunt,
    date_retour,
    payment_id,
    created_at,
    updated_at
  )
  VALUES (
    p_auth_user_id,
    p_movie_id,
    'en_cours',
    v_type_emprunt,
    v_montant_paye,
    NOW(),
    NOW() + INTERVAL '48 hours',
    p_payment_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_rental_id;

  -- ✅ CORRECTION 2 : Retourner avec noms de champs TypeScript
  RETURN json_build_object(
    'success', true,
    'emprunt_id', v_new_rental_id,                           -- ✅ rental_id → emprunt_id
    'rental_type', CASE
      WHEN v_type_emprunt = 'abonnement' THEN 'subscription'
      WHEN v_type_emprunt = 'unitaire' THEN 'paid'
      ELSE v_type_emprunt
    END,                                                     -- ✅ type → rental_type (valeurs anglaises)
    'amount_charged', v_montant_paye,                        -- ✅ Ajout du montant
    'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,       -- ✅ date_retour → expires_at (format ISO)
    'previous_rental_released', v_existing_rental_id IS NOT NULL,  -- ✅ Boolean au lieu d'UUID
    'previous_rental_id', v_existing_rental_id,              -- ✅ Ajout de l'ID si besoin
    'existing_rental', false                                 -- ✅ Explicite : c'est un nouvel emprunt
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner les détails
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VÉRIFICATIONS POST-MIGRATION
-- ============================================

-- Vérifier que la fonction existe et est SECURITY DEFINER
SELECT
  proname AS function_name,
  prosecdef AS is_security_definer
FROM pg_proc
WHERE proname = 'rent_or_access_movie';
-- Devrait retourner : rent_or_access_movie | true

-- ============================================
-- TESTS
-- ============================================

-- Test 1 : Abonnement actif
-- SELECT rent_or_access_movie(
--   'USER_ID_HERE'::UUID,
--   'MOVIE_ID_HERE'::UUID,
--   NULL
-- );

-- Test 2 : Abonnement résilié mais encore valide
-- SELECT rent_or_access_movie(
--   '436af50a-cc0b-4462-b5d5-7ceba8789448'::UUID,
--   'MOVIE_ID_HERE'::UUID,
--   NULL
-- );
-- Devrait retourner success: true avec rental_type: 'abonnement'

-- Test 3 : Sans abonnement + paiement
-- SELECT rent_or_access_movie(
--   'USER_ID_HERE'::UUID,
--   'MOVIE_ID_HERE'::UUID,
--   'PAYMENT_ID_HERE'::UUID
-- );
