# 🛠️ Guide de Développement Dragonfly

Ce guide explique comment développer efficacement sur le projet Dragonfly avec un environnement de développement séparé de la production.

## 🎯 Problème Résolu

Avant, quand vous lanciez `npm run dev`, le serveur démarrait sur le port 3000, mais nginx redirigeait tout vers la version de production. Maintenant, le développement se fait sur le port **3002**, évitant complètement les conflits avec nginx.

## 🚀 Démarrage Rapide

### Option 1: Scripts NPM (Recommandé)
```bash
# Démarrer le serveur de développement
npm run dev:start

# Voir le statut des serveurs
npm run dev:status

# Afficher les URLs d'accès
npm run dev:urls
```

### Option 2: Script Helper Direct
```bash
# Démarrer le développement
./scripts/dev-helper.sh start-dev

# Voir toutes les commandes disponibles
./scripts/dev-helper.sh help
```

### Option 3: Commande NPM Simple
```bash
# Démarrer directement (port 3002)
npm run dev
```

## 🌐 URLs d'Accès

### 🟢 Production (Version Stable)
- **URL**: http://217.65.144.71
- **Port**: 3000 (via PM2)
- **Proxy**: Nginx sur port 80

### 🟡 Développement (Version Test)
- **URL Directe**: http://217.65.144.71:3002
- **URL Proxy**: http://217.65.144.71/dev/ *(si nginx configuré)*
- **Port**: 3002 (Next.js dev server)

## 📋 Commandes Disponibles

### Développement
```bash
npm run dev                # Démarrer sur port 3002
npm run dev:3001          # Démarrer sur port 3001
npm run dev:3003          # Démarrer sur port 3003
npm run dev:start         # Script helper: démarrer dev
npm run dev:status        # Script helper: statut des serveurs
npm run dev:urls          # Script helper: afficher les URLs
npm run dev:logs          # Script helper: logs du dev server
```

### Production
```bash
npm run build             # Build de production
npm run start             # Démarrer en mode production
npm run deploy            # Build + redémarrage PM2
npm run deploy:full       # Prisma + Build + redémarrage PM2
npm run pm2:restart       # Redémarrer PM2
npm run pm2:logs          # Logs de production
```

### Script Helper
```bash
./scripts/dev-helper.sh start-dev     # Démarrer le développement
./scripts/dev-helper.sh start-prod    # Démarrer/redémarrer la production
./scripts/dev-helper.sh stop-prod     # Arrêter la production
./scripts/dev-helper.sh status        # Statut des serveurs
./scripts/dev-helper.sh urls          # URLs d'accès
./scripts/dev-helper.sh logs-dev      # Logs du développement
./scripts/dev-helper.sh logs-prod     # Logs de production
./scripts/dev-helper.sh help          # Aide
```

## 🔄 Workflow de Développement

### 1. Démarrer le Développement
```bash
npm run dev:start
```

### 2. Développer et Tester
- Accédez à http://217.65.144.71:3002
- Vos modifications sont automatiquement rechargées (hot reload)
- Utilisez les dev tools normalement

### 3. Tester en Production
```bash
npm run deploy
```

### 4. Vérifier le Statut
```bash
npm run dev:status
```

## 🛡️ Avantages du Nouveau Système

### ✅ Séparation Claire
- **Port 3000**: Production (PM2 + Nginx)
- **Port 3002**: Développement (Next.js dev)

### ✅ Aucun Conflit
- Nginx ne touche pas au port 3002
- Cache nginx évité pour le développement
- Hot reload fonctionne parfaitement

### ✅ Flexibilité
- Plusieurs environnements de dev possibles (3001, 3002, 3003)
- Accès direct sans proxy
- Scripts automatisés

### ✅ Production Inchangée
- La production reste sur le port 3000
- Nginx continue de fonctionner normalement
- Aucun impact sur les utilisateurs

## 🔧 Configuration Nginx (Optionnelle)

Si vous voulez accéder au développement via nginx (http://217.65.144.71/dev/), ajoutez cette configuration à nginx :

```nginx
# Dans votre configuration nginx
location /dev/ {
    rewrite ^/dev/(.*) /$1 break;
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Pour les WebSockets Next.js
location /_next/webpack-hmr {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

Puis redémarrez nginx :
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🚨 Dépannage

### Le port 3002 est occupé
```bash
# Trouver le processus
lsof -i :3002

# Tuer le processus
pkill -f "next dev.*3002"
```

### Le serveur de dev ne démarre pas
```bash
# Vérifier les erreurs
npm run dev

# Vérifier les dépendances
npm install
```

### Problème de permissions
```bash
# Rendre le script exécutable
chmod +x scripts/dev-helper.sh
```

## 💡 Conseils

1. **Toujours utiliser :3002** pour le développement
2. **Tester en production** avant de pousser en prod
3. **Utiliser les scripts helper** pour plus de facilité
4. **Vérifier le statut** régulièrement avec `npm run dev:status`

## 🎉 Vous êtes prêt !

Maintenant vous pouvez développer sereinement sans que nginx interfère avec votre environnement de développement !

```bash
# Démarrez et amusez-vous ! 🚀
npm run dev:start
``` 