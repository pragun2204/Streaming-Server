# Media Architecture Specification

## 1. Real-Time Media Modes

The Watch Party application operates in two distinct, non-overlapping media presentation modes:

### Mode 1: Screen-Sharing Mode (LiveKit SFU WebRTC)
- **Source**: Host desktop, browser tab, or application window via `navigator.mediaDevices.getDisplayMedia`.
- **System Audio**: Captures system / tab audio alongside video when selected by the host.
- **Transport**:
  - LiveKit Server SFU forwards video and audio tracks to subscribers over UDP/WebRTC.
  - Simulcast enabled when participants have differing network constraints.
  - Dynamic bandwidth allocation adapts bitrate if packet loss or queuing delay spikes.
- **Target Profiles**:
  - `1080p60`: Width 1920, Height 1080, FrameRate 60, Bitrate ~5000kbps.
  - `1080p30`: Width 1920, Height 1080, FrameRate 30, Bitrate ~3000kbps.
  - `720p30`: Width 1280, Height 720, FrameRate 30, Bitrate ~1500kbps.
- **Controls Distinction**: Screen-share playback controls are purely display-side (Fullscreen, Theater, Volume, Diagnostics). The browser cannot remotely pause or seek the host's actual desktop window.

### Mode 2: Local Media Playback Mode (HTML5 Video + WebSocket Sync)
- **Source**: Local video files (MP4/H.264, WebM/VP9/AV1) selected via the HTML `<input type="file">` API.
- **Fingerprinting**: Client calculates SHA-256 hash of the initial chunk or whole file plus file size in bytes to verify compatibility between host and viewers.
- **Audio & Video**: Rendered locally on each client device. Full fidelity, 0 network bandwidth spent on video transfer, 100% privacy for local media.
- **Controls**: Full synchronized timeline controls (Play, Pause, Seek, Rate) driven by the room host.

---

## 2. Voice Chat Architecture

- Voice channels use LiveKit audio tracks independent of video/screen-share tracks.
- **Audio Processing**:
  - Echo Cancellation: `true`
  - Noise Suppression: `true`
  - Automatic Gain Control: `true`
  - Local microphone is never looped back to local speakers (prevents acoustic feedback).
- **Control Features**:
  - Hardware microphone selection (`enumerateDevices`).
  - Output device selection (`setSinkId` where supported).
  - Software mute and deafen states.
  - Push-to-talk (PTT) with configurable keybind.
  - Individual participant volume slider (persisted per session).
  - Voice Activity Detection (VAD) with animated speaking rings.
  - Media volume vs Voice volume isolation (independent sliders).
