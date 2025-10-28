# Guide de Développement - Dragonfly

## 🎯 Contexte : VM Hostinger KM2

Vous êtes sur une VM Hostinger avec des ressources limitées. Voici les deux approches de développement recommandées.

---

## 🚀 Option 1 : Mode Développement Docker (RECOMMANDÉ)

### Avantages
✅ **Pas de rebuild** - Les modifications sont détectées instantanément  
✅ **Hot-reload** - Rechargez simplement votre navigateur  
✅ **Environnement isolé** - Aucune dépendance à installer sur la VM  
✅ **Facile à basculer** - Passez facilement de dev à prod  

### Utilisation

```bash
# Démarrer en mode développement
cd /var/www/dragonfly
./dev.sh
```

### Ce qui se passe :
- Le code source est monté comme volume dans le conteneur
- Next.js démarre en mode développement avec Turbo
- Les modifications dans `/app`, `/components`, `/utils`, etc. sont automatiquement rechargées
- **Pas besoin de rebuilder l'image Docker**

### Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose -f docker-compose.dev.yml logs -f app

# Redémarrer uniquement l'application
docker-compose -f docker-compose.dev.yml restart app

# Arrêter l'environnement de développement
docker-compose -f docker-compose.dev.yml down

# Entrer dans le conteneur pour debug
docker exec -it dragonfly_app_dev sh
```

### Dossiers synchronisés (hot-reload)
- `/app` - Pages et routes
- `/components` - Composants React
- `/utils` - Utilitaires
- `/lib` - Bibliothèques
- `/prisma` - Schéma de base de données
- `/public` - Assets statiques
- `/styles` - Styles CSS

---

## 🏭 Option 2 : Mode Production

### Quand l'utiliser ?
- Tester les performances de production
- Vérifier le build final
- Déployer en production

### Utilisation

```bash
# Démarrer en mode production
cd /var/www/dragonfly
./prod.sh
```

### Ce qui se passe :
- L'image Docker est rebuildée avec les dernières modifications
- Next.js est compilé en mode production
- L'application est optimisée et minifiée
- **Nécessite un rebuild à chaque modification**

---

## 🔄 Workflow de Développement Recommandé

### 1. Développement quotidien

```bash
# 1. Démarrer en mode dev
./dev.sh

# 2. Développer
# - Modifier vos fichiers dans /app, /components, etc.
# - Les changements sont automatiquement rechargés
# - Pas besoin de redémarrer Docker

# 3. Voir les logs si besoin
docker-compose -f docker-compose.dev.yml logs -f app
```

### 2. Tests avant mise en production

```bash
# 1. Basculer en mode prod
./prod.sh

# 2. Tester l'application
curl http://localhost:3000

# 3. Si tout est OK, laisser en prod
```

---

## 📊 Comparaison des Modes

| Aspect | Mode DEV | Mode PROD |
|--------|----------|-----------|
| **Hot-reload** | ✅ Oui | ❌ Non |
| **Rebuild nécessaire** | ❌ Non | ✅ Oui (à chaque modif) |
| **Vitesse de démarrage** | ⚡ Rapide | 🐢 Lent (build) |
| **Performance** | 🐢 Plus lent | ⚡ Optimisé |
| **Taille image** | 📦 Large | 📦 Moyenne |
| **Debug** | ✅ Facile | ❌ Difficile |
| **Ressources VM** | 💾 Moyennes | 💾 Faibles (une fois démarré) |

---

## 🔧 Modifications du Schéma Prisma

Si vous modifiez le schéma Prisma (`prisma/schema.prisma`) :

### En mode DEV :
```bash
# 1. Entrer dans le conteneur
docker exec -it dragonfly_app_dev sh

# 2. Créer la migration
npx prisma migrate dev --name nom_de_la_migration

# 3. Exit
exit

# L'app se recharge automatiquement
```

### En mode PROD :
```bash
# Vous devez rebuilder
./prod.sh
```

---

## 🐛 Dépannage

### Le site ne répond plus après `./prod.sh`
```bash
# Relancer proprement
docker-compose down && docker-compose up -d
```

### Les modifications ne sont pas prises en compte en DEV
```bash
# Redémarrer le conteneur dev
docker-compose -f docker-compose.dev.yml restart app
```

### Erreur "ContainerConfig"
```bash
# Nettoyage complet
docker-compose down
docker-compose up -d
```

### Manque de ressources sur la VM
```bash
# Nettoyer les images inutilisées
docker system prune -a

# Ou utiliser le mode local (sans Docker)
npm run dev
```

---

## 💡 Recommandations pour VM KM2

1. **Utilisez le mode DEV** pendant la journée de travail
2. **Basculez en PROD** uniquement pour tester ou déployer
3. **Nettoyez régulièrement** : `docker system prune -a`
4. **Surveillez les ressources** : `docker stats`

---

## 📝 Résumé des Commandes

```bash
# MODE DÉVELOPPEMENT (sans rebuild)
./dev.sh                                            # Démarrer
docker-compose -f docker-compose.dev.yml logs -f    # Logs
docker-compose -f docker-compose.dev.yml down       # Arrêter

# MODE PRODUCTION (avec rebuild)
./prod.sh                                           # Démarrer
docker-compose logs -f app                          # Logs
docker-compose down                                 # Arrêter

# DÉPANNAGE
docker-compose down && docker-compose up -d         # Relancer proprement
docker system prune -a                              # Nettoyer
```

