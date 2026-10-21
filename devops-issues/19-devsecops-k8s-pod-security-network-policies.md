# Issue #19: [DevSecOps] Kubernetes Hardening: Pod SecurityContext & Zero-Trust NetworkPolicies

**Labels:** `devsecops`, `kubernetes`, `network-policy`, `security`, `beginner-friendly`  
**Estimated Time:** 1 hour  

---

## 🎯 Goal
Implement two fundamental Kubernetes runtime security defenses:
1. **Pod `securityContext` Hardening:** Prevent privilege escalation, enforce read-only filesystems, and drop Linux kernel capabilities.
2. **Zero-Trust `NetworkPolicies`:** Restrict pod-to-pod network traffic so compromised pods cannot pivot laterally.

---

## 💡 Background & Concepts for Beginners
- **Defense in Depth:** Even if an attacker finds an application exploit (like remote code execution), `securityContext` prevents them from writing malware to disk or escalating to host root privileges.
- **Zero-Trust Network Isolation:** By default in Kubernetes, **any pod can talk to any other pod** across the entire cluster!
  - Does the React frontend ever need to talk to PostgreSQL? **No!**
  - Does the Go worker ever need to talk to PostgreSQL directly? **No, it only needs Redis!**
  - `NetworkPolicy` acts as an internal pod firewall enforcing strict least-privilege networking.

---

## 📋 Requirements & Specifications
1. **Target Files:**
   - Update `k8s/05-backend.yaml`, `k8s/06-worker.yaml`, `k8s/07-frontend.yaml` with `securityContext`.
   - Create `k8s/09-network-policies.yaml`.
2. **SecurityContext Standards:**
   - `runAsNonRoot: true`
   - `allowPrivilegeEscalation: false`
   - `readOnlyRootFilesystem: true` (with `/tmp` emptyDir where temp files are needed)
   - `capabilities: drop: ["ALL"]`
3. **NetworkPolicy Rules:**
   - Default Deny all ingress in `notes-app` namespace.
   - Allow Postgres only from `backend`.
   - Allow Redis only from `backend` and `worker`.
   - Allow Backend from `ingress` and `frontend`.

---

## 🛠️ Step-by-Step Starter Guide

### 1. Pod `securityContext` Example (Backend)
Add to container spec in `k8s/05-backend.yaml`:
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
  containers:
    - name: backend
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

### 2. `k8s/09-network-policies.yaml`
```yaml
# 1. Default Deny all inbound traffic in namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: notes-app
spec:
  podSelector: {}
  policyTypes:
    - Ingress
---
# 2. Allow PostgreSQL only from Backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-postgres-from-backend
  namespace: notes-app
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 5432
---
# 3. Allow Redis only from Backend and Go Worker
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-redis-from-backend-and-worker
  namespace: notes-app
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
        - podSelector:
            matchLabels:
              app: worker
      ports:
        - protocol: TCP
          port: 6379
```

---

## 🧪 Verification & Testing Commands

Apply NetworkPolicies:
```bash
kubectl apply -f k8s/09-network-policies.yaml
```

Test Zero-Trust Isolation:
Try to connect from the Frontend pod directly to PostgreSQL:
```bash
# This connection should TIMEOUT and be blocked by the NetworkPolicy!
kubectl exec -it -n notes-app deployment/frontend -- nc -zv postgres-service 5432
```

---

## ✅ Acceptance Criteria
- [ ] Pods run with non-root security context and dropped capabilities.
- [ ] NetworkPolicies prevent frontend from connecting to database.
- [ ] Only authorized connections (Backend -> Postgres, Backend/Worker -> Redis) are permitted.
