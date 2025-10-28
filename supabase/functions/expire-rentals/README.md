# Edge Function: expire-rentals

Cette Edge Function Supabase s'occupe de l'expiration automatique des emprunts de films après 48h.

## Fonctionnement

La fonction appelle la fonction PostgreSQL `expire_overdue_rentals()` qui :
1. Identifie tous les emprunts avec statut "en_cours" et date_retour < NOW()
2. Met à jour leur statut à "expiré"
3. Les triggers PostgreSQL libèrent automatiquement les copies de films

## Déploiement

### Prérequis
- Supabase CLI installé : `npm install -g supabase`
- Authentification Supabase : `supabase login`

### Commandes

```bash
# Se positionner dans le dossier du projet
cd warecast-app

# Déployer la fonction
supabase functions deploy expire-rentals

# Tester localement
supabase functions serve expire-rentals

# Tester avec curl
curl -X POST http://localhost:54321/functions/v1/expire-rentals \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Planification (Cron)

### Option 1 : Supabase Cron Extension (Recommandé)

Exécuter dans le SQL Editor de Supabase :

```sql
-- Activer l'extension pg_cron (si pas déjà activée)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Planifier l'exécution toutes les heures
SELECT cron.schedule(
  'expire-rentals-hourly',
  '0 * * * *',  -- Toutes les heures à minute 0
  $$
    SELECT expire_overdue_rentals();
  $$
);

-- Vérifier que le cron est bien créé
SELECT * FROM cron.job;

-- Pour supprimer le cron (si besoin)
-- SELECT cron.unschedule('expire-rentals-hourly');
```

### Option 2 : Supabase Edge Function + Cron externe

Si pg_cron n'est pas disponible, utiliser un service externe pour appeler l'Edge Function :

1. **GitHub Actions** (gratuit)
```yaml
# .github/workflows/expire-rentals.yml
name: Expire Rentals Cron
on:
  schedule:
    - cron: '0 * * * *'  # Toutes les heures

jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            "https://YOUR_PROJECT_ID.supabase.co/functions/v1/expire-rentals" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

2. **Vercel Cron** (si déployé sur Vercel)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/expire-rentals",
    "schedule": "0 * * * *"
  }]
}
```

Puis créer l'endpoint API :
```typescript
// app/api/cron/expire-rentals/route.ts
export async function GET() {
  const response = await fetch(
    `https://YOUR_PROJECT_ID.supabase.co/functions/v1/expire-rentals`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    }
  );
  return Response.json(await response.json());
}
```

## Logs et Monitoring

```bash
# Voir les logs en temps réel
supabase functions logs expire-rentals --follow

# Voir les derniers logs
supabase functions logs expire-rentals
```

## Variables d'environnement

Les variables suivantes sont automatiquement injectées par Supabase :
- `SUPABASE_URL` : URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service (avec permissions élevées)

## Réponse de la fonction

```json
{
  "expired_count": 5,
  "timestamp": "2025-10-28T14:00:00.000Z",
  "success": true
}
```

En cas d'erreur :
```json
{
  "expired_count": 0,
  "timestamp": "2025-10-28T14:00:00.000Z",
  "success": false,
  "error": "Error message here"
}
```

## Sécurité

La fonction utilise la `SUPABASE_SERVICE_ROLE_KEY` pour bypasser les Row Level Security (RLS) policies, car elle doit pouvoir modifier tous les emprunts, peu importe l'utilisateur.

**Important** : Cette fonction doit être appelée uniquement par des sources de confiance (cron jobs internes, GitHub Actions, etc.). Ne jamais exposer le endpoint publiquement sans authentification.
