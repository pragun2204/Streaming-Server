# Testing Strategy & Automated Test Suite

## 1. Testing Hierarchy

1. **Backend Unit & Integration Tests (`apps/api/app/tests`)**:
   - `test_auth.py`: Guest session creation, cookie issuance, and unauthorized rejection.
   - `test_rooms.py`: Room lifecycle, invite hashing, max-10 capacity enforcement, host transfer.
   - `test_synchronization.py`: Playback state transitions, revision incrementation, stale command dropping, drift calculation.
   - `test_livekit_token.py`: Scoped token generation and role verification.
2. **Frontend Component & State Tests (`apps/web/src/test`)**:
   - Store testing: Playback state management, drift correction threshold logic.
   - Component tests: Room controls, media player controls, chat validation.
3. **Multi-User Integration Testing**:
   - Verification across multiple browser contexts (Host + Viewer) testing real-time events, chat, and playback synchronization.
