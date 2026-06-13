# Monorepo Internals — How Everything Works Together

This document explains every piece of the monorepo setup in plain terms —
what each file does, why it exists, and how they all connect.

---

## The Big Picture

When you clone this repo, you are getting **three separate apps** inside one git repo:

```
bap/
├── apps/web        ← Next.js (the storefront)
├── apps/api        ← Laravel (the backend API)
└── packages/types  ← shared TypeScript types (not an app, just shared code)
```

The glue that holds them together is three tools:

| Tool | What it does |
|---|---|
| **pnpm** | installs JavaScript packages, knows about all workspaces |
| **pnpm workspaces** | links the apps together so they can reference each other |
| **Turborepo** | runs tasks (dev, build, lint) across all apps efficiently |

---

## File-by-File Breakdown

---

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**What it does:**
This file is the foundation of the whole monorepo. It tells pnpm:
> "Every folder inside `apps/` and every folder inside `packages/` is a separate workspace."

A **workspace** is just a folder that has its own `package.json`. pnpm reads this file first when you run any command from the root, discovers all the workspaces, and treats them as one connected system.

**Without this file**, pnpm would treat this repo as a single plain project and know nothing about `apps/web` or `apps/api`.

**Result of this file existing:**
- `apps/web` becomes the workspace `@bap/web`
- `apps/api` becomes the workspace `@bap/api`
- `packages/types` becomes the workspace `@bap/types`

Those names (`@bap/...`) come from the `"name"` field inside each folder's own `package.json`.

---

### Root `package.json`

```json
{
  "name": "bap",
  "private": true,
  "scripts": {
    "dev":   "turbo run dev",
    "build": "turbo run build",
    "lint":  "turbo run lint",
    "web":   "pnpm --filter @bap/web dev",
    "api":   "pnpm --filter @bap/api dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**What each part means:**

**`"private": true`**
This repo is never published to npm. `private: true` prevents accidental publishing and is required for workspaces to work correctly.

**`"scripts"`**
These are the commands you type from the root folder:

- `pnpm run dev` → tells Turborepo to run the `dev` script in **all** workspaces simultaneously
- `pnpm run build` → tells Turborepo to build all apps (respecting dependency order)
- `pnpm run web` → runs dev in `apps/web` only (the `--filter` flag targets one workspace)
- `pnpm run api` → runs dev in `apps/api` only

**`"devDependencies": { "turbo" }`**
Turborepo itself is installed here at the root level so the `turbo` command is available everywhere.

**`"packageManager": "pnpm@9.0.0"`**
Locks down which package manager and version to use. If someone tries to run `npm install` in this repo, pnpm will warn them. This prevents accidental mixed lockfiles.

---

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

**What Turborepo does:**
When you run `pnpm run dev`, the root `package.json` hands off to `turbo run dev`.
Turborepo then reads `turbo.json` to understand the rules, then goes into every workspace and runs their own `"dev"` script in parallel.

**Breaking down each task:**

**`build`**
```json
"build": {
  "dependsOn": ["^build"],
  "outputs": [".next/**", "dist/**"]
}
```
- `"dependsOn": ["^build"]` — the `^` means "run the `build` task of my dependencies first". So if `apps/web` depends on `packages/types`, Turborepo builds `packages/types` before it builds `apps/web`. Order is automatic.
- `"outputs"` — tells Turborepo which folders contain the build result. It uses this for **caching**: if nothing changed, it restores the previous output instead of rebuilding. Massive time saver in CI.

**`dev`**
```json
"dev": {
  "cache": false,
  "persistent": true
}
```
- `"cache": false` — never cache the dev server. It runs fresh every time (correct behaviour for a live dev server).
- `"persistent": true` — this task runs forever (it's a server, not a one-shot command). Turborepo won't wait for it to finish before moving on.

**`lint`**
```json
"lint": {}
```
No special rules. Turborepo just runs each workspace's `lint` script and caches the result.

---

### `packages/types/`

```
packages/types/
├── index.ts        ← all shared interfaces live here
└── package.json    ← { "name": "@bap/types" }
```

**What it is:**
A mini internal package that holds TypeScript interfaces shared across apps.
It is NOT published to npm. It only exists inside this repo.

**`packages/types/index.ts`** contains interfaces like:
```typescript
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  // ...
}
```

**Why does it exist?**
Without this, you would define `Product` in `apps/web/src/types.ts`.
When you later build a mobile app or admin panel, you'd copy-paste that definition — and they'd drift apart over time (one gets a new field, the other doesn't).

With `@bap/types`, every app imports from one place:
```typescript
import type { Product } from '@bap/types';
```
Change it once → every app gets the update.

**How to wire it into an app:**
Add it as a dependency in the app's `package.json`:
```json
{
  "dependencies": {
    "@bap/types": "workspace:*"
  }
}
```
The `workspace:*` prefix is the key — it tells pnpm "don't look on npm, find this package inside this repo's workspaces."

---

### Each App's Own `package.json`

Every workspace has its own `package.json`. This is where app-specific dependencies live.

**`apps/web/package.json`**
```json
{
  "name": "@bap/web",
  "scripts": {
    "dev":   "next dev",
    "build": "next build",
    "lint":  "eslint"
  },
  "dependencies": {
    "next": "16.0.7",
    "react": "19.2.0",
    "@bap/types": "workspace:*"
  }
}
```

**`apps/api/package.json`**
```json
{
  "name": "@bap/api",
  "scripts": {
    "dev": "concurrently \"php artisan serve --port=8000\" \"vite\""
  }
}
```

When Turborepo runs `turbo run dev`, it finds every workspace that has a `"dev"` script and runs them all.

---

## How pnpm Knows About Everything

Here is the exact sequence of what happens when you run `pnpm install` from the root:

```
Step 1: pnpm reads pnpm-workspace.yaml
        → discovers apps/web, apps/api, packages/types

Step 2: pnpm reads package.json in each workspace
        → collects all dependencies

Step 3: pnpm installs all JS packages into a shared store
        → (only one copy of React exists on disk, even if 3 apps need it)

Step 4: pnpm creates a single root node_modules/
        + symlinks inside each app's node_modules/ pointing to the shared store

Step 5: pnpm links workspace packages to each other
        → apps/web/node_modules/@bap/types → symlink → packages/types/
```

This is why you only need to run `pnpm install` once from the root — it handles everything.

---

## How to Install Packages

### Add a package to a specific app

```bash
# Add to Next.js frontend only
pnpm --filter @bap/web add axios

# Add to Laravel's JS dependencies only
pnpm --filter @bap/api add some-package

# Add as a dev dependency
pnpm --filter @bap/web add -D @types/axios
```

The `--filter` flag targets a specific workspace by its `name` in `package.json`.

### Add a package to the root (available everywhere)

```bash
pnpm add -D turbo -w
```

The `-w` flag means "install at the workspace root". Use this for tooling like Turborepo, Prettier, ESLint configs that apply to the whole repo.

### Add a shared internal package to an app

```bash
# Wire @bap/types into apps/web
pnpm --filter @bap/web add @bap/types
```

pnpm sees that `@bap/types` is a workspace package and creates a symlink instead of downloading from npm.

### Install PHP packages (Laravel — separate from pnpm)

Laravel uses **Composer**, not pnpm. These commands run from `apps/api/`:

```bash
cd apps/api

composer require laravel/sanctum        # add a package
composer require --dev barryvdh/laravel-debugbar  # add a dev package
composer remove some-package            # remove a package
```

---

## How Running Commands Works

### From the root — affects all apps

```bash
pnpm run dev      # starts apps/web AND apps/api at the same time
pnpm run build    # builds all apps in correct dependency order
pnpm run lint     # lints all apps
```

### From the root — affects one app (using --filter)

```bash
pnpm --filter @bap/web dev
pnpm --filter @bap/api dev
pnpm --filter @bap/types build
```

### From inside an app — only affects that app

```bash
cd apps/web
npm run dev       # or: pnpm run dev

cd apps/api
php artisan serve
php artisan make:model Product -mcr
php artisan migrate
```

---

## The Complete Flow Diagram

```
pnpm run dev (from root)
       │
       ▼
root package.json → "dev": "turbo run dev"
       │
       ▼
turbo.json → reads task rules for "dev"
       │
       ├──▶ apps/web  → runs "next dev"     → http://localhost:3000
       │
       └──▶ apps/api  → runs "php artisan serve" + "vite"  → http://localhost:8000
```

```
pnpm install (from root)
       │
       ▼
pnpm-workspace.yaml → finds all workspaces
       │
       ▼
reads every package.json in apps/* and packages/*
       │
       ▼
installs all dependencies + links @bap/types into apps that need it
```

---

## Quick Reference Card

| What you want to do | Command |
|---|---|
| Start everything | `pnpm run dev` |
| Start only frontend | `pnpm run web` |
| Start only backend | `pnpm run api` |
| Install all JS deps | `pnpm install` |
| Add package to frontend | `pnpm --filter @bap/web add <pkg>` |
| Add package to backend JS | `pnpm --filter @bap/api add <pkg>` |
| Add PHP package to Laravel | `cd apps/api && composer require <pkg>` |
| Add root-level dev tool | `pnpm add -D <pkg> -w` |
| Build everything | `pnpm run build` |
| Run Laravel migrations | `cd apps/api && php artisan migrate` |
| Make a Laravel model | `cd apps/api && php artisan make:model Product -mcr` |
