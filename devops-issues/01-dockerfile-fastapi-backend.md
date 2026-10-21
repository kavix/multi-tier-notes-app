# Issue #1: [Docker] Create Multi-Stage Dockerfile for Python FastAPI Backend

**Labels:** `docker`, `backend`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Create a production-grade, secure `backend/Dockerfile` that builds and packages the FastAPI application.

---

## 💡 Background & Concepts for Beginners
- **Containerization**: Packaging an app and its dependencies together so it runs identically everywhere.
- **Layer Caching**: In Dockerfiles, order matters! Copy `requirements.txt` and run `pip install` *before* copying the source code so Docker caches installed packages when only code edits are made.
- **Non-Root User**: Running containers as `root` is a security risk. Best practice is to create a dedicated user (e.g. `appuser`).

---

## 📋 Requirements & Specifications
1. **Target File:** `backend/Dockerfile`
2. **Base Image:** `python:3.11-slim` or `python:3.12-slim` (avoids bloated standard images).
3. **Working Directory:** `/app`
4. **Dependencies:**
   - Install dependencies from `requirements.txt` with `--no-cache-dir`.
5. **Security:**
   - Add a non-privileged user and switch to it (`USER appuser`).
6. **Port:** Expose port `8000`.
7. **Start Command:** Run with `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

---

## 🛠️ Step-by-Step Starter Guide

Create `backend/Dockerfile` with the following structure:

```dockerfile
FROM python:3.11-slim

# 1. Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 2. Install curl (optional for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 3. Create non-root user
RUN useradd -m -u 1000 appuser

# 4. Install python dependencies first (leverage layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy backend application source
COPY app/ ./app/

# 6. Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🧪 Verification & Testing Commands

Build the Docker image:
```bash
docker build -t notes-backend:latest ./backend
```

Run the container (connecting to local or containerized Postgres & Redis):
```bash
docker run -p 8000:8000 \
  -e POSTGRES_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  notes-backend:latest
```

Verify with curl:
```bash
curl http://localhost:8000/
# Expected: {"message":"Multi-Tier Notes API","docs":"/docs"}
```

---

## ✅ Acceptance Criteria
- [ ] `backend/Dockerfile` exists.
- [ ] Image builds without errors (`docker build -t notes-backend ./backend`).
- [ ] Container runs as a non-root user.
- [ ] Container responds on port `8000`.
