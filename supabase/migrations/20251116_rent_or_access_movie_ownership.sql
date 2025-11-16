-- ============================================
-- MIGRATION : RPC rent_or_access_movie pour modele de propriete
-- Date : 16 novembre 2025
-- Objectif : Adapter la RPC au systeme de propriete unique (films_registry)
-- ============================================

CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_registry_id UUID;
  v_current_owner_id UUID;
  v_existing_rental_id UUID;
  v_new_rental_id UUID;
  v_user_has_subscription BOOLEAN;
  v_type_emprunt TEXT;
  v_montant_paye NUMERIC;
BEGIN
  -- Verifier si le film existe dans le registre
  SELECT id, current_owner_id INTO v_registry_id, v_current_owner_id
  FROM films_registry
  WHERE movie_id = p_movie_id
  LIMIT 1;

  -- Si le film n existe pas dans le registre
  IF v_registry_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Film non trouve dans le registre',
      'code', 'MOVIE_NOT_FOUND'
    );
  END IF;

  -- Verifier si l utilisateur possede le film
  IF v_current_owner_id != p_auth_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne possedez pas ce film. Echangez-le d abord.',
      'code', 'NOT_OWNER'
    );
  END IF;

  -- Verifier si le proprietaire a deja une session active
  SELECT id INTO v_existing_rental_id
  FROM emprunts
  WHERE user_id = p_auth_user_id
    AND statut = 'en_cours'
  LIMIT 1;

  -- Si l utilisateur a deja une session active sur un autre film
  IF v_existing_rental_id IS NOT NULL THEN
    -- Verifier si c est le meme film
    IF EXISTS(
      SELECT 1 FROM emprunts
      WHERE id = v_existing_rental_id
        AND movie_id = p_movie_id
    ) THEN
      -- Meme film deja en cours, retourner la session existante
      RETURN json_build_object(
        'success', true,
        'emprunt_id', v_existing_rental_id,
        'rental_type', 'subscription',
        'amount_charged', 0,
        'expires_at', (SELECT date_retour FROM emprunts WHERE id = v_existing_rental_id)::TEXT,
        'previous_rental_released', false,
        'existing_rental', true
      );
    ELSE
      -- Film different, liberer l ancienne session (rotation)
      UPDATE emprunts
      SET statut = 'rendu',
          updated_at = NOW()
      WHERE id = v_existing_rental_id;
    END IF;
  END IF;

  -- Verifier si l utilisateur a un abonnement actif OU resilie encore valide
  SELECT EXISTS(
    SELECT 1 FROM user_abonnements
    WHERE user_id = p_auth_user_id
      AND (
        statut = 'actif'
        OR (statut = 'resilie' AND date_expiration > NOW())
      )
  ) INTO v_user_has_subscription;

  -- Determiner le type d emprunt
  -- Pour un film possede, utiliser abonnement (gratuit comme un abonne)
  -- La contrainte CHECK n accepte que unitaire et abonnement
  v_type_emprunt := 'abonnement';
  v_montant_paye := 0;

  -- Creer la session de lecture
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

  -- Retourner le resultat
  RETURN json_build_object(
    'success', true,
    'emprunt_id', v_new_rental_id,
    'rental_type', 'subscription',
    'amount_charged', 0,
    'expires_at', (NOW() + INTERVAL '48 hours')::TEXT,
    'previous_rental_released', v_existing_rental_id IS NOT NULL,
    'previous_rental_id', v_existing_rental_id,
    'existing_rental', false
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
