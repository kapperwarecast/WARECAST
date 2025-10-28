# Warecast - Plateforme de location de films

## Vue d'ensemble

Warecast est une plateforme web de location de films avec système d'abonnement. Les utilisateurs peuvent :
- Louer des films à l'unité (paiement par film - 1.5€)
- S'abonner pour un accès mensuel (5€/mois, 1 film à la fois)
- Regarder les films en streaming (48h par emprunt)
- Gérer leurs favoris et historique de location

**IMPORTANT** : Tous les films ont un **nombre de copies limité**. Quand toutes les copies sont empruntées, le film devient indisponible pour TOUS les utilisateurs (abonnés inclus) jusqu'à ce qu'une copie soit retournée.

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
│   │   ├── film/[id]/       # Détails d'un film
│   │   ├── movie-player/[id]/ # Lecteur vidéo
│   │   ├── favorites/       # Films favoris
│   │   ├── films-en-cours/  # Films en cours de location
│   │   ├── formules/        # Abonnements (pricing)
│   │   ├── abonnement/      # Gestion abonnement
│   │   ├── profile/         # Profil utilisateur
│   │   ├── auth/            # Login, signup, forgot-password
│   │   └── admin/           # Admin (import films, posters)
│   └── api/                 # API Routes
│       ├── movies/          # CRUD films
│       ├── subscriptions/   # Stripe checkout, annulation
│       ├── rentals/         # GET liste emprunts utilisateur
│       ├── movie-rental-status/[id]/ # Vérification statut location (polling post-paiement)
│       ├── user-subscription/ # Status abonnement
│       └── stripe/webhook/  # Webhooks Stripe (paiements, abonnements)
│
├── components/              # Composants React réutilisables
│   ├── ui/                  # shadcn/ui + composants custom
│   ├── debug/               # Composants de debug (dev only)
│   └── movie-player/        # Composants du lecteur vidéo
│
├── hooks/                   # Custom React Hooks (organisés par catégorie)
│   ├── ui/                  # Logique UI (navigation, infinite scroll, like button)
│   ├── data/                # Données business (rentals, favorites, movies)
│   ├── actions/             # Actions utilisateur (play, rent, movie info)
│   └── realtime/            # Supabase Realtime subscriptions
│
├── stores/                  # Zustand stores
│   ├── create-cached-store.ts # Factory pattern pour stores avec cache
│   ├── rental-store.ts      # État des locations
│   ├── subscription-store.ts # État abonnement
│   └── like-store.ts        # Likes/favoris
│
├── lib/                     # Bibliothèques et services
│   ├── supabase/            # Client Supabase + types
│   ├── stripe.ts            # Configuration Stripe
│   ├── tmdb/                # API TMDB
│   ├── server/              # Fonctions server-side
│   └── utils/               # Utilitaires (cn, formatters)
│
├── types/                   # Types TypeScript centralisés
│   ├── index.ts             # Types principaux (Movie, User, etc.)
│   ├── subscription.ts      # Types abonnement
│   ├── rental.ts            # Types location
│   ├── playback.ts          # Types lecture vidéo
│   └── realtime.ts          # Types Realtime
│
├── contexts/                # React Context providers
│   ├── auth-context.tsx     # Authentification Supabase
│   └── filters-context.tsx  # Filtres catalogue
│
├── constants/               # Constantes de l'application
│   ├── routes.ts            # Routes de l'app
│   └── navigation.ts        # Configuration navigation
│
├── docs/                    # Documentation technique
│   └── STRIPE_SUBSCRIPTION_SETUP.md
│
└── public/                  # Assets statiques
```

## Modèle économique

### Location à l'unité
- **Prix : 1.5€** par film
- **Durée : 48h** après l'emprunt
- Paiement Stripe unique
- ⚠️ **Soumis aux copies disponibles** - Si toutes les copies sont louées, le film est indisponible

### Abonnement mensuel
- **Prix : 5€/mois**
- **⚠️ 1 SEUL film à la fois** (limitation importante)
- **Emprunts illimités** dans le mois (peut changer de film autant de fois qu'il veut)
- **Durée : 48h par film** (libération automatique si pas de nouveau film emprunté)
- **⚠️ AUSSI soumis aux copies disponibles** (même restriction que location)
- Renouvellement automatique
- Annulation possible (fin de période)

### Différences clés

| Critère | Location 1.5€ | Abonnement 5€/mois |
|---------|---------------|-------------------|
| Prix | 1.5€ par film | 5€ illimité |
| Films simultanés | Illimité (plusieurs films en même temps) | **1 seul à la fois** |
| Changement | Non (48h fixe) | Oui (rotation automatique) |
| Durée par film | 48h | 48h (libération auto) |
| Copies limitées | ✅ Oui | ✅ Oui |

## Système de copies limitées (CRITIQUE)

### Fonctionnement

Chaque film dans la base de données a **deux champs** :
- `nombre_copies` (INTEGER) - Nombre total de copies du film
- `copies_disponibles` (INTEGER) - Nombre de copies actuellement disponibles

### Règles d'emprunt

⚠️ **TOUT LE MONDE est soumis aux copies limitées** (abonnés ET non-abonnés)

```
SI copies_disponibles > 0
  ALORS emprunt possible
SINON
  ERREUR "Aucune copie disponible pour ce film"
```

### Gestion automatique par triggers PostgreSQL

⚠️ **CRITIQUE** : Il existe **exactement 2 triggers** sur la table `emprunts`. Ne JAMAIS créer de duplicats.

**Trigger `on_rental_created`** (AFTER INSERT)
- Appelle la fonction `handle_rental_created()`
- Décrémente automatiquement `copies_disponibles` quand un emprunt est créé
- Action : `UPDATE movies SET copies_disponibles = copies_disponibles - 1`

**Trigger `on_rental_return`** (AFTER UPDATE)
- Appelle la fonction `handle_rental_return()`
- Incrémente automatiquement `copies_disponibles` quand statut → 'rendu' ou 'expiré'
- Action : `UPDATE movies SET copies_disponibles = copies_disponibles + 1`

### Synchronisation temps réel

Via Supabase Realtime :
- Channel `rentals` écoute INSERT/UPDATE/DELETE sur `emprunts`
- Channel `movie-availability` broadcast les changements de `copies_disponibles`
- Tous les utilisateurs voient la disponibilité en temps réel

**Exemple concret** :
1. Film "Inception" : 3 copies totales, 1 disponible
2. User A (abonné) emprunte → `copies_disponibles = 0`
3. **Tous les autres users voient immédiatement "Indisponible"**
4. User A retourne après 24h → `copies_disponibles = 1`
5. **Film redevient disponible pour tous en temps réel**

## Workflow utilisateur abonné (Spécificité)

Les **abonnés** ont un comportement particulier :

### Scénario 1 : Premier emprunt
```
1. Abonné se connecte
2. Clique "Play" sur Film A
3. Système vérifie copies_disponibles > 0
4. Si OK : Création emprunt (type='abonnement', montant_paye=0)
5. Trigger décrémente copies_disponibles
6. Accès au player pendant 48h
```

### Scénario 2 : Rotation de film (avant 48h)
```
1. Abonné a Film A en cours (emprunté il y a 24h)
2. Veut regarder Film B
3. Clique "Play" sur Film B
4. RPC rent_or_access_movie exécute atomiquement :
   - Vérifie abonnement actif ✅
   - Vérifie copies Film B disponibles ✅
   - Libère ancien emprunt Film A → statut 'rendu'
   - Trigger incrémente copies_disponibles pour Film A
   - Crée nouvel emprunt Film B
   - Trigger décrémente copies_disponibles pour Film B
5. Si Film B indisponible :
   - Erreur "Aucune copie disponible"
   - Film A reste emprunté (aucun changement)
```

### Scénario 3 : Expiration 48h
```
1. Abonné a Film A en cours
2. 48h passent sans nouveau film emprunté
3. Système marque automatiquement Film A comme 'expiré'
4. Trigger incrémente copies_disponibles pour Film A
5. Abonné peut emprunter un nouveau film
```

## Architecture de location (Simplifiée)

### Principe fondamental
Toute location (abonné ou payante) passe par **1 seul point d'entrée** : la fonction RPC PostgreSQL `rent_or_access_movie`.

Cette approche garantit :
- ✅ Opération atomique (transaction PostgreSQL)
- ✅ Validation centralisée (abonnement, copies, paiement)
- ✅ Gestion automatique de la rotation (abonnés)
- ✅ Pas de race conditions

### Flux location abonné
```
User clique "Play"
  ↓
MovieAccessGuard (client component)
  ↓
supabase.rpc('rent_or_access_movie', {
  p_movie_id: movieId,
  p_auth_user_id: user.id,
  p_payment_id: null
})
  ↓
RPC vérifie + crée/libère emprunts (atomique)
  ↓
Triggers gèrent copies_disponibles automatiquement
  ↓
MoviePlayerClient fetch rental_id
  ↓
Player affiche le film
```

### Flux location payante (1.5€)
```
User clique "Louer"
  ↓
Stripe Checkout (paiement 1.5€)
  ↓
Webhook reçoit payment_intent.succeeded
  ↓
Webhook appelle supabase.rpc('rent_or_access_movie', {
  p_movie_id: movieId,
  p_auth_user_id: userId,
  p_payment_id: paymentId
})
  ↓
RPC crée l'emprunt (atomique)
  ↓
Frontend polling sur /api/movie-rental-status/[id]
  ↓
Détecte emprunt créé (< 3 secondes)
  ↓
Redirection automatique vers /movie-player/[id]
```

### Fonction RPC `rent_or_access_movie`

**Caractéristiques :**
- Type : `SECURITY DEFINER` (bypass RLS pour opérations critiques)
- Transaction PostgreSQL atomique
- Gère abonnés ET locations payantes en 1 seul code path

**Paramètres :**
```sql
rent_or_access_movie(
  p_movie_id uuid,
  p_auth_user_id uuid,
  p_payment_id uuid DEFAULT NULL
)
```

**Retour :**
```json
{
  "success": true,
  "emprunt_id": "uuid",
  "existing_rental": false,
  "previous_rental_released": true,
  "previous_rental_id": "uuid",
  "rental_type": "subscription" | "paid",
  "amount_charged": 0 | 1.50,
  "movie_title": "Titre du film",
  "expires_at": "2025-10-30T12:00:00Z"
}
```

**Ce que fait la RPC (ordre d'exécution) :**
1. Vérifie que l'utilisateur existe
2. Vérifie si emprunt actif pour ce film → retourne existing_rental: true
3. Vérifie abonnement actif OU paiement valide
4. Libère ancien emprunt si existe (abonnés uniquement)
5. **Vérifie copies_disponibles > 0** (CRITIQUE)
6. INSERT nouvel emprunt → Trigger décrémente copies automatiquement
7. Associe payment_id si fourni

## Conventions de code importantes

### ❌ À NE PAS FAIRE

1. **Barrel exports** - Ne JAMAIS créer de fichier `hooks/index.ts` qui ré-export tous les hooks
   ```typescript
   // ❌ MAUVAIS - cause des problèmes de performance HMR
   export * from "./ui"
   export * from "./data"
   ```
   **Problème** : Force le chargement de 15+ hooks à chaque import, ralentit HMR de 5-10x

2. **useSearchParams sans Suspense** - Next.js 15 bloque le build
   ```tsx
   // ❌ MAUVAIS - bloque le build Vercel
   function Page() {
     const searchParams = useSearchParams()
     return <div>...</div>
   }
   ```

### ✅ À FAIRE

1. **Imports directs depuis sous-dossiers**
   ```typescript
   // ✅ BON - charge uniquement ce qui est nécessaire
   import { useInfiniteMovies } from "@/hooks/ui"
   import { useCurrentRentals } from "@/hooks/data"
   import { usePlayButton } from "@/hooks/actions"
   import { useRealtimeSubscription } from "@/hooks/realtime"
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

3. **Event listeners HMR-safe**
   ```typescript
   // ✅ BON - évite les duplications en dev mode
   if (typeof window !== "undefined") {
     const listenerKey = `__listener_${name}`
     if (!(window as any)[listenerKey]) {
       window.addEventListener("event", handler)
       ;(window as any)[listenerKey] = true
     }
   }
   ```

4. **Stores avec cache utilisateur**
   ```typescript
   // ✅ BON - utilise le factory pattern
   const useMyStore = createCachedStore({
     name: "my-store",
     cacheDuration: 10 * 60 * 1000, // 10min
     partializeFields: ["data", "lastFetch"],
     fetchData: async (userId) => { /* ... */ }
   })
   ```

5. **Hydratation SSR/Client - Éviter les mismatches**
   ```tsx
   // ✅ BON - Évite mismatch serveur/client pour attributs dynamiques
   const { isHydrated } = useHydration()

   <button aria-label={isHydrated ? dynamicLabel : "Static label"}>
   ```
   **Problème résolu** : Attributs comme `aria-label` qui changent selon l'état client (likes, etc.) causent des mismatches d'hydratation si rendus dynamiquement au SSR.

## Organisation des hooks

Les hooks sont **organisés par responsabilité**, pas par ordre alphabétique :

### `hooks/ui/` - Logique interface utilisateur
- `use-active-route.ts` - Détection de la route active
- `use-infinite-movies.ts` - Pagination infinie du catalogue
- `use-infinite-scroll.ts` - Scroll infini générique
- `use-like-button-logic.ts` - Logique du bouton like
- `use-user-display.ts` - Affichage info utilisateur

### `hooks/data/` - Données business
- `use-batch-rental-status.ts` - Status de location multiple
- `use-current-rentals.ts` - Locations en cours
- `use-favorite-movies.ts` - Films favoris
- `use-movie-access.ts` - Vérification accès film (player guard)
- `use-movie-rental.ts` - Location d'un film

### `hooks/actions/` - Actions utilisateur
- `use-play-button.ts` - Logique bouton play (login/play/payment)
- `use-movie-info.ts` - Informations film (modal)

### `hooks/realtime/` - Supabase Realtime
- `use-realtime-movie-availability.ts` - Disponibilité temps réel (copies)
- `use-realtime-user-rental.ts` - Locations temps réel
- `use-realtime-subscription.ts` - Status abonnement temps réel

### Hooks root (non catégorisés)
- `use-hydration.ts` - Détection hydratation SSR
- `use-subscription.ts` - Gestion abonnement utilisateur
- `use-modal-security.ts` - Sécurité modales
- `use-isomorphic-layout-effect.ts` - useLayoutEffect SSR-safe

## Stores Zustand

### Pattern Factory - `create-cached-store.ts`

Tous les stores utilisent une factory pour :
- **Cache automatique** (10min par défaut)
- **Tracking utilisateur** - Clear data si changement d'utilisateur
- **Persistence localStorage** - Partialize des champs
- **Network resilience** - Auto-refresh online/visibility change

```typescript
interface BaseCachedStore<T> {
  data: T
  loading: boolean
  initializing: boolean
  lastFetch: number
  currentUserId: string | null

  clearUserData: () => void
  checkUserChanged: (userId: string | null) => boolean
  fetchData: (userId?: string | null) => Promise<void>
  isLoading: () => boolean
  needsRefresh: () => boolean
}
```

### Stores existants
- `rental-store.ts` - État des locations
- `subscription-store.ts` - État abonnement (avec Realtime)
- `like-store.ts` - Likes/favoris
- `rental-status-store.ts` - Status batch de locations

## Services externes

### Supabase

**Configuration** : `lib/supabase/`
- `client.ts` - Client browser
- `server.ts` - Client server-side
- `middleware.ts` - Client middleware

**Tables principales** :

| Table | Description | Champs importants |
|-------|-------------|-------------------|
| `movies` | Catalogue films | `nombre_copies`, `copies_disponibles`, `titre_francais`, `lien_vimeo` |
| `emprunts` | Locations/emprunts | `user_id`, `movie_id`, `statut`, `type_emprunt`, `montant_paye`, `date_retour` |
| `user_abonnements` | Abonnements users | `user_id`, `abonnement_id`, `statut`, `date_expiration` |
| `abonnements` | Types abonnements | `nom`, `prix`, `duree_mois`, `emprunts_illimites`, `stripe_price_id` |
| `likes` | Favoris utilisateurs | `user_id`, `movie_id` |

**Triggers** (⚠️ Exactement 2, ne pas dupliquer) :
- `on_rental_created` → Appelle `handle_rental_created()` → Décrémente `copies_disponibles`
- `on_rental_return` → Appelle `handle_rental_return()` → Incrémente `copies_disponibles`

**RPC Functions** :
- `rent_or_access_movie(p_movie_id, p_auth_user_id, p_payment_id)` - Point d'entrée unique pour toutes les locations (SECURITY DEFINER)

**RLS Policies** (Row Level Security) :
- `emprunts` - Users lisent uniquement leurs emprunts, INSERT/UPDATE/DELETE via RPC uniquement
- `user_abonnements` - Users lisent uniquement leur abonnement, modifications via webhook Stripe uniquement
- `payments` - Users lisent/créent uniquement leurs paiements, UPDATE via webhook uniquement
- `likes` - Users gèrent uniquement leurs likes, lecture publique pour comptage

**Realtime Channels** :
- `rentals` - Locations (INSERT, UPDATE, DELETE sur emprunts)
- `subscriptions` - Abonnements (INSERT, UPDATE sur user_abonnements)
- `movie-availability` - Disponibilité films (UPDATE sur movies.copies_disponibles)

**Edge Functions** :
- `stripe-webhook` - Gestion événements Stripe (checkout, subscriptions, invoices)

### Stripe

**Configuration** : `lib/stripe.ts`
- Mode test en développement
- Webhooks configurés pour abonnements
- Product : Abonnement mensuel 5€

**Routes API** :
- `/api/subscriptions/create-checkout` - Créer session checkout Stripe
- `/api/subscriptions/cancel` - Annuler abonnement
- `/api/subscriptions/reactivate` - Réactiver abonnement

**Événements webhook** :
- `checkout.session.completed` - Création abonnement dans DB
- `customer.subscription.updated` - Mise à jour statut
- `customer.subscription.deleted` - Suppression/suspension
- `invoice.payment_succeeded` - Renouvellement mensuel
- `invoice.payment_failed` - Échec paiement → suspension

### TMDB

**Configuration** : `lib/tmdb/`
- API pour métadonnées films (titre, synopsis, genres, année)
- Images (posters, backdrops)
- Casting et équipe (acteurs, réalisateurs)

## Points d'attention

### Performance

1. **HMR lent** = Vérifier les barrel exports
   - Si `import from "@/hooks"` existe → remplacer par import direct
   - Symptôme : Rechargement 5-10s en dev mode

2. **Build lent** = Vérifier taille des bundles
   - `npm run build` doit générer 34 pages
   - Vérifier First Load JS < 300KB

### Next.js 15

1. **useSearchParams()** → Toujours wrapper dans `<Suspense>`
2. **Server Components par défaut** → Ajouter "use client" si nécessaire
3. **Middleware** → Refresh session Supabase automatique

### Supabase

1. **RLS (Row Level Security)** → ✅ Activé sur toutes les tables critiques avec policies strictes
2. **Realtime** → Vérifier les policies pour channels
3. **Storage** → Buckets publics pour posters/videos
4. **Triggers** → ✅ Exactement 2 triggers (`on_rental_created`, `on_rental_return`). Ne JAMAIS dupliquer.
5. **RPC rent_or_access_movie** → ✅ Point d'entrée unique pour locations. Ne pas créer d'API routes alternatives.
6. **Webhook retry** → ✅ Retry logic 5×1s pour race conditions paiements

### Stripe

1. **Webhooks** → Signature validation obligatoire
2. **Test mode** → Carte `4242 4242 4242 4242`
3. **Metadata** → userId stocké dans customer metadata

### Système de copies

1. **Vérifier TOUJOURS** `copies_disponibles` avant emprunt
2. **Realtime actif** → Disponibilité change en temps réel
3. **Abonnés aussi bloqués** → Pas d'exception pour les abonnés
4. **Triggers automatiques** → Ne pas décrémenter manuellement

## Commandes utiles

```bash
# Développement
npm run dev              # Dev avec Turbopack (port 3000)

# Build
npm run build            # Build production (vérifier 34 pages)
npm start                # Serveur production

# Linting
npm run lint             # ESLint

# Vercel
vercel                   # Deploy preview
vercel --prod            # Deploy production
```

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

## Workflow utilisateur complet

### 1. Navigation catalogue
- Filtrable par genre, année, recherche
- Affichage en grille avec posters
- Infinite scroll

### 2. Sélection film
- Page détails avec synopsis, casting, trailer
- Affichage du statut :
  - ✅ "X copies disponibles" si copies > 0
  - ❌ "Aucune copie disponible" si copies = 0
- Bouton "Play" adaptatif

### 3. Clic sur "Play" - Logique complète

**Cas 1 : User non connecté**
```
→ Redirection /auth/login
```

**Cas 2 : User abonné**
```
→ Vérifier copies_disponibles
  Si copies > 0 :
    → Libérer ancien emprunt (si existe)
    → Créer nouvel emprunt (type='abonnement')
    → Redirect /movie-player/[id]
  Si copies = 0 :
    → Modal "Aucune copie disponible"
    → Rester sur page film
```

**Cas 3 : User non abonné avec location en cours**
```
→ Redirect /movie-player/[id] (accès direct)
```

**Cas 4 : User non abonné sans location**
```
→ Modal choix :
  - Option 1 : Louer 1.5€ (vérifier copies avant paiement)
  - Option 2 : S'abonner 5€/mois
```

### 4. Paiement
- Stripe Checkout (hosted page)
- Redirection success/cancel
- Création emprunt après paiement (si copies disponibles)

### 5. Lecture
- Player vidéo sécurisé
- Vérification accès (MovieAccessGuard)
- Durée 48h

### 6. Favoris
- Système de likes
- Synchronisé temps réel
- Page favoris dédiée

## Synchronisation multi-utilisateurs (Realtime)

### Cas d'usage 1 : Dernière copie disponible
```
État initial : Film "Matrix" - 1 copie disponible

User A (France) :
  → Voit "1 copie disponible"
  → Clique "Play"

User B (Belgique) :
  → Au même moment, voit "1 copie disponible"
  → Clique "Play"

Résolution :
  → Premier arrivé (User A) obtient la copie
  → Trigger décrémente copies_disponibles = 0
  → Realtime broadcast à tous
  → User B voit immédiatement "Aucune copie disponible"
  → Modal d'erreur pour User B
```

### Cas d'usage 2 : Retour de film
```
User A retourne "Inception" après 30h

→ Statut emprunt → 'rendu'
→ Trigger incrémente copies_disponibles
→ Realtime broadcast changement
→ Tous les users voient "Film disponible" en temps réel
→ Boutons "Play" redeviennent actifs
```

### Cas d'usage 3 : Rotation abonné
```
User A (abonné) a "Avatar" emprunté
User A veut regarder "Interstellar"

→ Clic "Play" sur Interstellar
→ API libère Avatar automatiquement
→ Trigger Avatar : copies_disponibles++
→ Realtime : Avatar redevient disponible pour tous
→ Création emprunt Interstellar
→ Trigger Interstellar : copies_disponibles--
→ Realtime : Mise à jour disponibilité Interstellar
```

## Documentation

- Configuration Stripe détaillée → `/docs/STRIPE_SUBSCRIPTION_SETUP.md`
- Ce fichier claude.md → Documentation générale du projet

## Notes importantes pour Claude Code

### Spécificités du projet

1. **Système de copies POUR TOUS**
   - Ne JAMAIS supposer qu'un abonné a un accès illimité sans vérifier les copies
   - Toujours vérifier `copies_disponibles > 0` avant tout emprunt
   - Les abonnés peuvent être bloqués comme les autres

2. **Abonnés = 1 seul film à la fois**
   - Un abonné ne peut PAS avoir 2 films simultanément
   - La rotation est automatique (ancien libéré, nouveau emprunté)
   - Durée 48h par film, même pour abonnés

3. **Prix précis**
   - Location : 1.5€ (PAS 3€)
   - Abonnement : 5€/mois

4. **Performance optimisée**
   - Ce projet a été spécifiquement optimisé pour éviter les problèmes HMR
   - Les barrel exports ont été retirés pour cette raison
   - Ne PAS réintroduire de `hooks/index.ts`

5. **Realtime critique**
   - La disponibilité des films doit être synchronisée en temps réel
   - Les triggers DB gèrent automatiquement les copies
   - Ne pas manipuler `copies_disponibles` manuellement

6. **Types centralisés**
   - Tous les types sont dans `/types`
   - Ne pas dupliquer les types dans les composants
   - Importer depuis `/types` pour cohérence

7. **Build Vercel**
   - 34 pages doivent être générées avec succès
   - `useSearchParams()` doit TOUJOURS être dans Suspense
   - Vérifier le build localement avant de push

### Patterns à suivre

- Stores : Utiliser `createCachedStore` factory
- Hooks : Organiser par catégorie (ui/data/actions/realtime)
- API Routes : Toujours vérifier auth + copies disponibles
- Components : Client components avec "use client"
- Realtime : Utiliser les hooks existants dans `hooks/realtime/`

### Pièges à éviter

- ❌ Ne pas oublier Suspense pour useSearchParams
- ❌ Ne pas créer de barrel exports (`hooks/index.ts`)
- ❌ Ne pas supposer qu'un abonné a un accès illimité (vérifier copies)
- ❌ Ne pas manipuler `copies_disponibles` manuellement (laisser les triggers)
- ❌ Ne pas dupliquer les triggers sur table `emprunts`
- ❌ Ne pas permettre 2 films simultanés pour un abonné
- ❌ Ne pas oublier la validation côté serveur (toujours dans RPC)
- ✅ Toutes les API routes utilisent la RPC (pas de bypass)
- ✅ Variables d'environnement validées avec Zod (lib/env.ts)
- ✅ Logger conditionnel en production (lib/logger.ts)
- ✅ Types RPC définis (types/rpc.ts)
