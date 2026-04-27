FROM php:8.3-cli-alpine AS base

RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    nodejs \
    npm \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        zip \
        mbstring \
        intl \
        opcache \
        pcntl \
        sockets \
    && pecl install redis \
    && docker-php-ext-enable redis

RUN npm install -g yarn

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

FROM base AS rr-downloader

RUN curl -sSL https://github.com/roadrunner-server/roadrunner/releases/download/v2024.3.5/roadrunner-2024.3.5-linux-amd64.tar.gz \
    | tar -xz -C /tmp \
    && mv /tmp/roadrunner-2024.3.5-linux-amd64/rr /usr/local/bin/rr \
    && chmod +x /usr/local/bin/rr

FROM base AS builder

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile 2>/dev/null || yarn install

COPY . .

RUN composer dump-autoload --optimize --no-dev

RUN yarn build

RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

FROM base AS app

WORKDIR /var/www/html

COPY --from=rr-downloader /usr/local/bin/rr /usr/local/bin/rr
COPY --from=builder /var/www/html .

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
