# Issue #9: [K8s] Deploy Go Background Worker with Graceful Shutdown

**Labels:** `kubernetes`, `worker`, `golang`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Deploy the Go background worker as a Kubernetes Deployment to asynchronously process note text, compute word counts, generate summaries, and maintain the worker heartbeat.

---

## 💡 Background & Concepts for Beginners
- **Workers don't need a Kubernetes Service:** Unlike web servers, background workers do not accept inbound HTTP traffic from users or other pods. They actively pull/subscribe to messages from Redis (`note_jobs`).
- **`terminationGracePeriodSeconds`:** When Kubernetes stops a pod, it sends `SIGTERM`. If a worker is currently processing a note, setting a grace period (e.g. 30s) ensures it finishes in-flight jobs and closes connections before receiving `SIGKILL`.

---

## 📋 Requirements & Specifications
1. **Target File:** `k8s/06-worker.yaml`
2. **Namespace:** `notes-app`
3. **Deployment:**
   - Name: `worker`
   - Replicas: 1 (or 2)
   - Image: `notes-worker:latest`
   - Environment variables: `REDIS_HOST`, `REDIS_PORT` (from `app-config`).
   - Resource limits: lightweight (requests: 20m CPU, 32Mi RAM).

---

## 🛠️ Step-by-Step Starter Guide

Create `k8s/06-worker.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: notes-app
  labels:
    app: worker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: worker
          image: notes-worker:latest
          imagePullPolicy: IfNotPresent
          envFrom:
            - configMapRef:
                name: app-config
          resources:
            requests:
              cpu: 20m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 128Mi
```

---

## 🧪 Verification & Testing Commands

Apply manifest:
```bash
kubectl apply -f k8s/06-worker.yaml
```

View live worker logs:
```bash
kubectl logs -n notes-app -l app=worker -f
# Should output:
# Connected to Redis at redis-service:6379
# Heartbeat goroutine started
# Pub/sub subscriber started on channel 'note_jobs'
```

Check Redis heartbeat key:
```bash
kubectl exec -it -n notes-app deployment/redis -- redis-cli get worker:heartbeat
# Should return the current UTC timestamp!
```

---

## ✅ Acceptance Criteria
- [ ] `k8s/06-worker.yaml` created.
- [ ] Worker pod connects to Redis and stays running.
- [ ] Heartbeat timestamp refreshes in Redis every 5 seconds.
