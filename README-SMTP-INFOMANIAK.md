# Configuration SMTP Infomaniak pour le formulaire de contact

## Avantages de cette solution

✅ **Utilise votre infrastructure existante** Infomaniak  
✅ **Pas de service externe** supplémentaire  
✅ **Emails envoyés depuis votre domaine** directement  
✅ **Fonction Reply-To** pour répondre facilement aux clients  
✅ **Plus simple et économique** que Resend

## Configuration requise

### 1. Variables d'environnement

Dans votre fichier `.env.local`, configurez :

```env
# Configuration SMTP Infomaniak
SMTP_USER="admin@dragonfly-trimarans.org"
SMTP_PASSWORD="votre-mot-de-passe-email-infomaniak"
```

### 2. Paramètres SMTP Infomaniak

Le code utilise automatiquement ces paramètres :

- **Serveur SMTP** : `mail.infomaniak.com`
- **Port** : `587` (STARTTLS)
- **Sécurité** : STARTTLS
- **Authentification** : Nom d'utilisateur et mot de passe

## Fonctionnalités

### 📧 Email de notification

Quand quelqu'un remplit le formulaire, vous recevez un email avec :

- **Informations du contact** : nom, email, sujet, date
- **Message complet** formaté et lisible
- **Fonction Reply-To** : répondez directement au client
- **Design professionnel** avec emojis et couleurs

### 🔄 Workflow simple

1. **Client** remplit le formulaire sur `/contact`
2. **Système** envoie un email à `admin@dragonfly-trimarans.org`
3. **Vous** recevez la notification dans votre boîte Infomaniak
4. **Vous** répondez directement depuis votre client email habituel

## Sécurité

- ✅ **Validation des données** côté serveur
- ✅ **Validation du format email**
- ✅ **Protection contre le spam** (validation requise)
- ✅ **Authentification SMTP** sécurisée

## Avantages vs Resend

| Critère           | SMTP Infomaniak               | Resend                       |
| ----------------- | ----------------------------- | ---------------------------- |
| **Coût**          | Inclus dans votre hébergement | Payant après 3000 emails     |
| **Configuration** | Simple (2 variables)          | Plus complexe (domaine, DNS) |
| **Maintenance**   | Aucune                        | Gestion des quotas           |
| **Intégration**   | Directe avec votre email      | Service externe              |
| **Réponses**      | Depuis votre client email     | Interface séparée            |

## Dépannage

### Erreur d'authentification

- Vérifiez que `SMTP_USER` est votre email complet
- Vérifiez que `SMTP_PASSWORD` est correct
- Assurez-vous que l'email existe dans votre compte Infomaniak

### Emails non reçus

- Vérifiez votre dossier spam
- Confirmez que `admin@dragonfly-trimarans.org` existe
- Testez l'envoi avec un autre email de destination

### Erreur de connexion

- Vérifiez votre connexion internet
- Confirmez que le port 587 n'est pas bloqué
- Essayez le port 465 avec `secure: true` si nécessaire

## Configuration alternative (port 465)

Si le port 587 ne fonctionne pas, modifiez dans `app/api/contact/route.ts` :

```typescript
const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

## Test

1. Configurez vos variables d'environnement
2. Redémarrez votre serveur : `npm run dev`
3. Allez sur `/contact`
4. Remplissez et envoyez le formulaire
5. Vérifiez votre boîte `admin@dragonfly-trimarans.org`

## Support

- **Documentation Infomaniak** : [aide.infomaniak.com](https://aide.infomaniak.com)
- **Support technique** : Via votre espace client Infomaniak
