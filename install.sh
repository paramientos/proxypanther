#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ____                      ____             _   _               "
echo " |  _ \ _ __ _____  ___   |  _ \ __ _ _ __ | |_| |__   ___ _ __ "
echo " | |_) | '__/ _ \ \/ / | | | |_) / _\` | '_ \| __| '_ \ / _ \ '__|"
echo " |  __/| | | (_) >  <| |_| |  __/ (_| | | | | |_| | | |  __/ |   "
echo " |_|   |_|  \___/_/\_\\__, |_|   \__,_|_| |_|\__|_| |_|\___|_|   "
echo "                      |___/                                        "
echo -e "${NC}"
echo -e "${GREEN}ProxyPanther Docker Installer${NC}"
echo "================================================"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found.${NC}"
    echo -n "Install Docker Engine now? (Ubuntu/Debian) [y/N]: "
    read -r INSTALL_DOCKER
    if [[ "$INSTALL_DOCKER" =~ ^[yY]$ ]]; then
        echo -e "${YELLOW}Installing Docker...${NC}"
        curl -fsSL https://get.docker.com | sh
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}Docker installation failed. Manual install: https://docs.docker.com/engine/install/${NC}"
            exit 1
        fi
        echo -e "${GREEN}Docker installed successfully.${NC}"
    else
        echo -e "${RED}Docker is required. Exiting.${NC}"
        exit 1
    fi
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${YELLOW}Docker Compose v2 not found.${NC}"
    echo -n "Install Docker Compose plugin now? [y/N]: "
    read -r INSTALL_COMPOSE
    if [[ "$INSTALL_COMPOSE" =~ ^[yY]$ ]]; then
        echo -e "${YELLOW}Installing Docker Compose...${NC}"
        apt-get install -y docker-compose-plugin 2>/dev/null || \
            curl -fsSL https://get.docker.com | sh
        if ! docker compose version &> /dev/null 2>&1; then
            echo -e "${RED}Docker Compose installation failed. Manual install: https://docs.docker.com/compose/install/${NC}"
            exit 1
        fi
        echo -e "${GREEN}Docker Compose installed successfully.${NC}"
    else
        echo -e "${RED}Docker Compose is required. Exiting.${NC}"
        exit 1
    fi
fi

if [ ! -f ".env.docker" ]; then
    echo -e "${RED}.env.docker file not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/6] Preparing environment...${NC}"

DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
APP_KEY="base64:$(openssl rand -base64 32)"

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env.docker
    sed -i '' "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.docker
else
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env.docker
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.docker
fi

echo -e "${YELLOW}[2/6] Building Caddy with GeoIP module — this may take 3-5 minutes...${NC}"
docker compose build caddy

echo -e "${YELLOW}[3/6] Building application image...${NC}"
docker compose build app horizon scheduler reverb

echo -e "${YELLOW}[4/6] Starting infrastructure services...${NC}"
docker compose up -d postgres redis caddy

echo -e "${YELLOW}[5/6] Waiting for database to be ready...${NC}"
until docker compose exec -T postgres pg_isready -U proxypanther -d proxypanther &>/dev/null; do
    echo -n "."
    sleep 2
done
echo ""

echo -e "${YELLOW}[6/6] Starting application...${NC}"
docker compose up -d

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ProxyPanther installed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "  Dashboard:   ${CYAN}http://localhost:3434${NC}"
echo -e "  Caddy HTTP:  ${CYAN}http://localhost:80${NC}"
echo -e "  Caddy HTTPS: ${CYAN}https://localhost:443${NC}"
echo -e "  Caddy Admin: ${CYAN}http://localhost:2019${NC}"
echo -e "  PostgreSQL:  ${CYAN}localhost:5656${NC}"
echo -e "  DB Password: ${CYAN}${DB_PASSWORD}${NC}"
echo ""
echo -e "  Logs:        ${YELLOW}docker compose logs -f app${NC}"
echo -e "  Stop:        ${YELLOW}docker compose down${NC}"
echo -e "  Update:      ${YELLOW}docker compose build && docker compose up -d${NC}"
echo ""
