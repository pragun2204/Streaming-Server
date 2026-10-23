from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.room import Room, RoomMembership
from app.schemas.livekit import LiveKitTokenResponse
from app.schemas.playback import PlaybackStateSchema, PlaybackCommandPayload
from app.services.livekit_service import livekit_service
from app.services.playback_service import playback_service

router = APIRouter()


@router.post("/{room_id}/livekit-token", response_model=LiveKitTokenResponse)
async def get_livekit_token(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify room exists
    room_stmt = select(Room).where(Room.id == room_id)
    room_res = await db.execute(room_stmt)
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # Verify user is an active member
    mem_stmt = select(RoomMembership).where(
        and_(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == current_user.id,
            RoomMembership.is_active == True,
        )
    )
    mem_res = await db.execute(mem_stmt)
    membership = mem_res.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an active member of this room")

    is_host = (current_user.id == room.host_user_id)
    token = livekit_service.create_token(
        room_name=f"room_{room.id}",
        user_id=current_user.id,
        display_name=current_user.display_name,
        is_host=is_host,
    )

    return LiveKitTokenResponse(
        token=token,
        url=livekit_service.public_url,
        roomName=f"room_{room.id}",
        participantIdentity=current_user.id,
        participantName=current_user.display_name,
    )


@router.get("/{room_id}/playback-state", response_model=PlaybackStateSchema)
async def get_playback_state(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify room membership
    mem_stmt = select(RoomMembership).where(
        and_(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == current_user.id,
            RoomMembership.is_active == True,
        )
    )
    mem_res = await db.execute(mem_stmt)
    membership = mem_res.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an active member of this room")

    state = playback_service.get_state(room_id)
    return state


@router.put("/{room_id}/playback-state", response_model=PlaybackStateSchema)
async def update_playback_state(
    room_id: str,
    payload: PlaybackCommandPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room_stmt = select(Room).where(Room.id == room_id)
    room_res = await db.execute(room_stmt)
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    is_host = (room.host_user_id == current_user.id)
    success, err, state = playback_service.handle_command(
        room_id=room_id,
        cmd=payload,
        caller_id=current_user.id,
        is_host=is_host,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err or "Invalid command")

    return state
