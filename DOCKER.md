# Running with Docker

Four services via docker compose: **nginx** (entry point, port 8080) →
**frontend** (TanStack Start SSR, node) + **backend** (FastAPI/uvicorn) →
**db** (PostgreSQL 16).

```
browser ──> nginx :8080 ──┬── /api/*  ──> backend :8000 ──> db :5432
                          └── /*      ──> frontend :3000
```

## Quick start (development, hot reload)

```sh
cd My-Health-Compass
docker compose up -d --build
```

- App: http://localhost:8080
- API docs: http://localhost:8080/api/docs

`docker compose up` automatically merges `docker-compose.override.yml`, which
bind-mounts your source into the containers:

- **backend** — `uvicorn --reload`: edit anything under `backend/app/` and the
  server restarts.
- **frontend** — Vite dev server: edits under `frontend/src/` hot-reload in the
  browser (HMR), no refresh needed.

Both watchers poll (file events don't cross Docker Desktop bind mounts), so a
change can take up to ~1 s to apply. After changing `frontend/package.json`,
restart the frontend container (`docker compose restart frontend`) — it re-runs
`bun install` on start. After changing `backend/requirements.txt`, rebuild:
`docker compose up -d --build backend`.

## Production-style build

```sh
docker compose -f docker-compose.yml up -d --build
```

Skips the dev override: no bind mounts, frontend served as the optimized
TanStack Start build.

Configuration is optional — copy `.env.example` to `.env` to change the port,
Postgres password, JWT secret, or add AI API keys.

## Demo data

```sh
docker compose exec backend python seed_demo.py
```

Creates 3 patients + 3 doctors (password `demo123`) with a full history.

## Notes

- The database schema is created automatically on backend startup.
- Postgres data persists in the `pgdata` volume; uploaded documents/images in
  the `uploads` volume. `docker compose down -v` wipes both.
- The frontend bundle bakes in `VITE_API_URL=/api` (see
  `frontend/Dockerfile` build arg); nginx strips the `/api` prefix and the
  backend runs with `--root-path /api` so its docs/OpenAPI URLs match.
- Postgres is not exposed to the host by default — uncomment the `ports`
  block on `db` in `docker-compose.yml` if you need psql access.
