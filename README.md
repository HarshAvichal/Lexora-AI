# Lexora

**Lexora** is a video intelligence platform: ingest YouTube videos (and later playlists), turn transcripts into searchable embeddings, and answer questions with **timestamp-backed** citations. The codebase is structured for **single-video MVP first**, with schema and APIs designed to grow into **multi-video**, **playlist**, and **comparison** flows.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind (scaffolded under `apps/web`)
- **Backend:** Node.js, Express, TypeScript (`apps/api`)
- **Worker:** Node ingestion pipeline (`apps/worker`)
- **Data:** PostgreSQL (Drizzle ORM), Redis, Qdrant, Ollama + BGE-class embeddings (wired incrementally)
- **Local infra:** Docker Compose — Postgres, Redis, Qdrant, Ollama; optional **API** container via `app` profile

## Monorepo layout

```
apps/web          # Next.js
apps/api          # REST API
apps/worker       # Background jobs
packages/db       # Schema, migrations, `getDb()`
packages/ai       # LLM / embedding abstractions (planned)
packages/shared   # Shared types and constants
```

## Quick start

1. **Clone** and install dependencies:

   ```bash
   npm install
   ```

2. **Environment:** copy `.env.example` → `.env` at the repo root and set `DATABASE_URL` (and other vars as you enable features). `POSTGRES_*` must match the password embedded in `DATABASE_URL` when using Docker Postgres.

3. **Infrastructure:**

   ```bash
   docker compose up -d
   ```

   If port `6379` / `6333` / `11434` is already in use on your machine, stop the conflicting service or remap ports in `docker-compose.yml` and update `.env`.

4. **Database migrations:**

   ```bash
   npm run db:migrate
   ```

5. **API (local dev, hot reload):**

   ```bash
   npm run dev:api
   ```

   Health check: `GET http://localhost:4000/health`

**Optional — run the API in Docker as well** (after migrations, from the host):

```bash
npm run compose:up:full
```

(`compose:up` starts only infra; `compose:up:full` includes the `app` profile API image.)

## Scripts (root)

| Script | Purpose |
|--------|---------|
| `npm run dev:api` | Express API with `tsx watch` |
| `npm run dev:web` | Next.js (once scaffolded) |
| `npm run db:migrate` | Apply SQL migrations to Postgres |
| `npm run db:generate` | Regenerate migrations from Drizzle schema |
| `npm run compose:up` | `docker compose up -d` (infra) |
| `npm run compose:up:full` | Infra + API container (`--profile app`) |

---

Public experiments welcome; use issues and PRs against **`main`** per branch protection on this repo.
