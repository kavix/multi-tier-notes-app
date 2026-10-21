# Issue #6: [K8s] Deploy PostgreSQL with StatefulSet, PVC, and Headless Service

**Labels:** `kubernetes`, `database`, `statefulset`, `storage`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Deploy PostgreSQL on Kubernetes using a `StatefulSet` with a `PersistentVolumeClaim` (PVC) and a ClusterIP Service so database state is preserved across pod restarts.

---

## 💡 Background & Concepts for Beginners
- **Why StatefulSet instead of Deployment?** Deployments are for stateless apps. Databases are stateful: each pod needs a stable, unique network identity and dedicated, persistent disk storage that survives restarts.
- **PersistentVolumeClaim (PVC):** Requests dynamic storage from the Kubernetes cluster (minikube, kind, AWS EBS, GCP Persistent Disk).
- **Probes (`readinessProbe` / `livenessProbe`):** Kubernetes uses probes to know when a container is ready to accept traffic and when to restart a stuck container.

---

## 📋 Requirements & Specifications
1. **Target File:** `k8s/03-postgres.yaml`
2. **Namespace:** `notes-app`
3. **Service:** Headless / ClusterIP named `postgres-service` on port `5432`.
4. **StatefulSet:**
   - 1 replica
   - Image: `postgres:16-alpine`
   - Volume mount: `/var/lib/postgresql/data`
   - Environment variables sourced from `app-secrets` and `app-config`.
   - `volumeClaimTemplates` requesting `1Gi` storage.
   - Readiness/Liveness probes using `pg_isready`.

---

## 🛠️ Step-by-Step Starter Guide

Create `k8s/03-postgres.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: notes-app
  labels:
    app: postgres
spec:
  ports:
    - port: 5432
      targetPort: 5432
      name: postgres
  clusterIP: None # Headless service for StatefulSet
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: notes-app
spec:
  serviceName: "postgres-service"
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: postgres
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: POSTGRES_PASSWORD
            - name: POSTGRES_DB
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: POSTGRES_DB
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
          livenessProbe:
            exec:
              command: ["psql", "-w", "-U", "notes_user", "-d", "notes_db", "-c", "SELECT 1"]
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "notes_user", "-d", "notes_db"]
            initialDelaySeconds: 5
            periodSeconds: 5
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
```

---

## 🧪 Verification & Testing Commands

Apply the manifest:
```bash
kubectl apply -f k8s/03-postgres.yaml
```

Monitor pod startup:
```bash
kubectl get pods -n notes-app -w
# Wait until postgres-0 is in Running state (1/1)
```

Verify storage claim:
```bash
kubectl get pvc -n notes-app
```

Test database connection using port-forward:
```bash
kubectl port-forward -n notes-app statefulset/postgres 5432:5432 &
PGPASSWORD=notes_password psql -h localhost -U notes_user -d notes_db -c "SELECT 1;"
```

---

## ✅ Acceptance Criteria
- [ ] `k8s/03-postgres.yaml` created.
- [ ] `postgres-0` pod reaches `1/1 Running`.
- [ ] PVC is bound to persistent storage.
- [ ] Database accepts SQL connections.
