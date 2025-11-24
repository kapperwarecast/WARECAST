# État du Fix Multi-Copies - 24 Novembre 2025

## Problème Initial

### Symptômes
- **Bouton Play désactivé** pour TOUS les films ayant plusieurs copies physiques
- **Erreur React** : `Encountered two children with the same key, 41ed78dc-0717-4f49-b3af-e5f6a96e0bc1`
- Erreur dans `movie-grid.tsx:38` et `mes-films/page.tsx:170`

### Cause Racine Identifiée
Le système utilise `registry_id` (identifiant de copie physique unique) mais ce `registry_id` était **perdu** dans le flux de données à `mes-films/page.tsx` ligne 171 :

```typescript
// ❌ AVANT - Perdait le registry_id
<MovieGrid movies={availableFilms.map(f => f.movie)} />
```

Conséquences :
1. React utilisait `movie.id` comme clé → **doublons** pour films multi-copies
2. Les hooks de disponibilité ne pouvaient pas vérifier la **copie spécifique**
3. Le RPC `rent_or_access_movie` ne savait pas **quelle copie** utiliser

## Solution Implémentée

### 1. Création du type `OwnedFilm` ✅
**Fichier** : `types/movie.ts`

```typescript
export interface OwnedFilm {
  registry_id: string          // ⭐ Identifiant copie physique
  movie_id: string             // ID film catalogue
  has_active_session: boolean
  movie: MovieWithDirector
}
```

### 2. Hook de disponibilité par registry_id ✅
**Fichier** : `hooks/data/use-registry-availability.ts` (NOUVEAU)

```typescript
export function useRegistryAvailability(registryId: string | undefined) {
  // Vérifie si UNE copie spécifique est disponible
  // Query : viewing_sessions WHERE registry_id = ... AND statut = 'en_cours'
}
```

### 3. Propagation du registry_id ✅
Modifications apportées pour propager `registry_id` dans toute la chaîne :

| Fichier | Changement | Ligne |
|---------|-----------|-------|
| `mes-films/page.tsx` | `<MovieGrid ownedFilms={availableFilms} />` | 171 |
| `components/movie-grid.tsx` | `key={ownedFilm.registry_id}` | ~45 |
| `components/movie-card.tsx` | `buildMovieUrl()` avec `registryId` param | ~85 |
| `app/film/[slug]/page.tsx` | `searchParams.registryId` | ~248 |
| `components/movie-action-buttons.tsx` | `registryId={search.registryId}` | N/A |
| `components/ui/play-button-improved.tsx` | `useRegistryAvailability(registryId)` | ~55 |
| `hooks/actions/use-play-button.ts` | `p_registry_id: registryId` dans RPC | ~96 |

### 4. Migration RPC ✅
**Fichier** : `supabase/migrations/20251124000529_add_registry_id_param_to_rent_or_access.sql`

```sql
CREATE OR REPLACE FUNCTION rent_or_access_movie(
  p_auth_user_id UUID,
  p_movie_id UUID,
  p_registry_id UUID DEFAULT NULL,  -- ⭐ NOUVEAU paramètre
  p_payment_id UUID DEFAULT NULL
)
```

Logique mise à jour :
- Si `p_registry_id` fourni → utilise directement cette copie
- Sinon → comportement legacy (sélection automatique)

### 5. Types Supabase mis à jour ✅
**Fichier** : `lib/supabase/types.ts`

Modifications :
- ✅ Remplacé table `emprunts` par `viewing_sessions`
- ✅ Ajouté `registry_id` dans `viewing_sessions`
- ✅ Ajouté paramètre `p_registry_id` dans `rent_or_access_movie`
- ✅ Ajouté nouvelles fonctions utilitaires :
  - `is_registry_available(p_registry_id)`
  - `get_user_active_sessions(p_user_id)`
  - `get_movie_availability(p_movie_id)`
  - `expire_overdue_sessions()`
  - `get_user_viewing_stats(p_user_id)`

## État Actuel

### ✅ Ce qui fonctionne
1. **Build réussi** - Aucune erreur TypeScript
2. **Types corrects** - Tous les types Supabase alignés avec la DB
3. **Migration appliquée** - RPC `rent_or_access_movie` accepte `p_registry_id`
4. **Propagation registry_id** - Le `registry_id` est maintenant passé dans toute la chaîne

### ❌ Problème Restant
**Le bouton Play reste désactivé/barré** pour les films multi-copies

## Investigation Nécessaire

### Hypothèses à Tester

#### 1. Hook `useRegistryAvailability` ne retourne pas le bon état
**Vérification** :
```typescript
// Dans play-button-improved.tsx
console.log('registryId:', registryId)
console.log('isAvailableByRegistry:', isAvailableByRegistry)
console.log('loadingAvailability:', loadingAvailabilityRegistry)
```

**Fichier** : `components/ui/play-button-improved.tsx:52-60`

#### 2. Query Supabase incorrecte
**Vérification** : Inspecter la requête dans `use-registry-availability.ts`
```typescript
// Ligne 23-28
const { data: sessionData, error } = await supabase
  .from("viewing_sessions")
  .select("id")
  .eq("registry_id", registryId)
  .eq("statut", "en_cours")
  .gt("return_date", new Date().toISOString())
  .maybeSingle()
```

**Questions** :
- La requête retourne-t-elle des résultats ?
- Y a-t-il des sessions actives qui bloquent ?
- Le `registry_id` passé est-il correct ?

#### 3. Sessions fantômes dans `viewing_sessions`
**Vérification DB** :
```sql
-- Vérifier s'il y a des sessions actives qui bloquent
SELECT
  vs.id,
  vs.registry_id,
  vs.user_id,
  vs.statut,
  vs.return_date,
  m.titre_francais,
  fr.current_owner_id
FROM viewing_sessions vs
JOIN films_registry fr ON fr.id = vs.registry_id
JOIN movies m ON m.id = vs.movie_id
WHERE vs.statut = 'en_cours'
  AND vs.return_date > NOW()
ORDER BY vs.created_at DESC;
```

#### 4. RLS Policy bloque les requêtes
**Vérification** : Policies sur `viewing_sessions`
```sql
-- Lister les policies
SELECT * FROM pg_policies WHERE tablename = 'viewing_sessions';
```

**Policy existante** (d'après migration) :
```sql
-- Users peuvent voir toutes les sessions pour vérifier disponibilité
CREATE POLICY "Users can view all sessions for availability"
  ON viewing_sessions FOR SELECT
  USING (true);
```

#### 5. `registryId` undefined ou null
**Vérification** : Dans `movie-card.tsx`
```typescript
// Ligne 85-95
const buildMovieUrl = (): string => {
  const baseUrl = `/film/${movie.slug}`
  const params = new URLSearchParams()

  if (registryId) {
    console.log('Building URL with registryId:', registryId) // ⭐ AJOUTER
    params.append('registryId', registryId)
  } else {
    console.log('No registryId provided') // ⭐ AJOUTER
  }
  // ...
}
```

#### 6. Condition de disponibilité dans `play-button-improved.tsx`
**Vérification** : Ligne 62-63
```typescript
const isAvailable = registryId ? isAvailableByRegistry : isAvailableByMovie
const loadingAvailability = registryId ? loadingAvailabilityRegistry : loadingAvailabilityMovie
```

**Question** : Est-ce que `isAvailableByRegistry` retourne bien `true` ?

### Actions de Debug Recommandées

#### Étape 1 : Logs Frontend (Console Browser)
Ajouter des `console.log` dans :

1. **`mes-films/page.tsx`** ligne 171 :
```typescript
console.log('availableFilms:', availableFilms)
// Vérifier que registry_id est présent
```

2. **`movie-card.tsx`** ligne 85-95 :
```typescript
console.log('MovieCard props:', { registryId, movie: movie.titre_francais })
```

3. **`play-button-improved.tsx`** ligne 52-65 :
```typescript
console.log('PlayButton:', {
  registryId,
  isAvailableByRegistry,
  isAvailableByMovie,
  loadingAvailabilityRegistry,
  isAvailable,
  disabled
})
```

4. **`use-registry-availability.ts`** ligne 23-40 :
```typescript
console.log('useRegistryAvailability:', {
  registryId,
  sessionData,
  error,
  isAvailable: !sessionData
})
```

#### Étape 2 : Vérification DB Directe
```sql
-- 1. Lister tous les films avec leurs copies
SELECT
  m.titre_francais,
  fr.id as registry_id,
  fr.current_owner_id,
  up.prenom,
  up.nom,
  fr.physical_support_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM viewing_sessions vs
      WHERE vs.registry_id = fr.id
        AND vs.statut = 'en_cours'
        AND vs.return_date > NOW()
    ) THEN 'OCCUPÉ'
    ELSE 'DISPONIBLE'
  END as disponibilite
FROM films_registry fr
JOIN movies m ON m.id = fr.movie_id
JOIN user_profiles up ON up.id = fr.current_owner_id
ORDER BY m.titre_francais, fr.created_at;

-- 2. Vérifier les sessions actives
SELECT
  vs.id,
  m.titre_francais,
  fr.id as registry_id,
  up.prenom || ' ' || up.nom as user_name,
  vs.statut,
  vs.session_start_date,
  vs.return_date,
  (vs.return_date > NOW()) as is_active
FROM viewing_sessions vs
JOIN films_registry fr ON fr.id = vs.registry_id
JOIN movies m ON m.id = vs.movie_id
JOIN user_profiles up ON up.id = vs.user_id
WHERE vs.statut = 'en_cours'
ORDER BY vs.created_at DESC;
```

#### Étape 3 : Test Manuel RPC
Tester le RPC directement depuis Supabase SQL Editor :

```sql
-- Test 1: Vérifier qu'une copie est disponible
SELECT is_registry_available('VOTRE_REGISTRY_ID_ICI');

-- Test 2: Voir toutes les copies d'un film
SELECT * FROM get_movie_availability('VOTRE_MOVIE_ID_ICI');

-- Test 3: Voir les sessions actives d'un user
SELECT * FROM get_user_active_sessions('VOTRE_USER_ID_ICI');
```

## Fichiers Clés Modifiés

### Frontend
```
types/movie.ts                              # OwnedFilm type
hooks/data/use-registry-availability.ts     # NOUVEAU - Hook disponibilité
hooks/actions/use-play-button.ts           # Passe registry_id au RPC
components/movie-grid.tsx                   # Support ownedFilms prop
components/movie-card.tsx                   # Passe registryId via URL
components/ui/play-button-improved.tsx      # Utilise useRegistryAvailability
components/movie-action-buttons.tsx         # Forward registryId
app/mes-films/page.tsx                      # Passe ownedFilms au grid
app/film/[slug]/page.tsx                    # Reçoit registryId des params
```

### Backend
```
supabase/migrations/
  20251124000529_add_registry_id_param_to_rent_or_access.sql  # RPC update
lib/supabase/types.ts                       # Types mis à jour
```

## Prochaines Étapes

1. **Activer les logs de debug** dans les fichiers listés ci-dessus
2. **Tester en développement** :
   ```bash
   cd warecast-app
   npm run dev
   ```
3. **Inspecter la console browser** pour voir les valeurs de `registryId` et `isAvailable`
4. **Vérifier la DB** avec les requêtes SQL fournies
5. **Tester le RPC** directement depuis Supabase
6. **Identifier** où le flux se casse

## Informations Contextuelles

### Structure Multi-Copies
- **1 film** (table `movies`) peut avoir **N copies physiques** (table `films_registry`)
- Chaque copie a un `registry_id` unique
- Une copie est **disponible** si aucune session active n'existe dessus
- Query clé : `viewing_sessions.registry_id = ? AND statut = 'en_cours'`

### Flow Complet
```
Page "Mes Films"
  ↓ ownedFilms (avec registry_id)
MovieGrid
  ↓ key={registry_id}
MovieCard
  ↓ URL: /film/slug?registryId=xxx
Film Detail Page
  ↓ searchParams.registryId
MovieActionButtons
  ↓ registryId prop
PlayButton
  ↓ useRegistryAvailability(registryId)
  ↓ Query: viewing_sessions WHERE registry_id=xxx
  ↓ isAvailable = !sessionData
  ↓ disabled = !isAvailable
RPC rent_or_access_movie(p_registry_id: xxx)
```

### Exemple de Film Multi-Copies
```
Film: "Matrix" (movie_id: abc-123)
  ├─ Copie 1 (registry_id: xxx-111) → User A [Session active] ❌ INDISPONIBLE
  └─ Copie 2 (registry_id: xxx-222) → User B [Pas de session] ✅ DISPONIBLE
```

## Notes Importantes

- ✅ **Build passe** - Aucune erreur TypeScript
- ✅ **Migration appliquée** - `p_registry_id` existe dans le RPC
- ✅ **Types corrects** - `viewing_sessions` table présente
- ❌ **Bug fonctionnel** - Bouton Play reste désactivé

Le problème est maintenant **fonctionnel**, pas de compilation. Il faut débugger le **runtime** pour trouver pourquoi `isAvailable` retourne `false`.

---

**Date** : 24 novembre 2025
**Build Status** : ✅ Successful
**Issue Status** : 🔴 Bouton Play désactivé (investigation requise)
