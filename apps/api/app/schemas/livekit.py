from pydantic import BaseModel


class LiveKitTokenResponse(BaseModel):
    token: str
    url: str
    roomName: str
    participantIdentity: str
    participantName: str
