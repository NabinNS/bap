# Monorepo Approach 3 — Root Package Manager (Advanced)

## What Is a Monorepo?

A **monorepo** (monolithic repository) means you store multiple distinct apps or packages inside a **single git repository**. In our case: the Next.js frontend and the Laravel backend live together under one repo root.

Approach 3 goes one step further — it introduces a **root-level package manager** (like pnpm workspaces or Turborepo) that acts as an orchestrator. It knows about all the apps inside the repo and lets you manage, build, and run them together from the root.

---

## Visual Structure

```
bap/                                  ← git root (one repo)
├── apps/
│   ├── web/                          ← Next.js frontend
│   │   ├── src/
│   │   ├── package.json
│   │   └── next.config.ts
│   └── api/                          ← Laravel backend
│       ├── app/
│       ├── routes/
│       ├── composer.json
│       └── .env
├── packages/                         ← optional shared code
│   ├── types/                        ← shared TypeScript types
│   │   └── index.ts
│   └── utils/                        ← shared utility functions
│       └── index.ts
├── package.json                      ← root package.json (workspaces config)
├── pnpm-workspace.yaml               ← tells pnpm where the apps/packages are
├── turbo.json                        ← Turborepo pipeline config (optional)
└── README.md
```

---

## The Key Players

### 1. pnpm Workspaces

`pnpm` is a package manager (like npm or yarn) but faster and more disk-efficient. Its **workspaces** feature lets you define multiple `package.json` projects inside one repo and link them together.

**`pnpm-workspace.yaml`** (at the root) tells pnpm where to find workspaces:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

This means pnpm treats every folder inside `apps/` and `packages/` as a separate workspace (app/package).

**Root `package.json`:**

```json
{
  "name": "bap",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

Notice `"private": true` — the root is never published, it only orchestrates the apps inside.

---

### 2. Turborepo

**Turborepo** is a high-performance build system for monorepos. It sits on top of your package manager (pnpm) and adds:

- **Task pipelines** — define the order tasks must run (e.g., build `packages/types` before building `apps/web`)
- **Caching** — if nothing changed, Turborepo skips re-running the task and uses the cached output (massive time saver)
- **Parallel execution** — runs tasks across all apps in parallel where possible

**`turbo.json`** (at the root) defines the pipeline:

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

- `"^build"` means: before building this app, build all its dependencies first
- `"cache": false` on `dev` means: don't cache the dev server (it runs continuously)
- `"persistent": true` means: this task runs forever (like a dev server), don't wait for it to finish

---

### 3. The `packages/` Folder (Shared Code)

This is the most powerful feature of Approach 3. When you have multiple apps (web, mobile, admin), they often share:

- **TypeScript types** — e.g., what a `Product` object looks like
- **Utility functions** — e.g., price formatting, date helpers
- **UI components** — a shared design system (buttons, inputs)

Instead of duplicating this code, you put it in `packages/` and import it in any app.

**Example — `packages/types/index.ts`:**

```typescript
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  brand: string;
  rating: number;
  image: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}
```

**`packages/types/package.json`:**

```json
{
  "name": "@bap/types",
  "version": "0.0.1",
  "main": "./index.ts"
}
```

**Using it in `apps/web` (`package.json`):**

```json
{
  "name": "@bap/web",
  "dependencies": {
    "@bap/types": "workspace:*"
  }
}
```

Now in your Next.js components:

```typescript
import type { Product } from '@bap/types';

export function ProductCard({ product }: { product: Product }) {
  // ...
}
```

If you later build a mobile app (`apps/mobile`), it can import the same `@bap/types` — one source of truth.

---

## How Does Laravel Fit In?

Laravel is a PHP project and doesn't use `package.json` or pnpm. It lives inside `apps/api/` but is **not a pnpm workspace**. It just coexists in the same repo.

You manage Laravel separately with Composer:

```bash
cd apps/api
composer install
php artisan serve
```

Turborepo can still coordinate it by running shell commands:

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

And in `apps/api/package.json` (a thin wrapper just for Turborepo):

```json
{
  "name": "@bap/api",
  "scripts": {
    "dev": "php artisan serve --port=8000"
  }
}
```

Now `pnpm run dev` from the root starts **both** the Next.js frontend and the Laravel backend simultaneously.

---

## Day-to-Day Commands

All run from the **repo root**:

```bash
# Install all JS dependencies across all workspaces
pnpm install

# Run dev servers for ALL apps at once
pnpm run dev

# Build all apps
pnpm run build

# Run a command in a specific app only
pnpm --filter @bap/web dev
pnpm --filter @bap/api dev

# Add a dependency to a specific app
pnpm --filter @bap/web add axios

# Add a shared dev dependency to the root
pnpm add -D turbo -w
```

---

## Deployment

Each app deploys independently:

| App | Platform |
|---|---|
| `apps/web` (Next.js) | Vercel, Netlify, or a VPS |
| `apps/api` (Laravel) | Laravel Forge, Railway, or a VPS |

Turborepo's caching also works in CI/CD (GitHub Actions, etc.) — if only the frontend changed, it won't rebuild the backend.

---

## When Should You Use Approach 3?

| Situation | Use Approach 3? |
|---|---|
| Solo dev, learning | No — too much setup overhead |
| Small team, one frontend + one backend | Maybe — only if you plan to scale |
| Multiple apps (web + mobile + admin) | Yes — shared packages pay off |
| Separate frontend/backend teams | Yes — each team works in their `apps/` folder |
| Plan to add a React Native mobile app later | Yes — shared `@bap/types` is invaluable |

---

## Approach 2 vs Approach 3 — Quick Comparison

| | Approach 2 (Simple Monorepo) | Approach 3 (Turborepo) |
|---|---|---|
| Setup time | 5 minutes | 30–60 minutes |
| Tooling | None (just folders) | pnpm + Turborepo |
| Shared code between apps | Copy-paste | `packages/` workspace |
| Run all apps with one command | Manual (two terminals) | `pnpm run dev` |
| Build caching | No | Yes (Turborepo cache) |
| Best for | Solo/small projects | Growing teams, multiple apps |

---

## Summary

Approach 3 is powerful because:

1. **One repo** — all code is version-controlled together, PRs can span frontend and backend
2. **One command** — `pnpm run dev` starts everything
3. **Shared packages** — types, utils, and UI components defined once, used everywhere
4. **Turborepo caching** — only rebuilds what changed, making CI/CD fast
5. **Scalable** — adding a mobile app or admin panel is just adding another folder to `apps/`

The trade-off is upfront configuration complexity. For your current project (solo dev, one frontend, one backend), **Approach 2 is the right starting point**. Migrate to Approach 3 when you find yourself copy-pasting types between apps or wanting to run everything with one command.
