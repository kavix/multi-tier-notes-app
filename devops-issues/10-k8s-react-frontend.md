# Issue #10: [K8s] Deploy React Frontend with Nginx and Service

**Labels:** `kubernetes`, `frontend`, `react`, `beginner-friendly`  
**Estimated Time:** 30 minutes  

---

## 🎯 Goal
Deploy the containerized React frontend into Kubernetes using a `Deployment` and a ClusterIP `Service` to serve the web UI to users.

---

## 💡 Background & Concepts for Beginners
- The React application is served by Nginx inside the pod.
- The Kubernetes Service (`frontend-service`) acts as an internal load balancer that distributes incoming browser requests across frontend pods.

---

## 📋 Requirements & Specifications
1. **Target File:** `k8s/07-frontend.yaml`
2. **Namespace:** `notes-app`
3. **Deployment:**
   - Name: `frontend`
   - Replicas: 2
   - Image: `notes-frontend:latest`
   - Container port: 80
   - Healthcheck: HTTP GET `/` on port 80
4. **Service:**
   - ClusterIP named `frontend-service`
   - Port 80 -> targetPort 80

---

## 🛠️ Step-by-Step Starter Guide

Create `k8s/07-frontend.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: notes-app
  labels:
    app: frontend
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
      name: http
  selector:
    app: frontend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: notes-app
  labels:
    app: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: notes-frontend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
              name: http
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 3
            periodSeconds: 10
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
kubectl apply -f k8s/07-frontend.yaml
```

Verify rollout:
```bash
kubectl rollout status deployment/frontend -n notes-app
```

Port-forward to test in your local browser:
```bash
kubectl port-forward -n notes-app service/frontend-service 3000:80 &
```
Open [http://localhost:3000](http://localhost:3000) and verify the React Dashboard loads!

---

## ✅ Acceptance Criteria
- [ ] `k8s/07-frontend.yaml` created.
- [ ] 2 frontend pods running without errors.
- [ ] Service forwards port 80 to container port 80.
