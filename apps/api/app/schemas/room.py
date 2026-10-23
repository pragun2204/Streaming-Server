from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RoomCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    isPrivate: bool = True
    password: Optional[str] = Field(None, max_length=50)


class RoomJoinRequest(BaseModel):
    inviteToken: Optional[str] = None
    password: Optional[str] = None


class TransferHostRequest(BaseModel):
    newHostUserId: str


class RoomParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    userId: str
    displayName: str
    role: str
    joinedAt: datetime
    isOnline: bool = False


class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    hostUserId: str
    capacity: int = 10
    mediaMode: str
    isPrivate: bool
    hasPassword: bool
    inviteToken: Optional[str] = None
    participants: List[RoomParticipantResponse] = []
    createdAt: datetime


class InviteResponse(BaseModel):
    id: str
    roomId: str
    inviteToken: str
    expiresAt: datetime
