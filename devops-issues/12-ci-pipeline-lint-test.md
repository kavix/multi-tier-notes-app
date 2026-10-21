# Issue #12: [CI/CD] GitHub Actions: Lint & Automated Test Pipeline

**Labels:** `ci-cd`, `github-actions`, `testing`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Create a Continuous Integration (CI) workflow using GitHub Actions (`.github/workflows/ci.yaml`) that automatically runs linting and unit tests for Frontend, Backend, and Go Worker on every Pull Request and push to `main`.

---

## 💡 Background & Concepts for Beginners
- **Continuous Integration (CI):** The practice of automating the building and testing of code every time a team member commits changes to version control.
- **Fail Fast:** If someone breaks a Python endpoint, a React TypeScript type, or a Go test, CI fails immediately before bad code merges into `main`.

---

## 📋 Requirements & Specifications
1. **Target File:** `.github/workflows/ci.yaml`
2. **Triggers:** `push` on branch `main` and `pull_request` on branch `main`.
3. **Jobs:**
   - `test-backend`: Sets up Python 3.11, installs requirements + pytest, runs `pytest tests/test_backend.py`.
   - `test-worker`: Sets up Go 1.22, downloads modules, runs `go test -v ./...`.
   - `test-frontend`: Sets up Node.js 20, runs `npm ci` and `npm run build` (type-checks and builds).

---

## 🛠️ Step-by-Step Starter Guide

Create `.github/workflows/ci.yaml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    name: Backend Unit Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run Backend Tests
        run: |
          PYTHONPATH=. pytest ../tests/test_backend.py -v

  test-worker:
    name: Go Worker Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./worker
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache-dependency-path: worker/go.sum

      - name: Run Go Tests
        run: |
          go test -v ./...

  test-frontend:
    name: Frontend Build & Type Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: TypeScript & Vite Build
        run: npm run build
```

---

## 🧪 Verification & Testing Commands

1. Push your branch or open a Pull Request on GitHub.
2. Go to the **Actions** tab in your repository.
3. Observe all three jobs (`test-backend`, `test-worker`, `test-frontend`) running concurrently and turning green (passing).

---

## ✅ Acceptance Criteria
- [ ] `.github/workflows/ci.yaml` created.
- [ ] Backend tests run and pass.
- [ ] Go worker unit tests run and pass.
- [ ] React TypeScript builds cleanly without type errors.
