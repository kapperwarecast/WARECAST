# Guide de Configuration des Emails - Supabase Dashboard

Ce guide vous explique comment configurer les templates d'emails et les redirections dans le dashboard Supabase pour Warecast.

## Table des matières

1. [Configuration des URLs de redirection](#1-configuration-des-urls-de-redirection)
2. [Configuration des templates d'emails](#2-configuration-des-templates-demails)
3. [Test de configuration](#3-test-de-configuration)
4. [Dépannage](#4-dépannage)

---

## 1. Configuration des URLs de redirection

### Accéder aux paramètres d'authentification

1. Connectez-vous à [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet **Warecast**
3. Dans le menu latéral, cliquez sur **Authentication** (icône de bouclier)
4. Cliquez sur l'onglet **URL Configuration**

### Configurer le Site URL

Dans le champ **Site URL**, entrez :

```
https://www.warecast.fr
```

> **Important** : Cette URL est utilisée comme base pour tous les liens dans les emails.

### Configurer les Redirect URLs

Dans la section **Redirect URLs**, ajoutez les URLs suivantes (une par ligne) :

```
https://www.warecast.fr/auth/callback
https://www.warecast.fr/auth/confirm
https://www.warecast.fr/auth/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
```

> **Note** : Les URLs localhost sont nécessaires pour le développement local.

### Alternative : Wildcard pour développement

Pour simplifier, vous pouvez aussi ajouter un wildcard pour localhost :

```
http://localhost:3000/*
```

**Cliquez sur "Save" pour enregistrer les modifications.**

---

## 2. Configuration des templates d'emails

### Accéder aux templates d'emails

1. Toujours dans **Authentication**
2. Cliquez sur l'onglet **Email Templates**
3. Vous verrez une liste de templates disponibles

### Template 1 : Confirm signup (Confirmation d'inscription)

1. Sélectionnez le template **"Confirm signup"** dans la liste
2. Cliquez sur **"Edit template"**
3. Copiez le contenu du fichier `docs/email-templates/confirm-signup.html`
4. Collez-le dans l'éditeur en remplaçant tout le contenu existant
5. **Vérifiez** que le lien de confirmation contient bien :
   ```
   https://www.warecast.fr/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```
6. Cliquez sur **"Save"** en bas de la page

### Template 2 : Reset password (Réinitialisation mot de passe)

1. Sélectionnez le template **"Reset password"** dans la liste
2. Cliquez sur **"Edit template"**
3. Copiez le contenu du fichier `docs/email-templates/reset-password.html`
4. Collez-le dans l'éditeur en remplaçant tout le contenu existant
5. **Vérifiez** que le lien de réinitialisation contient bien :
   ```
   https://www.warecast.fr/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
   ```
6. Cliquez sur **"Save"** en bas de la page

### Variables Supabase disponibles

Les templates d'emails peuvent utiliser ces variables :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{ .Email }}` | Email de l'utilisateur | `user@example.com` |
| `{{ .TokenHash }}` | Token de confirmation | `abc123...` |
| `{{ .SiteURL }}` | URL du site (obsolète) | Non utilisé dans nos templates |
| `{{ .Token }}` | Token legacy (obsolète) | Non utilisé |

> **Important** : Dans nos templates, nous avons remplacé `{{ .SiteURL }}` par l'URL en dur `https://www.warecast.fr` pour plus de fiabilité.

---

## 3. Test de configuration

### Test 1 : Inscription d'un nouvel utilisateur

1. Allez sur https://www.warecast.fr/auth/signup (ou localhost:3000)
2. Inscrivez-vous avec un nouvel email
3. Vérifiez votre boîte email
4. **Vous devriez recevoir** :
   - Email avec le design Warecast
   - Bouton "Confirmer mon email"
   - Lien cliquable vers `/auth/confirm`
5. Cliquez sur le bouton
6. **Vous devriez être redirigé** vers :
   - `/auth/confirm` → Message "Email confirmé ✅"
   - Puis `/auth/login` après 2 secondes

### Test 2 : Réinitialisation de mot de passe

1. Allez sur https://www.warecast.fr/auth/forgot-password
2. Entrez votre email
3. Vérifiez votre boîte email
4. **Vous devriez recevoir** :
   - Email avec le design Warecast
   - Bouton "Réinitialiser mon mot de passe"
   - Lien cliquable vers `/auth/confirm?...&type=recovery`
5. Cliquez sur le bouton
6. **Vous devriez être redirigé** vers :
   - `/auth/confirm` → Validation du token
   - Puis `/auth/reset-password` → Formulaire de nouveau mot de passe
7. Entrez votre nouveau mot de passe
8. **Vous devriez être redirigé** vers `/auth/login`

---

## 4. Dépannage

### Problème : Email non reçu

**Solutions** :

1. Vérifiez votre dossier spam/courrier indésirable
2. Vérifiez que le serveur SMTP est correctement configuré (voir `email-setup.md`)
3. Dans Supabase Dashboard → Authentication → Logs, vérifiez qu'il n'y a pas d'erreurs d'envoi

### Problème : "Lien invalide ou expiré"

**Causes possibles** :

1. Le lien a été cliqué après 24h (expiration normale)
2. Le token a déjà été utilisé
3. Le lien a été tronqué par votre client email

**Solutions** :

- Demandez un nouveau lien (signup ou forgot-password)
- Copiez-collez le lien complet depuis l'email

### Problème : Redirection vers une mauvaise URL

**Vérifications** :

1. Dans Supabase → Authentication → URL Configuration
   - Site URL = `https://www.warecast.fr`
   - Redirect URLs contient toutes les URLs nécessaires
2. Dans les templates d'emails
   - Les liens pointent bien vers `https://www.warecast.fr/auth/...`
3. Vérifiez que la variable `NEXT_PUBLIC_APP_URL` dans `.env.local` est correcte

### Problème : Design de l'email cassé

**Solutions** :

1. Vérifiez que vous avez copié **tout le contenu** du fichier HTML
2. N'enlevez pas les styles inline (nécessaires pour les clients email)
3. Testez l'email avec [mail-tester.com](https://www.mail-tester.com) pour vérifier le rendu

### Problème : Variables non remplacées ({{ .TokenHash }} visible)

**Cause** : Le template n'est pas correctement reconnu par Supabase

**Solutions** :

1. Vérifiez que vous éditez le **bon template** (Confirm signup ou Reset password)
2. Assurez-vous d'avoir cliqué sur "Save" après modification
3. Videz le cache de votre navigateur et réessayez

---

## Flux utilisateur complets

### Flux 1 : Inscription

```
User → /auth/signup
  ↓ Saisie email + mot de passe
  ↓ Soumission du formulaire
  ↓
Email envoyé avec lien :
https://www.warecast.fr/auth/confirm?token_hash=xxx&type=email
  ↓ User clique sur le lien
  ↓
/auth/confirm
  ↓ Validation du token avec supabase.auth.verifyOtp()
  ↓ Message "Email confirmé ✅"
  ↓ Attente 2 secondes
  ↓
/auth/login → User peut se connecter
```

### Flux 2 : Mot de passe oublié

```
User → /auth/forgot-password
  ↓ Saisie email
  ↓ Soumission du formulaire
  ↓
Email envoyé avec lien :
https://www.warecast.fr/auth/confirm?token_hash=xxx&type=recovery&next=/auth/reset-password
  ↓ User clique sur le lien
  ↓
/auth/confirm
  ↓ Validation du token
  ↓ Redirection immédiate vers next=/auth/reset-password
  ↓
/auth/reset-password
  ↓ Formulaire nouveau mot de passe
  ↓ Soumission
  ↓ supabase.auth.updateUser({ password })
  ↓ Message "Mot de passe mis à jour ✅"
  ↓ Attente 2 secondes
  ↓
/auth/login → User peut se connecter
```

---

## Checklist finale

Avant de déployer en production, vérifiez que :

- [ ] Site URL = `https://www.warecast.fr` dans Supabase
- [ ] Toutes les Redirect URLs sont ajoutées
- [ ] Template "Confirm signup" est correctement configuré
- [ ] Template "Reset password" est correctement configuré
- [ ] Test d'inscription fonctionne (email reçu + confirmation)
- [ ] Test de reset password fonctionne (email reçu + formulaire)
- [ ] Les redirections fonctionnent correctement
- [ ] Aucune erreur dans les logs Supabase
- [ ] Le serveur SMTP LWS est correctement configuré (voir `email-setup.md`)

---

## Support

Si vous rencontrez des problèmes non listés ici :

1. Consultez les logs Supabase : Dashboard → Authentication → Logs
2. Consultez la documentation Supabase : [Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
3. Vérifiez les erreurs dans la console du navigateur (F12)

---

## Notes importantes

### Sécurité

- Les tokens de confirmation expirent après **24 heures**
- Les tokens de recovery (reset password) expirent après **1 heure**
- Un token ne peut être utilisé qu'**une seule fois**
- Toujours vérifier le token côté serveur avec `verifyOtp()`

### Email delivery

- Les emails sont envoyés via le serveur SMTP LWS (`mail.warecast.fr`)
- DNS SPF, DKIM et DMARC doivent être correctement configurés
- Testez régulièrement avec [mail-tester.com](https://www.mail-tester.com)
- Score minimal recommandé : 8/10

### URLs en production vs développement

En développement local (`localhost:3000`), les templates utilisent automatiquement les URLs localhost si configurées dans Redirect URLs. En production, ils utilisent `https://www.warecast.fr`.

Pour tester en local, vous pouvez temporairement remplacer les URLs dans les templates par `http://localhost:3000` mais **n'oubliez pas de les remettre à `https://www.warecast.fr` avant de déployer** !

---

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0
