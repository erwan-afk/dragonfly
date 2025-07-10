#!/bin/bash

# Script de déploiement pour l'application Dragonfly
# Usage: ./scripts/deploy.sh [options]

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour vérifier si pm2 est installé
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 n'est pas installé. Installez-le avec: npm install -g pm2"
        exit 1
    fi
}

# Fonction pour vérifier si l'app pm2 existe
check_pm2_app() {
    if ! pm2 show dragonfly-app &> /dev/null; then
        log_warning "L'application 'dragonfly-app' n'existe pas dans PM2"
        log_info "Démarrage de l'application..."
        pm2 start ecosystem.config.js --env production
    fi
}

# Fonction de nettoyage
cleanup() {
    log_info "Nettoyage..."
    # Supprimer les fichiers temporaires si nécessaire
}

# Trap pour nettoyer en cas d'interruption
trap cleanup EXIT

# Vérifications préliminaires
log_info "Vérification des prérequis..."
check_pm2
check_pm2_app

# Générer le client Prisma
log_info "Génération du client Prisma..."
npm run db:generate

# Build de l'application
log_info "Build de l'application Next.js..."
npm run build

# Redémarrage de PM2
log_info "Redémarrage de l'application avec PM2..."
pm2 restart dragonfly-app

# Attendre un peu pour que l'application démarre
log_info "Attente du démarrage de l'application..."
sleep 3

# Vérifier le statut
log_info "Vérification du statut de l'application..."
pm2 show dragonfly-app

# Afficher les logs récents
log_info "Logs récents:"
pm2 logs dragonfly-app --lines 10

log_success "Déploiement terminé avec succès! 🎉"
log_info "Utilisez 'pm2 logs dragonfly-app' pour voir les logs en temps réel" 