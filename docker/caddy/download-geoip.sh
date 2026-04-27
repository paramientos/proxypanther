#!/bin/sh
set -e

GEOIP_PATH="/etc/caddy/GeoLite2-Country.mmdb"

if [ -f "$GEOIP_PATH" ]; then
    echo "[GeoIP] Database already exists, skipping download."
    exit 0
fi

echo "[GeoIP] Downloading GeoIP database..."

YEAR_MONTH=$(date +%Y-%m)
URL="https://download.db-ip.com/free/dbip-country-lite-${YEAR_MONTH}.mmdb.gz"

if curl -fsSL "$URL" -o "${GEOIP_PATH}.gz"; then
    gunzip "${GEOIP_PATH}.gz"
    chmod 644 "$GEOIP_PATH"
    echo "[GeoIP] Downloaded successfully: $GEOIP_PATH"
else
    echo "[GeoIP] WARNING: Could not download GeoIP database. GeoIP features will be disabled."
fi
