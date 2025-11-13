# Guide de Vérification DNS

Guide pour vérifier que vos enregistrements DNS (SPF, DKIM, DMARC) sont correctement configurés.

---

## 🎯 Pourquoi vérifier les DNS ?

Les enregistrements DNS sont **critiques** pour la délivrabilité email :

- **SPF** : Autorise les serveurs à envoyer des emails pour votre domaine
- **DKIM** : Signature cryptographique qui authentifie vos emails
- **DMARC** : Politique de gestion des emails non authentifiés

**Sans ces enregistrements** :
- 80% de risque d'atterrir en spam ❌
- Emails bloqués par certains providers
- Réputation domaine dégradée

**Avec ces enregistrements** :
- 95%+ de délivrabilité en inbox ✅
- Confiance des providers
- Protection contre phishing/spoofing

---

## 📋 Vos enregistrements DNS (LWS)

### Records à configurer dans Vercel

Voici les enregistrements DNS exacts fournis par LWS pour `warecast.fr` :

#### 1. SPF (Sender Policy Framework)

```
Type : TXT
Nom : @ (ou warecast.fr)
Valeur : v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all
TTL : 3600 (ou Auto)
```

**Explication** :
- `v=spf1` : Version SPF 1
- `mx:warecast.fr` : Autorise les serveurs MX du domaine
- `a:mail.warecast.fr` : Autorise le serveur mail.warecast.fr
- `a:mailphp.lws-hosting.com` : Autorise le serveur LWS
- `-all` : Rejette tous les autres serveurs (strict)

#### 2. DKIM (DomainKeys Identified Mail)

```
Type : TXT
Nom : default._domainkey (ou default._domainkey.warecast.fr)
Valeur : v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8C8Xh049AFp+LuKVCUlwahtRFxO85rrJ0dE0idCfNAsI5Nlobf02gik8jesZ04clvZ0lxaM+L8IU50AKVHeFva83Y7LVJdeaXk14fO3gwQ1r/asNhzvg++88bfhSaLKD5M4Eid13mBrpsV3gP/MeGIzsty0AMUUNpDwe0otnv3wIDAQAB
TTL : 3600 (ou Auto)
```

**Explication** :
- `v=DKIM1` : Version DKIM 1
- `k=rsa` : Clé de type RSA
- `p=MIG...` : Clé publique pour vérification signature

#### 3. DMARC (Domain-based Message Authentication)

```
Type : TXT
Nom : _dmarc (ou _dmarc.warecast.fr)
Valeur : v=DMARC1; p=quarantine;
TTL : 3600 (ou Auto)
```

**Explication** :
- `v=DMARC1` : Version DMARC 1
- `p=quarantine` : Mettre en quarantaine (spam) les emails non authentifiés
- Alternative `p=none` : Mode surveillance (pas de blocage)
- Alternative `p=reject` : Rejeter totalement (très strict)

**Note** : `p=quarantine` est recommandé (équilibre entre sécurité et flexibilité).

---

## ✅ Vérification : Méthode 1 (Ligne de commande)

### Windows (PowerShell ou CMD)

#### Vérifier SPF

```powershell
nslookup -type=txt warecast.fr
```

**Résultat attendu** :
```
warecast.fr     text = "v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all"
```

Si vous voyez cette ligne → ✅ SPF configuré correctement

#### Vérifier DKIM

```powershell
nslookup -type=txt default._domainkey.warecast.fr
```

**Résultat attendu** :
```
default._domainkey.warecast.fr  text = "v=DKIM1; k=rsa; p=MIGfMA0GC..."
```

Si vous voyez cette ligne → ✅ DKIM configuré correctement

#### Vérifier DMARC

```powershell
nslookup -type=txt _dmarc.warecast.fr
```

**Résultat attendu** :
```
_dmarc.warecast.fr      text = "v=DMARC1; p=quarantine;"
```

Si vous voyez cette ligne → ✅ DMARC configuré correctement

### macOS / Linux

```bash
# SPF
dig txt warecast.fr +short

# DKIM
dig txt default._domainkey.warecast.fr +short

# DMARC
dig txt _dmarc.warecast.fr +short
```

---

## 🌐 Vérification : Méthode 2 (Outils en ligne)

### Option A : MXToolbox (Recommandé)

**SPF Check** :
1. Aller sur https://mxtoolbox.com/spf.aspx
2. Entrer : `warecast.fr`
3. Cliquer "SPF Record Lookup"

**Résultat attendu** :
```
✅ SPF Record found
v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all
```

**DKIM Check** :
1. Aller sur https://mxtoolbox.com/dkim.aspx
2. Entrer domaine : `warecast.fr`
3. Entrer selector : `default`
4. Cliquer "DKIM Lookup"

**Résultat attendu** :
```
✅ DKIM Record found
v=DKIM1; k=rsa; p=MIGfMA0GC...
```

**DMARC Check** :
1. Aller sur https://mxtoolbox.com/dmarc.aspx
2. Entrer : `warecast.fr`
3. Cliquer "DMARC Lookup"

**Résultat attendu** :
```
✅ DMARC Record found
v=DMARC1; p=quarantine;
```

### Option B : DNSChecker.org

1. Aller sur https://dnschecker.org
2. Sélectionner type : **TXT**
3. Entrer selon le record :
   - SPF : `warecast.fr`
   - DKIM : `default._domainkey.warecast.fr`
   - DMARC : `_dmarc.warecast.fr`
4. Cliquer "Search"

**Avantage** : Vérification multi-serveurs DNS (propagation mondiale)

### Option C : Google Admin Toolbox

1. Aller sur https://toolbox.googleapps.com/apps/checkmx
2. Entrer : `warecast.fr`
3. Cliquer "Run checks"

**Vérifie automatiquement** :
- MX records
- SPF record
- DMARC record
- DKIM (si configuré)

---

## ⏱️ Propagation DNS

### Délai normal

Après configuration dans Vercel, les DNS mettent du temps à se propager :

- **Minimum** : 5 minutes
- **Typique** : 1-4 heures
- **Maximum** : 24-48 heures

### Vérifier propagation mondiale

**Outil** : https://www.whatsmydns.net

**Procédure** :
1. Sélectionner type : **TXT**
2. Entrer : `warecast.fr` (pour SPF)
3. Voir résultats par pays/serveur

**Résultat attendu** :
- Checkmarks verts ✅ sur la plupart des serveurs
- Si certains rouges ❌ : Attendre encore quelques heures

---

## 🔧 Problèmes courants

### Problème 1 : "No TXT record found"

**Causes** :
- DNS pas encore propagé (attendre)
- Erreur de configuration dans Vercel
- Typo dans le nom ou valeur

**Solutions** :
1. Attendre 24h propagation complète
2. Vérifier configuration exacte dans Vercel :
   - Panel Vercel → Domaines → DNS Records
   - Vérifier Type, Nom, Valeur
3. Comparer avec valeurs exactes ci-dessus
4. Si erreur : Modifier et sauvegarder

### Problème 2 : SPF "Too many DNS lookups"

**Cause** :
- SPF trop complexe (>10 lookups DNS)

**Votre SPF actuel** :
```
v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all
```

**Nombre de lookups** : 3 (OK, limite = 10)

**Solution** : Rien à faire, votre SPF est optimal ✅

### Problème 3 : DKIM "Invalid syntax"

**Causes** :
- Espace manquant ou en trop dans la valeur
- Guillemets mal placés
- Caractère spécial copié par erreur

**Solution** :
1. Supprimer le record DKIM dans Vercel
2. Recréer avec valeur exacte :
   ```
   v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8C8Xh049AFp+LuKVCUlwahtRFxO85rrJ0dE0idCfNAsI5Nlobf02gik8jesZ04clvZ0lxaM+L8IU50AKVHeFva83Y7LVJdeaXk14fO3gwQ1r/asNhzvg++88bfhSaLKD5M4Eid13mBrpsV3gP/MeGIzsty0AMUUNpDwe0otnv3wIDAQAB
   ```
3. Pas de guillemets, pas d'espace avant/après
4. Sauvegarder

### Problème 4 : DMARC "Multiple records"

**Cause** :
- Plusieurs enregistrements DMARC (seul 1 autorisé)

**Solution** :
1. Vérifier dans Vercel → DNS
2. Supprimer les doublons
3. Garder uniquement :
   ```
   Type : TXT
   Nom : _dmarc
   Valeur : v=DMARC1; p=quarantine;
   ```

### Problème 5 : "Record found but not on all servers"

**Cause** :
- Propagation DNS en cours

**Solution** :
- Attendre 4-24h
- Vérifier périodiquement avec whatsmydns.net
- Si après 48h toujours pas propagé : contacter support Vercel

---

## 📊 Checklist de vérification complète

### Vérifications initiales (Après configuration)

- [ ] SPF record créé dans Vercel
- [ ] DKIM record créé dans Vercel
- [ ] DMARC record créé dans Vercel
- [ ] Attendre 1h minimum (propagation)

### Vérifications DNS (Méthode ligne de commande)

- [ ] `nslookup -type=txt warecast.fr` → SPF trouvé
- [ ] `nslookup -type=txt default._domainkey.warecast.fr` → DKIM trouvé
- [ ] `nslookup -type=txt _dmarc.warecast.fr` → DMARC trouvé

### Vérifications en ligne (MXToolbox)

- [ ] SPF Check → ✅ Pass
- [ ] DKIM Check → ✅ Pass
- [ ] DMARC Check → ✅ Pass
- [ ] Blacklist Check → ✅ Not listed

### Vérifications propagation

- [ ] WhatsmyDNS.net → SPF visible mondialement
- [ ] WhatsmyDNS.net → DKIM visible mondialement
- [ ] WhatsmyDNS.net → DMARC visible mondialement

### Vérifications fonctionnelles

- [ ] Test mail-tester.com → SPF pass
- [ ] Test mail-tester.com → DKIM pass
- [ ] Test mail-tester.com → DMARC pass
- [ ] Test email réel → Reçu (pas spam)

---

## 🎯 Validation finale

Votre configuration DNS est validée si **TOUS** les critères suivent sont ✅ :

**SPF** :
- ✅ Record trouvé via nslookup
- ✅ Valeur exacte : `v=spf1 mx:warecast.fr a:mail.warecast.fr a:mailphp.lws-hosting.com -all`
- ✅ MXToolbox : Pass
- ✅ Mail-tester : SPF Pass

**DKIM** :
- ✅ Record trouvé via nslookup
- ✅ Commence par `v=DKIM1; k=rsa; p=MIG...`
- ✅ MXToolbox : Pass
- ✅ Mail-tester : DKIM Pass

**DMARC** :
- ✅ Record trouvé via nslookup
- ✅ Valeur : `v=DMARC1; p=quarantine;`
- ✅ MXToolbox : Pass
- ✅ Mail-tester : DMARC Pass

**Si tous validés** : DNS configuré correctement ! ✅

**Si 1-2 non validés** : Attendre propagation ou vérifier configuration

**Si >2 non validés** : Problème configuration à corriger dans Vercel

---

## 📅 Maintenance DNS

### Vérifications régulières

**Fréquence recommandée** :
- **Hebdomadaire** : Premier mois (période critique)
- **Mensuelle** : Après stabilisation
- **Trimestrielle** : En régime de croisière

**Que vérifier** :
1. Records DNS toujours présents (pas supprimés par erreur)
2. Pas de blacklist (mxtoolbox.com/blacklists.aspx)
3. Score mail-tester toujours >8/10

### Alertes à configurer

Si vous utilisez un monitoring (optionnel) :
- Alerte si SPF/DKIM/DMARC non trouvé
- Alerte si IP blacklistée
- Alerte si propagation DNS échoue

---

## 🔗 Ressources utiles

**Outils de vérification** :
- MXToolbox : https://mxtoolbox.com
- DNSChecker : https://dnschecker.org
- WhatsmyDNS : https://www.whatsmydns.net
- Google Toolbox : https://toolbox.googleapps.com/apps/checkmx

**Documentation** :
- SPF : https://www.open-spf.org
- DKIM : https://www.dkim.org
- DMARC : https://dmarc.org

**Support** :
- Vercel Support : https://vercel.com/support
- LWS Support : https://www.lws.fr/support.php

---

## 📝 Template de rapport DNS

Copiez et remplissez après vérification :

```markdown
# Rapport vérification DNS - [Date]

## Configuration Vercel
- Domaine : warecast.fr
- Provider DNS : Vercel

## Résultats vérification

### SPF
- nslookup : ✅ / ❌
- MXToolbox : ✅ / ❌
- Valeur trouvée : [copier valeur]

### DKIM
- nslookup : ✅ / ❌
- MXToolbox : ✅ / ❌
- Selector : default
- Valeur trouvée : [copier début]

### DMARC
- nslookup : ✅ / ❌
- MXToolbox : ✅ / ❌
- Valeur trouvée : [copier valeur]

## Propagation
- Locale : ✅ / ❌
- Mondiale (whatsmydns) : __% serveurs

## Problèmes identifiés
1. [Problème si applicable]

## Actions à prendre
1. [Action si nécessaire]

## Statut final : ✅ Validé / ⚠️ En attente / ❌ Problème
```

---

**Une fois tous les DNS validés, passez à la configuration Supabase SMTP** (voir `email-setup.md`).
