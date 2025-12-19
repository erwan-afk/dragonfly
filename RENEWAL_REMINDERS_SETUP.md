# Configuration des rappels de renouvellement d'annonces

Ce document explique comment configurer le système automatique d'envoi d'emails de rappel de renouvellement d'annonces qui expirent dans 7 jours.

## Vue d'ensemble

Le système fonctionne en 3 parties :
1. **Script de vérification** (`scripts/send-renewal-reminders.ts`) - identifie les annonces expirant bientôt
2. **API Route** (`app/api/send-renewal-reminders/route.ts`) - endpoint sécurisé pour déclencher les emails
3. **Planification automatique** - exécution régulière via cron job

## Configuration requise

### Variables d'environnement

Ajoutez ces variables dans votre configuration Vercel :

```env
# Token secret pour sécuriser l'API (générez un token aléatoire fort)
CRON_SECRET_TOKEN=votre_token_secret_très_long_et_aléatoire

# Configuration SMTP (déjà existante)
SMTP_USER=votre_email@domain.com
SMTP_PASSWORD=votre_mot_de_passe_smtp

# URL du site (pour les liens dans les emails)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.vercel.app
```

### Générer un token secret sécurisé

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Ou utiliser Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Options de configuration sur Vercel

### Option 1 : Vercel Cron Jobs (recommandé - si disponible)

Si votre plan Vercel supporte les cron jobs :

1. Dans votre `vercel.json`, ajoutez :

```json
{
  "crons": [
    {
      "path": "/api/send-renewal-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Explication du cron :** `0 9 * * *` = tous les jours à 9h00 UTC

### Option 2 : Service de cron externe (recommandé pour tous les plans)

Utilisez un service comme [Cron-Job.org](https://cron-job.org) (gratuit) :

1. Créez un compte sur cron-job.org
2. Ajoutez une nouvelle tâche cron :
   - **URL :** `https://votre-domaine.vercel.app/api/send-renewal-reminders`
   - **Méthode :** POST
   - **Headers :**
     ```
     Authorization: Bearer VOTRE_CRON_SECRET_TOKEN
     Content-Type: application/json
     ```
   - **Schedule :** Tous les jours à 9:00 (heure de votre choix)

### Option 3 : GitHub Actions (gratuit)

Créez un workflow GitHub Actions :

```yaml
# .github/workflows/renewal-reminders.yml
name: Send Renewal Reminders

on:
  schedule:
    # Tous les jours à 9h00 UTC
    - cron: '0 9 * * *'
  workflow_dispatch: # Pour déclenchement manuel

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send renewal reminders
        run: |
          curl -X POST \
            https://votre-domaine.vercel.app/api/send-renewal-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json"
```

**Variables secrètes GitHub :**
- Allez dans Settings > Secrets and variables > Actions
- Ajoutez `CRON_SECRET_TOKEN` avec votre token secret

## Test de la fonctionnalité

### Test manuel via l'API

```bash
# Remplacer VOTRE_TOKEN par votre token secret
curl -X POST \
  https://votre-domaine.vercel.app/api/send-renewal-reminders \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json"
```

### Test local

```bash
# Depuis la racine du projet
npm run renewal:send
```

## Fonctionnement détaillé

### Quand les emails sont envoyés ?

- Le script vérifie **toutes les annonces actives**
- Il calcule la date d'expiration basée sur :
  - Date de création de l'annonce
  - Durée du produit (3 ou 4 mois selon le plan)
- Les emails sont envoyés **exactement 7 jours** avant l'expiration

### Contenu de l'email

L'email inclut :
- Nom de l'utilisateur
- Modèle du bateau
- Date d'expiration exacte
- Nombre de jours restants
- Lien vers la page de renouvellement
- Informations sur les avantages du renouvellement

### Sécurité

- L'API est protégée par un token secret
- Seules les requêtes autorisées peuvent déclencher les emails
- Logs détaillés pour le monitoring

## Monitoring et logs

### Logs Vercel

Les logs sont disponibles dans le dashboard Vercel :
- Function logs pour l'API route
- Console logs pour le script

### Logs importants à surveiller

```
✅ Email de renouvellement envoyé à user@email.com pour l'annonce "Sun Odyssey 389"
❌ Erreur lors de l'envoi de l'email à user@email.com: [erreur détaillée]
⏰ Déclenchement automatique des rappels de renouvellement (cron job)...
```

## Dépannage

### Les emails ne sont pas envoyés

1. **Vérifiez le token secret** : Assurez-vous que `CRON_SECRET_TOKEN` est correctement configuré
2. **Vérifiez les credentials SMTP** : `SMTP_USER` et `SMTP_PASSWORD` doivent être valides
3. **Vérifiez les annonces actives** : Le script ne traite que les annonces avec `status = 'active'`

### Erreur 401 Unauthorized

- Le token dans l'header `Authorization: Bearer TOKEN` ne correspond pas à `CRON_SECRET_TOKEN`

### Timeout Vercel

- Si vous avez beaucoup d'annonces, la fonction peut atteindre la limite de 5 minutes
- Envisagez de paginer le traitement ou d'optimiser les requêtes

## Améliorations futures

- [ ] Récupération du nom du produit depuis les paiements Stripe pour une durée plus précise
- [ ] Pagination pour les gros volumes d'annonces
- [ ] Métriques et monitoring avancés
- [ ] Possibilité pour les utilisateurs de se désabonner des rappels
- [ ] Tests automatisés pour le script

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Vercel
2. Testez l'API manuellement avec curl
3. Vérifiez la configuration des variables d'environnement
