# Issue #20: [DevSecOps] Dynamic Application Security Testing (DAST) with OWASP ZAP

**Labels:** `devsecops`, `dast`, `security`, `ci-cd`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Implement Dynamic Application Security Testing (DAST) using **OWASP ZAP (Zed Attack Proxy)** to attack and test the running FastAPI REST API from an external perspective, detecting runtime vulnerabilities like missing security headers, improper CORS, and API misconfigurations.

---

## 💡 Background & Concepts for Beginners
- **SAST vs DAST:**
  - **SAST (Static):** Scans the source code files *before* running.
  - **DAST (Dynamic / Black-Box):** Sends real HTTP payloads (simulating an external hacker) against the running application to see how the server actually responds in practice.
- **OWASP ZAP:** The world's most widely used open-source web application security scanner maintained by OWASP.

---

## 📋 Requirements & Specifications
1. **Target File:** `.github/workflows/security-dast.yaml`
2. **Scanner:** `zaproxy/action-api-scan` (API scan designed specifically for OpenAPI / Swagger specs).
3. **Target Endpoint:** OpenAPI schema `/openapi.json` exposed by FastAPI backend.
4. **Behavior:** Generate an HTML/Markdown vulnerability report in CI.

---

## 🛠️ Step-by-Step Starter Guide

Create `.github/workflows/security-dast.yaml`:

```yaml
name: DevSecOps - DAST Dynamic API Scan

on:
  schedule:
    # Run dynamic scan weekly against staging or integration environment
    - cron: '0 2 * * 0'
  workflow_dispatch: # Allows manual trigger from GitHub UI

jobs:
  zap-api-scan:
    name: OWASP ZAP API Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Start Services with Docker Compose
        run: |
          docker compose up -d postgres redis backend
          # Wait for backend to be healthy
          sleep 10
          curl -f http://localhost:8000/api/health

      - name: Run OWASP ZAP API Scan
        uses: zaproxy/action-api-scan@v0.8.0
        with:
          target: 'http://localhost:8000/openapi.json'
          format: 'openapi'
          fail_action: false # Set to true to break build on HIGH vulnerabilities
          cmd_options: '-a'
```

### Local Testing with Docker:
Run OWASP ZAP against your local running FastAPI server:
```bash
docker run -t zaproxy/zap-stable zap-api-scan.py \
  -t http://host.docker.internal:8000/openapi.json \
  -f openapi
```

---

## 🧪 Verification & Testing Commands

Check FastAPI security headers:
```bash
curl -I http://localhost:8000/api/health
```
Look for standard security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`

---

## ✅ Acceptance Criteria
- [ ] `.github/workflows/security-dast.yaml` created.
- [ ] OWASP ZAP attacks API schema endpoints and generates an audit report.
- [ ] No CRITICAL runtime security flaws detected on `/api/*` endpoints.
