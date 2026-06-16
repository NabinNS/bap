# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**BAP (Best Auto Parts)** — a Turborepo monorepo with:
- `apps/web` — Next.js 16 storefront (`@bap/web`)
- `apps/api` — Laravel 13 REST API (`@bap/api`)
- `packages/types` — Shared TypeScript interfaces (`@bap/types`)

## Commands

### Root (runs across all apps via Turborepo)
```bash
pnpm run dev          # Start all apps (Next.js + Laravel + Vite)
pnpm run web          # Start only the Next.js frontend
pnpm run api          # Start only the Laravel backend
pnpm run build        # Build all apps
pnpm run lint         # Lint all apps
pnpm run setup        # pnpm install + composer install
```

### Laravel (from `apps/api/`)
```bash
php artisan serve                          # Dev server on :8000
php artisan migrate                        # Run migrations
php artisan migrate:refresh --seed         # Reset + reseed
php artisan db:seed                        # Seed (admin@gmail.com / password)
php artisan test                           # Run PHPUnit tests
php artisan make:model Product -mcr        # Model + migration + controller
php artisan make:controller Api/ProductController --api
composer require <package>
```

### Docker
```bash
docker compose up -d                       # Start all services
docker compose down -v                     # Stop + wipe volumes (resets DB)
docker compose exec api php artisan migrate
```

## Architecture

### Frontend (`apps/web`)
- **App Router** under `src/app/(store)/` — all store pages live in this route group
- **`@/*`** path alias maps to `src/*`
- **shadcn/ui** components live in `src/components/ui/`; custom components in `src/components/<domain>/`
- **Mock data** is in `src/data/` (`storeHome.ts`, `products.ts`, `productDetails.ts`) — replace with API calls as backend matures
- **`NEXT_PUBLIC_API_URL`** env var points to the Laravel API (`.env.local` for local dev)
- Images from `images.unsplash.com` and `upload.wikimedia.org` are whitelisted in `next.config.ts`

### Backend (`apps/api`)
- **PostgreSQL** on port **5434** (mapped from 5432 inside Docker)
- **Multi-tenant schema**: `tenants`, `tenant_users`, `tenant_contacts`, `tenant_types`
- `User` model has a `status` field (active/inactive/suspended)
- API routes go in `routes/api.php` (does not exist yet — create it and register in `bootstrap/app.php`)
- Exception handling is configured to return JSON for `api/*` requests automatically
- Health check endpoint: `GET /up`
- Vite builds frontend assets (CSS/JS) separately from the PHP server — both run concurrently in dev

### Shared Types (`packages/types`)
Defines `Product`, `Category`, `Brand`, `CartItem`, `ApiResponse<T>`, `PaginatedResponse<T>`. Import in the frontend as `@bap/types`. Laravel responses should match these shapes.

### Docker Networking
Inside the Docker network (`bap_network`):
- Web → API: `http://api:8000`
- API → DB: `postgres:5432`

Locally: web on `:3000`, API on `:8000`, Postgres on `:5434`.

## Authentication Plan (Laravel Sanctum + Next.js)

The API uses **Laravel Sanctum** for SPA authentication (cookie-based). The frontend (`apps/web`) posts credentials to the API, receives a session cookie, and includes it on subsequent requests.

Key Sanctum setup steps (not yet implemented):
1. `composer require laravel/sanctum` and publish config
2. Add `EnsureFrontendRequestsAreStateful` middleware to `api` middleware group
3. Set `SANCTUM_STATEFUL_DOMAINS` and `SESSION_DOMAIN` in `.env`
4. Frontend must first hit `GET /sanctum/csrf-cookie` before login POST

## Key Conventions
- Tailwind CSS v4 (no `tailwind.config.js` — configured via PostCSS plugin)
- `cn()` utility from `@/lib/utils` for conditional class merging (Tailwind Merge + clsx)
- Primary brand color: `#092d50` (dark navy), accent: `#0d3b66`
- shadcn/ui style: `new-york`, base color: `neutral`, CSS variables enabled
