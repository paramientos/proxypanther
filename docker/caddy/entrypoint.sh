#!/bin/sh
set -e

/download-geoip.sh

CADDYFILE="/etc/caddy/Caddyfile"
ADMIN_ADDR="${CADDY_ADMIN:-0.0.0.0:2019}"

if [ ! -f "$CADDYFILE" ]; then
    cat > "$CADDYFILE" <<EOF
{
    admin ${ADMIN_ADDR}
    email admin@proxypanther.com
}

:80 {
    respond "ProxyPanther is ready. Configure your proxy sites from the dashboard." 200
}
EOF
fi

exec caddy run --config "$CADDYFILE" --adapter caddyfile
