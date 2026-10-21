# Issue #14: [CI/CD] GitHub Actions: Kubernetes Manifest Linting & Continuous Deployment

**Labels:** `ci-cd`, `kubernetes`, `gitops`, `cd`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Create a Continuous Deployment (CD) workflow (`.github/workflows/deploy.yaml`) to validate/lint Kubernetes manifests (using `kubeconform`) and automatically deploy the updated images to a Kubernetes cluster or update image tags for GitOps.

---

## 💡 Background & Concepts for Beginners
- **Continuous Deployment (CD):** Once code is tested and containerized, the CD pipeline automatically deploys the new version to staging or production without manual intervention.
- **Manifest Linting:** Before applying YAML files to a live cluster, tools like `kubeconform` validate that your Kubernetes manifests adhere to official Kubernetes OpenAPI schemas (catching typos and missing required fields).

---

## 📋 Requirements & Specifications
1. **Target File:** `.github/workflows/deploy.yaml`
2. **Steps:**
   - Lint all YAML manifests in `k8s/` using `kubeconform`.
   - Update image tags in deployment manifests (`notes-backend`, `notes-worker`, `notes-frontend`) to the current commit SHA.
   - Apply manifests using `kubectl apply` (or configured kubeconfig secret).

---

## 🛠️ Step-by-Step Starter Guide

Create `.github/workflows/deploy.yaml`:

```yaml
name: Kubernetes Lint & Deploy

on:
  workflow_run:
    workflows: ["Build and Push Docker Images"]
    types:
      - completed

jobs:
  validate-and-deploy:
    name: Validate Manifests & Deploy
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Kubeconform (K8s Validator)
        run: |
          curl -sL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar -xz
          sudo mv kubeconform /usr/local/bin/

      - name: Validate Kubernetes Manifests
        run: |
          kubeconform -summary -verbose -kubernetes-version 1.29.0 k8s/

      # Optional step if deploying to a remote Kubernetes cluster (e.g. AWS EKS, GKE, DigitalOcean, or K3s)
      # - name: Set Kubernetes Context
      #   uses: azure/k8s-set-context@v3
      #   with:
      #     method: kubeconfig
      #     kubeconfig: ${{ secrets.KUBECONFIG }}

      # - name: Deploy to Kubernetes
      #   run: |
      #     kubectl apply -f k8s/00-namespace.yaml
      #     kubectl apply -f k8s/01-configmap.yaml
      #     kubectl apply -f k8s/02-secret.yaml
      #     kubectl apply -f k8s/03-postgres.yaml
      #     kubectl apply -f k8s/04-redis.yaml
      #     kubectl apply -f k8s/05-backend.yaml
      #     kubectl apply -f k8s/06-worker.yaml
      #     kubectl apply -f k8s/07-frontend.yaml
      #     kubectl apply -f k8s/08-ingress.yaml
      #     kubectl rollout status deployment/backend -n notes-app --timeout=120s
```

---

## 🧪 Verification & Testing Commands

Run validation locally with kubeconform or dry-run:
```bash
# Validate manifests without applying
kubectl apply --dry-run=client -f k8s/
```

---

## ✅ Acceptance Criteria
- [ ] `.github/workflows/deploy.yaml` created.
- [ ] K8s manifests are linted and schema-validated before deployment.
- [ ] Pipeline triggers automatically when Docker images are built.
