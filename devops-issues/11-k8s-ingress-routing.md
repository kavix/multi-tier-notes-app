# Issue #11: [K8s] Configure Ingress with Path-Based Routing

**Labels:** `kubernetes`, `ingress`, `networking`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Configure a Kubernetes `Ingress` controller resource to route external web traffic:
- All `/api/*` traffic -> `backend-service:8000`
- All other `/` traffic -> `frontend-service:80`

---

## 💡 Background & Concepts for Beginners
- Instead of exposing every service to the internet using expensive cloud load balancers or random NodePorts, an **Ingress** provides a single public entry point (HTTP/HTTPS) and routes traffic based on URL path or domain name.
- In Minikube or kind, enable the Nginx Ingress addon: `minikube addons enable ingress`.

---

## 📋 Requirements & Specifications
1. **Target File:** `k8s/08-ingress.yaml`
2. **Namespace:** `notes-app`
3. **Ingress Controller:** `nginx`
4. **Rules:**
   - Path `/api` (and `/api/.*`) -> backend-service port 8000.
   - Path `/` -> frontend-service port 80.
5. **PathType:** `Prefix`

---

## 🛠️ Step-by-Step Starter Guide

Create `k8s/08-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: notes-ingress
  namespace: notes-app
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          # Route API traffic to FastAPI backend
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 8000
          # Route all other web traffic to React frontend
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

---

## 🧪 Verification & Testing Commands

Ensure Ingress controller is active:
```bash
# In Minikube:
minikube addons enable ingress
```

Apply Ingress manifest:
```bash
kubectl apply -f k8s/08-ingress.yaml
```

Inspect Ingress IP:
```bash
kubectl get ingress -n notes-app
```

Test requests via Ingress IP:
```bash
INGRESS_IP=$(kubectl get ingress notes-ingress -n notes-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$INGRESS_IP/api/health
curl http://$INGRESS_IP/
```

---

## ✅ Acceptance Criteria
- [ ] `k8s/08-ingress.yaml` created.
- [ ] Ingress resource routes `/api` to the backend.
- [ ] Ingress resource routes `/` to the frontend.
- [ ] Notes application is fully browsable through the single Ingress entry point.
