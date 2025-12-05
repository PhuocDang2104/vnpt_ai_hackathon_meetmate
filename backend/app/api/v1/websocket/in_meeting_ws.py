from fastapi import APIRouter, WebSocket
from app.websocket.manager import manager
from app.llm.graphs.router import build_router_graph
from app.llm.graphs.state import MeetingState

router = APIRouter()
router_graph = build_router_graph(default_stage="in")


async def _run_graph(state: MeetingState) -> MeetingState:
    if hasattr(router_graph, "ainvoke"):
        return await router_graph.ainvoke(state)
    if hasattr(router_graph, "invoke"):
        return router_graph.invoke(state)
    return state


@router.websocket('/in-meeting/{session_id}')
async def in_meeting_ws(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    try:
        await manager.send_json({"event": "connected", "channel": "in-meeting", "session_id": session_id}, websocket)
        while True:
            payload = await websocket.receive_json()
            state: MeetingState = {
                "meeting_id": payload.get("meeting_id") or session_id,
                "stage": "in",
                "sla": "realtime",
                "transcript_window": payload.get("chunk", ""),
                "full_transcript": payload.get("full_transcript", ""),
                "last_user_question": payload.get("question"),
                "actions": payload.get("actions", []),
                "decisions": payload.get("decisions", []),
                "risks": payload.get("risks", []),
            }
            new_state = await _run_graph(state)
            await manager.send_json({"event": "state", "session_id": session_id, "payload": new_state}, websocket)
    except Exception:
        await manager.disconnect(websocket)
