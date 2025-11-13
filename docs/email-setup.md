# Configuration Email LWS avec Supabase

Guide complet pour configurer les emails d'authentification Supabase via votre serveur SMTP LWS.

## 📋 Informations LWS

**Paramètres SMTP** :
- Serveur SMTP : `mail.warecast.fr` (ou `mail60.lwspanel.com`)
- Port : `465` (SSL recommandé) ou `587` (TLS)
- Username : `contact@warecast.fr`
- Password : Mot de passe de votre boîte email LWS
- Expéditeur : `Warecast <contact@warecast.fr>`

**DNS configurés** (déjà fait dans Vercel) :
```
SPF : v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all
DKIM : v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8C8Xh049AFp+LuKVCUlwahtRFxO85rrJ0dE0idCfNAsI5Nlobf02gik8jesZ04clvZ0lxaM+L8IU50AKVHeFva83Y7LVJdeaXk14fO3gwQ1r/asNhzvg++88bfhSaLKD5M4Eid13mBrpsV3gP/MeGIzsty0AMUUNpDwe0otnv3wIDAQAB
DMARC : v=DMARC1; p=quarantine;
```

---

## ⚙️ Configuration Supabase Dashboard

### Étape 1 : Accéder aux paramètres SMTP

1. Connectez-vous à votre [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet Warecast
3. Dans le menu latéral gauche, cliquez sur **Settings** (icône engrenage)
4. Cliquez sur **Authentication** dans le sous-menu
5. Scrollez jusqu'à la section **SMTP Settings**

### Étape 2 : Activer Custom SMTP

1. **Toggle "Enable Custom SMTP"** : Activez le bouton (doit être vert/bleu)

### Étape 3 : Remplir les paramètres

Remplissez les champs suivants :

**Sender Details** :
```
Sender email : contact@warecast.fr
Sender name : Warecast
```

**SMTP Server** :
```
Host : mail.warecast.fr
Port number : 465
```

**Authentication** :
```
Username : contact@warecast.fr
Password : [votre mot de passe email LWS]
```

**Important** : Vérifiez bien que :
- Le port est **465** (SSL)
- Le username est exactement `contact@warecast.fr`
- Le password correspond à celui de votre boîte email LWS

### Étape 4 : Sauvegarder

1. Cliquez sur le bouton **Save** en bas de la section
2. Attendez la confirmation (message de succès en vert)

### Étape 5 : Test d'envoi (Optionnel)

Supabase propose parfois un bouton "Send test email" :
1. Si disponible, cliquez dessus
2. Entrez votre adresse email personnelle
3. Vérifiez la réception (boîte de réception ou spam)

---

## 📧 Configuration des Templates Email

### Accéder aux templates

1. Toujours dans **Settings → Authentication**
2. Scrollez jusqu'à **Email Templates**
3. Vous verrez plusieurs sections :
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### Personnaliser les templates

Pour chaque template, vous devez :

1. **Cliquez sur la section** (ex: "Confirm signup")
2. **Subject** : Modifiez le sujet de l'email
3. **Body (HTML)** : Copiez le contenu depuis `docs/email-templates/`

**Templates disponibles** :
- `confirm-signup.html` → Pour "Confirm signup"
- `reset-password.html` → Pour "Reset Password"
- `change-email.html` → Pour "Change Email Address"

**Procédure** :
```
1. Ouvrir le fichier template (ex: confirm-signup.html)
2. Copier TOUT le contenu HTML
3. Retourner dans Supabase Dashboard
4. Coller dans le champ "Body (HTML)"
5. Cliquer "Save"
6. Répéter pour chaque template
```

---

## ✅ Vérification de la configuration

### Checklist post-configuration

- [ ] SMTP activé ("Enable Custom SMTP" = ON)
- [ ] Serveur : `mail.warecast.fr`
- [ ] Port : `465`
- [ ] Username : `contact@warecast.fr`
- [ ] Password : renseigné correctement
- [ ] Sender name : `Warecast`
- [ ] Configuration sauvegardée (message de succès)
- [ ] Templates personnalisés copiés et sauvegardés

### Test d'inscription

Pour tester la configuration complète :

1. **Ouvrir votre application Warecast** en navigation privée
2. **S'inscrire avec un email de test** (Gmail, Outlook, etc.)
3. **Vérifier la réception** :
   - Email reçu ? ✅
   - Provient de `contact@warecast.fr` ? ✅
   - Design correspond au template ? ✅
   - Lien de confirmation fonctionne ? ✅
   - Boîte de réception (pas spam) ? ✅

Si l'email arrive en **spam** :
- Consultez `docs/email-testing.md` pour diagnostiquer
- Utilisez mail-tester.com pour identifier les problèmes

---

## 🔧 Troubleshooting

### Problème : "Failed to send email"

**Causes possibles** :
1. **Mauvais mot de passe** : Vérifiez le mot de passe LWS
2. **Port incorrect** : Utilisez 465 (SSL) et non 587
3. **Serveur bloqué** : Vérifiez que LWS autorise SMTP

**Solution** :
```
1. Vérifier credentials dans panel LWS
2. Tester envoi depuis client email (Thunderbird, Outlook)
3. Contacter support LWS si blocage SMTP
```

### Problème : Emails arrivent en spam

**Causes** :
- DNS mal configurés (SPF/DKIM/DMARC)
- Contenu détecté comme spam
- Réputation IP LWS faible
- Warmup nécessaire

**Solutions** :
1. Vérifier DNS avec `docs/dns-verification.md`
2. Utiliser templates optimisés `docs/email-templates/`
3. Tester avec `docs/email-testing.md`
4. Warmup progressif (10-20 emails/jour pendant 1 semaine)

### Problème : Variables Supabase ne fonctionnent pas

Les templates utilisent des variables comme :
- `{{ .Email }}` : Email de l'utilisateur
- `{{ .SiteURL }}` : URL de votre site
- `{{ .TokenHash }}` : Token de confirmation
- `{{ .Token }}` : Token (ancien format)

**Si les variables s'affichent en brut** :
1. Vérifiez que vous êtes bien dans la section HTML (pas texte)
2. Vérifiez la syntaxe exacte : `{{ .Variable }}` (avec espaces)
3. Sauvegardez et testez à nouveau

### Problème : Lien de confirmation ne fonctionne pas

**Vérifier** :
1. `Site URL` dans Supabase → Settings → General
   - Doit être : `https://warecast.fr` (production)
   - Ou : `http://localhost:3000` (développement)

2. Redirect URLs autorisées :
   - Settings → Authentication → Redirect URLs
   - Ajouter : `https://warecast.fr/auth/confirm`
   - Ajouter : `https://warecast.fr/auth/reset-password`

---

## 📊 Limites et quotas

### Limites LWS

**Rate limiting** :
- Varie selon offre LWS (généralement 100-500 emails/jour)
- Vérifiez votre offre dans panel LWS

**Recommandations** :
- Phase de lancement : <50 emails/jour
- Croissance : Surveiller quotas LWS
- Si dépassement : Contacter LWS pour upgrade ou migrer vers Resend

### Limites Supabase

**Avec SMTP custom** :
- Pas de limite Supabase (délégué à votre serveur SMTP)
- Limites = celles de LWS uniquement

---

## 🚀 Prochaines étapes

Après configuration :

1. **Tester** : Suivre `docs/email-testing.md`
2. **Vérifier DNS** : Suivre `docs/dns-verification.md`
3. **Warmup** : Envoi progressif pendant 1-2 semaines
4. **Monitoring** : Surveiller taux délivrabilité

---

## 📚 Ressources

- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [LWS Support](https://www.lws.fr/support.php)
- Mail Tester : https://www.mail-tester.com
- MX Toolbox : https://mxtoolbox.com

---

## 📝 Notes importantes

**Sécurité** :
- Ne jamais commit le mot de passe SMTP dans Git
- Utiliser variables d'environnement si nécessaire
- Changer password régulièrement (tous les 3-6 mois)

**Maintenance** :
- Vérifier délivrabilité mensuellement
- Surveiller rapports DMARC (si configuré)
- Mettre à jour templates si rebranding

**Évolution** :
- Si volume >500 emails/jour : Considérer migration vers Resend
- Si besoin templates React avancés : Voir Auth Hooks + Edge Functions
