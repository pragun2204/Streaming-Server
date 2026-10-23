# Playback Synchronization Protocol

## 1. Overview

Local media synchronization allows participants who possess the same local video file (or compatible encode) to watch together in lockstep without uploading gigabytes of private video to a third-party server.

## 2. Playback State Schema

The authoritative server maintains a state object per room:

```typescript
interface PlaybackState {
  roomId: string;
  mediaId: string | null;            // SHA-256 hash or fingerprint of file
  mediaName: string | null;          // Filename for user convenience
  mediaSize: number | null;          // File size in bytes
  mediaDuration: number | null;      // Total duration in seconds
  status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING';
  positionSeconds: number;           // Playback position at updatedAt time
  playbackRate: number;              // Current speed (e.g. 1.0, 1.25, 1.5)
  updatedAt: number;                 // Epoch milliseconds when state was recorded
  revision: number;                  // Monotonically increasing revision counter
  hostId: string;                    // Current controller participant ID
}
```

## 3. Protocol Commands & Transitions

The following client actions send WebSocket payloads to `/ws/rooms/{room_id}`:

| Command | Initiator | Validation | State Transition |
|---------|-----------|------------|------------------|
| `PLAY` | Host | Must have valid media, status was `PAUSED` or `BUFFERING` | `status = PLAYING`, `updatedAt = now`, `revision++` |
| `PAUSE` | Host | Current position recalculated | `status = PAUSED`, `positionSeconds = currentCalculated`, `updatedAt = now`, `revision++` |
| `SEEK` | Host | `targetPosition` within `[0, duration]` | `positionSeconds = targetPosition`, `updatedAt = now`, `revision++` |
| `SET_RATE` | Host | Rate between `0.25` and `2.0` | `playbackRate = rate`, `positionSeconds = currentCalculated`, `updatedAt = now`, `revision++` |
| `MEDIA_SELECTED`| Host | Calculates SHA-256 and metadata | `mediaId = hash`, `mediaName = name`, `status = PAUSED`, `positionSeconds = 0`, `revision++` |
| `READY` | Participant| Verifies file compatibility | Updates participant readiness list |
| `BUFFERING` | Any member | Reports client starvation | Pauses playback for room if host or threshold reached |
| `SYNC_REQUEST` | Reconnected | None | Broadcasts latest authoritative snapshot to requester |

## 4. Drift Estimation and Correction Algorithm

Clients continuously evaluate drift during active playback:

1. **Expected Position Calculation**:
   $$\text{expectedPosition} = \text{positionSeconds} + \frac{(\text{now}() - \text{updatedAt})}{1000} \times \text{playbackRate}$$

2. **Drift Difference**:
   $$\Delta = \text{videoElement.currentTime} - \text{expectedPosition}$$

3. **Correction Policy**:
   - **Zone 0 (In Sync)**: $|\Delta| \le 0.15\text{s}$
     - Action: None. Normal playback continues.
   - **Zone 1 (Micro-drift)**: $0.15\text{s} < |\Delta| \le 1.0\text{s}$
     - Action: Adjust `playbackRate` temporarily ($\pm 5\%$, e.g. $1.05\times$ if behind, $0.95\times$ if ahead) to smoothly restore sync without jarring audio pitch or stutter.
   - **Zone 2 (Hard Drift)**: $|\Delta| > 1.0\text{s}$
     - Action: Perform instantaneous `videoElement.currentTime = expectedPosition` seek.
   - **Suppression Window**:
     - During user-initiated seeks, pause, or video buffering (`seeking`, `waiting` events), drift correction is strictly suspended for 1000ms.
