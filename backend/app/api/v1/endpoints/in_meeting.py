from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.in_meeting import TranscriptEvent, ActionEvent
from app.llm.graphs.router import build_router_graph
from app.llm.graphs.state import MeetingState
from app.services import transcript_service, action_item_service

router = APIRouter()
router_graph = build_router_graph(default_stage="in")


def _run_graph(state: MeetingState) -> MeetingState:
    if hasattr(router_graph, "invoke"):
        return router_graph.invoke(state)
    return state


@router.get('/recap', response_model=dict)
def live_recap():
    result = _run_graph({"stage": "in", "transcript_window": "Stub transcript from API"})
    recap = result.get("debug_info", {}).get("recap", "No transcript received")
    return {"summary": recap}


@router.get('/recap/{meeting_id}', response_model=dict)
def get_meeting_recap(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Get live recap for a specific meeting"""
    recap = transcript_service.get_live_recap(db, meeting_id)
    if recap:
        return recap.model_dump()
    return {"meeting_id": meeting_id, "summary": None, "message": "No recap available"}


@router.get('/actions', response_model=list[ActionEvent])
def live_actions():
    result = _run_graph({"stage": "in", "transcript_window": ""})
    actions = result.get("actions") or []
    return [ActionEvent(task=a.get("task", ""), owner=a.get("owner"), due_date=None, confidence=0.82) for a in actions]


@router.get('/actions/{meeting_id}', response_model=dict)
def get_meeting_actions(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Get detected action items for a meeting"""
    items = action_item_service.list_action_items(db, meeting_id)
    return {
        "meeting_id": meeting_id,
        "actions": [item.model_dump() for item in items.items],
        "total": items.total
    }


@router.get('/decisions/{meeting_id}', response_model=dict)
def get_meeting_decisions(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Get detected decisions for a meeting"""
    items = action_item_service.list_decision_items(db, meeting_id)
    return {
        "meeting_id": meeting_id,
        "decisions": [item.model_dump() for item in items.items],
        "total": items.total
    }


@router.get('/risks/{meeting_id}', response_model=dict)
def get_meeting_risks(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Get detected risks for a meeting"""
    items = action_item_service.list_risk_items(db, meeting_id)
    return {
        "meeting_id": meeting_id,
        "risks": [item.model_dump() for item in items.items],
        "total": items.total
    }


@router.get('/transcript', response_model=list[TranscriptEvent])
def transcript():
    return [TranscriptEvent(speaker='PMO', text='We need to accelerate API A', timestamp=0.0)]


@router.get('/transcript/{meeting_id}', response_model=dict)
def get_meeting_transcript(
    meeting_id: str,
    from_index: int = None,
    to_index: int = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get transcript chunks for a meeting"""
    chunks = transcript_service.list_transcript_chunks(db, meeting_id, from_index, to_index, limit)
    return {
        "meeting_id": meeting_id,
        "chunks": [chunk.model_dump() for chunk in chunks.chunks],
        "total": chunks.total
    }
