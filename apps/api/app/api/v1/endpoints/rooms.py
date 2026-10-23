from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import generate_invite_token, hash_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.models.room import Room, RoomMembership
from app.models.invitation import Invitation
from app.schemas.room import (
    RoomCreateRequest,
    RoomJoinRequest,
    RoomResponse,
    RoomParticipantResponse,
    TransferHostRequest,
    InviteResponse,
)
from app.websocket.hub import ws_manager

router = APIRouter()


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cleaned_name = payload.name.strip()
    pwd_hash = hash_password(payload.password) if payload.password else None

    room = Room(
        name=cleaned_name,
        host_user_id=current_user.id,
        capacity=settings.MAX_PARTICIPANTS_PER_ROOM,
        media_mode="NONE",
        is_private=payload.isPrivate,
        password_hash=pwd_hash,
    )
    db.add(room)
    await db.flush()

    # Host membership
    membership = RoomMembership(
        room_id=room.id,
        user_id=current_user.id,
        role="HOST",
        is_active=True,
    )
    db.add(membership)

    # Generate initial invite token
    raw_invite_token = generate_invite_token()
    invite = Invitation(
        room_id=room.id,
        token_hash=hash_token(raw_invite_token),
        created_by=current_user.id,
        expires_at=datetime.utcnow() + timedelta(hours=settings.INVITATION_EXPIRE_HOURS),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(room)

    return RoomResponse(
        id=room.id,
        name=room.name,
        hostUserId=room.host_user_id,
        capacity=room.capacity,
        mediaMode=room.media_mode,
        isPrivate=room.is_private,
        hasPassword=bool(room.password_hash),
        inviteToken=raw_invite_token,
        participants=[
            RoomParticipantResponse(
                userId=current_user.id,
                displayName=current_user.display_name,
                role="HOST",
                joinedAt=membership.joined_at,
                isOnline=True,
            )
        ],
        createdAt=room.created_at,
    )


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Room).where(Room.id == room_id)
    res = await db.execute(stmt)
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Fetch active members
    mem_stmt = (
        select(RoomMembership, User)
        .join(User, RoomMembership.user_id == User.id)
        .where(RoomMembership.room_id == room_id)
        .where(RoomMembership.is_active == True)
    )
    mem_res = await db.execute(mem_stmt)
    members_data = mem_res.all()

    online_ids = set()
    if room_id in ws_manager.active_rooms:
        online_ids = set(ws_manager.active_rooms[room_id].keys())

    participants = [
        RoomParticipantResponse(
            userId=user.id,
            displayName=user.display_name,
            role=mem.role,
            joinedAt=mem.joined_at,
            isOnline=user.id in online_ids,
        )
        for mem, user in members_data
    ]

    return RoomResponse(
        id=room.id,
        name=room.name,
        hostUserId=room.host_user_id,
        capacity=room.capacity,
        mediaMode=room.media_mode,
        isPrivate=room.is_private,
        hasPassword=bool(room.password_hash),
        participants=participants,
        createdAt=room.created_at,
    )


@router.post("/{room_id}/join", response_model=RoomResponse)
async def join_room(
    room_id: str,
    payload: RoomJoinRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Room).where(Room.id == room_id)
    res = await db.execute(stmt)
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # If password is set, verify
    if room.password_hash:
        if not payload.password or not verify_password(payload.password, room.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid room password")

    # If invite token is provided, verify it is valid
    if payload.inviteToken:
        token_hash = hash_token(payload.inviteToken)
        inv_stmt = select(Invitation).where(
            and_(
                Invitation.room_id == room_id,
                Invitation.token_hash == token_hash,
                Invitation.is_revoked == False,
                Invitation.expires_at > datetime.utcnow(),
            )
        )
        inv_res = await db.execute(inv_stmt)
        invite = inv_res.scalar_one_or_none()
        if not invite:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired invitation")

    # Check active participants count for strict 10 capacity limit
    count_stmt = (
        select(func.count(RoomMembership.id))
        .where(RoomMembership.room_id == room_id)
        .where(RoomMembership.is_active == True)
    )
    count_res = await db.execute(count_stmt)
    active_count = count_res.scalar_one()

    # Check if this user is already active
    mem_stmt = select(RoomMembership).where(
        and_(RoomMembership.room_id == room_id, RoomMembership.user_id == current_user.id)
    )
    mem_res = await db.execute(mem_stmt)
    existing_mem = mem_res.scalar_one_or_none()

    if not existing_mem or not existing_mem.is_active:
        if active_count >= room.capacity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room has reached maximum capacity of {room.capacity} participants",
            )

    if existing_mem:
        existing_mem.is_active = True
        existing_mem.last_seen_at = datetime.utcnow()
    else:
        role = "HOST" if current_user.id == room.host_user_id else "VIEWER"
        new_mem = RoomMembership(
            room_id=room.id,
            user_id=current_user.id,
            role=role,
            is_active=True,
        )
        db.add(new_mem)

    await db.commit()

    # Return refreshed room state
    return await get_room(room_id, current_user, db)


@router.post("/{room_id}/leave")
async def leave_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mem_stmt = select(RoomMembership).where(
        and_(RoomMembership.room_id == room_id, RoomMembership.user_id == current_user.id)
    )
    mem_res = await db.execute(mem_stmt)
    membership = mem_res.scalar_one_or_none()
    if membership:
        membership.is_active = False
        await db.commit()

    # Disconnect from websocket hub if connected
    await ws_manager.disconnect(room_id, current_user.id)

    # Check if departing user was host
    room_stmt = select(Room).where(Room.id == room_id)
    room_res = await db.execute(room_stmt)
    room = room_res.scalar_one_or_none()

    if room and room.host_user_id == current_user.id:
        # Find next active participant to migrate host to
        next_host_stmt = (
            select(RoomMembership)
            .where(and_(RoomMembership.room_id == room_id, RoomMembership.is_active == True))
            .order_by(RoomMembership.joined_at.asc())
        )
        next_host_res = await db.execute(next_host_stmt)
        next_mem = next_host_res.scalar_one_or_none()

        if next_mem:
            room.host_user_id = next_mem.user_id
            next_mem.role = "HOST"
            await db.commit()
            await ws_manager.broadcast(
                room_id,
                "room.host_changed",
                {"newHostUserId": next_mem.user_id},
            )

    await ws_manager.broadcast(
        room_id,
        "room.participant_left",
        {"userId": current_user.id, "reason": "left"},
    )

    return {"status": "left"}


@router.post("/{room_id}/transfer-host")
async def transfer_host(
    room_id: str,
    payload: TransferHostRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room_stmt = select(Room).where(Room.id == room_id)
    room_res = await db.execute(room_stmt)
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only current host can transfer privileges")

    target_stmt = select(RoomMembership).where(
        and_(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == payload.newHostUserId,
            RoomMembership.is_active == True,
        )
    )
    target_res = await db.execute(target_stmt)
    target_mem = target_res.scalar_one_or_none()
    if not target_mem:
        raise HTTPException(status_code=400, detail="Target participant is not an active room member")

    # Demote old host
    old_stmt = select(RoomMembership).where(
        and_(RoomMembership.room_id == room_id, RoomMembership.user_id == current_user.id)
    )
    old_res = await db.execute(old_stmt)
    old_mem = old_res.scalar_one_or_none()
    if old_mem:
        old_mem.role = "VIEWER"

    room.host_user_id = target_mem.user_id
    target_mem.role = "HOST"
    await db.commit()

    await ws_manager.broadcast(
        room_id,
        "room.host_changed",
        {"newHostUserId": target_mem.user_id},
    )

    return {"status": "transferred", "newHostUserId": target_mem.user_id}


@router.delete("/{room_id}/participants/{participant_id}")
async def kick_participant(
    room_id: str,
    participant_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room_stmt = select(Room).where(Room.id == room_id)
    room_res = await db.execute(room_stmt)
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can kick participants")

    target_stmt = select(RoomMembership).where(
        and_(RoomMembership.room_id == room_id, RoomMembership.user_id == participant_id)
    )
    target_res = await db.execute(target_stmt)
    target_mem = target_res.scalar_one_or_none()
    if target_mem:
        target_mem.is_active = False
        await db.commit()

    await ws_manager.broadcast(
        room_id,
        "room.participant_left",
        {"userId": participant_id, "reason": "kicked"},
    )
    await ws_manager.disconnect(room_id, participant_id)

    return {"status": "removed"}


@router.post("/{room_id}/invites", response_model=InviteResponse)
async def create_invite(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Any active room member can generate an invite link
    raw_invite_token = generate_invite_token()
    invite = Invitation(
        room_id=room_id,
        token_hash=hash_token(raw_invite_token),
        created_by=current_user.id,
        expires_at=datetime.utcnow() + timedelta(hours=settings.INVITATION_EXPIRE_HOURS),
    )
    db.add(invite)
    await db.commit()

    return InviteResponse(
        id=invite.id,
        roomId=room_id,
        inviteToken=raw_invite_token,
        expiresAt=invite.expires_at,
    )
