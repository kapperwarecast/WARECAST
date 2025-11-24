# Guide de correction - Problèmes viewing_sessions et ownership_history

## Problèmes identifiés

### 🔴 Problème 1 : User non-abonné (kapper.warecast+17@gmail.com)
**Symptôme** : "No active session found for this movie" après paiement 1,50€
**Cause** : Colonne `related_entity_id` inexistante (movie_id est dans `payment_intent_data` JSON)

### 🔴 Problème 2 : User abonné
**Symptôme** : "ownership_history violates check constraint" lors d'un échange
**Cause** : Contrainte CHECK trop restrictive (manque 'deposit' et 'legacy_migration')

---

## Solution rapide (RECOMMANDÉ - 2 minutes)

### Étape 1 : Ouvrir SQL Editor Supabase
👉 https://supabase.com/dashboard/project/mjzbuxztvxivtyhocmkw/sql/new

### Étape 2 : Exécuter le script de correction complet
1. Ouvrir le fichier **`FIX_ALL.sql`** dans votre éditeur de code
2. **Copier TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Coller dans le SQL Editor** Supabase
4. Cliquer sur **"Run"** (bouton en bas à droite)

### Étape 3 : Vérifier les résultats
Vous devriez voir dans les résultats :
- ✅ `ALTER TABLE` - Contrainte mise à jour
- ✅ `NOTICE: Session créée avec succès !`
- ✅ Une ligne avec la session créée (statut "SESSION ACTIVE")
- ✅ Liste des paiements avec leur statut de session

---

## Solution alternative : Migrations individuelles

Si vous préférez appliquer les migrations séparément via CLI :

```bash
cd warecast-app

# Se connecter à Supabase
npx supabase login

# Lier le projet
npx supabase link --project-ref mjzbuxztvxivtyhocmkw

# Pousser toutes les migrations
npx supabase db push
```

Les migrations suivantes seront appliquées :
1. `20251121_fix_payment_validation.sql` - RPC corrigée (viewing_sessions)
2. `20251122_fix_ownership_history_constraint.sql` - Contrainte CHECK
3. `20251122_repair_orphan_payment.sql` - Session orpheline

---

## Vérifications post-correction

### ✅ Test 1 : User non-abonné peut regarder un film payé
1. Se connecter avec kapper.warecast+17@gmail.com
2. Accéder au film payé
3. Vérifier qu'il n'y a **AUCUNE erreur** "No active session"
4. Le player doit charger normalement

### ✅ Test 2 : User abonné peut échanger des films
1. Se connecter avec un compte abonné
2. Cliquer "Play" sur un film qu'il ne possède pas
3. L'échange doit s'effectuer **SANS erreur** de contrainte CHECK
4. Le film est accessible immédiatement

### ✅ Test 3 : Vérifier qu'il n'y a plus de paiements orphelins

Exécuter cette requête dans SQL Editor :

```sql
SELECT
  p.id,
  p.user_id,
  (p.payment_intent_data->>'movie_title') AS film,
  p.amount,
  p.completed_at,
  CASE
    WHEN vs.id IS NULL THEN '❌ AUCUNE SESSION'
    ELSE '✅ SESSION EXISTE'
  END AS status
FROM payments p
LEFT JOIN viewing_sessions vs ON vs.payment_id = p.id
WHERE p.payment_type = 'rental'
  AND p.status = 'succeeded'
  AND p.completed_at > '2025-11-20'
ORDER BY p.completed_at DESC;
```

**Résultat attendu** : Tous les paiements doivent avoir `✅ SESSION EXISTE`

---

## Fichiers créés/modifiés

### Nouveaux fichiers
- ✅ `FIX_ALL.sql` - Script de correction complet (TOUT-EN-UN)
- ✅ `supabase/migrations/20251122_fix_ownership_history_constraint.sql`
- ✅ `supabase/migrations/20251122_repair_orphan_payment.sql`

### Fichiers corrigés
- ✅ `REPAIR_NOW.sql` - Syntaxe JSON corrigée (`payment_intent_data`)
- ✅ `APPLY_MIGRATIONS.md` - Documentation complète

---

## FAQ

### Q1 : Que faire si la session est marquée "EXPIRÉE" ?
**R** : Normal si le paiement date de plus de 48h. L'utilisateur peut re-payer pour une nouvelle session de 48h.

### Q2 : Comment vérifier que la RPC est bien à jour ?
**R** : Exécuter `SELECT prosrc FROM pg_proc WHERE proname = 'rent_or_access_movie';`
Vous devez voir `viewing_sessions` dans le code, PAS `emprunts`.

### Q3 : Et si d'autres utilisateurs ont des paiements orphelins ?
**R** : Le script `FIX_ALL.sql` affiche tous les paiements orphelins dans la dernière requête.
Créez une nouvelle migration similaire à `20251122_repair_orphan_payment.sql` pour chaque paiement.

### Q4 : Dois-je redéployer l'application frontend ?
**R** : **NON**. Les corrections sont côté base de données uniquement. Pas besoin de redéployer Next.js.

---

## Support

Si vous rencontrez des problèmes :
1. Vérifier les logs Supabase Dashboard → SQL Editor → Logs
2. Vérifier les logs Stripe : https://dashboard.stripe.com/test/events
3. Vérifier la table `payments` : vérifier que `payment_intent_data` contient bien le `movie_id`

---

**Temps estimé total : 2-5 minutes**
