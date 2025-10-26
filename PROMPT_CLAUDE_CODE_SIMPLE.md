# 🚀 PROMPT SIMPLIFIÉ POUR CLAUDE CODE

Copier-coller ce prompt dans Claude Code :

---

Tu es un expert en optimisation de performance Next.js et Supabase. Tu dois optimiser l'application Warecast en suivant le plan détaillé.

## 📁 Fichiers à lire en premier
1. **OBLIGATOIRE** : Lis `PERFORMANCE_OPTIMIZATION.md` en entier pour comprendre tous les changements
2. Lis `claude.md` pour comprendre l'architecture du projet
3. Suis les instructions de `CLAUDE_CODE_PROMPT.md` étape par étape

## 🎯 Objectif
Implémenter les 15 optimisations décrites pour :
- Réduire la latence de 50%
- Réduire les coûts Supabase de 70%
- Améliorer les Core Web Vitals de 40%

## ⚠️ Règles critiques
1. **NE JAMAIS** casser la fonctionnalité existante
2. **TESTER** chaque changement avant de passer au suivant
3. **RESPECTER** les conventions du projet (pas de barrel exports, imports directs)
4. **COMMENTER** le code modifié avec `// OPTIMIZATION:`
5. **CRÉER** un commit par phase (Phase 1, Phase 2, Phase 3)

## 📋 Plan d'action

### PHASE 1 - Impact immédiat (FAIRE EN PREMIER) 🔥

#### Tâche 1.1 : Cache HTTP sur /api/movies (5 min)
**Fichier** : `app/api/movies/route.ts`
- Supprimer `export const dynamic = 'force-dynamic'`
- Ajouter `export const runtime = 'edge'`
- Ajouter header `Cache-Control: s-maxage=60, stale-while-revalidate=300`

#### Tâche 1.2 : Colonne random_order (15 min)
**Partie A** : Migration SQL dans Supabase Dashboard (copier de `PERFORMANCE_OPTIMIZATION.md` section 2)
**Partie B** : Simplifier le tri random dans `app/api/movies/route.ts` ligne ~150

#### Tâche 1.3 : Indexes full-text search (10 min)
**Migration SQL** dans Supabase Dashboard (copier de `PERFORMANCE_OPTIMIZATION.md` section 3)

#### Tâche 1.4 : Réduire rootMargin (2 min)
**Fichier** : `components/movies-page-client.tsx` ligne 26
- Changer `rootMargin: '1000px'` → `rootMargin: '400px'`

#### Tâche 1.5 : Supprimer cache: no-store (2 min)
**Fichier** : `hooks/ui/use-infinite-movies.ts` ligne ~120
- Supprimer la ligne `cache: 'no-store'`

**TEST Phase 1** : 
- `npm run build` doit réussir
- Page d'accueil doit se charger
- Recherche doit fonctionner
- Tri aléatoire doit varier

---

### PHASE 2 - Optimisations moyennes (FAIRE SI PHASE 1 OK) ⚡

#### Tâche 2.1 : Consolider Realtime (20 min)
**Fichier** : `hooks/realtime/use-realtime-movie-availability.ts`
- Fusionner les 2 `useRealtimeSubscription` en 1 seul
- Supprimer les `checkInitialState()` dans les handlers

#### Tâche 2.2 : Full-text search avec tsvector (30 min)
**Partie A** : Migration SQL (voir `PERFORMANCE_OPTIMIZATION.md` section 7)
**Partie B** : Remplacer la recherche dans `app/api/movies/route.ts` par appel RPC

#### Tâche 2.3 : Optimiser effects Zustand (10 min)
**Fichier** : `stores/rental-store.ts` lignes 152-165
- Extraire `needsRefresh()` hors des dépendances

#### Tâche 2.4 : Indexes composites (5 min)
**Migration SQL** (voir `PERFORMANCE_OPTIMIZATION.md` section 9)

**TEST Phase 2** :
- Recherche fonctionne toujours
- Realtime updates fonctionnent (tester avec 2 navigateurs)
- Pas de requêtes multiples au montage

---

### PHASE 3 - Peaufinage (OPTIONNEL) 🎨

#### Tâche 3.1 : Optimiser images (15 min)
**Fichier** : `components/movie-card.tsx`
- Supprimer Intersection Observer custom
- Modifier `<Image>` : quality=60, placeholder="blur"

#### Tâche 3.2 : Code splitting (20 min)
**Fichiers** : `app/admin/page.tsx`, `app/formules/page.tsx`
- Ajouter dynamic imports pour gros composants

#### Tâche 3.3 : Optimiser next/font (5 min)
**Fichier** : `app/layout.tsx`
- Ajouter options à `Inter()` : display, preload, variable

#### Tâche 3.4 : Préconnexions (5 min)
**Fichier** : `app/layout.tsx`
- Ajouter `<link rel="preconnect">` dans `<head>`

#### Tâche 3.5 : Optimiser next.config.ts (5 min)
**Fichier** : `next.config.ts`
- Remplacer `hostname: '**'` par hostnames spécifiques
- Ajouter compiler.removeConsole

**TEST Phase 3** :
- `npm run build` → First Load JS < 250KB
- Images se chargent avec blur
- Lighthouse Performance > 90

---

## ✅ Tests finaux (Après TOUTES les phases)

```bash
# Build
npm run build

# Lighthouse
npx lighthouse https://localhost:3000 --view

# Vérifier :
# ✅ Performance > 90
# ✅ First Load JS < 250KB
# ✅ Pas d'erreurs console
# ✅ Recherche fonctionne
# ✅ Tri aléatoire varie
# ✅ Infinite scroll charge
# ✅ Realtime updates marchent
# ✅ Images lazy-load
# ✅ Navigation arrière rapide
```

---

## 🐛 Si problème

1. **Build échoue** → Vérifier les imports et types TypeScript
2. **Recherche ne marche plus** → Vérifier migration SQL `search_vector`
3. **Realtime ne marche plus** → Vérifier console navigateur + policies RLS
4. **Images ne chargent pas** → Vérifier hostnames dans `next.config.ts`

Consulter section Troubleshooting dans `CLAUDE_CODE_PROMPT.md` pour plus de détails.

---

## 📝 Commits recommandés

```bash
# Après Phase 1
git add .
git commit -m "feat(perf): Phase 1 - Cache, random_order, indexes, scroll"

# Après Phase 2
git add .
git commit -m "feat(perf): Phase 2 - Realtime, full-text search, Zustand"

# Après Phase 3
git add .
git commit -m "feat(perf): Phase 3 - Images, code splitting, preconnections"
```

---

## 🎯 Gains attendus

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| First Contentful Paint | 2.5s | 1.2s | -52% |
| Largest Contentful Paint | 4.0s | 2.0s | -50% |
| Time to Interactive | 5.0s | 2.8s | -44% |
| First Load JS | 350KB | 220KB | -37% |
| Requêtes Supabase/jour | 10K | 3.5K | -65% |
| Lighthouse Performance | ~65 | ~92 | +42% |

---

**IMPORTANT** : 
- Commence par lire `PERFORMANCE_OPTIMIZATION.md` en entier
- Suis l'ordre des phases
- Teste après chaque tâche
- Si tu as un doute, DEMANDE avant de continuer

**LET'S GO!** 🚀
