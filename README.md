# 🚀 Dragonfly - CI/CD Setup

Application Next.js avec déploiement automatisé sur Hostinger VM.

## 📋 Prérequis

- Node.js 20+
- Docker & Docker Compose
- Git
- Compte GitHub (pour le CI/CD)

## 🚀 Installation & Configuration

### 1. Configuration Git

```bash
# Vérifier la configuration Git
git config --list

# Configurer si nécessaire
git config user.name "Votre Nom"
git config user.email "votre.email@example.com"
```

### 2. Créer un repository sur GitHub

1. Allez sur https://github.com/new
2. Créez un repository `dragonfly`
3. **NE PAS** initialiser avec README, .gitignore ou licence

### 3. Pousser le code initial

```bash
# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "🚀 Initial setup with CI/CD"

# Ajouter le remote GitHub (remplacez YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dragonfly.git

# Pousser
git push -u origin main
```

## 🔐 Configuration des Secrets GitHub

### Accès SSH à votre VM

1. **Sur votre VM Hostinger**, générez une clé SSH :
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@dragonfly"
# Appuyez sur Entrée pour accepter les valeurs par défaut
```

2. **Affichez la clé publique** :
```bash
cat ~/.ssh/id_rsa.pub
```

3. **Ajoutez cette clé publique** aux clés autorisées de votre VM :
```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

4. **Affichez la clé privée** (pour GitHub) :
```bash
cat ~/.ssh/id_rsa
```

### Configuration dans GitHub

1. Allez dans votre repo → **Settings** → **Secrets and variables** → **Actions**
2. Ajoutez ces secrets :

| Secret | Valeur | Description |
|--------|--------|-------------|
| `SERVER_HOST` | `votre-ip-ou-domaine.com` | Adresse de votre VM |
| `SERVER_USER` | `root` | Utilisateur SSH |
| `SSH_PRIVATE_KEY` | Contenu de `~/.ssh/id_rsa` | Clé privée SSH |
| `SERVER_PORT` | `22` | Port SSH (généralement 22) |

## 🔄 Workflow de Développement

### Développement Local

```bash
# 1. Cloner le repo
git clone https://github.com/YOUR_USERNAME/dragonfly.git
cd dragonfly

# 2. Installer les dépendances
npm install

# 3. Démarrer le développement
npm run dev

# 4. Modifier vos fichiers
# Les changements sont automatiquement rechargés
```

### Déploiement Automatique

```bash
# 1. Commiter vos changements
git add .
git commit -m "✨ Nouvelle fonctionnalité"

# 2. Pousser sur main
git push origin main

# 3. GitHub Actions déploie automatiquement !
# Suivez le déploiement dans l'onglet "Actions" de GitHub
```

## 📊 Scripts Disponibles

### Déploiement Local (pour tests)
```bash
./deploy.sh
```

### Gestion des Conteneurs
```bash
# Voir les logs
docker-compose logs -f app

# Redémarrer
docker-compose restart app

# Arrêter tout
docker-compose down
```

## 🛠️ Structure du Projet

```
dragonfly/
├── .github/workflows/     # CI/CD GitHub Actions
├── app/                   # Pages Next.js
├── components/           # Composants React
├── utils/                # Utilitaires
├── prisma/               # Schéma base de données
├── public/               # Assets statiques
├── docker-compose.yml    # Configuration Docker
├── deploy.sh            # Script de déploiement local
└── README.md            # Cette documentation
```

## 🔍 Monitoring & Dépannage

### Vérifier le déploiement
```bash
# Sur votre VM
docker-compose ps
docker-compose logs -f app
```

### En cas de problème
```bash
# Restaurer la dernière sauvegarde
cd /var/www
ls -la backup_*
# Restaurer manuellement si nécessaire
```

### Logs GitHub Actions
- Allez dans votre repo GitHub
- Onglet **Actions**
- Cliquez sur le dernier workflow
- Voir les logs détaillés

## 📞 Support

Si vous avez des problèmes :

1. Vérifiez les logs GitHub Actions
2. Vérifiez les logs Docker sur la VM
3. Testez localement avant de pousser

## 🎯 Bonnes Pratiques

- ✅ Commitez régulièrement
- ✅ Testez localement avant de pousser
- ✅ Utilisez des messages de commit descriptifs
- ✅ Ne commitez jamais de secrets (.env)
- ✅ Gardez les backups automatiquement

---

**Prêt à développer ?** 🚀 Commitez votre premier changement et regardez GitHub Actions déployer automatiquement !
