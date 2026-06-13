# How This Repo Works

## Overview

This is a **Turborepo monorepo** — one git repository that contains both the frontend and backend of the BAP (Best Auto Parts) e-commerce platform. The tooling (pnpm + Turborepo) lets you manage, run, and build both apps from the root with a single command.

---

## Folder Structure

```
bap/                              ← git root (one repo, one git history)
├── apps/
│   ├── web/                      ← Next.js frontend (the store UI)
│   └── api/                      ← Laravel backend (the REST API)
├── packages/
│   └── types/                    ← shared TypeScript types used by web
├── docs/                         ← documentation (you are here)
├── package.json                  ← root config: scripts + Turborepo
├── pnpm-workspace.yaml           ← tells pnpm where the workspaces are
├── turbo.json                    ← Turborepo pipeline definition
└── .gitignore                    ← root-level ignores for the whole repo
```

---

## The Three Config Files at the Root

### `pnpm-workspace.yaml`
Tells pnpm that `apps/*` and `packages/*` are all workspaces in the same repo. This means pnpm links them together and you can reference them by name (e.g. `@bap/web`, `@bap/api`, `@bap/types`).

### `package.json` (root)
Defines the top-level scripts that run across all apps:
- `pnpm run dev` → starts both `apps/web` and `apps/api` in parallel
- `pnpm run build` → builds all apps
- `pnpm run web` → starts only the Next.js app
- `pnpm run api` → starts only the Laravel app

### `turbo.json`
Defines the **task pipeline** — the rules Turborepo follows when running tasks:
- `build` depends on `^build` — meaning build shared `packages/` before building apps
- `dev` is marked `persistent: true` — it runs forever (like a server), don't wait for it to finish
- `dev` has `cache: false` — never cache the dev server output

---

## apps/web — Next.js Frontend

```
apps/web/
├── src/
│   ├── app/              ← Next.js App Router pages
│   │   └── (store)/      ← route group for the store
│   │       ├── page.tsx          → home page
│   │       ├── products/         → product listing + detail
│   │       └── categories/       → category listing
│   ├── components/       ← UI components (navbar, cards, sliders, etc.)
│   ├── data/             ← static mock data (will be replaced by API calls)
│   └── lib/              ← utility functions
├── public/               ← static assets (images, svgs)
├── package.json          ← name: "@bap/web"
└── next.config.ts
```

**Package name:** `@bap/web`
**Runs on:** `http://localhost:3000`
**Start command (from root):** `pnpm run web`
**Start command (from apps/web):** `npm run dev`

---

## apps/api — Laravel Backend

```
apps/api/
├── app/
│   ├── Http/Controllers/ ← API controllers
│   └── Models/           ← Eloquent models (Product, Category, etc.)
├── routes/
│   ├── web.php           ← web routes (not used for API)
│   └── api.php           ← API routes (GET /api/products, etc.)
├── database/
│   ├── migrations/       ← database table definitions
│   ├── seeders/          ← seed data for development
│   └── factories/        ← model factories for testing
├── config/               ← Laravel config (database, cors, auth, etc.)
├── storage/              ← logs, cache, uploaded files
├── .env                  ← environment variables (DB credentials, app key) — never committed
├── .env.example          ← template for .env — safe to commit
├── composer.json         ← PHP dependencies
└── package.json          ← name: "@bap/api", has the `dev` script for Turborepo
```

**Package name:** `@bap/api`
**Runs on:** `http://localhost:8000`
**Start command (from root):** `pnpm run api`
**Start command (from apps/api):** `php artisan serve`

---

## packages/types — Shared TypeScript Types

```
packages/types/
├── index.ts       ← exports: Product, Category, Brand, CartItem, ApiResponse, etc.
└── package.json   ← name: "@bap/types"
```

This package holds TypeScript interfaces that both describe the shape of the API responses and are used by the frontend components. Instead of defining `Product` in multiple places, it lives here once.

**How to use it in `apps/web`:**
```typescript
import type { Product, Category } from '@bap/types';
```

To wire it up, add it as a dependency in `apps/web/package.json`:
```json
{
  "dependencies": {
    "@bap/types": "workspace:*"
  }
}
```

---

## What Is NOT Committed (Generated/Secret Files)

| Path | Why excluded |
|---|---|
| `apps/web/node_modules/` | Installed by `pnpm install` |
| `apps/web/.next/` | Built by `pnpm run build` |
| `apps/api/vendor/` | Installed by `composer install` |
| `apps/api/.env` | Contains secrets (DB password, app key) |
| `apps/api/public/build/` | Built by `vite build` |
| `.turbo/` | Turborepo local cache |

---

## Getting Started (Fresh Clone)

If you or someone clones this repo for the first time:

```bash
# 1. Install JS dependencies for all workspaces at once
pnpm install

# 2. Install PHP dependencies for Laravel
cd apps/api
composer install

# 3. Set up Laravel environment
cp .env.example .env
php artisan key:generate
php artisan migrate

# 4. Go back to root and start everything
cd ../..
pnpm run dev
```

Both servers will start:
- Next.js → `http://localhost:3000`
- Laravel  → `http://localhost:8000`

---

## Day-to-Day Commands (run from repo root)

```bash
pnpm run dev          # start both apps simultaneously
pnpm run web          # start Next.js only
pnpm run api          # start Laravel only
pnpm run build        # build all apps
pnpm install          # install/sync all JS dependencies

# Target a specific workspace
pnpm --filter @bap/web add axios          # add a package to Next.js
pnpm --filter @bap/web remove axios       # remove a package from Next.js

# Laravel commands (must be run from apps/api/)
cd apps/api
php artisan make:model Product -mcr       # make model + migration + controller
php artisan migrate                       # run migrations
php artisan db:seed                       # seed the database
```
