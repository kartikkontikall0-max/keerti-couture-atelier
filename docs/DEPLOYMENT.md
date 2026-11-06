# Keerti Couture — Production Deployment Guide

This guide details the deployment options for **Keerti Couture**, ranging from single-node containerized environments using Docker Compose to modern cloud hosting platforms (e.g., Render, Railway, DigitalOcean, AWS ECS).

---

## 1. Prerequisites

Before deploying to production, ensure you have:
- A Linux or container host (Ubuntu 22.04 LTS / Debian 12 recommended)
- Docker Engine v24+ and Docker Compose v2.20+
- A managed MongoDB database (MongoDB Atlas v7.0+ or a self-hosted replica set)
- Cloudinary account credentials (API Key, API Secret, Cloud Name)
- Enterprise SMTP credentials (e.g., SendGrid, Mailgun, Amazon SES, or custom Postfix)
- Razorpay API Key ID & Secret (optional for browsing; required for live payments)
- A registered domain name with SSL/TLS termination (e.g., Let's Encrypt / Cloudflare)

---

## 2. Docker Compose Deployment (Recommended)

The repository provides production-hardened multi-stage Dockerfiles for both frontend and backend, orchestrated via `docker-compose.yml`.

### Step 1: Clone Repository & Configure Environment
```bash
git clone https://github.com/kartikkontikall0-max/keerti-couture-atelier.git
cd keerti-couture-atelier

# Copy production environment template
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Populate the required production values:
- Set `NODE_ENV=production`
- Provide strong 64-character random secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET`
- Configure `MONGO_URI` pointing to your production MongoDB cluster
- Set `CLIENT_URL=https://yourdomain.com`

### Step 2: Build and Run Containers
```bash
docker compose up -d --build
```

### Step 3: Verify Container Health
```bash
docker compose ps
curl -f http://localhost:5000/health
curl -f http://localhost:5000/ready
```

---

## 3. Reverse Proxy & SSL (Nginx Configuration)

The repository includes a battle-tested Nginx configuration in [`deploy/nginx/keerti-couture.conf`](file:///c:/Users/karti/OneDrive/Documents/antigravity/tailor1/deploy/nginx/keerti-couture.conf).

### Nginx Setup Instructions
1. Install Nginx and Certbot:
   ```bash
   sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. Copy configuration:
   ```bash
   sudo cp deploy/nginx/keerti-couture.conf /etc/nginx/sites-available/keerti-couture.conf
   sudo ln -s /etc/nginx/sites-available/keerti-couture.conf /etc/nginx/sites-enabled/
   ```
3. Update `server_name` in `/etc/nginx/sites-available/keerti-couture.conf` to your domain.
4. Obtain SSL certificates:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## 4. Standalone Cloud PaaS Deployment

### Deploying the Backend (e.g., Render, Railway, AWS ECS)
- **Runtime**: Node.js 20+
- **Root Directory**: `backend`
- **Build Command**: `npm ci --omit=dev`
- **Start Command**: `node server.js`
- **Health Check Endpoint**: `/health` (HTTP 200)

### Deploying the Frontend (e.g., Vercel, Netlify, Cloudflare Pages)
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id`

---

## 5. Startup Validation & Smoke Testing

The backend server features strict startup environment validation (`validateEnv.js`). If essential secrets are missing or misconfigured in production (`NODE_ENV=production`), the process terminates immediately with exit code 1 to prevent insecure boots.

To smoke test the deployment:
```bash
# 1. Inspect live health
curl -s http://localhost:5000/health | jq .

# 2. Inspect database readiness
curl -s http://localhost:5000/ready | jq .

# 3. Test CSRF issuance
curl -s -c cookies.txt http://localhost:5000/api/csrf-token | jq .
```
