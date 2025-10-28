#!/bin/bash

# Script d'aide pour configurer le CI/CD

echo "🚀 Configuration du CI/CD pour Dragonfly"
echo ""

# Vérifier si Git est configuré
echo "📋 Vérification de la configuration Git..."
if git config --get user.name > /dev/null && git config --get user.email > /dev/null; then
    echo "✅ Git configuré: $(git config --get user.name) <$(git config --get user.email)>"
else
    echo "⚠️ Git pas configuré. Configurez-le avec:"
    echo "   git config user.name \"Votre Nom\""
    echo "   git config user.email \"votre.email@example.com\""
fi

echo ""

# Vérifier si on est dans un repo Git
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Repository Git initialisé"

    # Vérifier le status
    echo "📊 Status du repository:"
    git status --porcelain | head -10

    if [ $(git status --porcelain | wc -l) -gt 0 ]; then
        echo ""
        echo "💡 Vous avez des changements non committés."
        echo "   Commitez-les avec: git add . && git commit -m \"Message\""
    fi

    # Vérifier le remote
    if git remote get-url origin > /dev/null 2>&1; then
        echo "✅ Remote GitHub configuré: $(git remote get-url origin)"
    else
        echo "⚠️ Aucun remote GitHub configuré."
        echo "   Ajoutez-le avec: git remote add origin https://github.com/YOUR_USERNAME/dragonfly.git"
    fi
else
    echo "❌ Pas dans un repository Git"
    echo "   Initialisez avec: git init"
fi

echo ""

# Vérifier Docker
echo "🐳 Vérification Docker..."
if docker --version > /dev/null 2>&1; then
    echo "✅ Docker installé: $(docker --version)"
else
    echo "❌ Docker pas installé"
fi

if docker-compose --version > /dev/null 2>&1; then
    echo "✅ Docker Compose installé: $(docker-compose --version)"
else
    echo "❌ Docker Compose pas installé"
fi

echo ""

# Vérifier les conteneurs
echo "📦 Vérification des conteneurs..."
if docker ps | grep -q dragonfly; then
    echo "✅ Conteneurs Dragonfly actifs:"
    docker ps --filter name=dragonfly --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "⚠️ Aucun conteneur Dragonfly actif"
fi

echo ""

# Vérifier l'application
echo "🌐 Vérification de l'application..."
if curl -f --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application accessible sur http://localhost:3000"
else
    echo "❌ Application non accessible sur http://localhost:3000"
fi

echo ""

# Instructions finales
echo "📋 PROCHAINES ÉTAPES:"
echo ""
echo "1. 🌐 Créez un repository sur GitHub:"
echo "   https://github.com/new"
echo "   Nommez-le 'dragonfly'"
echo ""
echo "2. 🔗 Ajoutez le remote GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/dragonfly.git"
echo ""
echo "3. 🔐 Configurez les secrets GitHub:"
echo "   - SERVER_HOST: votre-ip-ou-domaine"
echo "   - SERVER_USER: root"
echo "   - SSH_PRIVATE_KEY: contenu de ~/.ssh/id_rsa"
echo "   - SERVER_PORT: 22"
echo ""
echo "4. 📤 Poussez votre code:"
echo "   git add ."
echo "   git commit -m \"🚀 Setup CI/CD\""
echo "   git push -u origin main"
echo ""
echo "5. 🎉 GitHub Actions déploiera automatiquement !"
echo ""

echo "📚 Documentation complète dans README.md"
