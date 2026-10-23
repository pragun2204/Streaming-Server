# Backend REST & WebSocket API Specification

Version: `v1`  
Base URL: `/api/v1`  
WebSocket URL: `/ws/rooms/{room_id}`

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/guest`
Creates or refreshes a guest identity session.
- **Request Body**:
  ```json
  {
    "displayName": "MovieBuff42"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "id": "usr_9f4c3a2...",
    "displayName": "MovieBuff42",
    "createdAt": "2026-10-23T09:30:00Z"
  }
  ```
- **Cookie Set**: `session_token` (HTTP-Only, SameSite=Lax, Secure in production).

### `GET /api/v1/auth/me`
Retrieves current user identity from the session cookie.
- **Response** `200 OK` or `401 Unauthorized`.

### `POST /api/v1/auth/logout`
Clears the session cookie.

---

## 2. Room Management Endpoints

### `POST /api/v1/rooms`
Creates a new private watch room. Host is automatically assigned to creator.
- **Request Body**:
  ```json
  {
    "name": "Friday Sci-Fi Night",
    "isPrivate": true,
    "password": "optional-password"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "id": "rm_8b21c...",
    "name": "Friday Sci-Fi Night",
    "hostUserId": "usr_9f4c3a2...",
    "capacity": 10,
    "mediaMode": "NONE",
    "inviteToken": "inv_71d...",
    "createdAt": "2026-10-23T09:35:00Z"
  }
  ```

### `GET /api/v1/rooms/{room_id}`
Retrieves room metadata and current active participants. Requires membership or valid invite.

### `POST /api/v1/rooms/{room_id}/join`
Joins an existing room using an invite token or room password.
- **Request Body**:
  ```json
  {
    "inviteToken": "inv_71d...",
    "password": "optional-password"
  }
  ```
- **Validation**: Enforces strict maximum 10 participants. Returns `409 Conflict` (Room Full) if `active_count >= 10`.

### `POST /api/v1/rooms/{room_id}/leave`
Leaves the room. If host leaves, triggers automatic host migration to next senior participant.

### `POST /api/v1/rooms/{room_id}/transfer-host`
Transfers host privileges to another room member. Only current host can invoke.

### `DELETE /api/v1/rooms/{room_id}/participants/{participant_id}`
Host can kick a participant. Kicked participant's session in this room is revoked.

---

## 3. Real-Time Media & Playback Endpoints

### `POST /api/v1/rooms/{room_id}/livekit-token`
Issues a cryptographically signed JWT for LiveKit SFU connection.
- **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "url": "ws://localhost:7880"
  }
  ```

### `GET /api/v1/rooms/{room_id}/playback-state`
Retrieves the current authoritative playback state.

---

## 4. WebSocket Protocol (`/ws/rooms/{room_id}`)

### Messages Client -> Server:
- `{"type": "chat.send", "payload": {"text": "Hello world!"}}`
- `{"type": "playback.command", "payload": {"command": "PLAY" | "PAUSE" | "SEEK" | "SET_RATE", ...}}`
- `{"type": "playback.media_selected", "payload": {"mediaId": "hash", "mediaName": "film.mp4", "mediaSize": 104857600, "mediaDuration": 7200}}`
- `{"type": "playback.ready", "payload": {"isCompatible": true}}`
- `{"type": "playback.sync_request", "payload": {}}`

### Messages Server -> Client:
- `{"type": "room.state", "payload": { "participants": [...], "mediaMode": "LOCAL_FILE" | "SCREEN_SHARE" | "NONE" }}`
- `{"type": "room.participant_joined", "payload": {"user": {...}}}`
- `{"type": "room.participant_left", "payload": {"userId": "usr_...", "reason": "left" | "kicked"}}`
- `{"type": "room.host_changed", "payload": {"newHostId": "usr_..."}}`
- `{"type": "chat.message_created", "payload": {"id": "msg_...", "sender": {...}, "text": "...", "timestamp": 123456789}}`
- `{"type": "playback.state_updated", "payload": { ...PlaybackState }}`
