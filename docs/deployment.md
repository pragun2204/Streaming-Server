# Self-Hosted Deployment Guide

## 1. Prerequisites

- A Linux VPS (Ubuntu 22.04 LTS or Debian 12 recommended)
- 2 vCPUs, 4GB RAM minimum (8GB recommended for multiple concurrent 1080p60 parties)
- A registered domain name pointing to the VPS IP
- Open firewall ports:
  - `80/tcp`, `443/tcp`: Caddy reverse proxy (HTTP/HTTPS)
  - `7880/tcp`: LiveKit signaling (proxied through Caddy or direct)
  - `7881/tcp`: LiveKit WebRTC TURN/TLS
  - `50000-50200/udp`: LiveKit WebRTC media transport range

---

## 2. Architecture & Container Layout

The deployment uses Docker Compose to orchestrate:
1. `caddy`: Handles automatic Let's Encrypt TLS and reverse proxies API, Web, and WebSocket traffic.
2. `web`: Production Nginx/Node container serving the pre-built React Vite SPA.
3. `api`: Python FastAPI ASGI application running under Uvicorn.
4. `db`: PostgreSQL 16 container for persistent storage.
5. `redis`: Redis 7 Alpine for ephemeral presence, rate limiting, and pub/sub.
6. `livekit`: Official LiveKit Server binary container.

---

## 3. Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/your-org/watch-party.git
cd watch-party

# 2. Copy and configure environment variables
cp .env.example .env
nano .env # Set DOMAIN, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, POSTGRES_PASSWORD

# 3. Build and launch services
docker compose -f docker-compose.prod.yml up -d --build

# 4. Run database migrations
docker compose -f docker-compose.prod.yml exec api alembic upgrade head

# 5. Check health
curl https://your-domain.com/api/v1/health
```
