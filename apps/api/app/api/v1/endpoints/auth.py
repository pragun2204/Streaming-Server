from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import generate_session_token, hash_token
from app.db.session import get_db
from app.models.user import User, UserSession
from app.schemas.auth import GuestLoginRequest, UserResponse

router = APIRouter()


@router.post("/guest", response_model=UserResponse)
async def create_guest_session(
    payload: GuestLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    cleaned_name = payload.displayName.strip()
    if not cleaned_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display name cannot be empty",
        )

    user = User(display_name=cleaned_name)
    db.add(user)
    await db.flush()

    raw_token = generate_session_token()
    token_hashed = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(hours=settings.SESSION_EXPIRE_HOURS)

    user_session = UserSession(
        user_id=user.id,
        token_hash=token_hashed,
        expires_at=expires_at,
    )
    db.add(user_session)
    await db.commit()
    await db.refresh(user)

    # Set secure HTTP-only cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        samesite="none" if settings.ENVIRONMENT == "production" else "lax",
        secure=settings.ENVIRONMENT == "production",
        path="/",
    )

    return UserResponse(
        id=user.id,
        displayName=user.display_name,
        createdAt=user.created_at,
        lastSeenAt=user.last_seen_at,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return UserResponse(
        id=current_user.id,
        displayName=current_user.display_name,
        createdAt=current_user.created_at,
        lastSeenAt=current_user.last_seen_at,
    )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        samesite="none" if settings.ENVIRONMENT == "production" else "lax",
        secure=settings.ENVIRONMENT == "production",
    )
    return {"status": "logged_out"}
