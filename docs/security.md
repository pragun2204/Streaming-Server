# Security Architecture and Hardening

## 1. Principles

1. **Zero Media Snooping**: Local video files remain on the user's computer; only cryptographic fingerprints (SHA-256) and playback timestamps pass through the network.
2. **Strict Server-Side Enforcement**: All participant limits (max 10), host permissions, rate limits, and invite validity are validated on the server, never trusted from client reports.
3. **Least Privilege LiveKit Grants**: Media tokens are signed with short expiration (15 minutes), bound to room ID, and granted only appropriate permissions (screen-sharing publishing requires host/authorized role).
4. **Defense in Depth**:
   - HTTP-only, SameSite session cookies prevent JavaScript exfiltration.
   - CORS is strictly locked down to configured origins.
   - Chat messages are HTML-sanitized and bounded to prevent DOM XSS and payload abuse.
   - Database operations use parameterized queries through SQLAlchemy ORM to prevent SQL injection.
   - Password hashes (for room protection) use industry-standard hashing (`passlib` with Argon2 or bcrypt).

---

## 2. Token Security & Lifetime

- **Session Tokens**: 256-bit cryptographically random tokens (`secrets.token_urlsafe(32)`), stored in database sessions with expiration.
- **Invitation Tokens**: Encrypted/hashed before database insertion. Expiration (24h default) and single/multi-use revocation flags.
- **LiveKit Tokens**: Signed using HMAC-SHA256 with the server's `LIVEKIT_API_SECRET`. Never revealed or generated on the client.
