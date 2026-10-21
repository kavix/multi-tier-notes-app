# 🚀 DevOps & DevSecOps Learning Roadmap (Beginner Track)

Welcome! This folder contains **20 beginner-friendly, step-by-step engineering issues** designed to teach you how to manually build a production-ready **Docker**, **Docker Compose**, **Kubernetes**, **CI/CD**, and **DevSecOps** security architecture from scratch.

---

## 🗺️ Learning Path

### Phase 1: Containerization (Docker)
| Issue | Title | Description |
|---|---|---|
| [Issue #1](./01-dockerfile-fastapi-backend.md) | **FastAPI Backend Dockerfile** | Python 3.11 slim, layer caching, non-root user, uvicorn entrypoint. |
| [Issue #2](./02-dockerfile-go-worker.md) | **Go Worker Dockerfile** | Multi-stage build, static compilation (`CGO_ENABLED=0`), ultra-lightweight (<20MB). |
| [Issue #3](./03-dockerfile-react-frontend.md) | **React Frontend Dockerfile** | Node builder, Nginx Alpine runtime, SPA routing fallback (`try_files`), gzip. |
| [Issue #4](./04-docker-compose-local-orchestration.md) | **Full 5-Tier Docker Compose** | Orchestrate Postgres, Redis, Backend, Worker, Frontend with healthcheck dependencies. |

---

### Phase 2: Kubernetes Manifests (K8s)
| Issue | Title | Description |
|---|---|---|
| [Issue #5](./05-k8s-namespace-config-secrets.md) | **Namespace, ConfigMaps & Secrets** | Isolate in `notes-app`, store hostnames in ConfigMap, passwords in Secret. |
| [Issue #6](./06-k8s-postgres-statefulset.md) | **PostgreSQL StatefulSet & PVC** | Stateful workloads, PersistentVolumeClaim storage, headless service, health probes. |
| [Issue #7](./07-k8s-redis-deployment.md) | **Redis Deployment & Service** | AOF persistence, ClusterIP service on port 6379, ping readiness probe. |
| [Issue #8](./08-k8s-fastapi-backend.md) | **FastAPI Backend Deployment** | 2 replicas for High Availability, probes (`/api/health`), CPU/memory limits. |
| [Issue #9](./09-k8s-go-worker.md) | **Go Background Worker** | Pod lifecycle, `terminationGracePeriodSeconds: 30`, Redis Pub/Sub subscriber. |
| [Issue #10](./10-k8s-react-frontend.md) | **React Frontend Deployment** | 2 Nginx replicas, ClusterIP service on port 80, readiness/liveness checks. |
| [Issue #11](./11-k8s-ingress-routing.md) | **Ingress & Path-Based Routing** | Single public entrypoint routing `/api` to Backend and `/` to Frontend. |

---

### Phase 3: CI/CD Pipelines (GitHub Actions)
| Issue | Title | Description |
|---|---|---|
| [Issue #12](./12-ci-pipeline-lint-test.md) | **CI: Lint & Automated Tests** | Parallel jobs for Python pytest, Go unit tests, and React TypeScript build. |
| [Issue #13](./13-ci-pipeline-docker-build-push.md) | **CI: Build & Push Images to GHCR** | Docker Buildx, GitHub Container Registry (`ghcr.io`), SHA & latest tagging. |
| [Issue #14](./14-cd-pipeline-k8s-deploy.md) | **CD: K8s Linting & Deployment** | Schema validation with `kubeconform` and automated rollout deployment. |

---

### Phase 4: DevSecOps (Automated Security Gates)
| Issue | Title | Description |
|---|---|---|
| [Issue #15](./15-devsecops-secret-scanning-gitleaks.md) | **Secret Scanning (Gitleaks)** | Scan git commits to block hardcoded database credentials, API keys, and tokens. |
| [Issue #16](./16-devsecops-sast-code-scanning.md) | **SAST Static Code Analysis** | Automated Bandit (Python), Gosec (Go), and Semgrep (React) scans in CI. |
| [Issue #17](./17-devsecops-sca-dependency-vulnerability-scanning.md) | **SCA Dependency Scanning** | Audit npm packages, pip wheels, and Go modules against CVE databases with Trivy. |
| [Issue #18](./18-devsecops-container-image-vulnerability-scanning.md) | **Container Vulnerability Scanning** | Scan Docker images with Trivy in CI before pushing to GHCR. |
| [Issue #19](./19-devsecops-k8s-pod-security-network-policies.md) | **K8s Hardening & NetworkPolicies** | ReadOnlyRootFilesystem, drop Linux capabilities, Zero-Trust pod isolation. |
| [Issue #20](./20-devsecops-dast-api-scanning-owasp-zap.md) | **DAST Dynamic API Security** | Automated OWASP ZAP attacks on OpenAPI endpoints to catch runtime flaws. |

---

## 💡 How to Work on These Issues
1. Pick one issue at a time in numerical order.
2. Follow the **Step-by-Step Starter Guide** and explanation.
3. Test using the **Verification & Testing Commands**.
4. Check off the items in the **Acceptance Criteria**!
