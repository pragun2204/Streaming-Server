import html
import json
import logging
import time
import uuid
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select, and_

from app.core.config import settings
from app.core.security import hash_token
from app.db.session import async_session_maker
from app.models.user import User, UserSession
from app.models.room import Room, RoomMembership
from app.schemas.playback import PlaybackCommandPayload, MediaSelectedPayload
from app.services.playback_service import playback_service
from app.websocket.hub import ws_manager

logger = logging.getLogger("watchparty.websocket")
router = APIRouter()


async def authenticate_ws(websocket: WebSocket, token: str | None) -> User | None:
    raw_token = token
    if not raw_token:
        raw_token = websocket.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        return None

    hashed = hash_token(raw_token)
    async with async_session_maker() as session:
        stmt = (
            select(UserSession)
            .where(UserSession.token_hash == hashed)
            .where(UserSession.expires_at > datetime.utcnow())
        )
        res = await session.execute(stmt)
        user_session = res.scalar_one_or_none()
        if not user_session:
            return None

        user_stmt = select(User).where(User.id == user_session.user_id)
        user_res = await session.execute(user_stmt)
        return user_res.scalar_one_or_none()


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str | None = Query(None),
):
    await websocket.accept()

    user = await authenticate_ws(websocket, token)
    if not user:
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # Check room and membership in database
    is_host = False
    role = "VIEWER"
    async with async_session_maker() as session:
        room_stmt = select(Room).where(Room.id == room_id)
        room_res = await session.execute(room_stmt)
        room = room_res.scalar_one_or_none()
        if not room:
            await websocket.close(code=4004, reason="Room not found")
            return

        mem_stmt = select(RoomMembership).where(
            and_(
                RoomMembership.room_id == room_id,
                RoomMembership.user_id == user.id,
                RoomMembership.is_active == True,
            )
        )
        mem_res = await session.execute(mem_stmt)
        membership = mem_res.scalar_one_or_none()
        if not membership:
            await websocket.close(code=4003, reason="Not an active member of this room")
            return

        is_host = (room.host_user_id == user.id)
        role = "HOST" if is_host else "VIEWER"

    # Register in connection manager (strictly enforces 10 capacity)
    connected = await ws_manager.connect(
        websocket=websocket,
        room_id=room_id,
        user_id=user.id,
        display_name=user.display_name,
        role=role,
    )
    if not connected:
        await websocket.close(code=4009, reason="Room full (max 10 participants)")
        return

    # Announce join and send initial room & playback state
    try:
        await ws_manager.broadcast(
            room_id=room_id,
            event_type="room.participant_joined",
            payload={
                "userId": user.id,
                "displayName": user.display_name,
                "role": role,
            },
            exclude_user_id=user.id,
        )

        participants = ws_manager.get_participants(room_id)
        current_playback = playback_service.get_state(room_id).model_dump()
        await ws_manager.send_personal(
            room_id=room_id,
            user_id=user.id,
            event_type="room.state",
            payload={
                "roomId": room_id,
                "participants": participants,
                "playbackState": current_playback,
            },
        )

        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                continue

            msg_type = data.get("type")
            payload = data.get("payload", {})

            # Rate limit check for chat
            if msg_type == "chat.send":
                if ws_manager.is_rate_limited(user.id, max_messages=10, window_seconds=3.0):
                    await ws_manager.send_personal(
                        room_id,
                        user.id,
                        "chat.error",
                        {"error": "Rate limit exceeded. Please wait a moment."},
                    )
                    continue

                raw_text = payload.get("text", "").strip()
                if not raw_text:
                    continue

                safe_text = html.escape(raw_text[:2000])
                msg_id = f"msg_{uuid.uuid4().hex[:12]}"
                now_ts = int(time.time() * 1000)

                await ws_manager.broadcast(
                    room_id=room_id,
                    event_type="chat.message_created",
                    payload={
                        "id": msg_id,
                        "roomId": room_id,
                        "senderUserId": user.id,
                        "senderDisplayName": user.display_name,
                        "message": safe_text,
                        "timestamp": now_ts,
                    },
                )

            elif msg_type == "playback.command":
                cmd = PlaybackCommandPayload(**payload)
                success, err, updated_state = playback_service.handle_command(
                    room_id=room_id,
                    cmd=cmd,
                    caller_id=user.id,
                    is_host=is_host,
                )
                if success:
                    await ws_manager.broadcast(
                        room_id=room_id,
                        event_type="playback.state_updated",
                        payload=updated_state.model_dump(),
                    )
                else:
                    await ws_manager.send_personal(
                        room_id=room_id,
                        user_id=user.id,
                        event_type="playback.error",
                        payload={"error": err or "Invalid playback command"},
                    )

            elif msg_type == "playback.media_selected":
                if not is_host:
                    await ws_manager.send_personal(
                        room_id,
                        user.id,
                        "playback.error",
                        {"error": "Only host can select local media"},
                    )
                    continue

                media_payload = MediaSelectedPayload(**payload)
                updated_state = playback_service.apply_media_selected(
                    room_id=room_id,
                    payload=media_payload,
                    host_id=user.id,
                )
                await ws_manager.broadcast(
                    room_id=room_id,
                    event_type="playback.state_updated",
                    payload=updated_state.model_dump(),
                )

            elif msg_type == "playback.ready":
                is_comp = payload.get("isCompatible", False)
                await ws_manager.broadcast(
                    room_id=room_id,
                    event_type="playback.peer_ready",
                    payload={
                        "userId": user.id,
                        "displayName": user.display_name,
                        "isCompatible": is_comp,
                    },
                )

            elif msg_type == "playback.sync_request":
                current_state = playback_service.get_state(room_id).model_dump()
                await ws_manager.send_personal(
                    room_id=room_id,
                    user_id=user.id,
                    event_type="playback.state_updated",
                    payload=current_state,
                )

            elif msg_type == "media.share_started":
                if is_host:
                    await ws_manager.broadcast(
                        room_id=room_id,
                        event_type="media.share_started",
                        payload={"hostId": user.id},
                    )

            elif msg_type == "media.share_stopped":
                if is_host:
                    await ws_manager.broadcast(
                        room_id=room_id,
                        event_type="media.share_stopped",
                        payload={"hostId": user.id},
                    )

    except WebSocketDisconnect:
        logger.info(f"User {user.id} disconnected from room {room_id}")
    finally:
        await ws_manager.disconnect(room_id, user.id)
        await ws_manager.broadcast(
            room_id=room_id,
            event_type="room.participant_left",
            payload={"userId": user.id, "reason": "disconnected"},
        )
