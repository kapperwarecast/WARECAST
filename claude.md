# Warecast - Plateforme collaborative d'échange de films

## Vue d'ensemble

Warecast est une plateforme collaborative où les utilisateurs possèdent et échangent des films physiques numérisés. Le système fonctionne comme une bibliothèque collective :

### Concepts clés
- **Propriété unique** : Chaque film physique existe en 1 seule copie et appartient à 1 seul utilisateur via `films_registry`
- **Dépôt physique** : Les utilisateurs déposent leurs films physiques (Blu-ray/DVD) qui sont numérisés
- **Échanges instantanés** : Transferts bilatéraux automatiques SANS accord du propriétaire
- **1 film à la fois** : Vous ne pouvez regarder qu'un seul film simultanément (session de 48h)
- **Abonnement optionnel** : 5€/mois pour échanger sans frais, sinon 1,50€ par échange

**IMPORTANT** : Quand vous regardez un film (session active 48h), il est "occupé" et non échangeable. Vos autres films sont automatiquement disponibles pour que d'autres les prennent en échange de leurs films, **sans votre accord**.

## Stack technique

### Frontend
- **Next.js 15.5.2** - App Router avec React 19
- **TypeScript** - Mode strict activé
- **TailwindCSS 4** - Styling avec shadcn/ui components
- **Zustand 5** - State management avec persistence
- **React Hook Form + Zod** - Gestion et validation de formulaires

### Backend & Services
- **Supabase** - Auth, Database (PostgreSQL), Realtime, Storage, Edge Functions
- **Stripe** - Paiements (checkout) et abonnements mensuels
- **TMDB API** - Métadonnées de films (posters, synopsis, casting)

### Outils
- **Turbopack** - Bundler rapide pour le développement
- **ESLint** - Linting
- **Lucide React** - Bibliothèque d'icônes

## Architecture du projet

```
warecast-app/
├── app/                      # Next.js App Router
│   ├── (routes)/            # Pages de l'application
│   │   ├── page.tsx         # Accueil - catalogue de films
│   │   ├── film/[slug]/     # Détails d'un film
│   │   ├── movie-player/[id]/ # Lecteur vidéo
│   │   ├── favorites/       # Films favoris
│   │   ├── mes-films/       # Ma collection (films possédés)
│   │   ├── formules/        # Abonnements (pricing)
│   │   ├── abonnement/      # Gestion abonnement
│   │   ├── profile/         # Profil utilisateur
│   │   ├── deposer/         # Dépôt de films physiques
│   │   ├── auth/            # Login, signup, forgot-password
│   │   └── admin/           # Admin (users, deposits, sponsorship)
│   └── api/                 # API Routes
│       ├── movies/          # CRUD films
│       ├── subscriptions/   # Stripe checkout, annulation
│       ├── exchanges/       # Échanges instantanés
│       ├── user-subscription/ # Status abonnement
│       ├── stripe/webhook/  # Webhooks Stripe (paiements, abonnements)
│       └── admin/           # Admin routes (users, deposits, lifetime)
│
├── components/              # Composants React réutilisables
│   ├── ui/                  # shadcn/ui + composants custom
│   ├── admin/               # Composants admin (users-table, dialogs)
│   └── movie-player/        # Composants du lecteur vidéo
│
├── hooks/                   # Custom React Hooks (organisés par catégorie)
│   ├── ui/                  # Logique UI (navigation, infinite scroll)
│   ├── data/                # Données business (owned-films, favorites)
│   ├── actions/             # Actions utilisateur (play button)
│   └── realtime/            # Supabase Realtime subscriptions
│
├── stores/                  # Zustand stores
│   ├── create-cached-store.ts # Factory pattern pour stores avec cache
│   ├── subscription-store.ts # État abonnement
│   ├── ownership-store.ts   # Films possédés
│   └── like-store.ts        # Likes/favoris
│
├── lib/                     # Bibliothèques et services
│   ├── supabase/            # Client Supabase + types
│   ├── stripe.ts            # Configuration Stripe
│   ├── tmdb/                # API TMDB
│   ├── server/              # Fonctions server-side
│   ├── types/               # Types pour subscription status
│   └── utils/               # Utilitaires (cn, formatters)
│
├── types/                   # Types TypeScript centralisés
│   ├── index.ts             # Types principaux (Movie, User, etc.)
│   ├── subscription.ts      # Types abonnement
│   └── rpc.ts               # Types RPC
│
├── contexts/                # React Context providers
│   ├── auth-context.tsx     # Authentification Supabase
│   └── filters-context.tsx  # Filtres catalogue
│
├── constants/               # Constantes de l'application
│   ├── routes.ts            # Routes de l'app
│   └── navigation.ts        # Configuration navigation
│
├── supabase/                # Supabase migrations
│   └── migrations/          # Migrations SQL
│
└── public/                  # Assets statiques
```

## Modèle économique

### Abonnement mensuel (optionnel)
- **Prix : 5€/mois**
- **Avantage** : Échanges illimités et gratuits
- **Limitation** : 1 seul film en lecture à la fois (session de 48h)
- Sans abonnement : 1,50€ par échange

### Frais d'échange (sans abonnement)
- **Prix : 1,50€** par échange
- **Payé par** : Celui qui PREND le film
- **Exemple** : Si je prends "Matrix" de User A en échange de mon "Tenet", je paie 1,50€ (sauf si abonné)

### Types d'emprunt (contrainte CHECK)

La table `emprunts` n'accepte que **2 types** via contrainte CHECK :
- **`'unitaire'`** : Location payante 1,50€ (non-abonnés)
- **`'abonnement'`** : Gratuit (abonnés OU films possédés)

**IMPORTANT** : Pour les films possédés, le système utilise type `'abonnement'` (même si non abonné), car c'est gratuit.

### Différences clés

| Critère | Sans abonnement | Avec abonnement 5€/mois |
|---------|----------------|-------------------------|
| Prix par échange | 1,50€ | Gratuit |
| Nombre d'échanges | Illimité (mais payant) | Illimité et gratuit |
| Films simultanés | **1 seul en lecture** | **1 seul en lecture** |
| Propriété | Permanente | Permanente |

## Système de propriété unique (NOUVEAU - Nov 2025)

### Migration du système legacy

**Ancien modèle (avant 16 nov 2025)** :
- Copies virtuelles : 1 film = N copies dans `movies.copies_disponibles`
- Triggers automatiques : Décrément/incrément lors emprunts
- Proposition/acceptation : Échanges nécessitaient accord

**Nouveau modèle (après 16 nov 2025)** :
- **Propriété unique** : 1 film physique = 1 propriétaire dans `films_registry`
- **RPC atomiques** : Transferts via `SECURITY DEFINER` functions
- **Échanges instantanés** : SANS accord, transfert automatique bilatéral
- **Colonne supprimée** : `copies_disponibles` n'existe plus dans `movies`

### Table `films_registry` - Registre de propriété

Chaque film numérisé existe en **1 seule copie physique** et appartient à **1 seul utilisateur** :

```sql
films_registry:
  - id (UUID) - Identifiant unique de la copie physique
  - movie_id (UUID) - Référence vers movies.id
  - current_owner_id (UUID) - Propriétaire actuel
  - previous_owner_id (UUID) - Ancien propriétaire (historique)
  - acquisition_method (TEXT) - 'deposit' | 'exchange' | 'sponsorship'
  - physical_support_type (TEXT) - 'Blu-ray' | 'DVD'
  - acquisition_date (TIMESTAMP)
  - deposit_date (TIMESTAMP) - Date de dépôt physique
```

### Règles de disponibilité à l'échange

⚠️ **CRITIQUE** : Un film est disponible à l'échange SI ET SEULEMENT SI le propriétaire n'a PAS de session de lecture active (48h)

```
Film disponible ⇔ AUCUNE session active (emprunts.statut = 'en_cours')
```

**Exemple concret** :
```
User A possède : [Inception*, Interstellar, Dunkerque, Matrix, Avatar]
                  (* = session active, en train de regarder)

Films DISPONIBLES à l'échange : 4 films (tous sauf Inception)
Films NON DISPONIBLES : 1 film (Inception, en cours de lecture)
```

### Gestion des sessions de lecture

**Table `emprunts` (sessions de 48h)** :
- **But** : Tracker quel film est "occupé" (en cours de lecture)
- **Durée** : 48h maximum par session
- **Limitation** : 1 seule session active par utilisateur
- **Type** : `'abonnement'` pour films possédés (gratuit)

**Statuts** :
- `en_cours` : Film en cours de lecture (NON disponible à l'échange)
- `rendu` : Session terminée (film redevient disponible)
- `expiré` : Session expirée après 48h

## Abonnements à vie (Admin)

### Convention date 2099-12-31

Les admins peuvent attribuer des abonnements à vie via l'interface admin :
- **Convention** : `date_expiration = '2099-12-31T23:59:59.999Z'`
- **Route API** : `/api/admin/users/[id]/grant-lifetime-subscription`
- **Badge** : Violet "À vie" affiché dans l'admin
- **Stripe** : Annulation automatique de l'abonnement Stripe existant si présent

### Workflow admin

1. Admin va sur `/admin/users`
2. Clique menu (⋮) sur un utilisateur
3. Sélectionne "Attribuer abonnement à vie"
4. Confirmation avec warning si abonnement Stripe actif
5. Système :
   - Annule abonnement Stripe via API (si existant)
   - Crée/MAJ `user_abonnements` avec `date_expiration = 2099-12-31`
   - `statut = 'actif'`, `stripe_subscription_id = null`
6. Badge violet "À vie" s'affiche immédiatement

### Détection

Un abonnement est considéré "à vie" si :
```javascript
new Date(date_expiration) > new Date('2099-01-01')
```

Fonctions concernées :
- `lib/types/subscription-status.ts` : `getSubscriptionStatusMessage()`
- `components/admin/users-table.tsx` : `getSubscriptionBadge()`

## Système de parrainage (Sponsorship)

### Principe

Chaque nouvel utilisateur reçoit automatiquement **1 film** d'un parrain existant lors de son inscription.

### Tables

**`sponsorships`** :
```sql
- id (UUID)
- sponsor_id (UUID) - Parrain
- sponsored_user_id (UUID) - Filleul
- film_given_id (UUID) - Film transféré (films_registry.id)
- created_at (TIMESTAMP)
```

**`sponsor_badges`** :
```sql
- id (UUID)
- user_id (UUID)
- badge_type (TEXT) - 'bronze' | 'silver' | 'gold'
- sponsorships_count (INT) - Nombre de parrainages
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Badges

Attribués automatiquement selon le nombre de parrainages :
- **Bronze** : 1-5 parrainages
- **Argent** : 6-15 parrainages
- **Or** : 16+ parrainages

### Critères de sélection du parrain

L'algorithme `assign_welcome_film()` sélectionne un parrain selon :
1. Utilisateur avec **au moins 2 films** (garde 1 minimum après don)
2. Priorité aux utilisateurs avec le **moins de parrainages** (équité)
3. Sélection aléatoire en cas d'égalité
4. Film le plus ancien du parrain (acquisition_date ASC)

### RPC Sponsorship

- `assign_welcome_film(p_new_user_id)` - Attribution automatique
- `get_my_sponsor(p_user_id)` - Voir son parrain
- `get_my_sponsored_users(p_user_id)` - Voir ses filleuls
- `get_user_highest_badge(p_user_id)` - Badge le plus élevé
- `update_sponsor_badge(p_user_id)` - Recalcul automatique

## Système de dépôts de films physiques

### Workflow complet

**1. Utilisateur - Création du dépôt**
- Route : `/deposer`
- Formulaire : titre, support (Blu-ray/DVD), TMDB ID optionnel, notes
- Génération tracking number : `WC-YYYYMMDD-XXXXX` (ex: WC-20251116-00042)
- Statut : `sent`
- User envoie le film physique par courrier

**2. Admin - Réception**
- RPC : `admin_mark_deposit_received(deposit_id, admin_id)`
- Statut : `received`
- Champ `admin_received_at` renseigné

**3. Admin - Numérisation** (optionnel)
- Statut manuel : `digitizing`
- Process externe de numérisation

**4. Admin - Finalisation**
- RPC : `admin_complete_deposit(deposit_id, admin_id, movie_id)`
- Actions :
  - Création entrée dans `films_registry`
  - `current_owner_id` = user qui a envoyé
  - `acquisition_method` = `'deposit'`
  - `physical_support_type` = support indiqué
- Statut : `completed`
- Film visible dans "Mes Films" de l'utilisateur

**5. Admin - Rejet** (si problème)
- RPC : `admin_reject_deposit(deposit_id, admin_id, reason)`
- Raisons : état défectueux, contenu non conforme, duplication
- Statut : `rejected`

### API Routes admin

- `/api/admin/deposits` - Liste tous les dépôts
- `/api/admin/deposits/[id]/receive` - Marquer comme reçu
- `/api/admin/deposits/[id]/complete` - Finaliser (ajoute au registre)
- `/api/admin/deposits/[id]/reject` - Rejeter avec raison

### Realtime

Channel `deposits` : Broadcast changements de statut en temps réel
- User voit progression de son dépôt
- Admin voit nouveaux dépôts instantanément

## Échanges instantanés (SANS accord)

### Principe fondamental

⚠️ **NOUVEAU SYSTÈME** : Les échanges sont **INSTANTANÉS et AUTOMATIQUES**
- PAS de proposition/acceptation/refus
- PAS d'accord du propriétaire nécessaire
- Transfert bilatéral IMMÉDIAT via transaction PostgreSQL atomique

### RPC `rent_or_access_movie` - Point d'entrée UNIQUE

Cette RPC gère TOUT (lecture de films possédés ET échanges automatiques) :

```sql
rent_or_access_movie(p_auth_user_id UUID, p_movie_id UUID, p_payment_id UUID)
```

### Workflow complet

**ÉTAPE 1** : Vérifier si user possède le film
```
SELECT current_owner_id FROM films_registry WHERE movie_id = p_movie_id
→ Si current_owner_id = p_auth_user_id : Film possédé, aller ÉTAPE 7
→ Sinon : Continuer
```

**ÉTAPE 2** : Vérifier disponibilité film demandé
```
Vérifier : Propriétaire n'a PAS de session active (emprunts.statut = 'en_cours')
→ Non disponible : Erreur FILM_NOT_AVAILABLE
→ Disponible : Continuer
```

**ÉTAPE 3** : Sélectionner automatiquement film de l'user à offrir
```
Critères :
- Film possédé par l'user (films_registry.current_owner_id = p_auth_user_id)
- Pas en cours de lecture (aucune session active)
- Le plus ancien (acquisition_date ASC)

→ Aucun film disponible : Erreur NO_FILM_TO_EXCHANGE
→ Film trouvé : Continuer
```

**ÉTAPE 4** : Vérifier abonnement OU paiement
```
→ User abonné (statut='actif' OU 'résilié' valide) : Gratuit
→ Paiement fourni + succeeded : 1,50€
→ Ni abonné ni paiement : Retour {requires_payment: true}
```

**ÉTAPE 5** : Libérer ancienne session (si rotation abonné)
```
Si user a déjà une session active sur un autre film :
  UPDATE emprunts SET statut='rendu' WHERE user_id = p_auth_user_id AND statut='en_cours'
```

**ÉTAPE 6** : ÉCHANGE INSTANTANÉ (transaction atomique)
```sql
BEGIN;
  -- Transfert bilatéral
  UPDATE films_registry SET current_owner_id = p_auth_user_id WHERE id = requested_film_id;
  UPDATE films_registry SET current_owner_id = old_owner WHERE id = offered_film_id;

  -- Historique
  INSERT INTO ownership_history (registry_id, from_user_id, to_user_id, transfer_type, exchange_id);
  INSERT INTO ownership_history (registry_id, from_user_id, to_user_id, transfer_type, exchange_id);

  -- Enregistrement échange
  INSERT INTO film_exchanges (requester_id, requested_film_id, offered_film_id, status='completed');
COMMIT;
```

**ÉTAPE 7** : Créer session de lecture sur film POSSÉDÉ
```sql
INSERT INTO emprunts (
  user_id, movie_id, statut='en_cours',
  type_emprunt='abonnement', -- Gratuit car film possédé
  montant_paye=0,
  date_retour=NOW()+48h
)
```

### Retour JSON

```json
{
  "success": true,
  "emprunt_id": "uuid",
  "rental_type": "subscription",
  "amount_charged": 0,  // Ou 1.5 si paiement
  "expires_at": "2025-11-18T15:30:00Z",
  "previous_rental_released": true/false,
  "exchange_performed": true/false,
  "exchange_id": "uuid",  // Si échange effectué
  "owns_film": true
}
```

### Erreurs possibles

- `FILM_NOT_IN_REGISTRY` : Film pas encore déposé dans le système
- `NOT_OWNER` : User ne possède pas le film (renvoie vers échange)
- `FILM_NOT_AVAILABLE` : Propriétaire a une session active
- `NO_FILM_TO_EXCHANGE` : User n'a aucun film disponible à offrir
- `PAYMENT_REQUIRED` : Non-abonné sans paiement
- `PAYMENT_NOT_SUCCEEDED` : Paiement non confirmé
- `INTERNAL_ERROR` : Erreur SQL inattendue

## Architecture système (Simplifiée)

### RPC Functions (PostgreSQL)

Toutes les opérations critiques passent par des fonctions `SECURITY DEFINER` pour garantir l'atomicité :

**Sessions de lecture :**
- `rent_or_access_movie(p_auth_user_id, p_movie_id, p_payment_id)` - Point d'entrée UNIQUE

**Dépôts :**
- `create_film_deposit(p_user_id, p_film_title, p_support_type, p_tmdb_id, p_notes)`
- `admin_mark_deposit_received(p_deposit_id, p_admin_id)`
- `admin_complete_deposit(p_deposit_id, p_admin_id, p_movie_id)`
- `admin_reject_deposit(p_deposit_id, p_admin_id, p_rejection_reason)`

**Parrainage :**
- `assign_welcome_film(p_new_user_id)`
- `get_my_sponsor(p_user_id)`
- `get_my_sponsored_users(p_user_id)`
- `get_user_highest_badge(p_user_id)`
- `update_sponsor_badge(p_user_id)`

**Obsolètes (ne plus utiliser) :**
- ~~`propose_film_exchange`~~ - Remplacé par échanges instantanés
- ~~`refuse_film_exchange`~~ - Système de proposition supprimé

### Flux lecture d'un film possédé

```
User clique "Play" sur un film qu'il possède
  ↓
Vérifie : films_registry.current_owner_id = user.id ✅
  ↓
Vérifie : Aucune autre session active ✅
  ↓
RPC rent_or_access_movie(movie_id, user_id, null)
  ↓
Crée emprunts (statut='en_cours', type='abonnement', montant=0, date_retour=NOW()+48h)
  ↓
Film devient NON disponible à l'échange (session active)
  ↓
Redirect /movie-player/[id]
  ↓
Après 48h ou fin manuelle → statut='rendu'
  ↓
Film redevient disponible à l'échange
```

### Flux échange instantané + lecture

```
User B veut regarder film Y (appartient à User A)
  ↓
Vérifie : User B possède au moins 1 film disponible ✅
  ↓
Vérifie : Film Y disponible (A n'a pas session active) ✅
  ↓
Si non-abonné → Paiement Stripe 1,50€ → payment_id
  ↓
RPC rent_or_access_movie(user_b_id, movie_y_id, payment_id)
  ↓
Sélection automatique : Film X de User B (le plus ancien disponible)
  ↓
Transaction atomique :
  1. UPDATE films_registry : Y.owner = B, X.owner = A
  2. INSERT ownership_history (2 transferts)
  3. INSERT film_exchanges (status='completed')
  4. INSERT emprunts (B, Y, 'en_cours', 'abonnement', 0)
  ↓
User B possède maintenant Y et peut le regarder
User A possède maintenant X (découvre en consultant sa collection)
  ↓
AUCUNE notification envoyée (transparent)
```

## Tables Supabase

### Tables principales

| Table | Description | Champs importants |
|-------|-------------|-------------------|
| `movies` | Catalogue films (métadonnées) | `titre_francais`, `slug`, `lien_vimeo`, `tmdb_id`, `synopsis`, `genres` |
| **`films_registry`** | **Registre de propriété** (NOUVEAU) | `id`, `movie_id`, `current_owner_id`, `previous_owner_id`, `acquisition_method`, `physical_support_type` |
| `emprunts` | Sessions de lecture (48h) | `user_id`, `movie_id`, `statut`, `type_emprunt` (unitaire/abonnement), `date_retour` |
| `film_exchanges` | Historique des échanges | `requester_id`, `requested_film_id`, `offered_film_id`, `status`, `completed_at` |
| `ownership_history` | Audit des transferts | `registry_id`, `from_user_id`, `to_user_id`, `transfer_type`, `exchange_id` |
| `film_deposits` | Dépôts physiques | `user_id`, `film_title`, `support_type`, `tracking_number`, `status` |
| `sponsorships` | Parrainages | `sponsor_id`, `sponsored_user_id`, `film_given_id` |
| `sponsor_badges` | Badges parrains | `user_id`, `badge_type` (bronze/silver/gold), `sponsorships_count` |
| `user_abonnements` | Abonnements users | `user_id`, `abonnement_id`, `statut`, `date_expiration`, `stripe_subscription_id` |
| `user_profiles` | Profils utilisateurs | `id`, `username`, `prenom`, `nom`, `is_admin`, `avatar_url` |
| `likes` | Favoris utilisateurs | `user_id`, `movie_id` |

**Notes importantes :**
- Table `user_profiles` utilisée (PAS `profiles`)
- Email récupéré via `auth.admin.getUserById()` (pas dans user_profiles)
- Colonne `copies_disponibles` N'EXISTE PLUS dans `movies` (système legacy supprimé)

### RLS Policies (Row Level Security)

- `emprunts` - Users lisent uniquement leurs sessions, INSERT/UPDATE/DELETE via RPC uniquement
- `films_registry` - Lecture publique (pour voir propriétaires/disponibilité), modifications via RPC uniquement
- `film_exchanges` - Users voient uniquement leurs échanges
- `ownership_history` - Lecture publique pour audit, INSERT via RPC uniquement
- `film_deposits` - Users gèrent uniquement leurs dépôts, admin lit tout
- `user_abonnements` - Users lisent uniquement leur abonnement, modifications via webhook Stripe uniquement
- `sponsorships` - Lecture publique, INSERT via RPC uniquement
- `sponsor_badges` - Lecture publique, modifications via RPC uniquement
- `user_profiles` - Users lisent leur profil + champ is_admin, admin lit tout

### Realtime Channels

- `rentals` - Sessions de lecture (INSERT, UPDATE, DELETE sur `emprunts`)
- `subscriptions` - Abonnements (INSERT, UPDATE sur `user_abonnements`)
- `ownership` - Propriété films (UPDATE sur `films_registry.current_owner_id`)
- `deposits` - Dépôts (INSERT, UPDATE sur `film_deposits`)
- `exchanges` - Échanges (INSERT sur `film_exchanges`)

### Triggers

**AUCUN trigger actif sur le système d'échange/propriété** :
- Tous les transferts sont gérés par RPC `SECURITY DEFINER` atomiques
- Garantie de cohérence via transactions PostgreSQL

## Routes API

### Routes publiques

- `/api/movies` - Liste films du catalogue
- `/api/movies/[id]` - Détails d'un film

### Routes authentifiées

**Abonnements :**
- `/api/subscriptions/create-checkout` - Créer session Stripe checkout
- `/api/subscriptions/cancel` - Annuler abonnement
- `/api/subscriptions/reactivate` - Réactiver abonnement
- `/api/user-subscription` - Status abonnement utilisateur

**Échanges :**
- `/api/exchanges/instant` - Échange instantané (appelle RPC)
- `/api/exchanges/[id]/accept` - Accepter échange (OBSOLÈTE)
- `/api/exchanges/[id]/refuse` - Refuser échange (OBSOLÈTE)
- `/api/exchanges/[id]/cancel` - Annuler échange

**Webhooks :**
- `/api/stripe/webhook` - Webhooks Stripe (checkout, subscriptions, invoices)

### Routes admin

**Utilisateurs :**
- `/api/admin/users` - Liste tous les utilisateurs (GET)
- `/api/admin/users/[id]` - Détails utilisateur (GET, PATCH, DELETE)
- `/api/admin/users/[id]/toggle-admin` - Toggle statut admin (POST)
- `/api/admin/users/[id]/cancel-subscription` - Annuler abonnement (POST)
- `/api/admin/users/[id]/grant-lifetime-subscription` - Attribuer abonnement à vie (POST)

**Dépôts :**
- `/api/admin/deposits` - Liste dépôts (GET)
- `/api/admin/deposits/[id]/receive` - Marquer reçu (POST)
- `/api/admin/deposits/[id]/complete` - Finaliser dépôt (POST)
- `/api/admin/deposits/[id]/reject` - Rejeter dépôt (POST)

## Workflows utilisateur

### Scénario 1 : Déposer un film physique

```
1. User A va sur /deposer
2. Remplit formulaire (titre, support Blu-ray/DVD, notes)
3. Reçoit numéro de suivi WC-YYYYMMDD-XXXXX
4. Envoie le film physique par courrier
5. Admin marque "reçu" (status='received')
6. Admin numérisation (status='digitizing')
7. Admin finalise (status='completed') → Ajout films_registry
8. User A possède maintenant le film, visible dans "Mes Films"
9. Film disponible pour échange immédiatement
```

### Scénario 2 : Échanger un film (non-abonné)

```
1. User B (non-abonné) consulte le catalogue
2. Voit "Interstellar" (User A, badge "Disponible")
3. Clique "Play" → Modal "Vous ne possédez pas ce film"
4. Option "Échanger et regarder (1,50€)"
5. Paiement Stripe 1,50€ → payment_id
6. Appel RPC rent_or_access_movie(user_b, interstellar, payment_id)
7. Échange instantané :
   - Interstellar : A → B
   - Film auto-sélectionné de B → A
8. Session créée pour B sur Interstellar
9. Redirect /movie-player/interstellar
10. User A découvre nouveau film dans "Mes Films" (sans notification)
```

### Scénario 3 : Rotation de film (abonné)

```
1. User C (abonné) regarde "Avatar" (session active)
2. Veut regarder "Matrix" (User D, disponible)
3. Clique "Play" sur Matrix
4. Appel RPC rent_or_access_movie(user_c, matrix, null)
5. RPC détecte :
   - User C abonné ✅
   - Matrix disponible ✅
   - User C a film "Tenet" disponible ✅
6. Libère automatiquement session Avatar → 'rendu'
7. Échange instantané : Matrix (D→C), Tenet (C→D)
8. Crée session Matrix pour User C
9. Redirect /movie-player/matrix
10. Avatar redevient disponible en temps réel (Realtime broadcast)
```

### Scénario 4 : Parrainage (nouvel utilisateur)

```
1. User E s'inscrit sur Warecast
2. Trigger auto : assign_welcome_film(user_e_id)
3. Sélection parrain (User F avec 5 films, 2 parrainages)
4. Transfert film "Dunkerque" : F → E
5. Enregistrement sponsorship (sponsor=F, sponsored=E, film=Dunkerque)
6. Mise à jour badge de F (3 parrainages → Bronze)
7. User E voit "Dunkerque" dans "Mes Films"
8. User E peut échanger ou regarder Dunkerque
```

## Conventions de code importantes

### ❌ À NE PAS FAIRE

1. **Barrel exports** - Ne JAMAIS créer de fichier `hooks/index.ts`
   ```typescript
   // ❌ MAUVAIS - ralentit HMR de 5-10x
   export * from "./ui"
   export * from "./data"
   ```

2. **useSearchParams sans Suspense** - Next.js 15 bloque le build
   ```tsx
   // ❌ MAUVAIS - bloque le build Vercel
   function Page() {
     const searchParams = useSearchParams()
     return <div>...</div>
   }
   ```

3. **Modifier films_registry manuellement** - Toujours via RPC
   ```sql
   -- ❌ MAUVAIS - bypass RLS et historique
   UPDATE films_registry SET current_owner_id = 'xxx' WHERE id = 'yyy'

   -- ✅ BON - appeler la RPC
   SELECT rent_or_access_movie(...)
   ```

### ✅ À FAIRE

1. **Imports directs depuis sous-dossiers**
   ```typescript
   // ✅ BON - charge uniquement ce qui est nécessaire
   import { useOwnedFilms } from "@/hooks/data"
   import { usePlayButton } from "@/hooks/actions"
   ```

2. **useSearchParams avec Suspense**
   ```tsx
   // ✅ BON - conforme Next.js 15
   function Content() {
     const searchParams = useSearchParams()
     return <div>...</div>
   }

   export default function Page() {
     return (
       <Suspense fallback={<Loading />}>
         <Content />
       </Suspense>
     )
   }
   ```

3. **Stores avec cache utilisateur**
   ```typescript
   // ✅ BON - utilise le factory pattern
   const useMyStore = createCachedStore({
     name: "my-store",
     cacheDuration: 10 * 60 * 1000,
     partializeFields: ["data", "lastFetch"],
     fetchData: async (userId) => { /* ... */ }
   })
   ```

## Organisation des hooks

Les hooks sont **organisés par responsabilité** :

### `hooks/ui/` - Logique interface
- `use-active-route.ts` - Détection route active
- `use-infinite-movies.ts` - Pagination infinie catalogue
- `use-infinite-scroll.ts` - Scroll infini générique
- `use-like-button-logic.ts` - Logique bouton like

### `hooks/data/` - Données business
- `use-owned-films.ts` - Films possédés (collection)
- `use-favorite-movies.ts` - Films favoris
- `use-movie-access.ts` - Vérification accès film (player guard)

### `hooks/actions/` - Actions utilisateur
- `use-play-button.ts` - Logique bouton play (login/play/exchange/payment)
- `use-movie-info.ts` - Informations film (modal)

### `hooks/realtime/` - Supabase Realtime
- `use-realtime-movie-availability.ts` - Disponibilité temps réel
- `use-realtime-subscription.ts` - Status abonnement temps réel

### Hooks root
- `use-hydration.ts` - Détection hydratation SSR
- `use-subscription.ts` - Gestion abonnement utilisateur

## Stores Zustand

### Pattern Factory - `create-cached-store.ts`

Tous les stores utilisent une factory pour :
- **Cache automatique** (10min par défaut)
- **Tracking utilisateur** - Clear data si changement d'utilisateur
- **Persistence localStorage** - Partialize des champs
- **Network resilience** - Auto-refresh online/visibility change

### Stores existants
- `subscription-store.ts` - État abonnement (avec Realtime)
- `ownership-store.ts` - Films possédés par l'utilisateur
- `like-store.ts` - Likes/favoris

## Stripe

**Configuration** : `lib/stripe.ts`
- Mode test en développement
- Webhooks configurés pour abonnements et paiements d'échange

**Products** :
- Abonnement mensuel 5€ (échanges illimités)
- Échange unitaire 1,50€ (non-abonnés)

**Événements webhook** :
- `checkout.session.completed` - Création abonnement
- `customer.subscription.updated` - Mise à jour statut
- `customer.subscription.deleted` - Suppression/suspension
- `invoice.payment_succeeded` - Renouvellement mensuel
- `invoice.payment_failed` - Échec paiement → suspension

## Points d'attention

### Performance

1. **HMR lent** = Vérifier les barrel exports
   - Si `import from "@/hooks"` existe → remplacer par import direct
   - Symptôme : Rechargement 5-10s en dev mode

2. **Build lent** = Vérifier taille des bundles
   - `npm run build` doit générer toutes les pages
   - Vérifier First Load JS < 300KB

### Next.js 15

1. **useSearchParams()** → Toujours wrapper dans `<Suspense>`
2. **Server Components par défaut** → Ajouter "use client" si nécessaire
3. **Middleware** → Refresh session Supabase automatique

### Supabase

1. **RLS (Row Level Security)** → ✅ Activé sur toutes les tables critiques
2. **Realtime** → Vérifier les policies pour channels
3. **RPC atomiques** → ✅ Toutes modifications via `SECURITY DEFINER` functions
4. **RPC rent_or_access_movie** → Point d'entrée UNIQUE pour sessions/échanges
5. **Webhook retry** → ✅ Retry logic 5×1s pour race conditions

### Stripe

1. **Webhooks** → Signature validation obligatoire
2. **Test mode** → Carte `4242 4242 4242 4242`
3. **Metadata** → userId stocké dans customer metadata

### Système de propriété

1. **Propriété unique** → 1 film physique = 1 seul propriétaire
2. **Realtime actif** → Disponibilité change en temps réel
3. **Transferts atomiques** → Toujours via RPC (jamais UPDATE direct)
4. **Types emprunt** → Seulement `'unitaire'` et `'abonnement'` (contrainte CHECK)

## Commandes utiles

```bash
# Développement
npm run dev              # Dev avec Turbopack (port 3000)

# Build
npm run build            # Build production
npm start                # Serveur production

# Linting
npm run lint             # ESLint

# Vercel
vercel                   # Deploy preview
vercel --prod            # Deploy production
```

## Workflow de développement recommandé

### Tester avant de commiter (IMPORTANT)

⚠️ **TOUJOURS exécuter `npm run build` avant de commiter et pusher** vers GitHub/Vercel.

#### Pourquoi ?
- Vercel déploie automatiquement chaque push sur `master`
- Un build qui échoue bloque le déploiement en production
- Les erreurs TypeScript ne sont détectées qu'au build (pas en dev mode)
- Économise du temps et évite les commits de "fix"

#### Workflow recommandé

```bash
# 1. Développement local
npm run dev

# 2. Vérifications avant commit
npm run build           # ✅ OBLIGATOIRE - Vérifie TypeScript + génère pages
npm run lint            # ⚠️ Optionnel - Vérifie ESLint

# 3. Si le build passe ✅
git add .
git commit -m "..."
git push

# 4. Si le build échoue ❌
# → Corriger les erreurs TypeScript
# → Re-tester avec npm run build
# → Ne PAS commiter tant que le build échoue
```

#### Erreurs courantes détectées au build
- Types incomplets ou manquants (ex: Movie, UserFilm)
- RPC functions inexistantes dans les types générés
- Imports manquants ou obsolètes
- Problèmes de null/undefined
- Type casts `as any` invalides

#### Vérification rapide
```bash
# Build complet avec logs
npm run build 2>&1 | tee build.log

# Build réussi si :
# ✓ Compiled successfully
# ✓ Generating static pages (N/N)
# ✓ Pas d'erreurs TypeScript (warnings ESLint OK)
```

### En cas d'échec du build

1. **Lire attentivement l'erreur** - TypeScript indique le fichier et la ligne exacte
2. **Vérifier les types Supabase** - Régénérer si nécessaire avec `npx supabase gen types`
3. **Vérifier les RPC functions** - S'assurer qu'elles existent en base de données
4. **Type casting** - Ajouter des casts appropriés pour les enums (BadgeLevel, PhysicalSupportType, etc.)
5. **Tester à nouveau** - `npm run build` jusqu'à succès

## Variables d'environnement

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# TMDB
TMDB_API_KEY=xxx
```

## Notes importantes pour Claude Code

### Spécificités du projet

1. **Propriété unique (NOUVEAU)** :
   - Système basé sur `films_registry` (1 copie physique = 1 propriétaire)
   - Colonne `copies_disponibles` N'EXISTE PLUS dans `movies`
   - Ne JAMAIS vérifier `copies_disponibles` (obsolète)

2. **Échanges instantanés (NOUVEAU)** :
   - SANS proposition/acceptation
   - Transfert bilatéral automatique
   - Géré par RPC `rent_or_access_movie`

3. **Types d'emprunt** :
   - Seulement 2 types autorisés : `'unitaire'` et `'abonnement'`
   - Films possédés utilisent type `'abonnement'` (gratuit)
   - Ne JAMAIS utiliser `'ownership'` (non supporté par contrainte CHECK)

4. **1 seul film à la fois** :
   - Abonnés et non-abonnés : 1 seule session active max
   - Rotation automatique pour abonnés (libère ancienne session)

5. **Table admin** :
   - Utiliser `user_profiles` (PAS `profiles`)
   - Email via `auth.admin.getUserById()` (pas dans table)

6. **Abonnements à vie** :
   - Convention : `date_expiration = '2099-12-31T23:59:59.999Z'`
   - Détection : `new Date(date_expiration) > new Date('2099-01-01')`

7. **Performance optimisée** :
   - Barrel exports retirés (HMR)
   - Ne PAS réintroduire `hooks/index.ts`

8. **Build Vercel** :
   - `useSearchParams()` TOUJOURS dans Suspense

### Patterns à suivre

- **Stores** : Utiliser `createCachedStore` factory
- **Hooks** : Organiser par catégorie (ui/data/actions/realtime)
- **API Routes** : Toujours vérifier auth via `createClient()`
- **Realtime** : Utiliser hooks existants dans `hooks/realtime/`
- **RPC** : Point d'entrée unique `rent_or_access_movie` pour sessions/échanges

### Pièges à éviter

- ❌ Ne pas vérifier `copies_disponibles` (colonne supprimée)
- ❌ Ne pas modifier `films_registry` directement (toujours via RPC)
- ❌ Ne pas utiliser type `'ownership'` (non supporté)
- ❌ Ne pas créer de barrel exports (`hooks/index.ts`)
- ❌ Ne pas permettre 2 films simultanés
- ❌ Ne pas oublier Suspense pour useSearchParams
- ✅ Toujours utiliser RPC pour transferts de propriété
- ✅ Types RPC définis dans `types/rpc.ts`
