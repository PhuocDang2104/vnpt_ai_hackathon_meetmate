from fastapi import APIRouter, WebSocket
import time
from app.websocket.manager import manager
from app.llm.graphs.router import build_router_graph
from app.llm.graphs.state import MeetingState
from app.llm.agents.in_meeting_agent import InMeetingAgent
from app.db.session import SessionLocal
from app.services.in_meeting_persistence import (
    persist_transcript,
    persist_topic_segment,
    persist_adr,
    persist_tool_suggestions,
)

router = APIRouter()
router_graph = build_router_graph(default_stage="in")
agent = InMeetingAgent()


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
            try:
                payload = await websocket.receive_json()
                chunk_text = payload.get("chunk", "")
                project_id = payload.get("project_id")
                if not project_id:
                    try:
                        db = SessionLocal()
                        from app.models.meeting import Meeting  # local import to avoid cycle at startup
                        m = db.query(Meeting).filter(Meeting.id == (payload.get("meeting_id") or session_id)).first()
                        if m and m.project_id:
                            project_id = str(m.project_id)
                    except Exception:
                        project_id = None
                    finally:
                        try:
                            db.close()
                        except Exception:
                            pass

                state: MeetingState = {
                    "meeting_id": payload.get("meeting_id") or session_id,
                    "stage": "in",
                    "intent": "qa" if payload.get("question") else "tick",
                    "project_id": project_id,
                    "sla": "realtime",
                    "vnpt_segment": {
                        "text": chunk_text,
                        "time_start": payload.get("time_start", 0.0),
                        "time_end": payload.get("time_end", 0.0),
                        "speaker": payload.get("speaker", "SPEAKER_01"),
                        "is_final": payload.get("is_final", True),
                        "confidence": payload.get("confidence", 1.0),
                        "lang": payload.get("lang", "vi"),
                    },
                    "transcript_window": chunk_text,
                    "full_transcript": payload.get("full_transcript", ""),
                    "last_user_question": payload.get("question"),
                    "actions": payload.get("actions", []),
                    "decisions": payload.get("decisions", []),
                    "risks": payload.get("risks", []),
                }
                force_tick = bool(payload.get("question"))
                # Persist transcript chunk asynchronously-light (best effort)
                try:
                    db = SessionLocal()
                    persist_transcript(db, state["meeting_id"], state["vnpt_segment"])
                except Exception:
                    pass
                finally:
                    try:
                        db.close()
                    except Exception:
                        pass

                result = agent.run_with_scheduler(state, force=force_tick)
                if result is None:
                    await manager.send_json({"event": "tick_skipped", "session_id": session_id, "payload": state}, websocket)
                    continue

                # Persist ADR, topics, tool suggestions (best effort)
                try:
                    db = SessionLocal()
                    if result.get("topic_segments"):
                        persist_topic_segment(db, result["meeting_id"], result["topic_segments"][-1])
                    persist_adr(db, result["meeting_id"], result.get("new_actions", []), result.get("new_decisions", []), result.get("new_risks", []))
                    persist_tool_suggestions(db, result["meeting_id"], result.get("tool_suggestions", []))
                except Exception:
                    pass
                finally:
                    try:
                        db.close()
                    except Exception:
                        pass

                await manager.send_json({"event": "state", "session_id": session_id, "payload": result}, websocket)
            except Exception as e:
                await manager.send_json({"event": "error", "session_id": session_id, "message": str(e)}, websocket)
    except Exception:
        await manager.disconnect(websocket)
