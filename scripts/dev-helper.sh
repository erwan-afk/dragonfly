#!/bin/bash

# Script helper pour le développement Dragonfly

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}🛠️  Dragonfly Development Helper${NC}"
    echo ""
    echo "Usage: ./scripts/dev-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start-dev     - Démarrer le serveur de développement (port 3002)"
    echo "  start-prod    - Démarrer/redémarrer la production (PM2)"
    echo "  stop-prod     - Arrêter la production"
    echo "  status        - Afficher le statut des serveurs"
    echo "  urls          - Afficher les URLs d'accès"
    echo "  logs-dev      - Afficher les logs du dev server"
    echo "  logs-prod     - Afficher les logs de production"
    echo "  help          - Afficher cette aide"
    echo ""
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port occupé
    else
        return 1  # Port libre
    fi
}

start_dev() {
    echo -e "${BLUE}🚀 Démarrage du serveur de développement...${NC}"
    
    if check_port 3002; then
        echo -e "${YELLOW}⚠️  Le port 3002 est déjà utilisé.${NC}"
        echo "Voulez-vous tuer le processus existant ? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            pkill -f "next dev.*3002" || true
            sleep 2
        else
            echo -e "${RED}❌ Démarrage annulé.${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Démarrage sur le port 3002...${NC}"
    npm run dev &
    DEV_PID=$!
    
    sleep 3
    if kill -0 $DEV_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Serveur de développement démarré avec succès!${NC}"
        echo ""
        show_urls
    else
        echo -e "${RED}❌ Échec du démarrage du serveur de développement.${NC}"
    fi
}

start_prod() {
    echo -e "${BLUE}🚀 Démarrage/redémarrage de la production...${NC}"
    npm run deploy
}

stop_prod() {
    echo -e "${YELLOW}⏹️  Arrêt de la production...${NC}"
    pm2 stop dragonfly-app
}

show_status() {
    echo -e "${BLUE}📊 Statut des serveurs:${NC}"
    echo ""
    
    echo -e "${YELLOW}Production (PM2):${NC}"
    pm2 show dragonfly-app 2>/dev/null || echo "❌ Production non démarrée"
    
    echo ""
    echo -e "${YELLOW}Développement (Port 3002):${NC}"
    if check_port 3002; then
        echo -e "${GREEN}✅ Serveur de développement actif${NC}"
    else
        echo -e "${RED}❌ Serveur de développement arrêté${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Nginx (Port 80):${NC}"
    if check_port 80; then
        echo -e "${GREEN}✅ Nginx actif${NC}"
    else
        echo -e "${RED}❌ Nginx arrêté${NC}"
    fi
}

show_urls() {
    echo -e "${BLUE}🌐 URLs d'accès:${NC}"
    echo ""
    echo -e "${GREEN}Production:${NC}"
    echo "  http://217.65.144.71"
    echo ""
    echo -e "${YELLOW}Développement:${NC}"
    echo "  http://217.65.144.71:3002  (accès direct)"
    echo "  http://217.65.144.71/dev/  (via nginx si configuré)"
    echo ""
    echo -e "${BLUE}💡 Astuce:${NC} Utilisez l'accès direct :3002 pour éviter le cache nginx"
}

logs_dev() {
    echo -e "${BLUE}📜 Logs du serveur de développement:${NC}"
    echo "Utilisez Ctrl+C pour quitter"
    sleep 1
    # Chercher le processus Next.js dev
    DEV_PID=$(pgrep -f "next-server.*dev.*3002" || pgrep -f "next dev.*3002")
    if [ ! -z "$DEV_PID" ]; then
        tail -f /proc/$DEV_PID/fd/1 2>/dev/null || echo "❌ Impossible d'accéder aux logs"
    else
        echo "❌ Serveur de développement non trouvé"
    fi
}

logs_prod() {
    echo -e "${BLUE}📜 Logs de production:${NC}"
    pm2 logs dragonfly-app
}

# Traitement des arguments
case "${1:-help}" in
    "start-dev")
        start_dev
        ;;
    "start-prod")
        start_prod
        ;;
    "stop-prod")
        stop_prod
        ;;
    "status")
        show_status
        ;;
    "urls")
        show_urls
        ;;
    "logs-dev")
        logs_dev
        ;;
    "logs-prod")
        logs_prod
        ;;
    "help"|*)
        show_help
        ;;
esac 