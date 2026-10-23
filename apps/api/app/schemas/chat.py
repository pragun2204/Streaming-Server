from pydantic import BaseModel, Field


class SendChatMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class ChatMessageSchema(BaseModel):
    id: str
    roomId: str
    senderUserId: str
    senderDisplayName: str
    message: str
    timestamp: int # epoch ms
