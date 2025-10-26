# ⚡ COPIER-COLLER CE PROMPT DANS CLAUDE CODE

```
Tu es un expert en optimisation Next.js et Supabase. 

INSTRUCTIONS :
1. Lis d'abord le fichier PERFORMANCE_OPTIMIZATION.md en ENTIER pour comprendre toutes les optimisations
2. Lis claude.md pour comprendre l'architecture
3. Implémente les optimisations dans cet ordre :

PHASE 1 (CRITIQUE - Faire en premier) :
- Tâche 1.1 : Supprimer force-dynamic et activer cache HTTP (app/api/movies/route.ts)
- Tâche 1.2 : Créer colonne random_order (Migration SQL + app/api/movies/route.ts)
- Tâche 1.3 : Créer indexes full-text search (Migration SQL)
- Tâche 1.4 : Réduire rootMargin à 400px (components/movies-page-client.tsx)
- Tâche 1.5 : Supprimer cache: no-store (hooks/ui/use-infinite-movies.ts)

PHASE 2 (Important - Si Phase 1 OK) :
- Tâche 2.1 : Consolider channels Realtime en 1 seul (hooks/realtime/use-realtime-movie-availability.ts)
- Tâche 2.2 : Full-text search avec tsvector (Migration SQL + app/api/movies/route.ts)
- Tâche 2.3 : Optimiser Zustand effects (stores/rental-store.ts)
- Tâche 2.4 : Créer indexes composites (Migration SQL)

PHASE 3 (Bonus - Optionnel) :
- Tâche 3.1 : Optimiser images (components/movie-card.tsx)
- Tâche 3.2 : Code splitting (app/admin/page.tsx, app/formules/page.tsx)
- Tâche 3.3 : Optimiser next/font (app/layout.tsx)
- Tâche 3.4 : Préconnexions (app/layout.tsx)
- Tâche 3.5 : Optimiser next.config.ts

RÈGLES CRITIQUES :
- NE JAMAIS casser la fonctionnalité existante
- TESTER après chaque tâche
- COMMENTER avec // OPTIMIZATION:
- RESPECTER les conventions (pas de barrel exports)
- CRÉER un commit par phase

MIGRATIONS SQL :
- Les migrations doivent être copiées depuis PERFORMANCE_OPTIMIZATION.md
- Elles seront exécutées manuellement dans Supabase Dashboard
- Note-les dans un fichier MIGRATIONS_TODO.sql

TESTS FINAUX :
- npm run build (First Load JS < 250KB)
- Page d'accueil se charge
- Recherche fonctionne
- Tri aléatoire varie
- Realtime updates marchent
- Navigation arrière rapide

COMMENCE PAR PHASE 1, TÂCHE 1.1 et demande-moi validation avant de continuer.
```

---

## 🎯 Comment utiliser

1. **Ouvrir Claude Code** dans votre terminal
2. **Copier le prompt ci-dessus** (tout le bloc entre les ```)
3. **Coller** dans Claude Code
4. **Appuyer sur Entrée**
5. **Suivre les instructions** de Claude Code
6. **Valider** après chaque tâche

---

## ✅ Avantages de cette approche

- 🚀 **Ultra-rapide** : Pas besoin de lire 40 pages
- 🤖 **Guidé** : Claude Code fait le travail
- 📋 **Organisé** : Phase par phase avec validation
- 🧪 **Sûr** : Tests après chaque modification
- 📝 **Documenté** : Commits automatiques

---

## 📚 Si besoin de plus de détails

- **Comprendre une optimisation** → `PERFORMANCE_OPTIMIZATION.md`
- **Voir le code avant/après** → `PERFORMANCE_OPTIMIZATION.md`
- **Troubleshooting** → `CLAUDE_CODE_PROMPT.md`
- **Vue d'ensemble** → `QUICKSTART_OPTIMIZATION.md`

---

**C'EST PARTI !** 🚀
