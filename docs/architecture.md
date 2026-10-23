# Watch Party Application Architecture

## 1. System Overview

The Watch Party application is a real-time, low-latency collaborative platform designed for private movie nights and high-quality screen sharing with up to 10 participants per room. It combines WebRTC SFU technology for audio and screen transport with server-authoritative state synchronization for local media playback and text communication.

```mermaid
flowchart TB
    subgraph Clients["Client Tier (Browsers)"]
        Host["Host Client\n(Screen Share / Local Video)"]
        Viewer["Viewer Clients (1-9)\n(Subscribers / Synchronized Viewers)"]
    end

    subgraph Edge["Reverse Proxy / Edge"]
        Caddy["Caddy Reverse Proxy\n(TLS Termination, Port 80/443)"]
    end

    subgraph AppServer["Application Backend"]
        FastAPI["FastAPI App (Python 3.10/3.12)\n- REST API (/api/v1)\n- WebSocket Hub (/ws)\n- Auth & Permissions\n- Playback State Machine\n- LiveKit Token Issuer"]
    end

    subgraph StateStorage["Persistence & Ephemeral Cache"]
        Postgres[(PostgreSQL 14+\nPersistent Users, Rooms, Invitations)]
        Redis[(Redis / InMemory Bus\nPresence, Ephemeral State, Pub/Sub)]
    end

    subgraph MediaSFU["Real-time Media Tier"]
        LiveKit["LiveKit Server (SFU)\n- Group Voice Channels\n- 1080p60 Screen Sharing\n- Track Subscriptions\n- Simulcast & Congestion Control"]
    end

    Host <-->|HTTPS / WSS| Caddy
    Viewer <-->|HTTPS / WSS| Caddy
    Caddy <-->|HTTP / WS| FastAPI
    FastAPI <--> Postgres
    FastAPI <--> Redis

    Host <==>|WebRTC Media (UDP 50000-50200)| LiveKit
    Viewer <==>|WebRTC Media (UDP 50000-50200)| LiveKit
    FastAPI -.->|Server SDK / Token Minting| LiveKit
```

---

## 2. Component Architecture

### A. Frontend (`apps/web`)
- **Framework**: React 18 / 19 with Vite and TypeScript (strict mode).
- **Styling**: Tailwind CSS with dark graphite theme, Lucide icons, accessible modal dialogs, toasts.
- **State Management**:
  - `zustand` for local room state, voice settings, and playback client state.
  - `@tanstack/react-query` for asynchronous server state (auth, room details, invites).
- **Transport**:
  - `livekit-client` for WebRTC voice communication and screen-share publishing/subscribing.
  - Native standard `WebSocket` client with automatic reconnection and typed message protocol.
- **Diagnostics**: Real-time WebRTC stats collector tracking resolution, FPS, bitrate, jitter, RTT, packet loss.

### B. Backend (`apps/api`)
- **Framework**: FastAPI (async ASGI) with Pydantic v2 validation.
- **Database ORM**: SQLAlchemy 2.0 (asyncio) supporting PostgreSQL with fallback to SQLite for local development and unit tests.
- **Migrations**: Alembic with versioned schema migrations.
- **Real-Time Protocol**: Typed JSON WebSocket protocol for room events, authoritative playback sync, and chat.
- **LiveKit Server Integration**: Official `livekit-api` server SDK for generating cryptographically signed, short-lived JWT video grants.

### C. Real-Time Media SFU (`infra/livekit`)
- Standalone LiveKit Server configured with:
  - TCP port 7880 for signaling.
  - UDP port range 50000-50200 for WebRTC media.
  - Port 7881 for TURN over TLS / TCP where needed.
- Quality profiles:
  - 1080p60 (High Quality / Smooth): 1920x1080 @ 60fps, 4.5 - 6.0 Mbps.
  - 1080p30 (Balanced): 1920x1080 @ 30fps, 3.0 Mbps.
  - 720p30 (Saver): 1280x720 @ 30fps, 1.5 Mbps.

---

## 3. Data Flow & Security Model

1. **Authentication**:
   - Guest entry with secure server-signed session cookies (HTTP-only, SameSite=Lax/Strict).
   - Identity tracks `user_id` and `display_name`.
2. **Room Access Control**:
   - Max 10 participants enforced at API and WebSocket join time.
   - Private invitation tokens hashed in database with expiration and revocation.
   - LiveKit access tokens strictly granted only to active, authorized room members with scoped permissions (publish voice: all; publish screen: host/authorized).
3. **Synchronization**:
   - Server-authoritative state engine with revision numbers (`revision: int`).
   - Monotonic drift calculation on clients; micro playback-rate adjustment for small drift (<0.5s), seek jump for large drift (>1.5s).
