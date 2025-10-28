#!/bin/bash

# Script pour initialiser la base de données de développement

echo "🔄 Initialisation de la base de données de développement..."
echo ""

# Vérifier que PostgreSQL dev est démarré
if ! docker ps | grep -q dragonfly_postgres_dev; then
    echo "❌ PostgreSQL dev n'est pas démarré!"
    echo "💡 Lancez d'abord: docker-compose -f docker-compose.dev.yml up -d postgres"
    exit 1
fi

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
sleep 5

# Lancer les migrations Prisma
echo "📦 Exécution des migrations Prisma..."
docker exec dragonfly_app_dev npx prisma migrate deploy

# Optionnel : Copier les données de prod vers dev
read -p "Voulez-vous copier les données de la PRODUCTION vers DEV? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if docker ps | grep -q dragonfly_postgres && docker ps | grep -q dragonfly_postgres_dev; then
        echo "📋 Dump de la base de données de production..."
        docker exec dragonfly_postgres pg_dump -U postgres default > /tmp/prod_dump.sql
        
        echo "📥 Import dans la base de données de développement..."
        docker exec -i dragonfly_postgres_dev psql -U postgres default < /tmp/prod_dump.sql
        
        rm /tmp/prod_dump.sql
        echo "✅ Données copiées avec succès!"
    else
        echo "❌ L'environnement de production n'est pas actif"
        echo "💡 Impossible de copier les données"
    fi
fi

echo ""
echo "✅ Base de données de développement initialisée!"

