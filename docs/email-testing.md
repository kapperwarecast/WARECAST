# Guide de Test de Délivrabilité Email

Guide complet pour tester et valider la délivrabilité de vos emails Warecast.

---

## 🎯 Objectifs des tests

1. **Vérifier que les emails arrivent** (pas de blocage total)
2. **Vérifier qu'ils arrivent en boîte de réception** (pas en spam)
3. **Obtenir un score anti-spam élevé** (>8/10)
4. **Identifier et corriger les problèmes**

---

## 📊 Test 1 : Mail-Tester.com (Le plus important)

### Procédure

**Étape 1 : Générer une adresse de test**
1. Aller sur https://www.mail-tester.com
2. Copier l'adresse email générée (ex: `test-abc123@mail-tester.com`)
3. **Important** : Cette adresse est valide pendant 7 jours

**Étape 2 : Envoyer un email de test depuis Supabase**

Option A - Via Dashboard Supabase (si disponible) :
```
Settings → Auth → SMTP Settings
→ Bouton "Send test email"
→ Coller l'adresse mail-tester
→ Envoyer
```

Option B - Via inscription réelle :
```
1. Ouvrir votre site Warecast en navigation privée
2. S'inscrire avec l'adresse mail-tester copiée
3. L'email de confirmation sera envoyé automatiquement
```

**Étape 3 : Analyser les résultats**
1. Retourner sur https://www.mail-tester.com
2. Cliquer sur **"Then check your score"**
3. Attendre l'analyse (30 secondes)
4. Noter le score obtenu (sur 10)

### Interprétation des résultats

**Score 10/10** ✅
- Parfait ! Délivrabilité maximale
- Rien à faire, passez aux tests multi-providers

**Score 8-9/10** ✅
- Très bon, délivrabilité excellente
- Corrections mineures possibles (voir détails)

**Score 6-7/10** ⚠️
- Moyen, risque modéré de spam
- Corrections nécessaires (voir section Problèmes courants)

**Score <6/10** ❌
- Faible, forte probabilité de spam
- Corrections urgentes nécessaires

### Problèmes courants détectés

#### 1. SPF Fail
```
Problème : "SPF record does not authorize this server"

Cause : Enregistrement SPF mal configuré ou manquant

Solution :
1. Vérifier DNS dans Vercel :
   Type : TXT
   Nom : @
   Valeur : v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all

2. Attendre propagation DNS (24h max)
3. Vérifier avec : nslookup -type=txt warecast.fr
```

#### 2. DKIM Fail
```
Problème : "DKIM signature not found"

Cause : DKIM non configuré ou mal configuré

Solution :
1. Vérifier DNS DKIM dans Vercel :
   Type : TXT
   Nom : default._domainkey
   Valeur : [clé fournie par LWS]

2. Contacter support LWS si clé manquante
3. Vérifier avec : nslookup -type=txt default._domainkey.warecast.fr
```

#### 3. DMARC Fail
```
Problème : "DMARC record not found"

Cause : DMARC non configuré

Solution :
1. Ajouter DNS DMARC dans Vercel :
   Type : TXT
   Nom : _dmarc
   Valeur : v=DMARC1; p=quarantine;

2. Vérifier avec : nslookup -type=txt _dmarc.warecast.fr
```

#### 4. Contenu détecté comme spam
```
Problème : "Spam score: 2.5"

Causes possibles :
- Mots spam dans sujet ("GRATUIT", "URGENT", "CLIQUEZ ICI")
- Trop de majuscules
- Trop de points d'exclamation !!!
- Ratio images/texte déséquilibré

Solution :
1. Utiliser les templates fournis (déjà optimisés)
2. Éviter mots spam
3. Ton professionnel et sobre
```

#### 5. Reverse DNS (PTR) manquant
```
Problème : "Reverse DNS does not match SMTP server"

Cause : PTR record non configuré (géré par LWS)

Solution :
- C'est géré par LWS automatiquement
- Si problème persiste : contacter support LWS
- Généralement pas bloquant pour LWS
```

#### 6. Blacklist IP
```
Problème : "IP is listed on [blacklist name]"

Cause : IP LWS partagée blacklistée

Solution :
1. Vérifier avec : https://mxtoolbox.com/blacklists.aspx
2. Entrer : mail.warecast.fr ou mail60.lwspanel.com
3. Si blacklistée :
   - Contacter support LWS immédiatement
   - Demander changement d'IP ou delisting
   - Considérer migration vers Resend si récurrent
```

---

## 📬 Test 2 : Multi-Providers (Gmail, Outlook, Yahoo)

### Objectif

Tester la délivrabilité réelle sur les principaux fournisseurs email.

### Procédure

**Étape 1 : Préparer comptes de test**

Créer ou utiliser des comptes existants sur :
- **Gmail** (le plus strict) : test1@gmail.com
- **Outlook/Hotmail** : test2@outlook.com
- **Yahoo Mail** : test3@yahoo.com
- **ProtonMail** (optionnel) : test4@proton.me

**Étape 2 : S'inscrire sur Warecast**

Pour chaque compte :
```
1. Ouvrir navigation privée
2. Aller sur https://warecast.fr/signup
3. S'inscrire avec le compte test
4. Noter l'heure d'envoi
5. Vérifier réception
```

**Étape 3 : Vérifier la réception**

Pour chaque email reçu, noter :

**Dossier de réception** :
- ✅ **Boîte principale** (Inbox) : Score 10/10
- ⚠️ **Promotions** (Gmail) : Score 7/10 (acceptable)
- ⚠️ **Autres** (Outlook) : Score 6/10 (à améliorer)
- ❌ **Spam** : Score 0/10 (problème grave)

**Délai de réception** :
- Très rapide : <10 secondes
- Rapide : 10-30 secondes
- Normal : 30 secondes - 2 minutes
- Lent : >2 minutes (vérifier configuration)

**Affichage** :
- Expéditeur : Doit afficher "Warecast <contact@warecast.fr>"
- Sujet : Clair et non tronqué
- Images : Chargées correctement
- Liens : Fonctionnels

### Grille d'évaluation

| Provider | Dossier | Délai | Affichage | Score |
|----------|---------|-------|-----------|-------|
| Gmail    |         |       |           |  /10  |
| Outlook  |         |       |           |  /10  |
| Yahoo    |         |       |           |  /10  |

**Objectif** : Score moyen >7/10

### Actions selon résultats

**Tous arrivent en inbox** ✅
- Parfait ! Délivrabilité excellente
- Passez au warmup progressif

**Certains arrivent en Promotions (Gmail)** ⚠️
- Acceptable pour emails marketing
- Peut être amélioré avec engagement utilisateur
- Encourager users à glisser vers inbox

**Certains arrivent en spam** ❌
- Problème de configuration DNS (SPF/DKIM/DMARC)
- Ou contenu détecté comme spam
- Refaire test mail-tester.com pour diagnostiquer

**Aucun n'arrive** ❌❌
- Problème critique de configuration SMTP
- Vérifier credentials LWS dans Supabase
- Vérifier logs Supabase (Settings → Logs)

---

## 🔍 Test 3 : Test de contenu (Spam Assassin)

### Outil : IsNotSpam.com

**Procédure** :
1. Copier le HTML d'un de vos templates
2. Aller sur https://www.isnotspam.com
3. Coller le HTML
4. Analyser

**Score acceptable** : <2.0 (moins = mieux)

**Si score >3.0** :
- Identifier les triggers dans le rapport
- Ajuster le contenu
- Utiliser les templates fournis (déjà optimisés)

---

## 📈 Test 4 : Test de warmup (Facultatif)

### Objectif

Vérifier que l'envoi progressif améliore la réputation.

### Procédure

**Semaine 1** : 10 emails/jour
```
Jour 1-7 : S'inscrire avec 10 nouveaux comptes tests/jour
Noter : % inbox vs spam
```

**Semaine 2** : 25 emails/jour
```
Jour 8-14 : Augmenter à 25 inscriptions/jour
Noter : Amélioration du % inbox ?
```

**Semaine 3** : 50 emails/jour
```
Jour 15-21 : Augmenter à 50 inscriptions/jour
Noter : % inbox stable ou en amélioration ?
```

**Résultat attendu** :
- Semaine 1 : 60-70% inbox
- Semaine 2 : 75-85% inbox
- Semaine 3 : 85-95% inbox

Si pas d'amélioration → Problème de configuration DNS ou IP blacklistée.

---

## 🎯 Checklist complète de test

### Pré-tests (Configuration)

- [ ] SMTP configuré dans Supabase
- [ ] Templates HTML copiés dans Supabase
- [ ] DNS vérifié (voir dns-verification.md)
- [ ] Paramètres LWS confirmés

### Tests obligatoires

- [ ] Mail-tester.com : Score >8/10
- [ ] Test Gmail : Inbox ou Promotions (pas spam)
- [ ] Test Outlook : Inbox (pas spam)
- [ ] Délai réception <2 minutes

### Tests recommandés

- [ ] Test Yahoo Mail
- [ ] Test ProtonMail
- [ ] Test IsNotSpam.com : Score <2.0
- [ ] Test reset password (en plus de signup)
- [ ] Test changement email (si activé)

### Tests avancés (optionnel)

- [ ] Warmup progressif (3 semaines)
- [ ] Test sur mobile (iOS Mail, Gmail app)
- [ ] Test accessibilité (lecteurs d'écran)
- [ ] Test affichage images désactivées

---

## 🛠️ Outils recommandés

### Tests anti-spam
- **Mail-Tester** : https://www.mail-tester.com (principal)
- **IsNotSpam** : https://www.isnotspam.com
- **GlockApps** : https://glockapps.com (payant, très complet)

### Vérification DNS
- **MXToolbox** : https://mxtoolbox.com
- **DNSChecker** : https://dnschecker.org
- **Google Admin Toolbox** : https://toolbox.googleapps.com/apps/checkmx

### Blacklist checking
- **MXToolbox Blacklist** : https://mxtoolbox.com/blacklists.aspx
- **MultiRBL** : http://multirbl.valli.org
- **Spamhaus** : https://check.spamhaus.org

### Analytics (si migration Resend)
- **Resend Dashboard** : Metrics intégrés
- **PostMark Spam Check** : https://spamcheck.postmarkapp.com

---

## 📋 Template de rapport de test

Copiez et remplissez ce template après chaque session de tests :

```markdown
# Rapport de test délivrabilité - [Date]

## Configuration
- SMTP : LWS (mail.warecast.fr:465)
- Expéditeur : contact@warecast.fr
- Templates : Version [X]

## Résultats Mail-Tester
- Score : __/10
- SPF : ✅ / ❌
- DKIM : ✅ / ❌
- DMARC : ✅ / ❌
- Spam score : __
- Blacklist : ✅ / ❌

## Tests multi-providers
| Provider | Dossier | Délai | Notes |
|----------|---------|-------|-------|
| Gmail    |         |       |       |
| Outlook  |         |       |       |
| Yahoo    |         |       |       |

## Problèmes identifiés
1. [Problème 1]
2. [Problème 2]

## Actions correctives
1. [Action 1]
2. [Action 2]

## Score global : __/10
```

---

## 🚨 Quand re-tester ?

**Re-test obligatoire** :
- Après modification DNS
- Après changement templates
- Après migration serveur
- Si plaintes spam des users

**Re-test recommandé** :
- Tous les mois (monitoring)
- Après ajout nouvelles fonctionnalités email
- Si baisse engagement (taux ouverture)

**Monitoring continu** :
- Vérifier inbox/spam quotidiennement (premiers jours)
- Puis hebdomadaire
- Puis mensuel (une fois stable)

---

## ✅ Critères de validation finale

Votre configuration est validée si :

- ✅ Mail-tester score ≥8/10
- ✅ Gmail inbox ou promotions (pas spam)
- ✅ Outlook inbox (pas spam)
- ✅ SPF pass
- ✅ DKIM pass
- ✅ DMARC pass
- ✅ Délai <2min
- ✅ Pas de blacklist
- ✅ Design conforme (templates)
- ✅ Liens fonctionnels

**Si tous validés** : Votre système email est prêt pour production ! 🚀

**Si 1-2 non validés** : Corrections mineures nécessaires

**Si >3 non validés** : Problème configuration à résoudre avant production
