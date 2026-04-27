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
    echo -e "${RED}Docker bulunamadı. Kurulum: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}Docker Compose v2 bulunamadı. Lütfen güncelleyin.${NC}"
    exit 1
fi

if [ ! -f ".env.docker" ]; then
    echo -e "${RED}.env.docker dosyası bulunamadı!${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/6] Ortam hazırlanıyor...${NC}"

DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
APP_KEY="base64:$(openssl rand -base64 32)"

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env.docker
    sed -i '' "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.docker
else
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env.docker
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.docker
fi

echo -e "${YELLOW}[2/6] Caddy (GeoIP modüllü) build ediliyor — bu 3-5 dakika sürebilir...${NC}"
docker compose build caddy

echo -e "${YELLOW}[3/6] Laravel uygulama imajı build ediliyor...${NC}"
docker compose build app horizon scheduler reverb

echo -e "${YELLOW}[4/6] Altyapı servisleri başlatılıyor...${NC}"
docker compose up -d postgres redis caddy

echo -e "${YELLOW}[5/6] Veritabanı hazır bekleniyor...${NC}"
until docker compose exec -T postgres pg_isready -U proxypanther -d proxypanther &>/dev/null; do
    echo -n "."
    sleep 2
done
echo ""

echo -e "${YELLOW}[6/6] Uygulama başlatılıyor...${NC}"
docker compose up -d

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ProxyPanther başarıyla kuruldu!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "  Dashboard:  ${CYAN}http://localhost:3434${NC}"
echo -e "  Caddy HTTP: ${CYAN}http://localhost:80${NC}"
echo -e "  Caddy HTTPS:${CYAN}https://localhost:443${NC}"
echo -e "  Caddy Admin:${CYAN}http://localhost:2019${NC}"
echo -e "  PostgreSQL: ${CYAN}localhost:5656${NC}"
echo -e "  DB Şifresi: ${CYAN}${DB_PASSWORD}${NC}"
echo ""
echo -e "  Loglar:     ${YELLOW}docker compose logs -f app${NC}"
echo -e "  Durdurmak:  ${YELLOW}docker compose down${NC}"
echo -e "  Güncelleme: ${YELLOW}docker compose build && docker compose up -d${NC}"
echo ""
