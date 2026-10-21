# Issue #7: [K8s] Deploy Redis with Persistent Storage and Service

**Labels:** `kubernetes`, `redis`, `cache`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Deploy Redis in the `notes-app` Kubernetes namespace with AOF persistence enabled and a ClusterIP Service to provide in-memory caching and Pub/Sub queue functionality.

---

## 💡 Background & Concepts for Beginners
- Redis serves two roles in our architecture:
  1. High-speed cache for `GET /api/notes` (10-second TTL) and visit counter.
  2. Message broker via Pub/Sub channels (`note_jobs` and `note_results`) between FastAPI and the Go worker.
- **Append-Only File (AOF):** Logs every write operation received by the server so data isn't lost if the pod restarts.

---

## 📋 Requirements & Specifications
1. **Target File:** `k8s/04-redis.yaml`
2. **Namespace:** `notes-app`
3. **Deployment:**
   - 1 replica
   - Image: `redis:7-alpine`
   - Command: `["redis-server", "--appendonly", "yes"]`
   - Readiness probe: `redis-cli ping`
4. **Service:**
   - ClusterIP named `redis-service`
   - Port: `6379`, targetPort: `6379`

---

## 🛠️ Step-by-Step Starter Guide

Create `k8s/04-redis.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: notes-app
  labels:
    app: redis
spec:
  type: ClusterIP
  ports:
    - port: 6379
      targetPort: 6379
      name: redis
  selector:
    app: redis
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: notes-app
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command: ["redis-server", "--appendonly", "yes"]
          ports:
            - containerPort: 6379
              name: redis
          livenessProbe:
            exec:
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            exec:
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 3
            periodSeconds: 5
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 256Mi
```

---

## 🧪 Verification & Testing Commands

Apply manifest:
```bash
kubectl apply -f k8s/04-redis.yaml
```

Verify pod is running:
```bash
kubectl get pods -n notes-app -l app=redis
```

Test Redis ping inside the pod:
```bash
kubectl exec -it -n notes-app deployment/redis -- redis-cli ping
# Expected: PONG
```

---

## ✅ Acceptance Criteria
- [ ] `k8s/04-redis.yaml` created.
- [ ] Pod is running and passes readiness probe (`PONG`).
- [ ] `redis-service` exposes port `6379` internally to the cluster.
