# Procédure d'application des migrations - URGENT

## Contexte du problème

L'utilisateur `kapper.warecast+17@gmail.com` a payé 1,50€ pour regarder un film mais reçoit l'erreur "No active session found for this movie".

**Cause** : Le paiement a été traité AVANT la migration vers `viewing_sessions`, donc l'ancienne RPC a essayé d'insérer dans la table `emprunts` (qui n'existe plus). Résultat : paiement accepté mais aucune session créée.

## Solution

Deux étapes :

### 1. S'assurer que la RPC est à jour (viewing_sessions)

La migration `20251121_fix_payment_validation.sql` contient la version correcte de la RPC. Normalement elle devrait déjà être appliquée, mais vérifiez :

```bash
cd warecast-app

# Se connecter à Supabase (si pas déjà fait)
npx supabase login

# Lier le projet
npx supabase link --project-ref mjzbuxztvxivtyhocmkw

# Pousser TOUTES les migrations manquantes
npx supabase db push
```

### 2. Réparer la session pour l'utilisateur bloqué

Appliquer manuellement la migration de réparation :

```bash
# Méthode 1 : Via CLI Supabase (recommandé)
npx supabase db push

# OU Méthode 2 : Via dashboard Supabase
# 1. Aller sur https://supabase.com/dashboard/project/mjzbuxztvxivtyhocmkw/sql/new
# 2. Copier-coller le contenu de supabase/migrations/20251122_repair_orphan_payment.sql
# 3. Cliquer "Run"
```

### 3. Vérifier que tout fonctionne

```bash
# Se connecter au SQL Editor Supabase et exécuter :
SELECT
  vs.id,
  vs.statut,
  vs.session_type,
  vs.amount_paid,
  vs.session_start_date,
  vs.return_date,
  m.titre_francais
FROM viewing_sessions vs
JOIN movies m ON m.id = vs.movie_id
WHERE vs.payment_id = '1441d69f-b162-48d2-99d9-1b3a01748e20';

-- Devrait retourner 1 ligne avec la session créée
```

## Alternative : Application manuelle SQL

Si vous ne pouvez pas utiliser la CLI, exécutez ce SQL directement dans le dashboard Supabase :

```sql
-- ÉTAPE 1 : Vérifier la RPC (doit utiliser viewing_sessions)
SELECT prosrc
FROM pg_proc
WHERE proname = 'rent_or_access_movie';
-- Si vous voyez "emprunts", la RPC n'a pas été mise à jour

-- ÉTAPE 2 : Créer la session manquante
DO $$
DECLARE
  v_payment_id UUID := '1441d69f-b162-48d2-99d9-1b3a01748e20';
  v_user_id UUID;
  v_movie_id UUID;
  v_registry_id UUID;
BEGIN
  -- Récupérer user_id et movie_id du paiement
  SELECT user_id, related_entity_id
  INTO v_user_id, v_movie_id
  FROM payments
  WHERE id = v_payment_id;

  -- Récupérer registry_id (copie physique)
  SELECT id INTO v_registry_id
  FROM films_registry
  WHERE movie_id = v_movie_id
  LIMIT 1;

  -- Créer la session
  INSERT INTO viewing_sessions (
    user_id, registry_id, movie_id, statut, session_type, amount_paid,
    payment_id, session_start_date, return_date, created_at, updated_at
  )
  VALUES (
    v_user_id,
    v_registry_id,
    v_movie_id,
    'en_cours',  -- ou 'expiré' si > 48h
    'unit',
    1.50,
    v_payment_id,
    NOW() - INTERVAL '1 hour',  -- Ajuster selon le moment du paiement
    NOW() + INTERVAL '47 hours',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Session créée : user=%, movie=%, registry=%', v_user_id, v_movie_id, v_registry_id;
END $$;
```

## Vérification finale

1. **L'utilisateur doit maintenant pouvoir accéder au player** :
   - URL : `/movie-player/[slug-du-film]`
   - Aucun message d'erreur "No active session"

2. **Vérifier les logs** :
   - Dashboard Supabase → Logs
   - Rechercher "rent_or_access_movie"
   - S'assurer qu'aucune erreur SQL "relation emprunts does not exist"

## Prévention future

Pour éviter ce problème à l'avenir :

1. **Toujours tester les migrations en local d'abord** :
   ```bash
   npx supabase db reset  # Reset local DB
   npx supabase db push   # Apply migrations
   npm run dev            # Test l'app
   ```

2. **Ajouter un monitoring webhook Stripe** :
   - Vérifier que chaque paiement "succeeded" crée bien une session
   - Alerter si payment.succeeded sans viewing_session correspondante

3. **Migration data** :
   - Créer un script qui vérifie tous les paiements "succeeded" sans session
   - Les réparer automatiquement

## Contact

Si le problème persiste :
- Vérifier les logs Stripe : https://dashboard.stripe.com/test/events
- Vérifier les logs Supabase Edge Functions
- Vérifier la table `payments` : status = 'succeeded' ?
