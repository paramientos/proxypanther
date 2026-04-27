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
    echo -e "${RED}Docker bulunamadı. Lütfen Docker'ı kurun: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}Docker Compose (v2) bulunamadı. Lütfen güncelleyin.${NC}"
    exit 1
fi

if [ ! -f ".env.docker" ]; then
    echo -e "${RED}.env.docker dosyası bulunamadı!${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/5] Ortam hazırlanıyor...${NC}"

DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
APP_KEY="base64:$(openssl rand -base64 32)"

sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env.docker
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.docker

echo -e "${YELLOW}[2/5] Docker imajları build ediliyor (bu birkaç dakika sürebilir)...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}[3/5] Servisler başlatılıyor...${NC}"
docker compose up -d postgres redis

echo -e "${YELLOW}[4/5] Veritabanı hazır bekleniyor...${NC}"
until docker compose exec -T postgres pg_isready -U proxypanther -d proxypanther &>/dev/null; do
    echo -n "."
    sleep 2
done
echo ""

echo -e "${YELLOW}[5/5] Uygulama başlatılıyor...${NC}"
docker compose up -d

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ProxyPanther başarıyla kuruldu!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "  Arayüz:     ${CYAN}http://localhost:3434${NC}"
echo -e "  PostgreSQL: ${CYAN}localhost:5656${NC}"
echo -e "  DB Şifresi: ${CYAN}${DB_PASSWORD}${NC}"
echo ""
echo -e "  Loglar için: ${YELLOW}docker compose logs -f app${NC}"
echo -e "  Durdurmak:   ${YELLOW}docker compose down${NC}"
echo ""
