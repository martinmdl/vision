# Docker setup (frontend + backend + PostgreSQL)

## Requirements

- Docker Desktop installed and running.
- Docker Compose v2 (included with Docker Desktop).

## First run

From repository root:

```powershell
docker compose up --build
```

This starts:

- Frontend: http://localhost:8080
- Backend (FastAPI): http://localhost:8000
- PostgreSQL: localhost:5432

## Useful commands

Start in detached mode:

```powershell
docker compose up -d --build
```

View logs:

```powershell
docker compose logs -f
```

Stop services (keep DB data):

```powershell
docker compose down
```

Stop and delete DB data volume:

```powershell
docker compose down -v
```

Rebuild one service:

```powershell
docker compose build back
# or
docker compose build front
```

## PostgreSQL connection

The backend container uses this connection string via environment variable:

```text
postgresql+psycopg2://vision_user:vision_pass@postgres:5432/vision_db
```

From your host machine (optional), you can connect to Postgres using:

- Host: localhost
- Port: 5432
- User: vision_user
- Password: vision_pass
- Database: vision_db

## Notes

- Postgres data is persisted in Docker volume `postgres_data`.
- Your `back/.env` is not required in Docker for DB credentials because Compose injects `CREDENTIALS` directly into the backend container.
- Frontend keeps using `http://127.0.0.1:8000` from the browser, which works because backend port 8000 is published to host.
