# Stage 1 — PHP dependencies
FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-scripts \
    --no-autoloader \
    --no-interaction \
    --prefer-dist \
    --ignore-platform-reqs \
    --quiet
COPY . .
RUN composer dump-autoload --optimize --quiet

# Stage 2 — Final image (pre-built extensions, no compilation)
FROM serversideup/php:8.4-cli

WORKDIR /var/www/api

COPY --from=vendor /app/vendor ./vendor
COPY . .

USER root
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
