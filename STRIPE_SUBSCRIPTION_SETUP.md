# Configuration du système de paiement des abonnements Stripe

Ce guide explique comment configurer le système de paiement des abonnements avec Stripe pour Warecast.

## 1. Configuration Stripe Dashboard

### 1.1 Créer un produit

1. Allez sur [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Cliquez sur "Créer un produit"
3. Nom du produit : **Abonnement Warecast Mensuel**
4. Description : **Accès illimité aux films du catalogue Warecast**

### 1.2 Créer un prix récurrent

1. Dans le produit créé, ajoutez un prix
2. Type de prix : **Récurrent**
3. Prix : **5,00 EUR**
4. Fréquence de facturation : **Mensuel**
5. Notez l'ID du prix (commence par `price_`)

### 1.3 Configurer le webhook

1. Allez sur [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur "Ajouter un point de terminaison"
3. URL du point de terminaison : Votre Edge Function Supabase
   - Format : `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
   - Exemple : `https://eklsrvuukohcdfqchwbz.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements à écouter :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Notez le **secret de signature** du webhook (commence par `whsec_`)

## 2. Configuration Supabase

### 2.1 Mettre à jour la table abonnements

Ajoutez le `stripe_price_id` à votre abonnement mensuel :

\`\`\`sql
UPDATE abonnements
SET stripe_price_id = 'price_VOTRE_PRICE_ID'
WHERE duree_mois = 1;
\`\`\`

### 2.2 Configurer les secrets de l'Edge Function

1. Allez dans votre projet Supabase > Settings > Edge Functions
2. Ajoutez les secrets suivants :
   - `STRIPE_SECRET_KEY` : Votre clé secrète Stripe (commence par `sk_`)
   - `STRIPE_WEBHOOK_SECRET` : Le secret de signature du webhook (commence par `whsec_`)

## 3. Variables d'environnement

Dans votre fichier `.env.local`, ajoutez :

\`\`\`bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optionnel : ID du prix pour référence
STRIPE_PRICE_ID_MONTHLY=price_...
\`\`\`

## 4. Tester le système

### 4.1 Carte de test Stripe

Pour tester les paiements, utilisez les cartes de test Stripe :
- ✅ **Carte valide** : `4242 4242 4242 4242`
- ❌ **Paiement refusé** : `4000 0000 0000 0002`
- Date d'expiration : n'importe quelle date future (ex: 12/25)
- CVC : n'importe quel 3 chiffres (ex: 123)
- Code postal : n'importe quel code postal

### 4.2 Flux de test

1. Créez un compte utilisateur sur Warecast
2. Allez sur `/formules`
3. Cliquez sur "Choisir ce plan" pour l'abonnement mensuel
4. Vous serez redirigé vers Stripe Checkout
5. Utilisez la carte de test `4242 4242 4242 4242`
6. Après le paiement, vous serez redirigé vers `/formules/success`
7. Vérifiez que l'abonnement est actif dans votre profil

### 4.3 Vérifier le webhook

1. Dans le dashboard Stripe, allez sur Webhooks
2. Cliquez sur votre webhook
3. Vérifiez que les événements sont bien reçus et traités (status 200)

## 5. Annulation d'abonnement

Les utilisateurs peuvent annuler leur abonnement :
- L'annulation est effective à la fin de la période payée
- L'utilisateur garde l'accès jusqu'à la date d'expiration
- Aucun remboursement n'est effectué

## 6. Architecture du système

### Fichiers créés/modifiés

- ✅ Migration Supabase : `add_stripe_columns_for_subscriptions`
- ✅ Edge Function : `stripe-webhook` (modifiée)
- ✅ API Route : `/api/subscriptions/create-checkout/route.ts`
- ✅ API Route : `/api/subscriptions/cancel/route.ts`
- ✅ Page : `/app/formules/page.tsx` (modifiée)
- ✅ Page : `/app/formules/success/page.tsx`
- ✅ Page : `/app/formules/cancel/page.tsx`

### Événements Stripe gérés

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Crée l'abonnement dans `user_abonnements` |
| `customer.subscription.updated` | Met à jour le statut de l'abonnement |
| `customer.subscription.deleted` | Marque l'abonnement comme suspendu |
| `invoice.payment_succeeded` | Prolonge la date d'expiration (renouvellement) |
| `invoice.payment_failed` | Suspend l'abonnement |

## 7. Passage en production

Avant de passer en production :

1. ✅ Remplacez toutes les clés de test (`sk_test_`, `pk_test_`) par les clés de production
2. ✅ Créez un nouveau produit et prix en mode production
3. ✅ Configurez un nouveau webhook en production avec le bon secret
4. ✅ Mettez à jour les variables d'environnement
5. ✅ Testez le flux complet avec une vraie carte

## Support

En cas de problème :
- Consultez les logs de l'Edge Function dans Supabase
- Vérifiez les événements du webhook dans Stripe Dashboard
- Vérifiez que tous les secrets sont bien configurés
