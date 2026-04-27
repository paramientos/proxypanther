#!/bin/bash
set -e

cd /var/www/html

mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache

if [ ! -f ".env" ]; then
    touch .env
fi

if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

CONTAINER_ROLE="${CONTAINER_ROLE:-app}"

if [ "$CONTAINER_ROLE" = "app" ]; then
    php artisan migrate --force --no-interaction

    php artisan db:seed --force --no-interaction 2>/dev/null || true

    exec php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000 --workers=auto

elif [ "$CONTAINER_ROLE" = "horizon" ]; then
    exec php artisan horizon

elif [ "$CONTAINER_ROLE" = "scheduler" ]; then
    exec php artisan schedule:work

elif [ "$CONTAINER_ROLE" = "reverb" ]; then
    exec php artisan reverb:start --host=0.0.0.0 --port=8080

else
    exec "$@"
fi
