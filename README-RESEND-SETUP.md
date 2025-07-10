# Configuration Resend pour le formulaire de contact

## Qu'est-ce que Resend ?

Resend est un service d'envoi d'emails transactionnels moderne et fiable, spécialement conçu pour les développeurs. Il offre une API simple et des fonctionnalités avancées pour l'envoi d'emails.

## Étapes de configuration

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Obtenir votre clé API

1. Connectez-vous à votre dashboard Resend
2. Allez dans la section "API Keys"
3. Cliquez sur "Create API Key"
4. Donnez un nom à votre clé (ex: "Dragonfly Contact Form")
5. Copiez la clé générée

### 3. Configurer votre domaine (Recommandé)

Pour éviter que vos emails finissent en spam, il est recommandé de configurer votre propre domaine :

1. Dans le dashboard Resend, allez dans "Domains"
2. Cliquez sur "Add Domain"
3. Entrez votre domaine (ex: `dragonfly.com`)
4. Suivez les instructions pour ajouter les enregistrements DNS
5. Attendez la vérification du domaine

### 4. Configurer les variables d'environnement

Ajoutez votre clé API dans votre fichier `.env.local` :

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5. Modifier l'adresse email (si nécessaire)

Si vous utilisez votre propre domaine, modifiez les adresses email dans `app/api/contact/route.ts` :

```typescript
// Remplacez par votre domaine vérifié
from: 'contact@votre-domaine.com',
to: ['contact@votre-domaine.com'],
```

## Limites du plan gratuit

- 100 emails par jour
- 3 000 emails par mois
- Pas de domaine personnalisé (utilise resend.dev)

## Fonctionnalités du formulaire de contact

✅ **Validation des données** : Vérification des champs requis et format email
✅ **Email de notification** : Envoyé à l'équipe avec les détails du message
✅ **Email de confirmation** : Envoyé automatiquement au client
✅ **Design responsive** : Interface adaptée à tous les écrans
✅ **États de chargement** : Feedback visuel pendant l'envoi
✅ **Gestion d'erreurs** : Messages d'erreur clairs pour l'utilisateur

## Structure des emails

### Email de notification (pour l'équipe)

- Informations du contact (nom, email, sujet)
- Message complet
- Possibilité de répondre directement

### Email de confirmation (pour le client)

- Message de remerciement personnalisé
- Récapitulatif du message envoyé
- Coordonnées de l'entreprise
- Délai de réponse estimé

## Dépannage

### Problème : "Domaine non vérifié"

- Vérifiez que votre domaine est correctement configuré dans Resend
- Utilisez `onboarding@resend.dev` pour les tests

### Problème : "Quota dépassé"

- Vérifiez votre usage dans le dashboard Resend
- Considérez un upgrade vers un plan payant

### Problème : "Emails en spam"

- Configurez SPF, DKIM et DMARC pour votre domaine
- Utilisez un domaine vérifié au lieu de resend.dev

## Test du formulaire

1. Lancez votre serveur de développement : `npm run dev`
2. Allez sur `/contact`
3. Remplissez et envoyez le formulaire
4. Vérifiez la réception des emails

## Support

- Documentation Resend : [docs.resend.com](https://docs.resend.com)
- Support Resend : support@resend.com
