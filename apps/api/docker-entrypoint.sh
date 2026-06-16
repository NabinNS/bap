#!/bin/sh
# Boot script for the API container.
# - logs each step with a clear prefix so `docker compose logs api` is readable
# - waits for the database to accept connections before running migrations
# - `exec`s the final process so PHP becomes PID 1 (clean shutdown on SIGTERM)
set -e

log() { printf '\033[1;36m[api]\033[0m %s\n' "$*"; }

log "Waiting for database at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until php -r "exit(@fsockopen(getenv('DB_HOST')?:'postgres', (int)(getenv('DB_PORT')?:5432)) ? 0 : 1);"; do
    sleep 1
done
log "Database is reachable."

log "Running migrations (php artisan migrate --force)..."
php artisan migrate --force

log "Seeding database (php artisan db:seed --force)..."
php artisan db:seed --force

log "Caching config, routes, and views..."
php artisan config:cache  >/dev/null
php artisan route:cache   >/dev/null
php artisan view:cache    >/dev/null

log "Starting HTTP server on 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
