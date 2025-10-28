#!/bin/bash

# Script de déploiement local pour les tests

echo "🚀 Déploiement local de Dragonfly..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erreur: docker-compose.yml non trouvé. Êtes-vous dans le répertoire du projet ?"
    exit 1
fi

# Créer une sauvegarde
echo "📦 Création d'une sauvegarde..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
cp -r . "../${BACKUP_NAME}" 2>/dev/null || echo "⚠️ Impossible de créer la sauvegarde (peut-être en raison des permissions)"

# Arrêter les conteneurs
echo "🛑 Arrêt des conteneurs..."
docker-compose down

# Nettoyer les anciennes images
echo "🧹 Nettoyage des images Docker..."
docker system prune -f

# Redémarrer l'application
echo "🚀 Redémarrage de l'application..."
docker-compose up -d

# Attendre que l'application soit prête
echo "⏳ Attente du démarrage..."
sleep 15

# Vérifier que l'application fonctionne
echo "🔍 Vérification du déploiement..."
if curl -f --max-time 10 http://localhost:3000 > /dev/null 2>&1; then
    echo ""
    echo "✅ DÉPLOIEMENT RÉUSSI !"
    echo "🌐 Application accessible sur: http://localhost:3000"
    echo ""
    echo "📊 Statistiques:"
    echo "   - Conteneurs actifs: $(docker ps | grep dragonfly | wc -l)"
    echo "   - Utilisation CPU/Memory: $(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep dragonfly | head -1)"
    echo ""

    # Supprimer les anciennes sauvegardes (garder seulement les 3 dernières)
    cd ..
    ls -t backup_* 2>/dev/null | tail -n +4 | xargs -r rm -rf
    cd dragonfly
else
    echo ""
    echo "❌ ÉCHEC DU DÉPLOIEMENT"
    echo ""

    # Restaurer la sauvegarde
    echo "🔄 Restauration de la sauvegarde..."
    docker-compose down
    if [ -d "../${BACKUP_NAME}" ]; then
        rm -rf ./*
        cp -r "../${BACKUP_NAME}"/* .
        docker-compose up -d
        echo "✅ Restauration terminée"
    else
        echo "⚠️ Aucune sauvegarde trouvée"
    fi

    exit 1
fi
