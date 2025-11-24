-- ============================================================================
-- MIGRATION: Migration données emprunts → viewing_sessions
-- Date: 2025-11-20
-- Description: Copie toutes les données de emprunts vers viewing_sessions
--              avec backfill du registry_id basé sur l'ownership actuel
-- ============================================================================

-- ============================================================================
-- PARTIE 1: MIGRATION DES DONNÉES
-- ============================================================================

INSERT INTO viewing_sessions (
  id,
  user_id,
  registry_id,
  movie_id,
  statut,
  session_type,
  amount_paid,
  session_start_date,
  return_date,
  payment_id,
  stripe_payment_intent_id,
  created_at,
  updated_at
)
SELECT
  e.id,
  e.user_id,

  -- BACKFILL registry_id: Trouver la copie physique correspondante
  -- Logique: Chercher dans films_registry le film (movie_id) possédé par l'user (user_id)
  (
    SELECT fr.id
    FROM films_registry fr
    WHERE fr.movie_id = e.movie_id
      AND fr.current_owner_id = e.user_id
    LIMIT 1
  ) AS registry_id,

  e.movie_id,
  e.statut,

  -- Mapping type_emprunt → session_type
  CASE e.type_emprunt
    WHEN 'abonnement' THEN 'subscription'
    WHEN 'unitaire' THEN 'unit'
    ELSE 'subscription'  -- Fallback sécuritaire
  END AS session_type,

  COALESCE(e.montant_paye, 0) AS amount_paid,
  COALESCE(e.date_emprunt, e.created_at) AS session_start_date,
  COALESCE(e.date_retour, e.created_at + INTERVAL '48 hours') AS return_date,
  e.payment_id,
  e.stripe_payment_intent_id,
  e.created_at,
  COALESCE(e.updated_at, e.created_at) AS updated_at

FROM emprunts e

-- Ne migrer que les lignes où on peut trouver un registry_id valide
WHERE EXISTS(
  SELECT 1
  FROM films_registry fr
  WHERE fr.movie_id = e.movie_id
    AND fr.current_owner_id = e.user_id
)

-- Éviter les doublons si la migration est relancée
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTIE 2: VÉRIFICATION ET RAPPORT
-- ============================================================================

-- Afficher statistiques de migration
DO $$
DECLARE
  v_emprunts_count INTEGER;
  v_viewing_sessions_count INTEGER;
  v_migrated_count INTEGER;
BEGIN
  -- Compter les emprunts originaux
  SELECT COUNT(*) INTO v_emprunts_count FROM emprunts;

  -- Compter les viewing_sessions après migration
  SELECT COUNT(*) INTO v_viewing_sessions_count FROM viewing_sessions;

  -- Compter les emprunts qui PEUVENT être migrés (ont un registry_id)
  SELECT COUNT(*) INTO v_migrated_count
  FROM emprunts e
  WHERE EXISTS(
    SELECT 1
    FROM films_registry fr
    WHERE fr.movie_id = e.movie_id
      AND fr.current_owner_id = e.user_id
  );

  -- Afficher rapport
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'RAPPORT DE MIGRATION emprunts → viewing_sessions';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Emprunts originaux: %', v_emprunts_count;
  RAISE NOTICE 'Viewing sessions créées: %', v_viewing_sessions_count;
  RAISE NOTICE 'Emprunts migrables: %', v_migrated_count;

  IF v_emprunts_count > v_migrated_count THEN
    RAISE WARNING '% emprunts NON MIGRÉS (registry_id introuvable)',
      v_emprunts_count - v_migrated_count;
    RAISE WARNING 'Cause possible: Emprunts sur films non possédés ou films_registry incomplet';
  END IF;

  IF v_viewing_sessions_count = v_migrated_count THEN
    RAISE NOTICE 'Migration RÉUSSIE: Toutes les données migrables ont été copiées';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 3: REQUÊTE DIAGNOSTIQUE (Optionnel - Commenter si problème)
-- ============================================================================

-- Identifier les emprunts qui ne peuvent PAS être migrés
-- (Utile pour déboguer)
/*
SELECT
  e.id AS emprunt_id,
  e.user_id,
  e.movie_id,
  m.titre_francais AS film_titre,
  e.statut,
  'Registry introuvable pour cet user/movie' AS raison
FROM emprunts e
LEFT JOIN movies m ON m.id = e.movie_id
WHERE NOT EXISTS(
  SELECT 1
  FROM films_registry fr
  WHERE fr.movie_id = e.movie_id
    AND fr.current_owner_id = e.user_id
)
LIMIT 20;
*/

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
