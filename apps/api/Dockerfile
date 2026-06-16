# syntax=docker/dockerfile:1.7

ARG PHP_VERSION=8.4

# ---------------------------------------------------------------------------
# Stage 1 — Install Composer dependencies
# ---------------------------------------------------------------------------
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
        --no-scripts \
        --no-autoloader \
        --no-interaction \
        --prefer-dist \
        --no-progress

COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative

# ---------------------------------------------------------------------------
# Stage 2 — Runtime image
# ---------------------------------------------------------------------------
FROM serversideup/php:${PHP_VERSION}-cli

WORKDIR /var/www/api

COPY --from=vendor /app/vendor ./vendor
COPY . .

USER root
RUN chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD php -r "exit(@file_get_contents('http://127.0.0.1:8000/up') !== false ? 0 : 1);"

ENTRYPOINT ["docker-entrypoint.sh"]
