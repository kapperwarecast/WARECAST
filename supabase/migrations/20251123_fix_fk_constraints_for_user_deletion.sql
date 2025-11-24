-- Migration: Modification des contraintes FK pour permettre suppression d'utilisateur
-- Créée le: 2025-11-23
-- Description: Change ON DELETE RESTRICT vers ON DELETE CASCADE pour permettre
--              la suppression propre des utilisateurs après redistribution de leurs films

-- =====================================================
-- TABLE: films_registry
-- =====================================================
-- Modifier current_owner_id: RESTRICT → CASCADE
-- Après redistribution des films, si des entrées restent (erreur), elles seront supprimées

ALTER TABLE films_registry
DROP CONSTRAINT IF EXISTS films_registry_current_owner_id_fkey;

ALTER TABLE films_registry
ADD CONSTRAINT films_registry_current_owner_id_fkey
FOREIGN KEY (current_owner_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;

-- Commentaire explicatif
COMMENT ON CONSTRAINT films_registry_current_owner_id_fkey ON films_registry IS
'CASCADE permet suppression après redistribution. Films résiduels seront supprimés automatiquement.';


-- =====================================================
-- TABLE: ownership_history
-- =====================================================
-- Modifier to_owner_id: RESTRICT → CASCADE
-- L'historique des transferts VERS l'utilisateur supprimé sera supprimé

ALTER TABLE ownership_history
DROP CONSTRAINT IF EXISTS ownership_history_to_owner_id_fkey;

ALTER TABLE ownership_history
ADD CONSTRAINT ownership_history_to_owner_id_fkey
FOREIGN KEY (to_owner_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;

-- Commentaire explicatif
COMMENT ON CONSTRAINT ownership_history_to_owner_id_fkey ON ownership_history IS
'CASCADE supprime historique des films reçus par l''utilisateur supprimé.';
