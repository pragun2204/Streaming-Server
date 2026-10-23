import asyncio
import json
import logging
import time
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from app.services.playback_service import playback_service

logger = logging.getLogger("watchparty.websocket")


class ConnectionManager:
    def __init__(self):
        # room_id -> user_id -> WebSocket
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}
        # room_id -> user_id -> user metadata (display_name, role)
        self.user_meta: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # Rate limit tracking: user_id -> list of message timestamps
        self.message_rates: Dict[str, list[float]] = {}
        self.lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        room_id: str,
        user_id: str,
        display_name: str,
        role: str,
    ) -> bool:
        await self.lock.acquire()
        try:
            if room_id not in self.active_rooms:
                self.active_rooms[room_id] = {}
                self.user_meta[room_id] = {}

            # Strict 10 participant capacity check
            if (
                user_id not in self.active_rooms[room_id]
                and len(self.active_rooms[room_id]) >= 10
            ):
                return False

            self.active_rooms[room_id][user_id] = websocket
            self.user_meta[room_id][user_id] = {
                "userId": user_id,
                "displayName": display_name,
                "role": role,
                "joinedAt": int(time.time() * 1000),
            }
            return True
        finally:
            self.lock.release()

    async def disconnect(self, room_id: str, user_id: str):
        async with self.lock:
            if room_id in self.active_rooms:
                self.active_rooms[room_id].pop(user_id, None)
                meta = self.user_meta[room_id].pop(user_id, None)
                if not self.active_rooms[room_id]:
                    self.active_rooms.pop(room_id, None)
                    self.user_meta.pop(room_id, None)

    def get_participants(self, room_id: str) -> list[Dict[str, Any]]:
        if room_id in self.user_meta:
            return list(self.user_meta[room_id].values())
        return []

    def is_rate_limited(self, user_id: str, max_messages: int = 10, window_seconds: float = 3.0) -> bool:
        now = time.time()
        timestamps = self.message_rates.setdefault(user_id, [])
        # Prune old timestamps
        timestamps = [t for t in timestamps if now - t < window_seconds]
        if len(timestamps) >= max_messages:
            self.message_rates[user_id] = timestamps
            return True
        timestamps.append(now)
        self.message_rates[user_id] = timestamps
        return False

    async def broadcast(self, room_id: str, event_type: str, payload: Any, exclude_user_id: Optional[str] = None):
        if room_id not in self.active_rooms:
            return
        message = json.dumps({"type": event_type, "payload": payload})
        targets = list(self.active_rooms[room_id].items())
        coros = []
        for uid, ws in targets:
            if exclude_user_id and uid == exclude_user_id:
                continue
            coros.append(self._safe_send(ws, message, room_id, uid))
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

    async def send_personal(self, room_id: str, user_id: str, event_type: str, payload: Any):
        if room_id in self.active_rooms and user_id in self.active_rooms[room_id]:
            ws = self.active_rooms[room_id][user_id]
            message = json.dumps({"type": event_type, "payload": payload})
            await self._safe_send(ws, message, room_id, user_id)

    async def _safe_send(self, ws: WebSocket, message: str, room_id: str, user_id: str):
        try:
            await ws.send_text(message)
        except Exception as e:
            logger.debug(f"Error sending message to {user_id} in {room_id}: {e}")


ws_manager = ConnectionManager()
