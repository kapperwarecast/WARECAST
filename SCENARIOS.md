# Warecast - Documentation complète des scénarios d'utilisation

## Introduction

Ce document décrit les **31 scénarios possibles** du système Warecast et comment chacun est pris en charge techniquement (frontend, backend, database).

**Point d'entrée principal**: RPC `rent_or_access_movie(p_auth_user_id, p_movie_id, p_payment_id)` - Gère à la fois la lecture de films possédés ET les échanges instantanés.

## Légende des conditions

- **A1**: Non connecté | **A2**: Abonné actif | **A3**: Abonné résilié valide | **A4**: Non-abonné
- **B1**: Possède le film | **B2**: Ne possède pas
- **C1**: Aucune session | **C2**: Session sur CE film | **C3**: Session sur AUTRE film
- **D1**: Film disponible | **D2**: Film occupé | **D3**: Film pas dans registre
- **E1**: A des films à offrir | **E2**: Aucun film disponible
- **F1**: Paiement fourni + succeeded | **F2**: Pas de paiement

---

## CATÉGORIE 1 : Utilisateur non connecté

### Scénario #1 : Utilisateur non authentifié tente de lire un film
**Conditions**: A1
**Frontend**: Hook `use-play-button.ts` → `getAction()` retourne `'login'`
**Backend**: Aucun appel (redirect avant)
**Tables lues**: Aucune
**Tables modifiées**: Aucune
**Résultat**: `router.push('/auth/login')`
**Impact**: Redirection page login, aucun changement système
**Référence code**: `hooks/actions/use-play-button.ts:42-44`

---

## CATÉGORIE 2 : Propriétaire du film (6 scénarios)

### Scénario #2 : Propriétaire regardant son film pour la première fois
**Conditions**: A2/A3/A4 + B1 + C1 + D1
**Frontend**: Hook `use-play-button.ts` → Appel RPC avec `payment_id=undefined`
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 1 (vérifie propriété) → ÉTAPE 2 (crée session)
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: `viewing_sessions` (INSERT avec `session_type='subscription'`, `amount_paid=0`)
**Résultat**: `{success: true, emprunt_id: "uuid", rental_type: "subscription", owns_film: true}`
**Impact**: Session 48h créée gratuitement (car propriétaire), film devient "occupé"
**Référence code**: `supabase/migrations/20251120_update_rpc_viewing_sessions.sql:63-114`

### Scénario #3 : Propriétaire avec session déjà active sur CE film
**Conditions**: A2/A3/A4 + B1 + C2 + D1
**Frontend**: Hook `use-play-button.ts` → Si `isCurrentlyRented=true`, redirect direct SANS RPC
**Backend**: RPC appelé uniquement si frontend pense session inexistante (cache périmé)
**Tables lues**: `viewing_sessions` (SELECT pour vérifier session existante)
**Tables modifiées**: Aucune
**Résultat**: `{success: true, existing_rental: true, emprunt_id: "uuid"}` OU redirect direct
**Impact**: Aucun changement, lecture continue
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:66-85` + `use-play-button.ts:74-78`

### Scénario #4 : Propriétaire abonné avec session active sur AUTRE film (rotation)
**Conditions**: A2/A3 + B1 + C3 + D1
**Frontend**: Hook `use-play-button.ts` → Appel RPC (rotation gérée côté backend)
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 2 : Ferme ancienne session + Crée nouvelle
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: `viewing_sessions` (UPDATE `statut='rendu'` ancienne + INSERT nouvelle)
**Résultat**: `{success: true, previous_rental_released: true, previous_rental_id: "old-uuid"}`
**Impact**: Ancien film redevient disponible, nouveau film occupé, rotation gratuite
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:88-104`

### Scénario #5 : Propriétaire NON-abonné avec session active sur AUTRE film
**Conditions**: A4 + B1 + C3 + D1
**Frontend**: Identique scénario #4 (rotation appliquée aussi aux non-abonnés propriétaires)
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 2 : Rotation automatique
**Tables lues**: `films_registry`, `viewing_sessions`
**Tables modifiées**: `viewing_sessions` (UPDATE + INSERT)
**Résultat**: Rotation appliquée gratuitement (car propriétaire)
**Impact**: Même comportement qu'abonné pour films possédés
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:88-104`

### Scénario #6 : Frontend détecte film possédé avec session active
**Conditions**: A2/A3/A4 + B1 + C2
**Frontend**: Hook `use-play-button.ts` → Détecte `isCurrentlyRented=true` → Redirect DIRECT
**Backend**: Aucun appel RPC (optimisation)
**Tables lues**: Aucune (données en cache frontend)
**Tables modifiées**: Aucune
**Résultat**: `router.push(/movie-player/${movieId})`
**Impact**: Lecture immédiate sans latence réseau
**Référence code**: `hooks/actions/use-play-button.ts:74-78`

### Scénario #7 : Frontend détecte film possédé SANS session (abonné)
**Conditions**: A2/A3 + B1 + C1 ou C3
**Frontend**: Hook `use-play-button.ts` → `getAction()` retourne `'play'` (car abonné)
**Backend**: Appel RPC `rent_or_access_movie` sans paiement
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: Selon présence autre session (scénario #2 ou #4)
**Résultat**: Crée session OU rotation selon contexte
**Impact**: Film devient "occupé"
**Référence code**: `hooks/actions/use-play-button.ts:81-127`

---

## CATÉGORIE 3 : Film non possédé - Erreurs système (2 scénarios)

### Scénario #8 : Film demandé pas dans le registre
**Conditions**: A2/A3/A4 + B2 + D3
**Frontend**: Hook `use-play-button.ts` → Appel RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 1 : `SELECT films_registry WHERE movie_id=X → NULL`
**Tables lues**: `films_registry`
**Tables modifiées**: Aucune
**Résultat**: `{success: false, error: "Film non disponible dans le registre", code: "FILM_NOT_IN_REGISTRY"}`
**Impact**: Erreur affichée utilisateur, film pas encore déposé physiquement
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:51-57`

### Scénario #9 : Film occupé (session active par propriétaire)
**Conditions**: A2/A3/A4 + B2 + D2 + E1/E2
**Frontend**: Hook `use-play-button.ts` → Appel RPC ou `use-film-availability.ts` détecte avant
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 3 : Vérifie `viewing_sessions.registry_id` → Session active trouvée
**Tables lues**: `films_registry`, `viewing_sessions`
**Tables modifiées**: Aucune
**Résultat**: `{success: false, error: "Film actuellement indisponible", code: "FILM_NOT_AVAILABLE"}`
**Impact**: Badge "Occupé" affiché, utilisateur doit attendre fin session (48h max)
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:123-136`

---

## CATÉGORIE 4 : Film non possédé - Aucun film à offrir (1 scénario)

### Scénario #10 : Utilisateur sans film disponible pour échange
**Conditions**: A2/A3/A4 + B2 + D1 + E2
**Frontend**: Hook `use-play-button.ts` → Appel RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 4 : Recherche film user disponible → Aucun trouvé
**Tables lues**: `films_registry`, `viewing_sessions` (vérifier disponibilité films user)
**Tables modifiées**: Aucune
**Résultat**: `{success: false, error: "Aucun film disponible pour l'échange", code: "NO_FILM_TO_EXCHANGE"}`
**Impact**: Utilisateur bloqué, doit attendre fin d'une de ses sessions pour libérer un film
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:142-162`

---

## CATÉGORIE 5 : Échange avec abonné actif (4 scénarios)

### Scénario #11 : Abonné actif échange SANS session active
**Conditions**: A2 + B2 + C1 + D1 + E1 + F2
**Frontend**: Hook `use-play-button.ts` → `getAction()='play'` → Appel RPC sans paiement
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 5 (détecte abonnement) → ÉTAPE 7 (échange) → ÉTAPE 8 (session)
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: `films_registry` (2× UPDATE `current_owner_id`), `film_exchanges` (INSERT), `viewing_sessions` (INSERT)
**Résultat**: `{success: true, exchange_performed: true, exchange_id: "uuid", rental_type: "subscription"}`
**Impact**: Échange bilatéral instantané + session créée, gratuit car abonné
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:168-296`

### Scénario #12 : Abonné actif échange AVEC session active sur autre film (rotation)
**Conditions**: A2 + B2 + C3 + D1 + E1 + F2
**Frontend**: Hook `use-play-button.ts` → Appel RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 6 (ferme session) → ÉTAPE 7-8 (échange + session)
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: `viewing_sessions` (UPDATE `statut='rendu'` + INSERT), `films_registry` (2× UPDATE), `film_exchanges` (INSERT)
**Résultat**: `{success: true, previous_rental_released: true, exchange_performed: true}`
**Impact**: Rotation + échange instantané, ancien film redevient disponible immédiatement
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:194-296`

### Scénario #13 : Abonné résilié mais valide échange
**Conditions**: A3 + B2 + C1/C3 + D1 + E1 + F2
**Frontend**: Hook détecte `subscription.statut='résilié' AND date_expiration > NOW()` → Traité comme actif
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 5 : `statut IN ('actif', 'résilié') AND date_expiration > NOW()` → TRUE
**Tables lues**: `user_abonnements`, `films_registry`, `viewing_sessions`
**Tables modifiées**: Identique scénario #11 ou #12
**Résultat**: Échange gratuit (accès maintenu jusqu'à expiration)
**Impact**: Abonné résilié conserve avantages jusqu'à `date_expiration`
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:168-172`

### Scénario #14 : Abonné tente échange mais RPC retourne requires_payment (bug cache)
**Conditions**: A2 + B2 + D1 + E1 + BUG (abonnement non détecté en BDD)
**Frontend**: Hook `use-play-button.ts` → Reçoit `requires_payment_choice: true` → Ouvre modal paiement
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 5 : `v_user_has_subscription = FALSE` (bug/cache)
**Tables lues**: `user_abonnements` (retourne résultat périmé)
**Tables modifiées**: Aucune
**Résultat**: `{success: false, requires_payment_choice: true, amount: 1.50}`
**Impact**: Edge case rare, user abonné voit modal paiement par erreur
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:180-188` + `use-play-button.ts:103-108`

---

## CATÉGORIE 6 : Échange avec non-abonné + paiement (4 scénarios)

### Scénario #15 : Non-abonné échange avec paiement SANS session active
**Conditions**: A4 + B2 + C1 + D1 + E1 + F1
**Frontend**: Hook → User paye 1,50€ Stripe → `payment_id` → Appel RPC avec `p_payment_id`
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 5 (`session_type='unit'`, `amount_paid=1.50`) → ÉTAPE 7-8
**Tables lues**: `films_registry`, `viewing_sessions`, `payments` (devrait vérifier status)
**Tables modifiées**: `films_registry` (2× UPDATE), `film_exchanges` (INSERT avec `payment_id`), `viewing_sessions` (INSERT)
**Résultat**: `{success: true, exchange_performed: true, rental_type: "unit", amount_charged: 1.50}`
**Impact**: Échange payant réussi, frais 1,50€ débités
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:177-296`

### Scénario #16 : Non-abonné échange avec paiement AVEC session active ✅ CORRIGÉ
**Conditions**: A4 + B2 + C3 + D1 + E1 + F1
**Frontend**: Hook → Paiement → Appel RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 6 : Rotation appliquée à TOUS (correction 2025-11-21)
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: `viewing_sessions` (UPDATE ancienne `statut='rendu'` + INSERT nouvelle), `films_registry` (2× UPDATE), `film_exchanges` (INSERT)
**Résultat**: Ancienne session fermée, nouvelle créée (1 seule session active ✅)
**Impact**: ✅ CORRIGÉ - Règle "1 film à la fois" respectée pour tous
**Référence code**: `20251121_fix_payment_validation.sql:216-220`

### Scénario #17 : Non-abonné tente échange SANS paiement
**Conditions**: A4 + B2 + C1/C3 + D1 + E1 + F2
**Frontend**: Hook `use-play-button.ts` → `hasActiveSubscription=false` → `getAction()='payment'`
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 5 : `p_payment_id IS NULL` → Retour erreur
**Tables lues**: `user_abonnements`, `films_registry`
**Tables modifiées**: Aucune
**Résultat**: `{success: false, requires_payment_choice: true, amount: 1.50, code: "PAYMENT_REQUIRED"}`
**Impact**: Frontend ouvre modal paiement Stripe
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:180-188`

### Scénario #18 : Frontend - Non-abonné clique Play (ouvre modal paiement)
**Conditions**: A4 + (B1 session inactive OU B2) + C1
**Frontend**: Hook `use-play-button.ts` → `getAction()` retourne `'payment'` → Click → `openPaymentModal()`
**Backend**: Aucun appel RPC (modal ouvert avant)
**Tables lues**: Aucune (cache frontend)
**Tables modifiées**: Aucune
**Résultat**: Modal Stripe checkout affiché (1,50€)
**Impact**: User voit interface paiement, doit compléter transaction avant RPC
**Référence code**: `hooks/actions/use-play-button.ts:56-57` + `130-132`

---

## CATÉGORIE 7 : Cas limites et erreurs (9 scénarios)

### Scénario #19 : Erreur interne RPC (exception SQL)
**Conditions**: N'importe quelle condition + Erreur PostgreSQL (FK violation, timeout, etc.)
**Frontend**: Hook reçoit erreur dans `catch` → Affiche message générique
**Backend**: RPC `rent_or_access_movie` → Exception levée → Bloc `EXCEPTION WHEN OTHERS`
**Tables lues**: Dépend du point de défaillance
**Tables modifiées**: Aucune (ROLLBACK automatique PostgreSQL)
**Résultat**: `{success: false, error: "[message SQL]", code: "INTERNAL_ERROR"}`
**Impact**: Transaction annulée, système revient à l'état précédent
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:298-305`

### Scénario #20 : Frontend loading state
**Conditions**: `loadingUserSubscription=true` OU `loadingRental=true`
**Frontend**: Hook `use-play-button.ts` → `getAction()` retourne `'loading'` → Bouton désactivé
**Backend**: Aucun
**Tables lues**: Aucune
**Tables modifiées**: Aucune
**Résultat**: Spinner affiché, bouton Play grisé
**Impact**: Protection contre double-click, attente chargement données
**Référence code**: `hooks/actions/use-play-button.ts:36-39`

### Scénario #21 : Multi-copies du même film (support nouveau système) ✅ CORRIGÉ
**Conditions**: Plusieurs entrées `films_registry` avec même `movie_id` (ex: Matrix Blu-ray User A + Matrix DVD User B)
**Frontend**: Hook `use-film-availability.ts` → Vérifie disponibilité par `registry_id` (copie spécifique)
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 1 : `ORDER BY` déterministe (priorité copies disponibles)
**Tables lues**: `films_registry`, `viewing_sessions` (filtré par `registry_id`)
**Tables modifiées**: Dépend scénario (échange ou lecture)
**Résultat**: Sélectionne toujours copie disponible en priorité ✅
**Impact**: ✅ CORRIGÉ - Sélection déterministe avec priorité disponibilité
**Référence code**: `20251121_fix_payment_validation.sql:47-57` + `use-film-availability.ts:29-54`

### Scénario #22 : Session expirée (48h dépassées) ✅ CORRIGÉ
**Conditions**: `viewing_sessions.return_date < NOW()` + `statut='en_cours'`
**Frontend**: Hook `use-film-availability.ts` filtre sessions par `gt('return_date', NOW())` → Ignore expirées
**Backend**: Edge Function `expire-sessions` (cron toutes les heures) → Appelle RPC `expire_overdue_sessions()`
**Tables lues**: `viewing_sessions` (WHERE `return_date < NOW() AND statut='en_cours'`)
**Tables modifiées**: `viewing_sessions` (UPDATE `statut='expiré'`)
**Résultat**: Films redeviennent disponibles automatiquement toutes les heures ✅
**Impact**: ✅ CORRIGÉ - Expiration automatique via cron
**Référence code**: `supabase/functions/expire-sessions/index.ts` + Cron `0 * * * *`

### Scénario #23 : Realtime - Détection disponibilité en temps réel
**Conditions**: User A crée session → User B consulte page film
**Frontend**: Hook `use-film-availability.ts` → Souscrit channel `film-availability-{registry_id}`
**Backend**: Trigger Postgres Realtime → Broadcast changements `viewing_sessions`
**Tables lues**: `viewing_sessions` (via subscription Realtime)
**Tables modifiées**: Aucune (écoute uniquement)
**Résultat**: Badge "Disponible" → "Occupé" en temps réel sans refresh
**Impact**: Synchronisation UI immédiate entre utilisateurs
**Référence code**: `hooks/data/use-film-availability.ts:71-90`

### Scénario #24 : Realtime - Mise à jour collection après échange
**Conditions**: User A échange film → User B (ancien propriétaire) consulte "Mes Films"
**Frontend**: Hook `use-owned-films.ts` → Souscrit channel `user-sessions-{user_id}`
**Backend**: RPC `rent_or_access_movie` → UPDATE `films_registry` → Broadcast Realtime
**Tables lues**: `viewing_sessions` (via subscription)
**Tables modifiées**: Aucune (écoute uniquement)
**Résultat**: Collection rafraîchie automatiquement, nouveau film apparaît
**Impact**: User B découvre nouveau film instantanément sans action
**Référence code**: `hooks/data/use-owned-films.ts:149-173`

### Scénario #25 : Rotation abonné - Film possédé vers film possédé
**Conditions**: A2/A3 + B1 (possède A,B,C) + C3 (session sur A) → Clique Play sur B
**Frontend**: Hook `use-play-button.ts` → Appel RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 2 : Ferme session A + Crée session B
**Tables lues**: `films_registry`, `viewing_sessions`, `user_abonnements`
**Tables modifiées**: `viewing_sessions` (UPDATE A `statut='rendu'` + INSERT B)
**Résultat**: Rotation gratuite entre films possédés
**Impact**: A redevient disponible, B devient occupé
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:88-94`

### Scénario #26 : Non-abonné - Lecture film possédé AVEC session active autre film
**Conditions**: A4 + B1 (possède D,E) + C3 (session sur D) → Clique Play sur E
**Frontend**: Hook → Appel RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 2 : Rotation appliquée (comme abonné car propriétaire)
**Tables lues**: `films_registry`, `viewing_sessions`
**Tables modifiées**: `viewing_sessions` (UPDATE + INSERT)
**Résultat**: Rotation gratuite (car propriétaire, pas besoin abonnement)
**Impact**: Non-abonné bénéficie rotation pour SES films
**Référence code**: `20251120_update_rpc_viewing_sessions.sql:88-104`

### Scénario #27 : Paiement Stripe failed (payment_intent not succeeded) ✅ CORRIGÉ
**Conditions**: A4 + B2 + D1 + E1 + F1 + Paiement Stripe échoué (carte refusée)
**Frontend**: Stripe webhook confirme `payment_intent.status != 'succeeded'` → Ne devrait pas appeler RPC
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 5 : **Valide `payments.status='succeeded'`** (correction 2025-11-21)
**Tables lues**: `films_registry`, `viewing_sessions`, `payments` (validation ajoutée)
**Tables modifiées**: Aucune (retourne erreur `PAYMENT_NOT_SUCCEEDED`)
**Résultat**: `{success: false, error: "Paiement invalide", code: "PAYMENT_NOT_SUCCEEDED"}` ✅
**Impact**: ✅ CORRIGÉ - Impossible d'échanger sans paiement valide
**Référence code**: `20251121_fix_payment_validation.sql:183-195`

### Scénario #28 : Utilisateur supprimé (cascade DELETE)
**Conditions**: User possède films via `films_registry` → Admin tente `DELETE user_profiles`
**Frontend**: Interface admin
**Backend**: PostgreSQL constraint `ON DELETE RESTRICT` sur `films_registry.current_owner_id`
**Tables lues**: `user_profiles`, `films_registry`
**Tables modifiées**: Aucune (DELETE bloqué)
**Résultat**: Erreur PostgreSQL "violates foreign key constraint"
**Impact**: Protection système, impossible supprimer user avec films (redistribution films nécessaire avant)
**Référence code**: `20251116_create_ownership_registry_system.sql:22`

---

## CATÉGORIE 8 : Scénarios frontend spécifiques (3 scénarios)

### Scénario #29 : Abonné clique Play - RPC retourne existing_rental (cache périmé)
**Conditions**: A2/A3 + Frontend détecte `isCurrentlyRented=false` (cache) + C2 réel en BDD
**Frontend**: Hook `use-play-button.ts` → Appel RPC (pense session inexistante)
**Backend**: RPC `rent_or_access_movie` → ÉTAPE 2 : Détecte session existante → Retour immédiat
**Tables lues**: `viewing_sessions`
**Tables modifiées**: Aucune
**Résultat**: `{success: true, existing_rental: true}` → Frontend redirect vers player
**Impact**: Fonctionne mais appel réseau inutile (cache désynchronisé)
**Référence code**: Scénario #3 + `use-play-button.ts:119-120`

### Scénario #30 : Erreur réseau lors appel RPC
**Conditions**: N'importe quelle condition + Timeout/network failure (connexion perdue)
**Frontend**: Hook `use-play-button.ts` → `supabase.rpc()` lève exception JavaScript
**Backend**: Aucun (requête n'arrive pas)
**Tables lues**: Aucune
**Tables modifiées**: Aucune
**Résultat**: Bloc `catch` → `setError("Erreur réseau")`
**Impact**: Message erreur utilisateur, système inchangé
**Référence code**: `hooks/actions/use-play-button.ts:121-126`

### Scénario #31 : RPC retourne requires_payment mais frontend ignore (bug UI)
**Conditions**: A4 + B2 + D1 + E1 + F2 + Frontend ne gère pas `requires_payment_choice`
**Frontend**: Hook reçoit `{requires_payment_choice: true}` mais n'ouvre PAS modal (bug code)
**Backend**: RPC retourne correctement demande paiement
**Tables lues**: `user_abonnements`, `films_registry`
**Tables modifiées**: Aucune
**Résultat**: Rien ne se passe, utilisateur bloqué
**Impact**: UI non réactive, expérience dégradée
**Référence code**: `use-play-button.ts:103-108` (doit ouvrir modal)

---

## Bugs et vulnérabilités identifiés

### ✅ BUG CRITIQUE #1 : Validation paiement Stripe (Scénario #27) - CORRIGÉ
**Problème**: RPC acceptait `payment_id` sans vérifier `payments.status = 'succeeded'`
**Impact**: Échanges gratuits frauduleux possibles en manipulant `payment_id`
**Fix appliqué**: Validation `SELECT FROM payments WHERE id=p_payment_id AND status='succeeded' AND user_id=p_auth_user_id` dans ÉTAPE 5
**Code**: `20251121_fix_payment_validation.sql:183-195`
**Date correction**: 2025-11-21

### ✅ BUG MAJEUR #2 : Double session non-abonné (Scénario #16) - CORRIGÉ
**Problème**: ÉTAPE 6 rotation skip si `v_user_has_subscription=FALSE`, permettait 2 sessions simultanées
**Impact**: Violation règle métier "1 film à la fois" via échange payant
**Fix appliqué**: Rotation appliquée à TOUS (condition `IF v_user_has_subscription` supprimée)
**Code**: `20251121_fix_payment_validation.sql:216-220`
**Date correction**: 2025-11-21

### ✅ BUG MINEUR #3 : Sélection copie aléatoire (Scénario #21) - CORRIGÉ
**Problème**: `LIMIT 1` sans `ORDER BY` prenait copie physique aléatoire
**Impact**: Pouvait choisir copie occupée alors qu'autre disponible
**Fix appliqué**: `ORDER BY (CASE WHEN NOT EXISTS(session) THEN 0 ELSE 1 END), acquisition_date ASC`
**Code**: `20251121_fix_payment_validation.sql:47-57`
**Date correction**: 2025-11-21

### ✅ BUG MINEUR #4 : Expiration non automatique (Scénario #22) - CORRIGÉ
**Problème**: Sessions expirées (>48h) restaient `statut='en_cours'`, films bloqués
**Impact**: Films marqués "occupés" indéfiniment
**Fix appliqué**: Edge Function cron appelant `expire_overdue_sessions()` toutes les heures
**Code**: `supabase/functions/expire-sessions/index.ts`
**Cron**: `0 * * * *` (configuration Supabase Dashboard)
**Date correction**: 2025-11-21

---

## 📋 Instructions d'application

Tous les correctifs sont disponibles dans:
- **Migration SQL**: `supabase/migrations/20251121_fix_payment_validation.sql`
- **Edge Function**: `supabase/functions/expire-sessions/index.ts`
- **Instructions**: `INSTRUCTIONS_CORRECTIONS_BUGS.md`

---

## Matrice de couverture

| Statut | Propriété | Session | Dispo film | Films échange | Paiement | Scénarios |
|--------|-----------|---------|------------|---------------|----------|-----------|
| A1 | - | - | - | - | - | #1 |
| A2/A3/A4 | B1 | C1 | D1 | - | - | #2, #7 |
| A2/A3/A4 | B1 | C2 | D1 | - | - | #3, #6 |
| A2/A3 | B1 | C3 | D1 | - | - | #4, #25 |
| A4 | B1 | C3 | D1 | - | - | #5, #26 |
| A2/A3/A4 | B2 | - | D3 | - | - | #8 |
| A2/A3/A4 | B2 | - | D2 | E1/E2 | - | #9 |
| A2/A3/A4 | B2 | - | D1 | E2 | - | #10 |
| A2/A3 | B2 | C1 | D1 | E1 | F2 | #11, #13 |
| A2/A3 | B2 | C3 | D1 | E1 | F2 | #12 |
| A4 | B2 | C1 | D1 | E1 | F1 | #15 |
| A4 | B2 | C3 | D1 | E1 | F1 | #16 (BUG) |
| A4 | B2 | C1/C3 | D1 | E1 | F2 | #17, #18 |
| Divers | - | - | - | - | - | #19-31 |

**Total**: 31 scénarios identifiés, 100% des combinaisons logiques couvertes.

---

## Références techniques

### Fichiers clés analysés
- `supabase/migrations/20251120_update_rpc_viewing_sessions.sql` - RPC principale
- `supabase/migrations/20251120_create_utility_rpc_functions.sql` - Fonctions utilitaires
- `hooks/actions/use-play-button.ts` - Logique bouton Play
- `hooks/data/use-owned-films.ts` - Films possédés
- `hooks/data/use-film-availability.ts` - Disponibilité temps réel
- `CLAUDE.md` - Documentation système

### Tables principales impliquées
1. **`viewing_sessions`** - Sessions de lecture (48h), statut, type, montant
2. **`films_registry`** - Propriété unique des copies physiques
3. **`film_exchanges`** - Historique échanges instantanés
4. **`user_abonnements`** - Abonnements 5€/mois
5. **`payments`** - Paiements Stripe (échanges unitaires 1,50€)
6. **`user_profiles`** - Utilisateurs

### Channels Realtime
- `film-availability-{registry_id}` - Disponibilité copie physique
- `user-sessions-{user_id}` - Sessions utilisateur
- `ownership` - Transferts propriété
