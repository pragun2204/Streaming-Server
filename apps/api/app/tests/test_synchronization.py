import time
import pytest
from app.services.playback_service import PlaybackService
from app.schemas.playback import PlaybackCommandPayload, MediaSelectedPayload


def test_playback_state_machine_lifecycle():
    service = PlaybackService()
    room_id = "test-room-1"
    host_id = "user-host-1"
    viewer_id = "user-viewer-2"

    # 1. Initial State
    initial_state = service.get_state(room_id)
    assert initial_state.status == "IDLE"
    assert initial_state.positionSeconds == 0.0
    assert initial_state.revision == 1

    # 2. Host selects media
    media_payload = MediaSelectedPayload(
        mediaId="a1b2c3d4e5f67890abcdef1234567890",
        mediaName="Inception.2010.1080p.mp4",
        mediaSize=2500000000,
        mediaDuration=8880.0,
    )
    state = service.apply_media_selected(room_id, media_payload, host_id)
    assert state.mediaId == media_payload.mediaId
    assert state.status == "PAUSED"
    assert state.positionSeconds == 0.0
    assert state.revision == 2

    # 3. Viewer attempts to PLAY -> MUST BE REJECTED
    viewer_cmd = PlaybackCommandPayload(command="PLAY")
    ok, err, _ = service.handle_command(room_id, viewer_cmd, viewer_id, is_host=False)
    assert not ok
    assert "Only the host" in err

    # 4. Host commands PLAY
    host_play = PlaybackCommandPayload(command="PLAY", revision=state.revision)
    ok, err, state = service.handle_command(room_id, host_play, host_id, is_host=True)
    assert ok
    assert state.status == "PLAYING"
    assert state.revision == 3

    # Simulate 200ms elapsed playback
    time.sleep(0.2)

    # 5. Host commands PAUSE
    host_pause = PlaybackCommandPayload(command="PAUSE", revision=state.revision)
    ok, err, state = service.handle_command(room_id, host_pause, host_id, is_host=True)
    assert ok
    assert state.status == "PAUSED"
    assert state.positionSeconds >= 0.15 # verified monotonic progression
    assert state.revision == 4

    # 6. Host commands SEEK to 120.0s
    host_seek = PlaybackCommandPayload(command="SEEK", positionSeconds=120.0, revision=state.revision)
    ok, err, state = service.handle_command(room_id, host_seek, host_id, is_host=True)
    assert ok
    assert state.positionSeconds == 120.0
    assert state.revision == 5

    # 7. Stale revision rejected
    stale_cmd = PlaybackCommandPayload(command="SEEK", positionSeconds=50.0, revision=2)
    ok, err, _ = service.handle_command(room_id, stale_cmd, host_id, is_host=True)
    assert not ok
    assert "Stale revision" in err
