# Troubleshooting Guide

## 1. WebRTC & Media Issues

### Issue: "Browser denied screen-share permission" or "No audio captured"
- **Cause**: Chrome/Firefox/Edge requires explicit user consent for screen sharing. Tab sharing usually supports audio, while full desktop sharing on Windows/macOS may require checking the "Share system audio" checkbox in the browser prompt.
- **Resolution**: Ensure the prompt modal checks "Share audio", and check that the site runs in a Secure Context (`https://` or `http://localhost`).

### Issue: LiveKit Connection Fails / ICE Connection Timeout
- **Cause**: Firewall blocking UDP port range `50000-50200` or symmetrical NAT without TURN.
- **Resolution**: In cloud VPS, verify security groups allow UDP 50000-50200. On local networks, `localhost:7880` connects via loopback directly.

---

## 2. Playback Synchronization Issues

### Issue: Video drift / jump loop
- **Cause**: Client and server system clocks drastically out of sync, or aggressive seek loop.
- **Resolution**: The protocol employs a 1000ms debounce/suppression window after seeks and uses adaptive $\pm 5\%$ playback rate adjustments for micro-drifts under 1.0 second.

---

## 3. Database & Session Issues

### Issue: Database connection failure
- **Cause**: PostgreSQL service not running or incorrect credentials.
- **Resolution**: Verify `DATABASE_URL` in `.env`. By default, the application falls back to SQLite (`sqlite+aiosqlite:///./watch_party.db`) when PostgreSQL is not configured, allowing zero-friction local execution.
