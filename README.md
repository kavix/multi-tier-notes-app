# 5-Tier Distributed Notes Application (No Nginx)

A resilient multi-tier application where **FastAPI directly handles ingress routing**, serving the static frontend UI at `/` and REST API endpoints at `/api/`, backed by Redis and PostgreSQL:

1. **Routing & Ingress**: FastAPI routes `/` to the static Single Page Application and `/api/` to the REST API endpoints.
2. **Frontend**: Static webpage with a live visit counter, note submission form, and dynamic notes feed with Redis cache indicators.
3. **Backend**: FastAPI REST API providing visit counting, note creation, and note listing.
4. **Redis**: In-memory store powering the visit counter (`INCR visit_counter`) and a 10-second cache layer for note reads (`notes_cache` with `EX=10`).
5. **PostgreSQL**: Relational database for persistent note storage with automatic schema initialization.

---

## Architecture Diagram

```
                 [ Client Browser ]
                         |
                   (Port :8088)
                         v
             +-----------------------+
             |    FastAPI (App)      |
             |  Serves / & /api/     |
             +-----------+-----------+
                         |
       +-----------------+-----------------+
       |                                   |
       v                                   v
+-----------------+                 +-----------------+
|      Redis      |                 |   PostgreSQL    |
| (Counter/Cache) |                 | (Notes Storage) |
+-----------------+                 +-----------------+
```

---

## Quickstart with Docker Compose

Ensure Docker daemon / Colima is running:

```bash
export DOCKER_HOST="unix:///Users/kavix/.colima/default/docker.sock"
cd /Users/kavix/multi-tier-notes-app

# Build and start all services
docker compose up -d --build
```

Access the application in your browser:
- **Web UI**: [http://localhost:8088/](http://localhost:8088/)
- **Interactive API Docs**: [http://localhost:8088/api/docs](http://localhost:8088/api/docs)
- **Health Check**: [http://localhost:8088/api/health](http://localhost:8088/api/health)

To view container status:
```bash
docker compose ps
```

To shut down:
```bash
docker compose down
```

---

## Running Verification Tests

To run the automated end-to-end integration tests:

```bash
python3 -m pytest tests/test_app.py -v
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Serves the static single-page frontend |
| `GET` | `/api/health` | Verifies PostgreSQL and Redis connectivity |
| `GET` | `/api/visits` | Increments & returns Redis visit counter |
| `GET` | `/api/notes` | Returns notes from 10s Redis cache or queries PostgreSQL |
| `POST` | `/api/notes` | Saves new note to PostgreSQL & invalidates Redis cache |
