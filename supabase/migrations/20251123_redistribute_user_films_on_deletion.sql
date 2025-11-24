-- Migration: Redistribution automatique des films lors suppression d'utilisateur
-- Créée le: 2025-11-23
-- Description: Implémente la logique de redistribution des films d'un utilisateur supprimé
--              avec priorité au parrain, puis redistribution aléatoire aux autres users

-- =====================================================
-- FONCTION: redistribute_user_films
-- =====================================================
-- Redistribue tous les films d'un utilisateur avant sa suppression
-- Priorité: 1) Parrain (sponsor), 2) Autres utilisateurs aléatoirement
--
-- Paramètres:
--   - p_user_id: UUID de l'utilisateur dont les films doivent être redistribués
--
-- Retourne: Nombre de films redistribués
-- =====================================================

CREATE OR REPLACE FUNCTION redistribute_user_films(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_film_record RECORD;
  v_sponsor_id UUID;
  v_target_owner_id UUID;
  v_films_count INTEGER := 0;
  v_active_users UUID[];
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur % n''existe pas', p_user_id;
  END IF;

  -- Récupérer le parrain (sponsor) de l'utilisateur s'il existe
  SELECT sponsor_id INTO v_sponsor_id
  FROM sponsorships
  WHERE sponsored_user_id = p_user_id
  LIMIT 1;

  -- Vérifier que le parrain existe toujours et est actif
  IF v_sponsor_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = v_sponsor_id
      AND deleted_at IS NULL
    ) THEN
      v_sponsor_id := NULL; -- Parrain supprimé ou inactif
    END IF;
  END IF;

  -- Récupérer la liste des utilisateurs actifs (hors utilisateur à supprimer)
  -- pour redistribution aléatoire si pas de parrain
  SELECT ARRAY_AGG(id) INTO v_active_users
  FROM user_profiles
  WHERE id != p_user_id
    AND deleted_at IS NULL
    AND id IN (SELECT id FROM auth.users WHERE deleted_at IS NULL);

  -- Si aucun utilisateur actif disponible, impossible de redistribuer
  IF v_active_users IS NULL OR array_length(v_active_users, 1) = 0 THEN
    RAISE EXCEPTION 'Aucun utilisateur actif disponible pour redistribution des films';
  END IF;

  -- Parcourir tous les films de l'utilisateur
  FOR v_film_record IN
    SELECT
      id,
      movie_id,
      physical_support_type,
      acquisition_method
    FROM films_registry
    WHERE current_owner_id = p_user_id
  LOOP
    -- Déterminer le nouveau propriétaire
    IF v_sponsor_id IS NOT NULL THEN
      -- Priorité 1: Le parrain
      v_target_owner_id := v_sponsor_id;
    ELSE
      -- Priorité 2: Utilisateur aléatoire parmi les actifs
      v_target_owner_id := v_active_users[1 + floor(random() * array_length(v_active_users, 1))::int];
    END IF;

    -- Mettre à jour le film dans films_registry
    UPDATE films_registry
    SET
      current_owner_id = v_target_owner_id,
      previous_owner_id = p_user_id,
      acquisition_method = 'redistribution',
      updated_at = NOW()
    WHERE id = v_film_record.id;

    -- Créer une entrée dans ownership_history
    INSERT INTO ownership_history (
      film_registry_id,
      from_owner_id,
      to_owner_id,
      transfer_type,
      transfer_date,
      created_at
    ) VALUES (
      v_film_record.id,
      p_user_id,
      v_target_owner_id,
      'redistribution',
      NOW(),
      NOW()
    );

    v_films_count := v_films_count + 1;
  END LOOP;

  RETURN v_films_count;
END;
$$;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION redistribute_user_films(UUID) IS
'Redistribue automatiquement les films d''un utilisateur avant sa suppression. Priorité: parrain puis utilisateurs aléatoires.';
