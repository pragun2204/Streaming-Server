from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_token
from app.db.session import get_db
from app.models.user import User, UserSession
from app.models.room import Room, RoomMembership


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    # Check session cookie first
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    # Also allow Bearer token or custom header for programmatic clients
    if not raw_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            raw_token = auth_header.split(" ")[1]

    if not raw_token:
        return None

    hashed = hash_token(raw_token)
    stmt = (
        select(UserSession)
        .where(UserSession.token_hash == hashed)
        .where(UserSession.expires_at > datetime.utcnow())
    )
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        return None

    user_stmt = select(User).where(User.id == session.user_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if user:
        user.last_seen_at = datetime.utcnow()
        await db.commit()
    return user


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user
