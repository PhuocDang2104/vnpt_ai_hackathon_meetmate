from fastapi import APIRouter
from app.schemas.chat import ChatMessage
from app.services import chat_service

router = APIRouter()


@router.post('/', response_model=dict)
def send_chat(message: ChatMessage):
    return chat_service.send_message(message)