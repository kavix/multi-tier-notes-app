# 5-Tier Distributed Notes Application

A containerized, resilient multi-tier application featuring:
1. **Ingress**: Reverse proxy routing `/` to Frontend and `/api/` to Backend.
2. **Frontend**: Static webpage with a live visit counter, note submission form, and dynamic notes feed with cache status.
3. **Backend**: FastAPI REST API providing visit counting, note creation, and note listing.
4. **Redis**: In-memory store powering the visit counter and a 10-second cache layer for note reads.
5. **PostgreSQL**: Relational database for persistent note storage with automatic migrations.

---

## Architecture Diagram

```
                 [ Client Browser ]
                         |
                   (Port :8080)
                         v
             +-----------------------+
             |        Ingress        |
             | (Nginx Reverse Proxy) |
             +-----------+-----------+
                         |
         +---------------+---------------+
         | /                             | /api/
         v                               v
+-----------------+             +-----------------+
|    Frontend     |             |     Backend     |
| (Nginx + HTML)  |             | (FastAPI+Uvicorn|
+-----------------+             +--------+--------+
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

# Build and start all 5 tiers
docker compose up -d --build
```

Access the application in your browser:
- **Web UI**: `http://localhost:8080/`
- **Interactive API Docs**: `http://localhost:8080/api/docs`
- **Health Check**: `http://localhost:8080/api/health`

To view container status:
```bash
docker compose ps
```

To shut down:
```bash
docker compose down
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Verifies PostgreSQL and Redis connectivity |
| `GET` | `/api/visits` | Increments & returns Redis visit counter |
| `GET` | `/api/notes` | Returns notes from 10s Redis cache or queries PostgreSQL |
| `POST` | `/api/notes` | Saves new note to PostgreSQL & invalidates Redis cache |

---

## Kubernetes Deployment (Optional)

Deploy all resources to a Kubernetes cluster (e.g. k3d, minikube, cloud):

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```
