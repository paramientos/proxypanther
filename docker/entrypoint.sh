#!/bin/bash
set -e

cd /var/www/html

if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan migrate --force --no-interaction

php artisan db:seed --force --no-interaction 2>/dev/null || true

if command -v rr &> /dev/null; then
    exec php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000 --workers=auto
else
    exec php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000 --workers=auto
fi
