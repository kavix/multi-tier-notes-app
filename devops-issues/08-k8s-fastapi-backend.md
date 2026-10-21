# Issue #8: [K8s] Deploy FastAPI Backend with Probes, Resource Limits, and Service

**Labels:** `kubernetes`, `backend`, `fastapi`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Deploy the Python FastAPI backend into the Kubernetes cluster with multiple replicas for High Availability (HA), proper environment configuration, health probes, and a ClusterIP Service.

---

## 💡 Background & Concepts for Beginners
- **High Availability (HA):** Running `replicas: 2` ensures that if one pod crashes or is upgraded, the second pod continues answering requests with zero downtime.
- **Resource Requests & Limits:**
  - `requests`: The minimum CPU & memory guaranteed to the pod.
  - `limits`: The maximum CPU & memory the pod is allowed to consume before being throttled (CPU) or killed by OOM (Memory).
- **Liveness vs Readiness:**
  - `livenessProbe`: Is the container alive? If it fails, Kubernetes restarts the pod.
  - `readinessProbe`: Is the app ready to handle user requests? If it fails, Kubernetes stops sending traffic to the pod.

---

## 📋 Requirements & Specifications
1. **Target File:** `k8s/05-backend.yaml`
2. **Namespace:** `notes-app`
3. **Deployment:**
   - Name: `backend`
   - Replicas: 2
   - Image: `notes-backend:latest` (or your GHCR image)
   - Environment: Load all variables from `app-config` and `app-secrets`.
   - Probes: HTTP GET on `/api/health` port 8000.
   - Resources: requests (100m CPU, 128Mi RAM), limits (500m CPU, 512Mi RAM).
4. **Service:**
   - ClusterIP named `backend-service`
   - Port 8000 -> targetPort 8000

---

## 🛠️ Step-by-Step Starter Guide

Create `k8s/05-backend.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: notes-app
  labels:
    app: backend
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
      name: http
  selector:
    app: backend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: notes-app
  labels:
    app: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: notes-backend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
              name: http
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          livenessProbe:
            httpGet:
              path: /api/health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
          readinessProbe:
            httpGet:
              path: /api/health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

---

## 🧪 Verification & Testing Commands

Apply manifest:
```bash
kubectl apply -f k8s/05-backend.yaml
```

Check rollout status:
```bash
kubectl rollout status deployment/backend -n notes-app
```

Test health check endpoint via port-forward:
```bash
kubectl port-forward -n notes-app service/backend-service 8000:8000 &
curl http://localhost:8000/api/health
# Expected: {"status":"ok","postgres":"ok","redis":"ok","worker":"ok"}
```

---

## ✅ Acceptance Criteria
- [ ] `k8s/05-backend.yaml` created.
- [ ] 2 backend pods run concurrently in `notes-app` namespace.
- [ ] Both pods pass `/api/health` readiness probe.
- [ ] Service `backend-service` routes traffic evenly across pods.
