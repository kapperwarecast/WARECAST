# Configuration du système d'expiration automatique des emprunts

## Vue d'ensemble

Ce document décrit la mise en place du système d'expiration automatique des emprunts après 48h pour Warecast.

### Problème initial

Le système ne gérait pas automatiquement l'expiration des emprunts :
- Les emprunts restaient en statut "en_cours" indéfiniment
- Les copies de films n'étaient jamais libérées automatiquement
- Les données de la base étaient incohérentes

### Solution implémentée

Un système en 3 parties :
1. **Triggers PostgreSQL** : Gestion automatique des copies disponibles
2. **Fonction d'expiration** : Marque les emprunts expirés
3. **Planification** : Exécution périodique (toutes les heures)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME COMPLET                          │
└─────────────────────────────────────────────────────────────┘

1. TRIGGERS (Temps réel - à chaque INSERT/UPDATE)
   ┌──────────────────────────────────────────────────┐
   │  INSERT emprunt                                  │
   │  statut = 'en_cours'                             │
   │        ↓                                         │
   │  Trigger: handle_rental_created                  │
   │        ↓                                         │
   │  UPDATE movies                                   │
   │  SET copies_disponibles = copies_disponibles - 1 │
   └──────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────┐
   │  UPDATE emprunt                                  │
   │  statut = 'rendu' ou 'expiré'                    │
   │        ↓                                         │
   │  Trigger: handle_rental_return                   │
   │        ↓                                         │
   │  UPDATE movies                                   │
   │  SET copies_disponibles = copies_disponibles + 1 │
   └──────────────────────────────────────────────────┘

2. FONCTION EXPIRATION (Périodique - toutes les heures)
   ┌──────────────────────────────────────────────────┐
   │  Cron Job / Edge Function                        │
   │        ↓                                         │
   │  SELECT expire_overdue_rentals()                 │
   │        ↓                                         │
   │  UPDATE emprunts                                 │
   │  SET statut = 'expiré'                           │
   │  WHERE date_retour < NOW()                       │
   │        ↓                                         │
   │  Trigger handle_rental_return s'exécute          │
   │  automatiquement pour chaque emprunt expiré      │
   └──────────────────────────────────────────────────┘
```

---

## Installation

### Étape 1 : Exécuter les migrations SQL

Ouvrir **Supabase Dashboard → SQL Editor** et exécuter le contenu de `MIGRATIONS_SQL.sql` dans l'ordre :

#### Migration 5 : Triggers de gestion des copies

```sql
-- Copier-coller depuis MIGRATIONS_SQL.sql ligne 218-270
-- Cette migration crée :
-- - Fonction handle_rental_created()
-- - Fonction handle_rental_return()
-- - Triggers associés
```

Vérifier que les triggers sont créés :
```sql
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname IN ('rental_created_trigger', 'rental_return_trigger')
  AND tgrelid = 'emprunts'::regclass;
```
> Devrait retourner 2 lignes

#### Migration 6 : Fonction d'expiration automatique

```sql
-- Copier-coller depuis MIGRATIONS_SQL.sql ligne 273-317
-- Cette migration crée :
-- - Fonction expire_overdue_rentals() (modifie les données)
-- - Fonction count_overdue_rentals() (lecture seule)
```

Vérifier que les fonctions existent :
```sql
SELECT proname FROM pg_proc WHERE proname IN (
  'expire_overdue_rentals',
  'count_overdue_rentals'
);
```
> Devrait retourner 2 lignes

#### Migration 7 : Nettoyage des données historiques

⚠️ **ATTENTION** : Cette migration modifie les données existantes !

```sql
-- Copier-coller depuis MIGRATIONS_SQL.sql ligne 320-407
-- Cette migration :
-- 1. Marque tous les emprunts expirés comme 'expiré'
-- 2. Recalcule copies_disponibles pour tous les films
```

Vérifier le résultat :
```sql
-- Voir combien d'emprunts ont été expirés
SELECT COUNT(*) as total_emprunts_expired
FROM emprunts
WHERE statut = 'expiré';

-- Vérifier qu'il n'y a pas d'incohérence
SELECT id, titre_francais, nombre_copies, copies_disponibles
FROM movies
WHERE copies_disponibles < 0 OR copies_disponibles > nombre_copies;
```
> Devrait retourner 0 lignes (aucune incohérence)

---

### Étape 2 : Déployer l'Edge Function

#### Installation Supabase CLI

```bash
# Installer le CLI Supabase
npm install -g supabase

# Se connecter à Supabase
supabase login
```

#### Déployer la fonction

```bash
# Se positionner dans le projet
cd warecast-app

# Déployer la fonction expire-rentals
supabase functions deploy expire-rentals

# Vérifier que la fonction est déployée
supabase functions list
```

#### Tester la fonction

```bash
# Récupérer votre ANON_KEY depuis Supabase Dashboard → Settings → API
export SUPABASE_ANON_KEY="your_anon_key_here"
export SUPABASE_PROJECT_ID="your_project_id"

# Tester l'appel
curl -X POST \
  "https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/expire-rentals" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

Réponse attendue :
```json
{
  "expired_count": 5,
  "timestamp": "2025-10-28T14:00:00.000Z",
  "success": true
}
```

---

### Étape 3 : Planifier l'exécution périodique

#### Option A : pg_cron (Recommandé - plus simple)

Exécuter dans **Supabase Dashboard → SQL Editor** :

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Planifier l'exécution toutes les heures
SELECT cron.schedule(
  'expire-rentals-hourly',
  '0 * * * *',  -- Toutes les heures à minute 0
  $$
    SELECT expire_overdue_rentals();
  $$
);

-- Vérifier que le cron est créé
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'expire-rentals-hourly';
```

**Avantages** :
- ✅ Pas besoin d'Edge Function
- ✅ Exécution directe dans la base de données
- ✅ Performant
- ✅ Aucune dépendance externe

**Pour supprimer le cron** (si besoin) :
```sql
SELECT cron.unschedule('expire-rentals-hourly');
```

#### Option B : GitHub Actions (Si pg_cron n'est pas disponible)

Créer `.github/workflows/expire-rentals.yml` :

```yaml
name: Expire Rentals Cron

on:
  schedule:
    # Toutes les heures
    - cron: '0 * * * *'
  # Permet aussi d'exécuter manuellement
  workflow_dispatch:

jobs:
  expire-rentals:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        env:
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          response=$(curl -s -X POST \
            "https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/expire-rentals" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

          echo "Response: $response"

          # Vérifier le succès
          success=$(echo $response | jq -r '.success')
          if [ "$success" != "true" ]; then
            echo "Error: Function call failed"
            exit 1
          fi

          expired_count=$(echo $response | jq -r '.expired_count')
          echo "Successfully expired $expired_count rentals"
```

Ajouter les secrets dans **GitHub → Settings → Secrets and variables → Actions** :
- `SUPABASE_PROJECT_ID`
- `SUPABASE_ANON_KEY`

#### Option C : Vercel Cron (Si déployé sur Vercel)

1. Créer `vercel.json` :
```json
{
  "crons": [{
    "path": "/api/cron/expire-rentals",
    "schedule": "0 * * * *"
  }]
}
```

2. Créer `app/api/cron/expire-rentals/route.ts` :
```typescript
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Sécurité : vérifier que l'appel vient de Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Appeler l'Edge Function Supabase
    const response = await fetch(
      `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/expire-rentals`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );

    const result = await response.json();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error calling expire-rentals:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

3. Ajouter dans `.env.local` :
```bash
CRON_SECRET=your_random_secret_here
```

---

## Monitoring et maintenance

### Vérifier le nombre d'emprunts expirés

```sql
-- Voir combien d'emprunts sont actuellement expirés (mais pas marqués)
SELECT count_overdue_rentals();

-- Voir les détails des emprunts en retard
SELECT
  e.id,
  e.user_id,
  e.movie_id,
  m.titre_francais,
  e.date_emprunt,
  e.date_retour,
  NOW() - e.date_retour as retard
FROM emprunts e
JOIN movies m ON m.id = e.movie_id
WHERE e.statut = 'en_cours'
  AND e.date_retour < NOW()
ORDER BY e.date_retour ASC;
```

### Vérifier l'historique d'expiration

```sql
-- Voir les emprunts expirés dans les dernières 24h
SELECT
  COUNT(*) as total_expired,
  DATE_TRUNC('hour', updated_at) as hour
FROM emprunts
WHERE statut = 'expiré'
  AND updated_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', updated_at)
ORDER BY hour DESC;
```

### Vérifier l'état des copies

```sql
-- Vérifier qu'il n'y a pas d'incohérence dans les copies
SELECT
  m.id,
  m.titre_francais,
  m.nombre_copies,
  m.copies_disponibles,
  COUNT(e.id) as emprunts_en_cours,
  m.nombre_copies - COUNT(e.id) as copies_attendues,
  m.copies_disponibles - (m.nombre_copies - COUNT(e.id)) as difference
FROM movies m
LEFT JOIN emprunts e ON e.movie_id = m.id AND e.statut = 'en_cours'
GROUP BY m.id
HAVING m.copies_disponibles != (m.nombre_copies - COUNT(e.id));
```
> Si cette requête retourne des lignes, il y a une incohérence à corriger

### Recalculer les copies (si incohérence détectée)

```sql
-- Exécuter uniquement si des incohérences sont détectées
UPDATE movies m
SET copies_disponibles = (
  SELECT m.nombre_copies - COUNT(*)
  FROM emprunts e
  WHERE e.movie_id = m.id
    AND e.statut = 'en_cours'
);
```

### Logs de l'Edge Function

```bash
# Voir les logs en temps réel
supabase functions logs expire-rentals --follow

# Voir les 50 derniers logs
supabase functions logs expire-rentals --tail 50
```

---

## Tests

### Test 1 : Vérifier les triggers

```sql
-- Test : Créer un emprunt
BEGIN;

-- Noter les copies avant
SELECT copies_disponibles FROM movies WHERE id = 'YOUR_MOVIE_ID';

-- Créer un emprunt
INSERT INTO emprunts (user_id, movie_id, statut, date_emprunt, date_retour, type_emprunt)
VALUES (
  'YOUR_USER_ID',
  'YOUR_MOVIE_ID',
  'en_cours',
  NOW(),
  NOW() + INTERVAL '48 hours',
  'location'
);

-- Vérifier que copies_disponibles a diminué de 1
SELECT copies_disponibles FROM movies WHERE id = 'YOUR_MOVIE_ID';

-- Marquer comme rendu
UPDATE emprunts
SET statut = 'rendu'
WHERE user_id = 'YOUR_USER_ID' AND movie_id = 'YOUR_MOVIE_ID' AND statut = 'en_cours';

-- Vérifier que copies_disponibles a augmenté de 1
SELECT copies_disponibles FROM movies WHERE id = 'YOUR_MOVIE_ID';

ROLLBACK; -- Annuler le test
```

### Test 2 : Fonction d'expiration

```sql
-- Créer un emprunt expiré pour tester
BEGIN;

INSERT INTO emprunts (user_id, movie_id, statut, date_emprunt, date_retour, type_emprunt)
VALUES (
  'YOUR_USER_ID',
  'YOUR_MOVIE_ID',
  'en_cours',
  NOW() - INTERVAL '72 hours',  -- Il y a 3 jours
  NOW() - INTERVAL '24 hours',  -- Expiré depuis 1 jour
  'location'
);

-- Vérifier qu'il est détecté comme expiré
SELECT count_overdue_rentals();  -- Devrait être > 0

-- Appeler la fonction d'expiration
SELECT expire_overdue_rentals();  -- Devrait retourner 1

-- Vérifier que le statut a changé
SELECT statut FROM emprunts
WHERE user_id = 'YOUR_USER_ID' AND movie_id = 'YOUR_MOVIE_ID';
-- Devrait être 'expiré'

-- Vérifier que la copie a été libérée
SELECT copies_disponibles FROM movies WHERE id = 'YOUR_MOVIE_ID';

ROLLBACK; -- Annuler le test
```

### Test 3 : Edge Function (si utilisée)

```bash
# Appeler l'Edge Function manuellement
curl -X POST \
  "https://YOUR_PROJECT_ID.supabase.co/functions/v1/expire-rentals" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -v

# Vérifier la réponse
# Devrait retourner un JSON avec success: true et expired_count
```

---

## Dépannage

### Problème : Les emprunts ne sont pas expirés automatiquement

**Diagnostic** :
```sql
-- Vérifier si la fonction existe
SELECT proname FROM pg_proc WHERE proname = 'expire_overdue_rentals';

-- Vérifier si le cron existe (si option A)
SELECT * FROM cron.job WHERE jobname = 'expire-rentals-hourly';

-- Vérifier les logs du cron (si option A)
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-rentals-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

**Solution** :
- Si fonction n'existe pas → Réexécuter Migration 6
- Si cron n'existe pas → Réexécuter Étape 3, Option A
- Si logs montrent des erreurs → Vérifier les permissions RLS

### Problème : Incohérence dans copies_disponibles

**Diagnostic** :
```sql
-- Trouver les films avec incohérence
SELECT
  m.id,
  m.titre_francais,
  m.nombre_copies,
  m.copies_disponibles,
  COUNT(e.id) as emprunts_en_cours
FROM movies m
LEFT JOIN emprunts e ON e.movie_id = m.id AND e.statut = 'en_cours'
GROUP BY m.id
HAVING m.copies_disponibles != (m.nombre_copies - COUNT(e.id));
```

**Solution** :
```sql
-- Recalculer toutes les copies
UPDATE movies m
SET copies_disponibles = (
  SELECT m.nombre_copies - COUNT(*)
  FROM emprunts e
  WHERE e.movie_id = m.id AND e.statut = 'en_cours'
);
```

### Problème : Edge Function timeout

**Diagnostic** :
```bash
# Vérifier les logs
supabase functions logs expire-rentals --tail 50
```

**Solution** :
- Si beaucoup d'emprunts à expirer (>1000), augmenter le timeout
- Ou utiliser l'option pg_cron (plus performant)

---

## Rollback

Pour désinstaller complètement le système :

```sql
-- Supprimer le cron (si option A)
SELECT cron.unschedule('expire-rentals-hourly');

-- Supprimer les triggers
DROP TRIGGER IF EXISTS rental_created_trigger ON emprunts;
DROP TRIGGER IF EXISTS rental_return_trigger ON emprunts;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS handle_rental_created();
DROP FUNCTION IF EXISTS handle_rental_return();
DROP FUNCTION IF EXISTS expire_overdue_rentals();
DROP FUNCTION IF EXISTS count_overdue_rentals();
```

⚠️ **Attention** : La migration 7 (nettoyage) ne peut pas être rollback automatiquement.

---

## Résumé

✅ **Ce qui a été implémenté** :
1. Triggers automatiques pour gérer les copies disponibles
2. Fonction PostgreSQL pour expirer les emprunts
3. Edge Function Supabase (optionnelle)
4. Nettoyage des données historiques
5. Plusieurs options de planification

✅ **Recommandation** :
- Utiliser **pg_cron** (Option A) si disponible
- Sinon, utiliser **GitHub Actions** (Option B)

✅ **Fréquence recommandée** :
- Toutes les heures (suffisant pour un système de location 48h)
- Peut être augmenté à toutes les 30 minutes si nécessaire

✅ **Monitoring** :
- Vérifier régulièrement les requêtes SQL de monitoring
- Surveiller les logs de la fonction d'expiration
- Vérifier l'absence d'incohérences dans copies_disponibles
