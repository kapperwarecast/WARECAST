-- ============================================================================
-- MIGRATION: Correction contrainte CHECK ownership_history
-- Date: 2025-11-22
-- Description: Ajoute 'deposit' et 'legacy_migration' à la contrainte CHECK
--              pour garantir cohérence avec films_registry.acquisition_method
--
-- Bug: Trigger record_ownership_transfer() essaie d'insérer transfer_type
--      depuis acquisition_method, mais certaines valeurs ne sont pas autorisées
--      par la contrainte CHECK (deposit, legacy_migration)
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE ownership_history
DROP CONSTRAINT IF EXISTS ownership_history_transfer_type_check;

-- Recréer la contrainte avec toutes les valeurs nécessaires
ALTER TABLE ownership_history
ADD CONSTRAINT ownership_history_transfer_type_check
CHECK (
  transfer_type IN (
    'exchange',           -- Échange bilatéral de films
    'sponsorship',        -- Parrainage (don d'un film à nouveau user)
    'redistribution',     -- Redistribution administrative
    'initial_deposit',    -- Dépôt initial (legacy)
    'deposit',            -- Dépôt de film physique (acquisition_method)
    'legacy_migration'    -- Migration données anciennes (acquisition_method)
  )
);

-- Commentaire
COMMENT ON CONSTRAINT ownership_history_transfer_type_check ON ownership_history IS
'Contrainte CHECK permettant tous les types de transfert compatibles avec films_registry.acquisition_method.
Mapping: deposit → deposit, exchange → exchange, sponsorship → sponsorship, legacy_migration → legacy_migration';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la contrainte est bien créée
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ownership_history'::regclass
  AND conname = 'ownership_history_transfer_type_check';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
