# Issue #4: [Compose] Create Docker Compose for Full 5-Tier Local Stack

**Labels:** `docker-compose`, `orchestration`, `local-dev`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Create a root-level `docker-compose.yml` to spin up all 5 tiers (PostgreSQL, Redis, FastAPI Backend, Go Worker, and React Frontend) with a single command: `docker compose up -d`.

---

## 💡 Background & Concepts for Beginners
- **Docker Compose:** A tool for defining and running multi-container Docker applications.
- **Service Discovery & Networking:** Containers on the same Docker Compose network communicate using service names (e.g. `http://postgres:5432`, `redis:6379`, `http://backend:8000`).
- **Healthchecks & Dependencies (`depends_on`):** Ensures backend and worker don't start until PostgreSQL and Redis are ready to accept connections.

---

## 📋 Requirements & Specifications
1. **Target File:** `docker-compose.yml`
2. **Services:**
   - `postgres`: image `postgres:16-alpine`, volumes `postgres_data:/var/lib/postgresql/data`, healthcheck `pg_isready`.
   - `redis`: image `redis:7-alpine`, command `["redis-server", "--appendonly", "yes"]`, healthcheck `redis-cli ping`.
   - `backend`: builds `./backend`, ports `8000:8000`, depends on `postgres` & `redis` healthy.
   - `worker`: builds `./worker`, depends on `redis` healthy.
   - `frontend`: builds `./frontend`, ports `3000:80`, depends on `backend`.
3. **Volumes:** `postgres_data`, `redis_data`.
4. **Networks:** Shared bridge network `notes-net`.

---

## 🛠️ Step-by-Step Starter Guide

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: notes-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: notes_user
      POSTGRES_PASSWORD: notes_password
      POSTGRES_DB: notes_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U notes_user -d notes_db"]
      interval: 3s
      timeout: 3s
      retries: 10
    networks:
      - notes-net

  redis:
    image: redis:7-alpine
    container_name: notes-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 10
    networks:
      - notes-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: notes-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_USER: notes_user
      POSTGRES_PASSWORD: notes_password
      POSTGRES_DB: notes_db
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - notes-net

  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile
    container_name: notes-worker
    restart: unless-stopped
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - notes-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: notes-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - notes-net

volumes:
  postgres_data:
  redis_data:

networks:
  notes-net:
    driver: bridge
```

---

## 🧪 Verification & Testing Commands

1. Start all containers:
   ```bash
   docker compose up -d --build
   ```
2. Check container status:
   ```bash
   docker compose ps
   ```
3. Test backend health endpoint:
   ```bash
   curl http://localhost:8000/api/health
   # Expected: {"status":"ok","postgres":"ok","redis":"ok","worker":"ok"}
   ```
4. Open the React frontend in your browser: [http://localhost:3000](http://localhost:3000)
5. Create a note and observe the Go worker computing word count and summary in real time!
6. Stop containers:
   ```bash
   docker compose down
   ```

---

## ✅ Acceptance Criteria
- [ ] `docker-compose.yml` orchestrates all 5 tiers.
- [ ] Healthchecks ensure proper startup ordering.
- [ ] Data persists across restarts with named volumes.
- [ ] Frontend successfully communicates with backend on `http://localhost:3000`.
