# Issue #16: [DevSecOps] Static Application Security Testing (SAST) with Bandit, Gosec & Semgrep

**Labels:** `devsecops`, `sast`, `security`, `ci-cd`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Implement automated Static Application Security Testing (SAST) across all 3 programming languages in our stack:
- **Bandit** for Python (FastAPI)
- **Gosec** for Go (Worker)
- **Semgrep** for React (TypeScript / Frontend)

---

## 💡 Background & Concepts for Beginners
- **SAST (White-Box Testing):** Analyzes source code files directly without executing the program. It looks for known insecure patterns such as:
  - SQL injection risks or unescaped queries
  - Weak cryptographic hashing or pseudorandom number generators
  - Unhandled errors, unsafe pointers, or command injection flaws
  - Insecure CORS wildcards (`allow_origins=["*"]`) in production

---

## 📋 Requirements & Specifications
1. **Target File:** `.github/workflows/security-sast.yaml`
2. **Scanners:**
   - Python: `bandit -r backend/app -ll -ii` (flag medium/high severity and confidence).
   - Go: `gosec -quiet ./...` inside `worker/`.
   - Semgrep: Multi-language security ruleset (`p/default`, `p/owasp-top-ten`).
3. **Trigger:** PRs and pushes to `main`.

---

## 🛠️ Step-by-Step Starter Guide

Create `.github/workflows/security-sast.yaml`:

```yaml
name: DevSecOps - SAST Code Scanning

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  sast-python:
    name: SAST - Python (Bandit)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Bandit
        run: pip install bandit

      - name: Scan FastAPI Backend
        run: bandit -r backend/app -ll -ii

  sast-go:
    name: SAST - Go (Gosec)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Install and Run Gosec
        uses: securego/gosec@master
        with:
          args: ./worker/...

  sast-semgrep:
    name: SAST - Polyglot & React (Semgrep)
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Semgrep Rules
        run: semgrep scan --config auto --error
```

---

## 🧪 Verification & Testing Commands

Run scans locally:

```bash
# Test Python backend with Bandit
pip install bandit
bandit -r backend/app -v

# Test Go worker with Gosec
go install github.com/securego/gosec/v2/cmd/gosec@latest
cd worker && gosec ./...
```

---

## ✅ Acceptance Criteria
- [ ] `.github/workflows/security-sast.yaml` created.
- [ ] Python, Go, and React codebases pass SAST security checks without high/critical issues.
- [ ] Scans run automatically on every pull request.
