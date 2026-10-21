# Issue #13: [CI/CD] GitHub Actions: Build & Push Docker Images to GHCR

**Labels:** `ci-cd`, `docker`, `registry`, `security`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Create a workflow (`.github/workflows/docker-publish.yaml`) that builds production Docker images for Backend, Worker, and Frontend and automatically pushes them to GitHub Container Registry (`ghcr.io`).

---

## 💡 Background & Concepts for Beginners
- **Container Registry:** A centralized storage location for Docker images (like Docker Hub or GitHub Packages/GHCR).
- **GitHub Token (`secrets.GITHUB_TOKEN`):** GitHub Actions automatically provides a temporary security token to authenticate with `ghcr.io`—no manual password management required!
- **Image Tagging:** Best practice is to tag images with the Git commit SHA (e.g. `notes-backend:a1b2c3d`) for immutability, as well as `latest`.

---

## 📋 Requirements & Specifications
1. **Target File:** `.github/workflows/docker-publish.yaml`
2. **Registry:** `ghcr.io`
3. **Images to publish:**
   - `ghcr.io/<username>/notes-backend`
   - `ghcr.io/<username>/notes-worker`
   - `ghcr.io/<username>/notes-frontend`
4. **Trigger:** On push to `main` branch (after tests pass).
5. **Permissions:** `packages: write`, `contents: read`.

---

## 🛠️ Step-by-Step Starter Guide

Create `.github/workflows/docker-publish.yaml`:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  build-and-push:
    name: Build & Push Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        component:
          - name: backend
            context: ./backend
          - name: worker
            context: ./worker
          - name: frontend
            context: ./frontend

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-${{ matrix.component.name }}
          tags: |
            type=sha,format=short
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.component.context }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 🧪 Verification & Testing Commands

1. Commit and push this workflow to `main`.
2. Inspect the GitHub Actions tab.
3. Once completed, visit your GitHub profile -> **Packages** tab to view your published container images:
   - `notes-backend`
   - `notes-worker`
   - `notes-frontend`

---

## ✅ Acceptance Criteria
- [ ] `.github/workflows/docker-publish.yaml` created.
- [ ] Docker Buildx builds all three components with layer caching.
- [ ] Images are published to `ghcr.io` tagged with Git SHA and `latest`.
