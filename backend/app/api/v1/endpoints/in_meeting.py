from fastapi import APIRouter
from app.schemas.in_meeting import TranscriptEvent, ActionEvent
from app.llm.graphs.router import build_router_graph
from app.llm.graphs.state import MeetingState

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


@router.get('/actions', response_model=list[ActionEvent])
def live_actions():
    result = _run_graph({"stage": "in", "transcript_window": ""})
    actions = result.get("actions") or []
    return [ActionEvent(task=a.get("task", ""), owner=a.get("owner"), due_date=None, confidence=0.82) for a in actions]


@router.get('/transcript', response_model=list[TranscriptEvent])
def transcript():
    return [TranscriptEvent(speaker='PMO', text='We need to accelerate API A', timestamp=0.0)]
