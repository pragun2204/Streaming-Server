from typing import Optional
from pydantic import BaseModel, Field


class PlaybackStateSchema(BaseModel):
    roomId: str
    mediaId: Optional[str] = None
    mediaName: Optional[str] = None
    mediaSize: Optional[int] = None
    mediaDuration: Optional[float] = None
    status: str = Field(default="IDLE") # IDLE, PLAYING, PAUSED, BUFFERING
    positionSeconds: float = 0.0
    playbackRate: float = 1.0
    updatedAt: int = 0 # epoch ms
    revision: int = 0
    hostId: Optional[str] = None


class PlaybackCommandPayload(BaseModel):
    command: str = Field(..., description="PLAY, PAUSE, SEEK, SET_RATE, BUFFERING, READY, SYNC_REQUEST")
    positionSeconds: Optional[float] = None
    playbackRate: Optional[float] = None
    revision: Optional[int] = None


class MediaSelectedPayload(BaseModel):
    mediaId: str = Field(..., description="SHA-256 fingerprint of file")
    mediaName: str
    mediaSize: int
    mediaDuration: float
