#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TAG="${PROXYPANTHER_TAG:-latest}"
INSTALL_DIR="${PROXYPANTHER_DIR:-/opt/proxypanther}"
COMPOSE_URL="https://raw.githubusercontent.com/paramientos/proxypanther/main/docker-compose.yml"
ENV_URL="https://raw.githubusercontent.com/paramientos/proxypanther/main/.env.docker"

echo -e "${CYAN}"
echo "  ____                      ____             _   _               "
echo " |  _ \ _ __ _____  ___   |  _ \ __ _ _ __ | |_| |__   ___ _ __ "
echo " | |_) | '__/ _ \ \/ / | | | |_) / _\` | '_ \| __| '_ \ / _ \ '__|"
echo " |  __/| | | (_) >  <| |_| |  __/ (_| | | | | |_| | | |  __/ |   "
echo " |_|   |_|  \___/_/\_\\__, |_|   \__,_|_| |_|\__|_| |_|\___|_|   "
echo "                      |___/                                        "
echo -e "${NC}"
echo -e "${GREEN}ProxyPanther Installer${NC}"
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

open_ports() {
    local ports=("80" "443" "3434" "5656" "2019")
    if command -v ufw &> /dev/null; then
        echo -e "${YELLOW}Configuring ufw firewall...${NC}"
        for port in "${ports[@]}"; do
            ufw allow "$port"/tcp &>/dev/null && echo -e "  ${GREEN}✓${NC} Port $port opened"
        done
        ufw --force enable &>/dev/null || true
    elif command -v firewall-cmd &> /dev/null; then
        echo -e "${YELLOW}Configuring firewalld...${NC}"
        for port in "${ports[@]}"; do
            firewall-cmd --permanent --add-port="$port"/tcp &>/dev/null && echo -e "  ${GREEN}✓${NC} Port $port opened"
        done
        firewall-cmd --reload &>/dev/null
    else
        echo -e "${YELLOW}No firewall detected — skipping port configuration.${NC}"
    fi
}

echo -e "${YELLOW}[1/6] Opening required ports...${NC}"
open_ports

echo -e "${YELLOW}[2/6] Setting up install directory: ${INSTALL_DIR}${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

if [ ! -f "docker-compose.yml" ]; then
    curl -fsSL "$COMPOSE_URL" -o docker-compose.yml
fi

if [ ! -f ".env.docker" ]; then
    curl -fsSL "$ENV_URL" -o .env.docker
fi

echo -e "${YELLOW}[3/6] Generating secrets...${NC}"

DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
APP_KEY="base64:$(openssl rand -base64 32)"
ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 24)

sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env.docker
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.docker
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" .env.docker

if grep -q "^ADMIN_PASSWORD=" .env.docker; then
    sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env.docker
else
    echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env.docker
fi

echo -e "${YELLOW}[4/6] Pulling images from registry...${NC}"
TAG="${TAG}" docker compose pull

echo -e "${YELLOW}[5/6] Starting infrastructure services...${NC}"
TAG="${TAG}" docker compose up -d postgres redis caddy

echo -e "${YELLOW}[6/6] Waiting for database...${NC}"
until docker compose exec -T postgres pg_isready -U proxypanther -d proxypanther &>/dev/null; do
    echo -n "."
    sleep 2
done
echo ""

TAG="${TAG}" docker compose up -d

PUBLIC_IP=$(curl -fsSL --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ProxyPanther installed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "  Dashboard:   ${CYAN}http://${PUBLIC_IP}:3434${NC}"
echo -e "  Caddy HTTP:  ${CYAN}http://${PUBLIC_IP}:80${NC}"
echo -e "  Caddy HTTPS: ${CYAN}https://${PUBLIC_IP}:443${NC}"
echo -e "  Caddy Admin: ${CYAN}http://localhost:2019${NC}  (local only)"
echo -e "  PostgreSQL:  ${CYAN}localhost:5656${NC}         (local only)"
echo -e "  DB Password: ${CYAN}${DB_PASSWORD}${NC}"
echo -e "  Install Dir: ${CYAN}${INSTALL_DIR}${NC}"
echo ""
echo -e "${YELLOW}  Default Login Credentials:${NC}"
echo -e "  Email:    ${CYAN}admin@proxypanther.com${NC}"
echo -e "  Password: ${CYAN}${ADMIN_PASSWORD}${NC}"
echo -e "  ${RED}⚠  Save this password — it won't be shown again!${NC}"
echo ""
echo -e "  Logs:        ${YELLOW}cd ${INSTALL_DIR} && docker compose logs -f app${NC}"
echo -e "  Stop:        ${YELLOW}cd ${INSTALL_DIR} && docker compose down${NC}"
echo -e "  Update:      ${YELLOW}cd ${INSTALL_DIR} && docker compose pull && docker compose up -d${NC}"
echo ""
echo -e "  Logs:        ${YELLOW}cd ${INSTALL_DIR} && docker compose logs -f app${NC}"
echo -e "  Stop:        ${YELLOW}cd ${INSTALL_DIR} && docker compose down${NC}"
echo -e "  Update:      ${YELLOW}cd ${INSTALL_DIR} && docker compose pull && docker compose up -d${NC}"
echo ""
