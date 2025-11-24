-- ============================================================================
-- MIGRATION: Nettoyage table payments et ajout contrainte FK
-- Date: 2025-11-22
-- Description: Supprime la colonne obsolète rental_id et ajoute une contrainte
--              FK sur viewing_sessions.payment_id pour garantir l'intégrité
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Supprimer la colonne obsolète rental_id
-- ============================================================================

-- Vérifier si la colonne existe avant de la supprimer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'rental_id'
  ) THEN
    ALTER TABLE payments DROP COLUMN rental_id;
    RAISE NOTICE 'Colonne payments.rental_id supprimée avec succès';
  ELSE
    RAISE NOTICE 'Colonne payments.rental_id n''existe pas (déjà supprimée)';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 2: Ajouter contrainte FK sur viewing_sessions.payment_id
-- ============================================================================

-- Nettoyer d'abord les payment_id invalides (qui pointent vers des paiements inexistants)
UPDATE viewing_sessions
SET payment_id = NULL
WHERE payment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM payments WHERE id = viewing_sessions.payment_id
  );

-- Ajouter la contrainte FK si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'viewing_sessions_payment_id_fkey'
  ) THEN
    ALTER TABLE viewing_sessions
    ADD CONSTRAINT viewing_sessions_payment_id_fkey
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

    RAISE NOTICE 'Contrainte FK viewing_sessions.payment_id ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Contrainte FK viewing_sessions.payment_id existe déjà';
  END IF;
END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN viewing_sessions.payment_id IS
'Référence au paiement Stripe associé (1.50€ pour sessions unitaires).
NULL pour sessions gratuites (abonnés ou films possédés).
Contrainte FK: ON DELETE SET NULL (si paiement supprimé, session conservée)';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la colonne rental_id a bien été supprimée
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'rental_id'
    ) THEN 'ERREUR: rental_id existe encore'
    ELSE 'OK: rental_id supprimée'
  END AS verification_rental_id;

-- Vérifier que la contrainte FK a bien été ajoutée
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'viewing_sessions_payment_id_fkey'
    ) THEN 'OK: Contrainte FK ajoutée'
    ELSE 'ERREUR: Contrainte FK manquante'
  END AS verification_fk;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
