# Jobell

Track new job postings from top companies in near real time. Filter by title, level,
location, years of experience, degree requirement and post date, and get notified by
email as soon as a new job matches.

> Current repo status: the backend base framework (data model + filter API + DB
> migrations) is done. Email/Google-OAuth auth is wired up end to end (backend +
> frontend). The job board UI and the scraping engine are chosen but not yet
> implemented — see "Current status" below.

## Tech stack

### Frontend — Next.js (TypeScript) + Tailwind CSS
*(auth pages implemented: signup/login/Google OAuth callback; job board UI not yet built)*

- Next.js ships routing out of the box and supports SSR. SEO matters a lot for a job
  board — SSR lets each company's job listing/detail pages rank well on Google, which
  brings free organic traffic.
- Tailwind lets you style directly in class names for fast iteration; shadcn/ui gives a
  mature component set to quickly assemble filter/list/detail pages.

### Core backend API — Python + FastAPI + SQLAlchemy (async) + PostgreSQL

- FastAPI has native `async/await` support, which paired with SQLAlchemy 2.0's async
  ORM keeps throughput high for I/O-heavy filtering/query workloads.
- Auto-generated OpenAPI/Swagger docs (`/docs`) mean the frontend and the scraper don't
  need separately maintained API documentation.
- Compared to Django/Flask, FastAPI's type hints + Pydantic validation make declaring
  and validating request parameters (filter conditions) very direct.

### Scraping engine — Playwright + Scrapy + httpx
*(chosen, not yet implemented)*

- Big tech career sites and mainstream job platforms (Workday, LinkedIn, etc.) have
  strict anti-bot measures; plain HTTP requests get blocked easily. Playwright can
  fake real browser fingerprints for sites that need JS execution or have strong
  anti-bot protection.
- Not every target needs a headless browser though: many SPA career pages are actually
  backed by a clean JSON API (e.g. Greenhouse). For those, hitting the API directly
  with `httpx` is 10-100x faster and far cheaper on resources than running Playwright
  end to end.
- Scrapy handles the simple, highly-concurrent-friendly targets (like the Greenhouse
  API); Playwright is reserved for sites that genuinely need interaction, have no
  usable API, or have strong anti-bot protection.

### Data relay / queue — Redis
*(infrastructure is ready in docker-compose, business logic not wired up yet)*

- The standard choice for caching, message queues and rate limiting. Newly scraped
  jobs get pushed onto a Redis queue and consumed by a notification service that
  triggers emails — this is the core of near-instant notifications.

### Primary database — PostgreSQL

- Compared to MySQL, Postgres is stronger at complex queries, JSON columns, and
  potential future geo calculations (e.g. distance to a job), and it's currently the
  more popular choice in the community.

## Project infrastructure

- **Code layout**: monorepo with independent top-level directories — `frontend/`,
  `backend/`, `scraper/` — no extra monorepo tooling (turborepo/nx) for now.
- **Python package management**: [`uv`](https://github.com/astral-sh/uv) — currently
  the fastest Python package manager; dependencies declared via `pyproject.toml` +
  `uv.lock`.
- **Local infrastructure**: `docker-compose.yml` spins up PostgreSQL + Redis with one
  command.
- **DB migrations**: Alembic, using the async engine + `run_sync` pattern (the
  officially recommended approach); migration files live in
  `backend/migrations/versions/`.

## Current status

| Module | Status |
| --- | --- |
| `backend/` — FastAPI app, `Job` data model, filter API, Alembic migrations | ✅ Done |
| `backend/` — email signup/login + Google OAuth | ✅ Done |
| `frontend/` — Next.js auth pages (signup/login/Google OAuth callback) | ✅ Done |
| `frontend/` — job board UI (filters/list/detail) | ⏳ Not started |
| `scraper/` — Playwright/Scrapy scraping engine | ⏳ Not started |
| Redis notification/queue consumer logic | ⏳ Not started (Redis service is ready) |

## Running locally

> Ports are intentionally offset from another similar project on this machine
> (Postgres `5433`, Redis `6380`, backend API `8001`, frontend `3001` later) so both
> can run side by side without conflicts.

### Prerequisites

- [Docker](https://www.docker.com/)
- [`uv`](https://github.com/astral-sh/uv) (`brew install uv`, or see the official docs)

### Steps

1. **Start the database and Redis.** This reads `docker-compose.yml` and boots two
   containers — `jobeller-postgres-1` (the app's database, exposed on host port
   `5433`) and `jobeller-redis-1` (exposed on `6380`, not used by any code yet but
   ready for the future notification queue). Data is kept in the `pgdata` Docker
   volume, so it survives container restarts.

   ```bash
   docker compose up -d postgres redis
   ```

2. **Install backend dependencies.** `uv sync` reads `backend/pyproject.toml`, resolves
   versions into `backend/uv.lock`, creates a virtualenv at `backend/.venv`, and
   installs everything into it (FastAPI, SQLAlchemy, asyncpg, Alembic, etc.).

   ```bash
   cd backend
   uv sync
   ```

   > If your network can't reach pypi.org directly, `backend/uv.toml` is already
   > configured to use the internal mirror at `artifactory.corp.ebay.com`
   > (`pypi-remote`) — `uv sync` will use it automatically.

3. **Copy the env file.** `app/core/config.py` reads `backend/.env` for settings like
   `DATABASE_URL`/`REDIS_URL`/`CORS_ORIGINS`.

   ```bash
   cp ../.env.example .env
   ```

   If you only need `/api/jobs`, the hardcoded defaults in
   `backend/app/core/config.py` already match the ports in `docker-compose.yml`, so
   this step can be skipped. **But Google login needs a real `.env`:**
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` default to empty, so without a
   `backend/.env` containing real values the Google OAuth flow fails immediately.
   To enable it:

   1. Create an OAuth 2.0 Client ID at the
      [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
      (application type: Web application).
   2. Fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `backend/.env` with the
      values from that client.
   3. Add `http://localhost:8001/api/auth/google/callback` as an Authorized redirect
      URI on that client — it must match `GOOGLE_REDIRECT_URI` in `.env` exactly.
   4. Make sure `FRONTEND_URL` in `.env` matches the port the frontend actually runs
      on (`http://localhost:3001` by default) — the backend redirects here after a
      successful Google login.

4. **Run database migrations.** This connects to the Postgres container from step 1
   and applies every migration under `backend/migrations/versions/` in order —
   currently just `0001_create_jobs_table`, which creates the `jobs` table and its
   indexes.

   ```bash
   cd backend
   uv run alembic upgrade head
   ```

5. **Start the backend API.** This runs the FastAPI app defined in `app/main.py` with
   auto-reload on code changes, listening on port `8001` (chosen to not collide with
   the `jobell` project's backend on `8000`).

   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8001
   ```

6. **Install frontend dependencies and start the dev server.** This installs the
   Next.js app under `frontend/` and runs it on port `3001` (configured in
   `frontend/package.json`'s `dev` script).

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   `frontend/.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8001` so the
   frontend knows where to reach the backend; there's a `.env.local.example` to copy
   from if `.env.local` doesn't exist yet.

### Open in the browser

- **Backend Swagger docs** (interactive API explorer, auto-generated from the FastAPI
  routes): http://localhost:8001/docs
- **Backend health check**: http://localhost:8001/health
- **Frontend**: http://localhost:3001 — signup/login (email or Google) and a
  logged-in landing page. The job board UI itself isn't built yet.

### Common commands

```bash
# After adding/changing Job model fields, generate a new migration
uv run alembic revision --autogenerate -m "describe the change"

# Stop local infrastructure (keeps data)
docker compose down

# Stop and wipe the data volumes
docker compose down -v
```

> **Migration state out of sync?** If `alembic upgrade head` fails with
> `Can't locate revision identified by '...'`, your local Postgres remembers a
> migration that isn't in `backend/migrations/versions/` on your current branch
> (commonly happens after switching branches with different migrations applied).
> Since local data is disposable, the easiest fix is to wipe and rebuild:
>
> ```bash
> docker compose down -v          # from the repo root
> docker compose up -d postgres redis
> cd backend && uv run alembic upgrade head
> ```

## API overview

- `GET /health` — health check
- `GET /api/jobs` — list jobs; supports filtering by `title`, `company`, `level`,
  `location`, `min_years`, `max_years`, `education`, `posted_after`, `posted_before`,
  `is_active`, plus pagination via `page`/`page_size`
- `GET /api/jobs/{id}` — job detail
- `POST /api/jobs` — create a job (for future scraper scripts / admin tooling)
- `POST /api/auth/signup` / `POST /api/auth/login` — email + password auth, returns a
  JWT `access_token`
- `GET /api/auth/google/login` — redirects to Google's OAuth consent screen
- `GET /api/auth/google/callback` — Google's redirect target; on success, redirects
  the browser to `{FRONTEND_URL}/auth/callback#access_token=...`
- `GET /api/auth/me` — current user, requires `Authorization: Bearer <token>`

## Data model: `Job`

`backend/app/models/job.py`, key fields:

- `source` / `external_id`: source system and its internal id; the
  `(source, external_id)` unique constraint lets scrapers upsert without duplicates
- `company` / `title` / `level` / `location`: base filter fields
- `min_years_experience` / `max_years_experience` / `education` / `employment_type`:
  years of experience, degree requirement, employment type
- `url`: link to the job detail page (unique)
- `posted_at`: when the company posted the job; `first_seen_at` / `last_seen_at`: when
  the scraper first/most recently saw this job, used to detect closed postings
- `is_active`: whether the job is still open
