# Issue #15: [DevSecOps] Automated Secret Scanning with Gitleaks in CI & Pre-Commit

**Labels:** `devsecops`, `security`, `ci-cd`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Prevent hardcoded API keys, database passwords, and private tokens from ever entering Git history by implementing **Gitleaks** secret detection in GitHub Actions and local pre-commit hooks.

---

## 💡 Background & Concepts for Beginners
- **The Problem:** Once a secret (like a database password or AWS secret key) is pushed to a Git repository, it remains in the Git history forever—even if you delete the file in a subsequent commit! Attackers scan public repositories within seconds of pushes.
- **The Solution:** Automated secret scanning runs regex and entropy algorithms to detect secrets *before* code is merged or pushed.

---

## 📋 Requirements & Specifications
1. **Target Files:**
   - `.github/workflows/security-secrets.yaml`
   - `.gitleaks.toml` (Optional custom configuration)
2. **Workflow Triggers:** On `pull_request` and `push` to all branches.
3. **Behavior:** Fail the CI build if any unencrypted secret pattern is detected in commits.

---

## 🛠️ Step-by-Step Starter Guide

Create `.github/workflows/security-secrets.yaml`:

```yaml
name: DevSecOps - Secret Scanning

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  gitleaks:
    name: Secret Detection (Gitleaks)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Fetch all history for secret scanning

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: "" # Free for public repositories
```

### Local Testing with Docker (No Install Needed):
You can run Gitleaks locally before committing:
```bash
docker run -v $(pwd):/path zricethezav/gitleaks:latest detect --source="/path" -v
```

---

## 🧪 Verification & Testing Commands

1. Test committing a dummy secret in a test file:
   ```bash
   echo "AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE12345" > test_secret.txt
   ```
2. Run Gitleaks locally:
   ```bash
   docker run -v $(pwd):/path zricethezav/gitleaks:latest detect --source="/path" -v
   # Should exit with code 1 and flag the dummy secret!
   ```
3. Remove test file:
   ```bash
   rm test_secret.txt
   ```

---

## ✅ Acceptance Criteria
- [ ] `.github/workflows/security-secrets.yaml` created.
- [ ] Gitleaks scans all pull requests for committed secrets.
- [ ] Workflow passes with zero leaks found in current repo.
