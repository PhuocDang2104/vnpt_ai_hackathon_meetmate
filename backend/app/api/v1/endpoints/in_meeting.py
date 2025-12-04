from fastapi import APIRouter
from app.schemas.in_meeting import TranscriptEvent, ActionEvent

router = APIRouter()


@router.get('/recap', response_model=dict)
def live_recap():
    return {"summary": "Realtime recap placeholder"}


@router.get('/actions', response_model=list[ActionEvent])
def live_actions():
    return [ActionEvent(task='Close CR-2024-015', owner='Tech Lead', due_date=None, confidence=0.82)]


@router.get('/transcript', response_model=list[TranscriptEvent])
def transcript():
    return [TranscriptEvent(speaker='PMO', text='We need to accelerate API A', timestamp=0.0)]