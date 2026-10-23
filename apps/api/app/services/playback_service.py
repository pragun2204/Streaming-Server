import time
from typing import Dict, Optional, Tuple
from app.schemas.playback import PlaybackStateSchema, PlaybackCommandPayload, MediaSelectedPayload


class PlaybackService:
    def __init__(self):
        # In-memory authoritative state dictionary: roomId -> PlaybackStateSchema
        self._states: Dict[str, PlaybackStateSchema] = {}

    def get_state(self, room_id: str) -> PlaybackStateSchema:
        if room_id not in self._states:
            self._states[room_id] = PlaybackStateSchema(
                roomId=room_id,
                status="IDLE",
                positionSeconds=0.0,
                playbackRate=1.0,
                updatedAt=int(time.time() * 1000),
                revision=1,
            )
        return self._states[room_id]

    def _calculate_current_position(self, state: PlaybackStateSchema) -> float:
        if state.status != "PLAYING":
            return state.positionSeconds
        now_ms = int(time.time() * 1000)
        elapsed_sec = max(0.0, (now_ms - state.updatedAt) / 1000.0)
        calculated = state.positionSeconds + (elapsed_sec * state.playbackRate)
        if state.mediaDuration and state.mediaDuration > 0:
            return min(state.mediaDuration, calculated)
        return calculated

    def apply_media_selected(
        self,
        room_id: str,
        payload: MediaSelectedPayload,
        host_id: str,
    ) -> PlaybackStateSchema:
        now_ms = int(time.time() * 1000)
        state = self.get_state(room_id)
        state.mediaId = payload.mediaId
        state.mediaName = payload.mediaName
        state.mediaSize = payload.mediaSize
        state.mediaDuration = payload.mediaDuration
        state.status = "PAUSED"
        state.positionSeconds = 0.0
        state.playbackRate = 1.0
        state.updatedAt = now_ms
        state.revision += 1
        state.hostId = host_id
        return state

    def handle_command(
        self,
        room_id: str,
        cmd: PlaybackCommandPayload,
        caller_id: str,
        is_host: bool,
    ) -> Tuple[bool, Optional[str], PlaybackStateSchema]:
        """
        Validates and executes a playback command.
        Returns: (success, error_message, updated_state)
        """
        state = self.get_state(room_id)
        now_ms = int(time.time() * 1000)

        # Non-host cannot command play/pause/seek unless room policy allows
        if cmd.command in ("PLAY", "PAUSE", "SEEK", "SET_RATE") and not is_host:
            return False, "Only the host can control media playback", state

        # Stale revision check (if revision was provided by client and is behind)
        if cmd.revision is not None and cmd.revision < state.revision:
            return False, f"Stale revision: client has {cmd.revision}, server at {state.revision}", state

        current_pos = self._calculate_current_position(state)

        if cmd.command == "PLAY":
            if not state.mediaId:
                return False, "No media has been selected", state
            state.status = "PLAYING"
            state.positionSeconds = current_pos
            state.updatedAt = now_ms
            state.revision += 1

        elif cmd.command == "PAUSE":
            state.status = "PAUSED"
            state.positionSeconds = current_pos
            state.updatedAt = now_ms
            state.revision += 1

        elif cmd.command == "SEEK":
            if cmd.positionSeconds is None or cmd.positionSeconds < 0:
                return False, "Invalid seek position", state
            seek_target = cmd.positionSeconds
            if state.mediaDuration and state.mediaDuration > 0:
                seek_target = min(state.mediaDuration, seek_target)
            state.positionSeconds = seek_target
            state.updatedAt = now_ms
            state.revision += 1

        elif cmd.command == "SET_RATE":
            if cmd.playbackRate is None or cmd.playbackRate < 0.25 or cmd.playbackRate > 3.0:
                return False, "Invalid playback rate", state
            state.positionSeconds = current_pos
            state.playbackRate = cmd.playbackRate
            state.updatedAt = now_ms
            state.revision += 1

        elif cmd.command == "BUFFERING":
            # If buffer stall occurs on host, or viewers report buffering, pause room
            if is_host:
                state.status = "BUFFERING"
                state.positionSeconds = current_pos
                state.updatedAt = now_ms
                state.revision += 1

        elif cmd.command == "READY":
            # If room was buffering and is ready now
            if is_host and state.status == "BUFFERING":
                state.status = "PAUSED"
                state.positionSeconds = current_pos
                state.updatedAt = now_ms
                state.revision += 1

        elif cmd.command == "SYNC_REQUEST":
            # Just return current state with updated position
            pass

        return True, None, state

    def update_host(self, room_id: str, new_host_id: str) -> PlaybackStateSchema:
        state = self.get_state(room_id)
        state.hostId = new_host_id
        state.revision += 1
        return state


playback_service = PlaybackService()
