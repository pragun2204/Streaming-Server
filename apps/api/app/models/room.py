from datetime import datetime
import uuid
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    host_user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    media_mode: Mapped[str] = mapped_column(String(20), default="NONE", nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    memberships: Mapped[list["RoomMembership"]] = relationship("RoomMembership", back_populates="room", cascade="all, delete-orphan")
    invitations: Mapped[list["Invitation"]] = relationship("Invitation", back_populates="room", cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")


class RoomMembership(Base):
    __tablename__ = "room_memberships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), default="VIEWER", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    room: Mapped["Room"] = relationship("Room", back_populates="memberships")
    user: Mapped["User"] = relationship("User", back_populates="memberships")
