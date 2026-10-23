# Watch Party Web Application

A modern, high-performance web application designed for private movie nights and real-time screen sharing with group voice communication.

---

## Features

- **Real-Time Group Voice Chat**: Low-latency, crystal-clear WebRTC voice chat powered by LiveKit SFU with noise suppression, echo cancellation, deafen, mute, and per-participant volume sliders.
- **1080p60 Screen Sharing**: Stream tabs, application windows, or full desktops with optional system audio forwarding and live connection diagnostics (resolution, FPS, bitrate, packet loss, RTT).
- **Synchronized Local Media Playback**: Play identical local video files in lockstep with SHA-256 fingerprint validation, monotonic revision tracking, micro playback rate adjustments, and seek jump drift correction.
- **Private Room Management**: Strict 10-person capacity enforcement, cryptographically signed invite tokens, optional room passwords, host transfer, and participant moderation.
- **Real-Time In-Room Text Chat**: Integrated dark-themed chat with timestamps, auto-scroll, and connection resilience.
- **Modern Desktop-First UI**: Dark graphite aesthetic, responsive design, accessible modal dialogs, and toast notifications.

---

## Architecture Overview

```
watch-party/
├── apps/
│   ├── web/            # React 18 + Vite + Tailwind CSS + LiveKit SDK
│   └── api/            # FastAPI + SQLAlchemy 2.0 + WebSockets + LiveKit API
├── infra/
│   ├── livekit/        # LiveKit SFU configuration
│   └── caddy/          # Reverse proxy and automatic TLS configuration
└── docs/               # In-depth architectural & deployment documentation
```

---

## Quick Start (Local Development)

### 1. Requirements
- Node.js 18+ (20+ recommended)
- Python 3.10+
- (Optional) Docker for full containerized stack

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Backend
```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 4. Start Frontend
```bash
cd apps/web
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running with Docker Compose
```bash
docker compose up -d
```
All services (Frontend, API, PostgreSQL, Redis, LiveKit) will start automatically.
