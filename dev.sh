#!/bin/bash

# Script pour lancer l'environnement de développement

echo "🚀 Démarrage de l'environnement de développement..."
echo ""
echo "⚠️  ATTENTION: Ceci va arrêter l'environnement de PRODUCTION!"
echo "⚠️  Le site sera inaccessible pendant le développement."
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

# Arrêter l'environnement de production si actif
if docker ps | grep -q dragonfly_app; then
    echo "📦 Arrêt de l'environnement de production..."
    docker-compose down
fi

# Build et démarrage en mode dev
echo "🔨 Build de l'image de développement..."
docker-compose -f docker-compose.dev.yml build app

echo "✨ Démarrage des conteneurs..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Environnement de développement démarré!"
echo "📝 Logs de l'application: docker-compose -f docker-compose.dev.yml logs -f app"
echo "🌐 Application accessible sur: http://localhost:3000"
echo "🛑 Arrêter: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "💡 Vos modifications dans /app, /components, /utils seront automatiquement rechargées!"

