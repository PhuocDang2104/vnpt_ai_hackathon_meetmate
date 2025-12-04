from pydantic import BaseModel


class ChatMessage(BaseModel):
    sender: str
    content: str
    meeting_id: str | None = None