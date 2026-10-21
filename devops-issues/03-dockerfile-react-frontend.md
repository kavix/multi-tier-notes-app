# Issue #3: [Docker] Create Multi-Stage Dockerfile for React Frontend with Nginx

**Labels:** `docker`, `frontend`, `react`, `nginx`, `beginner-friendly`  
**Estimated Time:** 45 minutes  

---

## 🎯 Goal
Create a multi-stage `frontend/Dockerfile` and an `frontend/nginx.conf` to build the React TypeScript app with Vite and serve static production assets using Nginx.

---

## 💡 Background & Concepts for Beginners
- In development, Vite runs a local Node.js development server (`npm run dev`).
- In production, React compiles to plain HTML, CSS, and JS files (`dist/`). Node.js is no longer needed at runtime! We use **Nginx** (an ultra-fast web server) to serve the static files.
- **SPA Routing Problem:** React Router is client-side. If a user refreshes `/notes/1`, Nginx will look for a file called `/notes/1.html` on disk and return 404! We need `try_files $uri $uri/ /index.html;` in Nginx configuration to let React Router handle client routes.

---

## 📋 Requirements & Specifications
1. **Target Files:**
   - `frontend/Dockerfile`
   - `frontend/nginx.conf`
2. **Build Stage:**
   - Base Image: `node:20-alpine AS builder`
   - Copy `package.json` & `package-lock.json`; run `npm ci` (or `npm install`).
   - Copy source files, run `npm run build` -> produces `/app/dist`.
3. **Runtime Stage:**
   - Base Image: `nginx:alpine`
   - Copy compiled files from `builder` to `/usr/share/nginx/html`.
   - Copy custom `nginx.conf` to `/etc/nginx/conf.d/default.conf`.
   - Expose port `80`.
   - Command: `nginx -g 'daemon off;'`.

---

## 🛠️ Step-by-Step Starter Guide

### 1. Create `frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # SPA Routing: Fall back to index.html for client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API calls to backend service (in Docker Compose / K8s)
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 2. Create `frontend/Dockerfile`
```dockerfile
# Stage 1: Build the React static assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 🧪 Verification & Testing Commands

Build the Docker image:
```bash
docker build -t notes-frontend:latest ./frontend
```

Run container:
```bash
docker run -p 3000:80 notes-frontend:latest
```

Verify in browser or curl:
```bash
curl http://localhost:3000/
# Should return the index.html containing React root
```

---

## ✅ Acceptance Criteria
- [ ] `frontend/nginx.conf` and `frontend/Dockerfile` created.
- [ ] Multi-stage build completes successfully.
- [ ] Navigating to client routes (e.g. `/notes`) does not return 404 on refresh.
- [ ] Exposes port `80`.
