# Issue #5: [K8s] Create Kubernetes Namespace, ConfigMaps, and Secrets

**Labels:** `kubernetes`, `security`, `config`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Create the base Kubernetes configuration files to isolate the application in its own `Namespace`, store non-sensitive settings in a `ConfigMap`, and protect credentials inside a `Secret`.

---

## 💡 Background & Concepts for Beginners
- **Namespace:** Creates a virtual cluster inside Kubernetes to group and isolate related resources.
- **ConfigMap:** Key-value store for plain-text environment variables (e.g. hostnames, ports, flags).
- **Secret:** Stores sensitive data (e.g. passwords, API keys) base64-encoded. Mounted into pods as environment variables or files.

---

## 📋 Requirements & Specifications
1. **Target Directory:** `k8s/`
2. **Target Files:**
   - `k8s/00-namespace.yaml`
   - `k8s/01-configmap.yaml`
   - `k8s/02-secret.yaml`
3. **Namespace:** `notes-app`
4. **ConfigMap values:**
   - `POSTGRES_HOST: "postgres-service"`
   - `POSTGRES_PORT: "5432"`
   - `POSTGRES_DB: "notes_db"`
   - `REDIS_HOST: "redis-service"`
   - `REDIS_PORT: "6379"`
5. **Secret values:**
   - `POSTGRES_USER: "notes_user"`
   - `POSTGRES_PASSWORD: "notes_password"`

---

## 🛠️ Step-by-Step Starter Guide

### 1. `k8s/00-namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: notes-app
  labels:
    app.kubernetes.io/name: notes-app
```

### 2. `k8s/01-configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: notes-app
data:
  POSTGRES_HOST: "postgres-service"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "notes_db"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

### 3. `k8s/02-secret.yaml`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: notes-app
type: Opaque
stringData:
  POSTGRES_USER: "notes_user"
  POSTGRES_PASSWORD: "notes_password"
```

---

## 🧪 Verification & Testing Commands

Apply the manifests:
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml
```

Verify:
```bash
kubectl get namespaces notes-app
kubectl get configmaps -n notes-app
kubectl get secrets -n notes-app
```

---

## ✅ Acceptance Criteria
- [ ] `k8s/00-namespace.yaml`, `k8s/01-configmap.yaml`, `k8s/02-secret.yaml` created.
- [ ] Successfully applied to Kubernetes cluster without syntax errors.
