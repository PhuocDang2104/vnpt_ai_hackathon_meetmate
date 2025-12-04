from fastapi import APIRouter
from app.schemas.meeting import Meeting, MeetingCreate
from app.services import meeting_service

router = APIRouter()


@router.get('/', response_model=list[Meeting])
def list_meetings():
    return meeting_service.list_meetings()


@router.post('/', response_model=Meeting)
def create_meeting(payload: MeetingCreate):
    return meeting_service.create_meeting(payload)