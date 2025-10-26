# 🤖 PROMPT POUR CLAUDE CODE - Optimisation Performance Warecast

## 📋 CONTEXTE

Tu es Claude Code, un assistant de développement expert. Tu dois optimiser les performances de l'application Warecast, une plateforme Next.js 15 de streaming vidéo avec Supabase.

**Projet** : `C:\Users\adkapper\Desktop\CC\Warecast\warecast-app`

**Documentation** : Lis d'abord ces fichiers pour comprendre l'architecture :
1. `claude.md` - Documentation complète du projet
2. `PERFORMANCE_OPTIMIZATION.md` - Plan d'optimisation détaillé (ce document contient TOUTES les infos)

---

## 🎯 OBJECTIF PRINCIPAL

Implémenter les 15 optimisations décrites dans `PERFORMANCE_OPTIMIZATION.md` pour :
- **Réduire la latence de 50%**
- **Réduire les coûts Supabase de 70%**
- **Améliorer les Core Web Vitals de 40%**

---

## 📝 INSTRUCTIONS GÉNÉRALES

### Avant de commencer
1. ✅ Lis le fichier `PERFORMANCE_OPTIMIZATION.md` en entier
2. ✅ Lis le fichier `claude.md` pour comprendre l'architecture
3. ✅ Vérifie les fichiers concernés pour comprendre le code actuel
4. ✅ Crée une branche Git : `git checkout -b feature/performance-optimization`

### Règles de développement
- ⚠️ **Ne JAMAIS casser la fonctionnalité existante**
- ✅ **Tester chaque changement individuellement**
- ✅ **Commenter le code modifié avec `// OPTIMIZATION:`**
- ✅ **Créer un commit par phase** (Phase 1, Phase 2, Phase 3)
- ✅ **Respecter les conventions du projet** (pas de barrel exports, imports directs)
- ✅ **Conserver tous les types TypeScript existants**

---

## 🚀 PHASE 1 - IMPACT IMMÉDIAT (Faire en priorité)

### ✅ Tâche 1.1 : Activer le cache HTTP sur /api/movies

**Fichier** : `app/api/movies/route.ts`

**Actions** :
1. Supprimer `export const dynamic = 'force-dynamic'`
2. Garder `export const revalidate = 60`
3. Ajouter `export const runtime = 'edge'`
4. Dans la fonction `GET()`, avant le `return NextResponse.json(...)` :
   ```typescript
   response.headers.set(
     'Cache-Control', 
     's-maxage=60, stale-while-revalidate=300'
   )
   ```

**Test** : Vérifier que l'API répond toujours correctement après les changements.

---

### ✅ Tâche 1.2 : Créer colonne random_order pour tri efficace

**Partie A - Migration SQL Supabase**

**IMPORTANT** : Cette migration doit être exécutée dans Supabase Dashboard :
1. Aller sur Supabase Dashboard → SQL Editor
2. Créer une nouvelle query
3. Copier-coller le SQL de `PERFORMANCE_OPTIMIZATION.md` section "2. Créer colonne random_order"
4. Exécuter la migration

**Partie B - Modifier l'API**

**Fichier** : `app/api/movies/route.ts`

**Actions** :
1. Trouver la section du tri "random" (lignes ~139-161)
2. Remplacer toute la logique `switch (strategy)` par :
   ```typescript
   if (safeSortBy === 'random') {
     query = query.order('random_order', { ascending: true })
   }
   ```

**Test** : 
- Naviguer sur la page d'accueil
- Rafraîchir plusieurs fois
- Vérifier que l'ordre change mais reste cohérent dans une session

---

### ✅ Tâche 1.3 : Créer indexes full-text search

**IMPORTANT** : Migration SQL dans Supabase Dashboard

**Actions** :
1. Aller sur Supabase Dashboard → SQL Editor
2. Copier le SQL de `PERFORMANCE_OPTIMIZATION.md` section "3. Créer indexes full-text search"
3. Exécuter la migration
4. Vérifier que les indexes sont créés : `SELECT * FROM pg_indexes WHERE tablename IN ('movies', 'actors', 'directors');`

**Test** : Les requêtes existantes doivent fonctionner plus rapidement (visible en prod, pas forcément en dev).

---

### ✅ Tâche 1.4 : Réduire rootMargin infinite scroll

**Fichier** : `components/movies-page-client.tsx`

**Actions** :
1. Trouver la ligne `rootMargin: '1000px'` (ligne ~26)
2. Remplacer par `rootMargin: '400px'`

**Test** :
- Naviguer sur la page d'accueil
- Scroller lentement
- Vérifier que le chargement se déclenche 2-3 scrolls avant la fin

---

### ✅ Tâche 1.5 : Supprimer cache: 'no-store'

**Fichier** : `hooks/ui/use-infinite-movies.ts`

**Actions** :
1. Trouver la ligne `cache: 'no-store'` (ligne ~120)
2. Supprimer complètement cette ligne
3. Garder uniquement :
   ```typescript
   const response = await fetch(`/api/movies?${queryParams}`, {
     headers: {
       'Content-Type': 'application/json',
     },
   })
   ```

**Test** :
- Naviguer sur la page d'accueil
- Cliquer sur un film
- Revenir en arrière
- La page devrait se charger instantanément

---

## ⚡ PHASE 2 - OPTIMISATIONS MOYENNES

### ✅ Tâche 2.1 : Consolider channels Realtime

**Fichier** : `hooks/realtime/use-realtime-movie-availability.ts`

**Actions** :
1. Supprimer les deux appels `useRealtimeSubscription` séparés
2. Les remplacer par UN SEUL appel avec tous les listeners (voir code dans `PERFORMANCE_OPTIMIZATION.md` section 6)
3. **IMPORTANT** : Supprimer tous les appels `checkInitialState()` dans les handlers (sauf dans `initialStateFetcher`)

**Test** :
- Ouvrir 2 navigateurs
- Louer un film dans le navigateur 1
- Vérifier que la disponibilité se met à jour dans le navigateur 2

---

### ✅ Tâche 2.2 : Implémenter full-text search avec tsvector

**Partie A - Migration SQL**

**IMPORTANT** : Exécuter dans Supabase Dashboard
1. Copier le SQL de `PERFORMANCE_OPTIMIZATION.md` section "7. Implémenter full-text search"
2. Exécuter dans SQL Editor
3. Vérifier que la fonction `search_movies()` existe : `SELECT proname FROM pg_proc WHERE proname = 'search_movies';`

**Partie B - Modifier l'API**

**Fichier** : `app/api/movies/route.ts`

**Actions** :
1. Trouver la section "Apply search filter" (lignes ~40-85)
2. Remplacer par l'appel RPC comme dans `PERFORMANCE_OPTIMIZATION.md` section 7
3. **ATTENTION** : Garder la logique de filtres et pagination

**Test** :
- Rechercher "Inception"
- Rechercher "Tom Hanks"
- Rechercher "Nolan" (réalisateur)
- Tous les résultats doivent être pertinents

---

### ✅ Tâche 2.3 : Optimiser effects Zustand

**Fichier** : `stores/rental-store.ts`

**Actions** :
1. Trouver l'effet `React.useEffect` lignes 152-165
2. Extraire `needsRefresh()` hors des dépendances (voir code dans `PERFORMANCE_OPTIMIZATION.md` section 8)
3. Appeler `needsRefresh()` une seule fois dans le body de l'effet

**Test** :
- Ouvrir la console du navigateur
- Naviguer sur la page d'accueil
- Vérifier qu'il n'y a qu'UNE SEULE requête à `/api/rentals` au chargement

---

### ✅ Tâche 2.4 : Créer indexes composites

**IMPORTANT** : Migration SQL dans Supabase Dashboard

**Actions** :
1. Copier le SQL de `PERFORMANCE_OPTIMIZATION.md` section "9. Créer indexes composites"
2. Exécuter dans SQL Editor
3. Vérifier : `SELECT indexname FROM pg_indexes WHERE tablename = 'emprunts';`

**Test** : Les requêtes existantes doivent fonctionner (pas de changement visible côté frontend).

---

## 🎨 PHASE 3 - PEAUFINAGE

### ✅ Tâche 3.1 : Optimiser images Next.js

**Fichier** : `components/movie-card.tsx`

**Actions** :
1. **SUPPRIMER** tout le code Intersection Observer (lignes 13-35)
2. **SUPPRIMER** les states `isVisible` et `cardRef`
3. Modifier le composant `<Image>` :
   - `quality={60}` au lieu de 75
   - Ajouter `placeholder="blur"`
   - Ajouter `blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzI3MjcyNyIvPjwvc3ZnPg=="`
4. Ajuster la condition de rendu (plus besoin de `isVisible`)

**Test** :
- Naviguer sur la page d'accueil
- Les images doivent apparaître avec un blur au chargement
- Vérifier dans DevTools que les images sont bien lazy-loaded

---

### ✅ Tâche 3.2 : Code splitting dynamic imports

**Fichiers concernés** : 
- `app/admin/page.tsx`
- `app/formules/page.tsx`
- `app/payment/[movieId]/page.tsx`
- Anywhere you see Stripe imports

**Actions** :
1. Ajouter `import dynamic from 'next/dynamic'` en haut des fichiers
2. Remplacer les imports directs par des dynamic imports
3. Ajouter des loading skeletons

**Exemple pour admin** :
```typescript
const ImportForm = dynamic(() => import('@/components/admin/import-form'), {
  loading: () => <div className="animate-pulse bg-zinc-800 h-64 rounded-lg" />,
  ssr: false
})
```

**Test** :
- `npm run build`
- Vérifier que le bundle est réduit
- Les pages doivent toujours se charger correctement

---

### ✅ Tâche 3.3 : Optimiser next/font

**Fichier** : `app/layout.tsx`

**Actions** :
1. Modifier l'import Inter (ligne ~11) :
   ```typescript
   const inter = Inter({ 
     subsets: ["latin"],
     display: 'swap',
     preload: true,
     variable: '--font-inter',
     fallback: ['system-ui', 'arial']
   });
   ```

**Test** : Le texte doit apparaître immédiatement même si la police n'est pas encore chargée.

---

### ✅ Tâche 3.4 : Ajouter préconnexions

**Fichier** : `app/layout.tsx`

**Actions** :
1. Ajouter un bloc `<head>` avec les préconnexions (voir code dans `PERFORMANCE_OPTIMIZATION.md` section 13)

**Test** : Ouvrir DevTools → Network → Les connexions DNS doivent être établies plus tôt.

---

### ✅ Tâche 3.5 : Optimiser next.config.ts

**Fichier** : `next.config.ts`

**Actions** :
1. Remplacer `hostname: '**'` par des hostnames spécifiques
2. Augmenter `minimumCacheTTL` à 86400 (24h)
3. Ajouter `compiler.removeConsole` pour la production
4. Ajouter `experimental.optimizePackageImports`

**Test** : `npm run build` doit réussir sans erreur.

---

## 🧪 TESTS FINAUX

### Checklist complète

Après avoir implémenté TOUTES les optimisations :

#### 1. Build et bundle
```bash
npm run build
```
**Vérifier** :
- ✅ Build réussit sans erreur
- ✅ "First Load JS" < 250KB
- ✅ Pas d'avertissements critiques

#### 2. Tests fonctionnels
- ✅ Page d'accueil se charge
- ✅ Recherche fonctionne
- ✅ Tri aléatoire varie entre sessions
- ✅ Infinite scroll charge correctement
- ✅ Cliquer sur un film ouvre les détails
- ✅ Realtime updates fonctionnent (tester avec 2 navigateurs)
- ✅ Images se chargent avec blur
- ✅ Navigation arrière est rapide

#### 3. Performance (Lighthouse)
```bash
npx lighthouse https://localhost:3000 --view
```
**Objectifs** :
- ✅ Performance > 90
- ✅ Accessibility > 95
- ✅ Best Practices > 90
- ✅ SEO > 90

#### 4. Vérifications Supabase
Dans Supabase Dashboard :
- ✅ Vérifier que les indexes existent
- ✅ Vérifier que `random_order` est peuplé
- ✅ Vérifier que `search_vector` est peuplé
- ✅ Tester la fonction `search_movies()` manuellement

---

## 🐛 TROUBLESHOOTING

### Problème : Build échoue
**Solution** : 
1. Vérifier les imports (pas de barrel exports)
2. Vérifier les types TypeScript
3. Vérifier que tous les fichiers modifiés sont bien sauvegardés

### Problème : Recherche ne fonctionne plus
**Solution** :
1. Vérifier que la migration SQL s'est bien exécutée
2. Vérifier que `search_vector` est peuplé : `SELECT COUNT(*) FROM movies WHERE search_vector IS NOT NULL;`
3. Vérifier les logs Supabase

### Problème : Realtime ne fonctionne plus
**Solution** :
1. Vérifier que les channels sont bien créés (console du navigateur)
2. Vérifier les policies RLS sur Supabase
3. Tester avec 2 navigateurs pour confirmer

### Problème : Images ne se chargent pas
**Solution** :
1. Vérifier que `next.config.ts` a les bons hostnames
2. Vérifier que `blurDataURL` est valide
3. Vérifier les URLs des images dans la base

---

## 📊 MÉTRIQUES À RAPPORTER

Après avoir tout implémenté, note ces métriques :

### Avant optimisations
- First Contentful Paint : ____
- Largest Contentful Paint : ____
- Time to Interactive : ____
- First Load JS : ____
- Lighthouse Performance : ____

### Après optimisations
- First Contentful Paint : ____
- Largest Contentful Paint : ____
- Time to Interactive : ____
- First Load JS : ____
- Lighthouse Performance : ____

### Supabase
- Requêtes API/jour (avant) : ____
- Requêtes API/jour (après) : ____
- Channels Realtime actifs (avant) : ____
- Channels Realtime actifs (après) : ____

---

## 📝 COMMITS RECOMMANDÉS

```bash
# Après Phase 1
git add .
git commit -m "feat(perf): Phase 1 - Cache HTTP, random_order, indexes, infinite scroll"

# Après Phase 2
git add .
git commit -m "feat(perf): Phase 2 - Realtime consolidation, full-text search, Zustand optimization"

# Après Phase 3
git add .
git commit -m "feat(perf): Phase 3 - Images optimization, code splitting, preconnections"

# Final
git add .
git commit -m "docs: Add performance optimization documentation"
git push origin feature/performance-optimization
```

---

## ✅ RÉSUMÉ DES GAINS ATTENDUS

| Métrique | Amélioration attendue |
|----------|----------------------|
| Latence globale | **-50%** |
| Coûts Supabase | **-70%** |
| First Load JS | **-37%** |
| LCP | **-50%** |
| Requêtes API | **-65%** |
| Channels Realtime | **-50%** |

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Commencer par Phase 1** (impact immédiat)
2. Tester après chaque tâche
3. Commit après chaque phase
4. **Continuer avec Phase 2** si Phase 1 fonctionne
5. **Finir par Phase 3** (polish)
6. Tests finaux complets
7. Deploy sur Vercel

---

**IMPORTANT** : Si tu rencontres un problème ou une ambiguïté, **DEMANDE** avant de continuer. Ne fais pas d'hypothèses qui pourraient casser le code existant.

**BONNE CHANCE !** 🚀
