#!/bin/bash

# Script pour développement local (sans Docker)
# Utilise la base de données de production

echo "🚀 Démarrage du mode développement local..."
echo ""
echo "📌 Ce mode:"
echo "  ✅ Utilise la base de données de PRODUCTION"
echo "  ✅ Hot-reload automatique"
echo "  ✅ Pas de Docker (rapide)"
echo "  ⚠️  La production Docker reste accessible sur le port 3000"
echo "  ⚠️  Le dev local sera sur le port 3001"
echo ""

# Créer .env.local si nécessaire (Next.js le charge automatiquement en priorité)
if [ ! -f ".env.local" ]; then
    echo "📝 Création de .env.local..."
    sed 's/@postgres:5432/@localhost:5432/g' .env > .env.local
    echo "✅ .env.local créé (pointe vers localhost:5432)"
fi

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Générer le client Prisma
echo "🔨 Génération du client Prisma..."
npx prisma generate

# Lancer en mode dev sur le port 3001
echo ""
echo "✅ Démarrage de Next.js en mode développement..."
echo "🌐 Application accessible sur: http://localhost:3001"
echo "🛑 Arrêter avec: Ctrl+C"
echo ""

npm run dev:3001

