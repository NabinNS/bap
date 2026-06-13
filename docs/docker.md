# Docker — What It Is and How It Helps This Project

## What Is Docker?

Docker is a tool that lets you run software inside isolated boxes called **containers**.
A container packages an app together with everything it needs to run — the runtime, libraries,
config — so it behaves the same on every machine.

Think of it this way:

```
Without Docker:
  "It works on my machine" → install PHP, install PostgreSQL, configure versions, fight conflicts

With Docker:
  "Here is the exact environment" → one command, everything runs identically everywhere
```

---

## The Core Concepts

### Image

A **blueprint** — a read-only template that describes what goes inside a container.
Like a recipe. It defines the OS, installed software, and config.

Examples of images that exist publicly:
- `postgres:16` → a full PostgreSQL 16 server, ready to run
- `node:20` → Node.js 20
- `php:8.3` → PHP 8.3

You pull images from **Docker Hub** (docker.com's public registry), or build your own.

### Container

A **running instance** of an image. Like a live kitchen running the recipe.

- One image can spawn many containers
- Containers are isolated from each other and from your host machine
- Kill a container → it's gone, no leftover files on your system

### Dockerfile

A text file that defines how to **build a custom image**.
You start from a base image and layer your own instructions on top.

```dockerfile
FROM php:8.3-fpm          # start from official PHP image
RUN apt-get install ...   # install extra packages
COPY . /var/www           # copy your code in
```

### Volume

Containers are **stateless by default** — if you delete a container, all data inside is gone.
A **volume** is a persistent folder that lives outside the container on your host machine,
mounted into the container so data survives restarts.

Critical for databases — you don't want your PostgreSQL data wiped every time you restart.

```
Your machine (host)         Container
/home/nabin/pgdata    ←→   /var/lib/postgresql/data
```

### Docker Compose

Running one container manually is fine. Running three (PostgreSQL + Laravel + Next.js)
with the right network, volumes, and environment variables by hand is painful.

**Docker Compose** solves this with a single `docker-compose.yml` file that defines
all your services together. One command starts everything:

```bash
docker compose up
```

One command tears everything down:

```bash
docker compose down
```

### Network

Containers are isolated — they can't talk to each other by default.
Docker Compose automatically creates a **shared network** for all services defined in the same
`docker-compose.yml`. Services find each other by their **service name**, not `localhost`.

```
Inside the Laravel container:
  DB_HOST=localhost    ← WRONG, Laravel can't see the host machine
  DB_HOST=postgres     ← CORRECT, "postgres" is the service name in docker-compose.yml
```

---

## How Docker Helps This Project Specifically

### The Problem Right Now

To run this project locally you need to:
1. Install PHP 8.3 with specific extensions (`pdo_pgsql`, etc.)
2. Install Composer
3. Install PostgreSQL and create a database manually
4. Install Node.js + pnpm
5. Configure everything to talk to each other
6. Hope your versions match

If another dev clones this repo, they do all of this again. If they have PHP 8.2, things break.

### With Docker

Clone the repo → run one command → everything starts:
- PostgreSQL running with the `bap` database already created
- Laravel API connected to it automatically
- Next.js frontend running

No manual installs. No version conflicts. Same environment for every developer,
and the same environment in production.

---

## What the Docker Setup Will Look Like for This Project

```
docker-compose.yml        ← defines all services
apps/
├── web/
│   └── Dockerfile        ← how to build the Next.js container
└── api/
    └── Dockerfile        ← how to build the Laravel container
```

### Services

```
┌─────────────────────────────────────────────────────┐
│                  Docker Network (bap)                │
│                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────┐ │
│  │  web         │   │  api         │   │postgres │ │
│  │  Next.js     │──▶│  Laravel     │──▶│  DB     │ │
│  │  :3000       │   │  :8000       │   │  :5432  │ │
│  └──────────────┘   └──────────────┘   └─────────┘ │
│                                              │       │
└──────────────────────────────────────────────│───────┘
                                               │
                                        Volume (data
                                        persists on
                                        your machine)
```

| Service | Image | Port | Purpose |
|---|---|---|---|
| `postgres` | `postgres:16` | 5432 | PostgreSQL database |
| `api` | custom (Dockerfile) | 8000 | Laravel REST API |
| `web` | custom (Dockerfile) | 3000 | Next.js storefront |

### Key Points

- `web` talks to `api` via `http://api:8000` inside Docker
- `api` talks to `postgres` via `DB_HOST=postgres` (the service name)
- PostgreSQL data is stored in a volume so it survives container restarts
- Your local code is mounted into the containers so changes reflect instantly without rebuilding

---

## Development vs Production Docker

There are two modes:

### Development
- Your local code folder is **mounted** into the container
- Change a file → it reflects immediately (hot reload still works)
- Slower build, but fast iteration

### Production
- Your code is **copied** into the image at build time
- The image is self-contained — no dependency on your local machine
- Deployed to a server or cloud (Railway, DigitalOcean, AWS, etc.)

For now we will focus on **development** mode.

---

## Essential Docker Commands

```bash
# Start all services (add -d to run in background)
docker compose up
docker compose up -d

# Stop all services
docker compose down

# Stop and delete volumes (wipes the database)
docker compose down -v

# View running containers
docker ps

# View logs of a specific service
docker compose logs api
docker compose logs postgres

# Run a command inside a running container
docker compose exec api php artisan migrate
docker compose exec api php artisan make:model Product -mcr
docker compose exec postgres psql -U postgres -d bap

# Rebuild images after Dockerfile changes
docker compose build
docker compose up --build

# Pull latest images
docker compose pull
```

---

## The `.env` Changes Docker Requires

When running inside Docker, `localhost` no longer means what you think.
Each container is its own machine. So `DB_HOST` must point to the
PostgreSQL **service name**, not `localhost`:

```env
# Before (local machine)
DB_HOST=127.0.0.1

# After (Docker)
DB_HOST=postgres
```

Everything else stays the same.

---

## Getting Started (Next Steps)

1. Install Docker Desktop (or Docker Engine on Linux)
2. Write `apps/api/Dockerfile` for Laravel
3. Write `apps/web/Dockerfile` for Next.js
4. Write `docker-compose.yml` at the repo root
5. Run `docker compose up` and both apps + the database start together

---

## Summary

| Concept | One-line explanation |
|---|---|
| Image | Blueprint — the recipe |
| Container | Running instance — the live kitchen |
| Dockerfile | Instructions to build a custom image |
| Volume | Persistent storage that survives container restarts |
| Docker Compose | Runs multiple containers together with one command |
| Network | Lets containers talk to each other by service name |
| `docker compose up` | Start everything |
| `docker compose down` | Stop everything |
