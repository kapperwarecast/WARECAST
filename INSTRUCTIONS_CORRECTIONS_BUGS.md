# Instructions pour appliquer les corrections des bugs

## 📋 Vue d'ensemble

3 bugs SQL corrigés + 1 Edge Function créée pour expiration automatique.

**Fichiers créés:**
- ✅ `supabase/migrations/20251121_fix_payment_validation.sql` (Bugs #1, #2, #3)
- ✅ `supabase/functions/expire-sessions/index.ts` (Bug #4)

---

## 🔴 ÉTAPE 1: Appliquer la migration SQL (Bugs #1, #2, #3)

### Option A: Via Supabase Dashboard (Recommandé)

1. Ouvrir https://supabase.com/dashboard/project/dktaafbwcbllxczdfazs/sql/new
2. Copier-coller le contenu COMPLET de:
   ```
   warecast-app/supabase/migrations/20251121_fix_payment_validation.sql
   ```
3. Cliquer "Run" (exécute CREATE OR REPLACE FUNCTION)
4. Vérifier succès: Message "Success. No rows returned"

### Option B: Via Supabase CLI

```bash
cd warecast-app
npx supabase db push
```

### Vérification

Exécuter cette requête SQL pour confirmer:

```sql
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'rent_or_access_movie'
  AND routine_schema = 'public';
```

Vous devriez voir le commentaire avec "CORRECTIONS APPLIQUÉES (2025-11-21)".

---

## 🟡 ÉTAPE 2: Déployer l'Edge Function (Bug #4)

### 1. Installer Supabase CLI (si pas déjà fait)

```bash
npm install -g supabase
```

### 2. Login Supabase

```bash
npx supabase login
```

### 3. Lier le projet

```bash
cd warecast-app
npx supabase link --project-ref dktaafbwcbllxczdfazs
```

### 4. Déployer la fonction

```bash
npx supabase functions deploy expire-sessions
```

**Résultat attendu:**
```
Deploying expire-sessions (project ref: dktaafbwcbllxczdfazs)
Bundled expire-sessions (0.10 KB)
Deployed expire-sessions in 2.5s
```

### 5. Tester manuellement

```bash
npx supabase functions invoke expire-sessions --method POST
```

**Réponse attendue:**
```json
{
  "expired_count": 0,
  "timestamp": "2025-11-21T..."
}
```

---

## ⏰ ÉTAPE 3: Configurer le cron job

### Via Supabase Dashboard

1. Aller sur: https://supabase.com/dashboard/project/dktaafbwcbllxczdfazs/functions
2. Cliquer sur la fonction **"expire-sessions"**
3. Onglet **"Settings"** → Section **"Cron Jobs"**
4. Cliquer **"Create Cron Job"**
5. Configurer:
   - **Name**: `Expire overdue viewing sessions`
   - **Schedule**: `0 * * * *` (toutes les heures)
   - **HTTP Method**: `POST`
   - **Headers**: Laisser vide
   - **Body**: Laisser vide
6. Cliquer **"Create"**

### Vérification

Le cron devrait apparaître dans la liste avec statut "Active".

**Test immédiat:**
- Cliquer sur les 3 points (...) → **"Invoke now"**
- Vérifier logs dans l'onglet "Logs"

---

## ✅ ÉTAPE 4: Vérifier que tout fonctionne

### Test 1: Validation paiement Stripe (Bug #1 corrigé)

```sql
-- Créer un faux paiement "failed"
INSERT INTO payments (id, user_id, amount, currency, payment_type, status)
VALUES (gen_random_uuid(), (SELECT id FROM user_profiles WHERE email = 'kapper.warecast@gmail.com'), 1.50, 'EUR', 'exchange', 'failed');

-- Tenter d'échanger avec ce payment_id
-- Le RPC devrait retourner: {"success": false, "code": "PAYMENT_NOT_SUCCEEDED"}
```

### Test 2: Rotation non-abonné (Bug #2 corrigé)

1. Créer 2 comptes test (non-abonnés)
2. User A possède films X et Y
3. User A regarde X (session active)
4. User A paye 1,50€ pour échanger et regarder film Z
5. **Vérifier**: Session X automatiquement fermée (`statut='rendu'`)
6. **Vérifier**: User A n'a qu'UNE session active (film Z)

### Test 3: Sélection copie déterministe (Bug #3 corrigé)

```sql
-- Vérifier ORDER BY dans la fonction
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'rent_or_access_movie';

-- Chercher: "ORDER BY ... CASE WHEN NOT EXISTS ... THEN 0 ELSE 1 END"
```

### Test 4: Expiration automatique (Bug #4 corrigé)

```sql
-- Créer une fausse session expirée
INSERT INTO viewing_sessions (user_id, registry_id, movie_id, statut, session_type, session_start_date, return_date)
VALUES (
  (SELECT id FROM user_profiles WHERE email = 'kapper.warecast@gmail.com'),
  (SELECT id FROM films_registry LIMIT 1),
  (SELECT movie_id FROM films_registry LIMIT 1),
  'en_cours',
  'subscription',
  NOW() - INTERVAL '50 hours',
  NOW() - INTERVAL '2 hours'
);

-- Attendre 1 heure (ou invoquer manuellement le cron)
-- Vérifier que le statut passe à 'expiré'
SELECT * FROM viewing_sessions WHERE statut = 'expiré';
```

---

## 📊 Résumé des corrections

| Bug | Scénario | Gravité | Correction | Fichier |
|-----|----------|---------|------------|---------|
| #1 | #27 | 🔴 CRITIQUE | Validation `payments.status='succeeded'` | Ligne 183-195 |
| #2 | #16 | 🟠 MAJEUR | Rotation pour TOUS (supprimé condition abonnement) | Ligne 216-220 |
| #3 | #21 | 🟡 MINEUR | ORDER BY déterministe (copie disponible prioritaire) | Ligne 47-57 |
| #4 | #22 | 🟡 MINEUR | Cron toutes les heures → `expire_overdue_sessions()` | Edge Function |

---

## 🚨 Points d'attention

### Après application des corrections:

1. **Régénérer types TypeScript:**
   ```bash
   npx supabase gen types typescript --project-id dktaafbwcbllxczdfazs > lib/supabase/types.ts
   ```

2. **Tester échanges en production:**
   - Échange abonné (gratuit) ✅
   - Échange non-abonné avec paiement ✅
   - Rotation automatique ✅

3. **Monitorer logs Edge Function:**
   - Dashboard → Functions → expire-sessions → Logs
   - Vérifier exécutions toutes les heures

4. **Vérifier métriques:**
   ```sql
   -- Nombre de sessions actives
   SELECT COUNT(*) FROM viewing_sessions WHERE statut = 'en_cours';

   -- Nombre de sessions expirées
   SELECT COUNT(*) FROM viewing_sessions WHERE statut = 'expiré';

   -- Échanges récents
   SELECT COUNT(*) FROM film_exchanges WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

---

## 🐛 En cas de problème

### Erreur lors de la migration

Si erreur "function already exists":
```sql
DROP FUNCTION IF EXISTS rent_or_access_movie(UUID, UUID, UUID);
-- Puis ré-exécuter la migration
```

### Edge Function ne se déploie pas

```bash
# Vérifier configuration
npx supabase functions list

# Logs détaillés
npx supabase functions deploy expire-sessions --debug
```

### Cron ne s'exécute pas

1. Vérifier que la fonction est déployée
2. Vérifier format cron: `0 * * * *` (sans espaces supplémentaires)
3. Invoquer manuellement pour tester

---

## 📞 Support

Si problème persistant:
1. Vérifier logs Supabase Dashboard
2. Exécuter requêtes SQL de vérification ci-dessus
3. Tester avec compte test avant production

**Tous les fichiers sont prêts**, il suffit d'exécuter les étapes ci-dessus! ✅
