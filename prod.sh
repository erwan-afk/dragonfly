#!/bin/bash

# Script pour lancer l'environnement de production

echo "🚀 Démarrage de l'environnement de production..."

# Arrêter l'environnement de développement si actif
if docker ps | grep -q dragonfly_app_dev; then
    echo "📦 Arrêt de l'environnement de développement..."
    docker-compose -f docker-compose.dev.yml down
fi

# Build et démarrage en mode production
echo "🔨 Build de l'image de production..."
docker-compose build app

echo "✨ Démarrage des conteneurs..."
docker-compose down && docker-compose up -d

echo ""
echo "✅ Environnement de production démarré!"
echo "📝 Logs de l'application: docker-compose logs -f app"
echo "🌐 Application accessible sur: http://localhost:3000"
echo "🛑 Arrêter: docker-compose down"

