# Issue #2: [Docker] Create Minimal Production Dockerfile for Go Background Worker

**Labels:** `docker`, `worker`, `golang`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Create a multi-stage `worker/Dockerfile` that compiles the Go worker into a statically-linked, ultra-lightweight production binary (<20MB).

---

## 💡 Background & Concepts for Beginners
- **Multi-Stage Builds:** Use a heavy build image (like `golang:1.22-alpine` ~300MB) to compile code, and copy *only* the compiled binary into a tiny base image (like `alpine:3.19` ~7MB) or `scratch` (~0MB).
- **Static Compilation (`CGO_ENABLED=0`):** Compiles all necessary C libraries into the Go binary itself, allowing it to run without dynamic glibc dependencies.

---

## 📋 Requirements & Specifications
1. **Target File:** `worker/Dockerfile`
2. **Build Stage:**
   - Image: `golang:1.22-alpine AS builder`
   - Copy `go.mod` and `go.sum` first; run `go mod download`.
   - Copy source files (`main.go`, `internal/`).
   - Compile: `CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o worker .`
3. **Runtime Stage:**
   - Image: `alpine:3.19`
   - Add non-root user (`adduser -D -u 1000 workeruser`).
   - Copy `/app/worker` from builder stage.
   - Run as `workeruser`.
   - Entrypoint: `./worker`.

---

## 🛠️ Step-by-Step Starter Guide

Create `worker/Dockerfile`:

```dockerfile
# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Download dependencies first to leverage caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY main.go .
COPY internal/ ./internal/

# Build static executable (-ldflags="-s -w" strips debug symbols to minimize binary size)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o worker .

# Stage 2: Create minimal runtime container
FROM alpine:3.19

WORKDIR /app

# Create non-root user
RUN adduser -D -u 1000 workeruser

# Copy binary from builder
COPY --from=builder /app/worker .

USER workeruser

CMD ["./worker"]
```

---

## 🧪 Verification & Testing Commands

Build the Docker image:
```bash
docker build -t notes-worker:latest ./worker
```

Inspect image size:
```bash
docker images | grep notes-worker
# Expected: Size should be under 25MB!
```

Run container:
```bash
docker run -e REDIS_HOST=host.docker.internal -e REDIS_PORT=6379 notes-worker:latest
```

---

## ✅ Acceptance Criteria
- [ ] `worker/Dockerfile` exists.
- [ ] Multi-stage build succeeds (`docker build -t notes-worker ./worker`).
- [ ] Image size is under 30MB.
- [ ] Runs with non-root user `workeruser`.
