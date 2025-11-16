-- ============================================================================
-- MIGRATION: Création du système de parrainage communautaire
-- Date: 2025-11-16
-- Description: Système obligatoire de don automatique de film aux nouveaux users
--              Conforme aux CGU Art. 6 et CGV Art. 3.2, 4
-- ============================================================================

-- ============================================================================
-- PARTIE 1: TABLE DES PARRAINAGES
-- ============================================================================

-- Table sponsorships: Relation parrain/filleul + film donné
-- 1 ligne = 1 parrainage (1 nouveau user reçoit 1 film d'un parrain)
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parrain (utilisateur qui donne un film)
  sponsor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Filleul (nouvel utilisateur qui reçoit le film)
  sponsored_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Film donné (référence au registre)
  film_given_id UUID NOT NULL REFERENCES films_registry(id) ON DELETE CASCADE,

  -- Date du parrainage
  sponsorship_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Badge éventuellement attribué au parrain suite à ce parrainage
  badge_awarded TEXT CHECK (badge_awarded IN ('bronze', 'silver', 'gold')),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Contrainte: Un utilisateur ne peut être parrainé qu'une seule fois
  UNIQUE(sponsored_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS sponsorships_sponsor_idx ON sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS sponsorships_sponsored_idx ON sponsorships(sponsored_user_id);
CREATE INDEX IF NOT EXISTS sponsorships_film_idx ON sponsorships(film_given_id);

-- Commentaires
COMMENT ON TABLE sponsorships IS 'Système de parrainage communautaire obligatoire (CGU Art. 6). Chaque nouvel utilisateur reçoit un film d''un parrain existant';
COMMENT ON COLUMN sponsorships.sponsor_id IS 'Utilisateur qui donne un de ses films pour accueillir le nouveau membre';
COMMENT ON COLUMN sponsorships.sponsored_user_id IS 'Nouvel utilisateur qui reçoit le film de bienvenue (unique - ne peut être parrainé qu''une fois)';
COMMENT ON COLUMN sponsorships.film_given_id IS 'Référence au film donné (dans films_registry)';

-- ============================================================================
-- PARTIE 2: TABLE DES BADGES DE PARRAINAGE
-- ============================================================================

-- Table sponsor_badges: Badges de reconnaissance pour les parrains actifs
-- Bronze (1-5 parrainages), Argent (6-15), Or (16+)
CREATE TABLE IF NOT EXISTS sponsor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Utilisateur ayant le badge
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Niveau du badge
  badge_level TEXT NOT NULL CHECK (badge_level IN ('bronze', 'silver', 'gold')),

  -- Nombre de parrainages au moment de l'attribution
  sponsorship_count INT NOT NULL CHECK (sponsorship_count > 0),

  -- Date d'attribution du badge
  awarded_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Un utilisateur ne peut avoir qu'un seul badge de chaque niveau
  UNIQUE(user_id, badge_level)
);

-- Index
CREATE INDEX IF NOT EXISTS sponsor_badges_user_idx ON sponsor_badges(user_id);
CREATE INDEX IF NOT EXISTS sponsor_badges_level_idx ON sponsor_badges(badge_level);

-- Commentaires
COMMENT ON TABLE sponsor_badges IS 'Badges de reconnaissance pour valoriser la contribution à la communauté (CGU Art. 6.1)';
COMMENT ON COLUMN sponsor_badges.badge_level IS 'bronze (1-5 parrainages), silver (6-15 parrainages), gold (16+ parrainages)';

-- ============================================================================
-- PARTIE 3: FONCTION HELPER - Attribution automatique des badges
-- ============================================================================

-- Fonction pour attribuer automatiquement un badge selon le nombre de parrainages
CREATE OR REPLACE FUNCTION update_sponsor_badge(p_sponsor_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_sponsorship_count INT;
  v_new_badge TEXT;
  v_existing_badge TEXT;
BEGIN
  -- Compter le nombre de parrainages effectués
  SELECT COUNT(*) INTO v_sponsorship_count
  FROM sponsorships
  WHERE sponsor_id = p_sponsor_id;

  -- Déterminer le badge approprié
  IF v_sponsorship_count >= 16 THEN
    v_new_badge := 'gold';
  ELSIF v_sponsorship_count >= 6 THEN
    v_new_badge := 'silver';
  ELSIF v_sponsorship_count >= 1 THEN
    v_new_badge := 'bronze';
  ELSE
    RETURN NULL;  -- Pas encore de badge
  END IF;

  -- Vérifier si le badge existe déjà
  SELECT badge_level INTO v_existing_badge
  FROM sponsor_badges
  WHERE user_id = p_sponsor_id AND badge_level = v_new_badge;

  -- Si le badge n'existe pas encore, l'attribuer
  IF v_existing_badge IS NULL THEN
    INSERT INTO sponsor_badges (user_id, badge_level, sponsorship_count)
    VALUES (p_sponsor_id, v_new_badge, v_sponsorship_count)
    ON CONFLICT (user_id, badge_level) DO NOTHING;

    RETURN v_new_badge;
  END IF;

  RETURN NULL;  -- Badge déjà attribué
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 4: RPC - Attribution automatique d'un film de bienvenue
-- ============================================================================

-- RPC: Attribuer automatiquement un film à un nouvel utilisateur (parrainage)
-- Appelé lors de l'inscription ou du premier échange à l'unité
CREATE OR REPLACE FUNCTION assign_welcome_film(p_new_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_sponsor_id UUID;
  v_film_registry_id UUID;
  v_film_movie_id UUID;
  v_film_title TEXT;
  v_new_badge TEXT;
BEGIN
  -- ÉTAPE 1: Vérifier que l'utilisateur n'a pas déjà été parrainé
  IF EXISTS (
    SELECT 1 FROM sponsorships WHERE sponsored_user_id = p_new_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_already_sponsored',
      'message', 'Cet utilisateur a déjà reçu un film de bienvenue'
    );
  END IF;

  -- ÉTAPE 2: Sélectionner un parrain (utilisateur avec films disponibles)
  -- Critères:
  -- - A au moins 2 films (garde 1 minimum pour lui)
  -- - Priorité aux utilisateurs avec le moins de parrainages (équité)
  -- - Aléatoire en cas d'égalité
  SELECT fr.current_owner_id INTO v_sponsor_id
  FROM films_registry fr
  LEFT JOIN sponsorships s ON s.sponsor_id = fr.current_owner_id
  WHERE fr.current_owner_id != p_new_user_id
  GROUP BY fr.current_owner_id
  HAVING COUNT(DISTINCT fr.id) > 1
  ORDER BY COUNT(s.id) ASC, RANDOM()
  LIMIT 1;

  -- ÉTAPE 3: Si aucun parrain disponible
  IF v_sponsor_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_films_available',
      'message', 'Aucun film disponible pour le parrainage. Veuillez déposer un film ou attendre qu''un utilisateur en dépose un.'
    );
  END IF;

  -- ÉTAPE 4: Sélectionner un film aléatoire du parrain
  SELECT id, movie_id INTO v_film_registry_id, v_film_movie_id
  FROM films_registry
  WHERE current_owner_id = v_sponsor_id
  ORDER BY RANDOM()
  LIMIT 1;

  -- ÉTAPE 5: Obtenir le titre du film
  SELECT titre_francais INTO v_film_title
  FROM movies
  WHERE id = v_film_movie_id;

  -- ÉTAPE 6: Transférer la propriété du film au nouveau user
  UPDATE films_registry
  SET
    previous_owner_id = current_owner_id,
    current_owner_id = p_new_user_id,
    transfer_date = NOW(),
    acquisition_date = NOW(),
    acquisition_method = 'sponsorship'
  WHERE id = v_film_registry_id;

  -- ÉTAPE 7: Enregistrer le parrainage
  INSERT INTO sponsorships (
    sponsor_id,
    sponsored_user_id,
    film_given_id,
    sponsorship_date
  ) VALUES (
    v_sponsor_id,
    p_new_user_id,
    v_film_registry_id,
    NOW()
  );

  -- ÉTAPE 8: Mettre à jour le badge du parrain (si seuil atteint)
  v_new_badge := update_sponsor_badge(v_sponsor_id);

  -- Si un nouveau badge a été attribué, le noter dans le parrainage
  IF v_new_badge IS NOT NULL THEN
    UPDATE sponsorships
    SET badge_awarded = v_new_badge
    WHERE sponsored_user_id = p_new_user_id;
  END IF;

  -- ÉTAPE 9: Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'sponsor_id', v_sponsor_id,
    'film_registry_id', v_film_registry_id,
    'film_movie_id', v_film_movie_id,
    'film_title', v_film_title,
    'new_badge_awarded', v_new_badge,
    'message', 'Vous avez reçu le film "' || v_film_title || '" de votre parrain !'
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
-- PARTIE 5: RPC - Consultation des parrainages
-- ============================================================================

-- RPC: Obtenir le parrain d'un utilisateur
CREATE OR REPLACE FUNCTION get_my_sponsor(p_user_id UUID)
RETURNS TABLE (
  sponsor_id UUID,
  sponsor_email TEXT,
  film_title TEXT,
  sponsorship_date TIMESTAMP,
  badge_awarded TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.sponsor_id,
    up.email AS sponsor_email,
    m.titre_francais AS film_title,
    s.sponsorship_date,
    s.badge_awarded
  FROM sponsorships s
  JOIN user_profiles up ON up.id = s.sponsor_id
  JOIN films_registry fr ON fr.id = s.film_given_id
  JOIN movies m ON m.id = fr.movie_id
  WHERE s.sponsored_user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir la liste des filleuls d'un utilisateur
CREATE OR REPLACE FUNCTION get_my_sponsored_users(p_user_id UUID)
RETURNS TABLE (
  sponsored_user_id UUID,
  sponsored_user_email TEXT,
  film_title TEXT,
  sponsorship_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.sponsored_user_id,
    up.email AS sponsored_user_email,
    m.titre_francais AS film_title,
    s.sponsorship_date
  FROM sponsorships s
  JOIN user_profiles up ON up.id = s.sponsored_user_id
  JOIN films_registry fr ON fr.id = s.film_given_id
  JOIN movies m ON m.id = fr.movie_id
  WHERE s.sponsor_id = p_user_id
  ORDER BY s.sponsorship_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir les badges d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_level TEXT,
  sponsorship_count INT,
  awarded_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.badge_level,
    sb.sponsorship_count,
    sb.awarded_at
  FROM sponsor_badges sb
  WHERE sb.user_id = p_user_id
  ORDER BY sb.awarded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir le badge le plus élevé d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_highest_badge(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_badge TEXT;
BEGIN
  SELECT badge_level INTO v_badge
  FROM sponsor_badges
  WHERE user_id = p_user_id
  ORDER BY
    CASE badge_level
      WHEN 'gold' THEN 3
      WHEN 'silver' THEN 2
      WHEN 'bronze' THEN 1
    END DESC
  LIMIT 1;

  RETURN v_badge;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur sponsorships
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs parrainages (en tant que parrain ou filleul)
CREATE POLICY "Users can view their sponsorships"
  ON sponsorships FOR SELECT
  USING (
    sponsor_id = auth.uid()
    OR sponsored_user_id = auth.uid()
  );

-- Policy: Seule la RPC assign_welcome_film peut créer des parrainages
CREATE POLICY "Only RPC can create sponsorships"
  ON sponsorships FOR INSERT
  WITH CHECK (false);

-- Activer RLS sur sponsor_badges
ALTER TABLE sponsor_badges ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir tous les badges (pour affichage public)
CREATE POLICY "Anyone can view badges"
  ON sponsor_badges FOR SELECT
  USING (true);

-- Policy: Seule la fonction update_sponsor_badge peut créer des badges
CREATE POLICY "Only function can create badges"
  ON sponsor_badges FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
