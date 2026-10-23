from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class PlaybackSession(Base):
    """
    Persistent snapshot of room playback state.
    Note: high-frequency real-time updates are processed in the in-memory/Redis state machine,
    and checkpointed here when paused, ended, or periodically.
    """
    __tablename__ = "playback_sessions"

    room_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    media_identifier: Mapped[str | None] = mapped_column(String(64), nullable=True) # SHA-256
    media_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    media_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    media_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    playback_status: Mapped[str] = mapped_column(String(20), default="IDLE", nullable=False) # IDLE, PLAYING, PAUSED, BUFFERING
    position_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    playback_rate: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    revision: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    host_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
