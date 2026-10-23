from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class GuestLoginRequest(BaseModel):
    displayName: str = Field(..., min_length=2, max_length=50, description="Display name for guest user")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    displayName: str
    createdAt: datetime
    lastSeenAt: datetime
