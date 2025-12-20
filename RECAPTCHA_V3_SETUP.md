# 🔒 Configuration reCAPTCHA v3 Gratuit

## ✅ Migration Terminée

Votre application utilise maintenant **reCAPTCHA v3 gratuit** (au lieu d'Enterprise).

## 🚨 URGENT : Créez une NOUVELLE Clé v3 !

**⚠️ VOS CLÉS ACTUELLES SONT POUR ENTERPRISE - ELLES NE MARCHENT PAS AVEC V3 !**

- ❌ `6LcfQTEsAAAAALJztMXdrE4hrKV1ExoDqU7w62ZU` = Clé **Enterprise**
- ✅ Vous devez créer une **nouvelle clé** de type `reCAPTCHA v3`

Les clés Enterprise et v3 gratuit sont **différentes** et **incompatibles** !

## 🔑 Obtenir les Clés reCAPTCHA v3

### Étape 1 : Aller sur Google reCAPTCHA

1. Allez sur https://www.google.com/recaptcha/admin/create
2. Connectez-vous avec votre compte Google

### Étape 2 : Créer un NOUVEAU site (PAS utiliser l'ancien !)

**IMPORTANT** : Ne modifiez pas votre clé Enterprise existante. Créez-en une **nouvelle** !

- **Label** : `Dragonfly App v3` (pour la différencier)
- **Type de reCAPTCHA** : `reCAPTCHA v3` ← **OBLIGATOIRE !**
- **Domaines** :
  - `localhost` (pour développement)
  - `votredomaine.com` (pour production)
- **Propriétaire** : Votre email

**Résultat** : Vous obtiendrez de **nouvelles clés** qui commencent par `6L` mais sont différentes des anciennes !

⚠️ **ATTENTION** : Assurez-vous de sélectionner **reCAPTCHA v3** (pas v2 ou Enterprise !)

### Étape 3 : Récupérer les clés

Après création, vous obtiendrez :

- **Clé du site** (publique) : Commence par `6L`
- **Clé secrète** (privée) : Aussi commence par `6L`

## ⚙️ Configuration dans .env

**REMPLACEZ** vos anciennes clés Enterprise par les **nouvelles clés v3** :

```env
# ❌ ANCIENNES CLÉS (Enterprise - NE MARCHENT PAS !)
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcfQTEsAAAAALJztMXdrE4hrKV1ExoDqU7w62ZU
# RECAPTCHA_SECRET_KEY=6LcfQTEsAAAAAN7LVZauO5PAdncCzZ7LxeOW07Up

# ✅ NOUVELLES CLÉS (v3 Gratuit)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6L[NOUVELLE_CLE_SITE_V3]
RECAPTCHA_SECRET_KEY=6L[NOUVELLE_CLE_SECRETE_V3]
```

## 🚀 Fonctionnalités v3 Gratuit

- ✅ **Gratuit** : 1 million d'évaluations/mois
- ✅ **Invisible** : Pas d'interaction utilisateur
- ✅ **Score de 0.0 à 1.0** (seuil 0.5 configuré)
- ✅ **Protection anti-bot** efficace

## ⚙️ Implémentation Technique

**Méthode** : API globale `grecaptcha` (sans composant React)

- ✅ **Invisible** : Aucune UI visible pour l'utilisateur
- ✅ **Automatique** : S'exécute lors de la soumission du formulaire
- ✅ **Action-based** : Utilise l'action "signup" pour le scoring
- ✅ **Single-use tokens** : Chaque token est unique

## 🔍 Dépannage : "Invalid site key"

### Vérifications à faire :

1. **Type de clé** : Dans Google reCAPTCHA Console, vérifiez que c'est `reCAPTCHA v3`
2. **Domaine** : `localhost` doit être dans la liste des domaines autorisés
3. **Clé publique** : Utilisez la clé du site (celle qui commence par `6L`)
4. **Script chargé** : Vérifiez dans l'onglet Network que `api.js` se charge

### Erreurs courantes :

- ❌ Clé Enterprise utilisée avec API v3
- ❌ Domaine manquant dans la configuration
- ❌ Mauvaise clé (secrète au lieu de publique)
- ❌ Script reCAPTCHA pas chargé

## 🧪 Test

Une fois les clés configurées :

1. Allez sur `http://localhost:3000/signin`
2. Ouvrez les DevTools (F12) → Console
3. Créez un compte
4. **Logs attendus** :
   - Client : `reCAPTCHA v3 execution completed`
   - Serveur : `reCAPTCHA v3 score: 0.9, success: true`

## 🔄 Migration Enterprise → v3

Si vous aviez des clés Enterprise avant :

- **Supprimez-les** complètement
- **Créez un nouveau site** avec type `reCAPTCHA v3`
- **Utilisez les nouvelles clés** v3 (commencent aussi par `6L` mais sont différentes)

## 💰 Au-delà de 1M

Si vous dépassez 1 million d'évaluations/mois :

- **Enterprise** : 0.60$ par 1,000 évaluations
- **Migration facile** : Même API, juste changement de clés

## 🔍 Dépannage

**Erreur "Invalid key type"** :

- Vérifiez que vous utilisez des clés **v3** (pas v2)
- Assurez-vous que `localhost` est dans les domaines autorisés

**Captcha pas invisible** :

- Vérifiez que `size="invisible"` dans le composant
- Le captcha v3 est toujours invisible par défaut
