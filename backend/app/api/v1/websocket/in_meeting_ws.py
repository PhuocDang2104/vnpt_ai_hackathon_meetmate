import asyncio
from typing import Any, Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import SessionLocal
from app.llm.agents.in_meeting_agent import InMeetingAgent
from app.llm.graphs.state import MeetingState
from app.models.meeting import Meeting
from app.services.in_meeting_persistence import (
    persist_transcript,
    persist_topic_segment,
    persist_adr,
    persist_tool_suggestions,
)
from app.services.session_event_bus import SessionEventBus

router = APIRouter()
session_bus = SessionEventBus()
langgraph_workers: Dict[str, asyncio.Task] = {}
transcript_buffers: Dict[str, str] = {}
state_versions: Dict[str, int] = {}
project_cache: Dict[str, Optional[str]] = {}


def _update_transcript_buffer(session_id: str, text: str, max_chars: int = 4000) -> str:
    if not text:
        return transcript_buffers.get(session_id, "")
    combined = f"{transcript_buffers.get(session_id, '')}\n{text}".strip()
    if len(combined) > max_chars:
        combined = combined[-max_chars:]
    transcript_buffers[session_id] = combined
    return combined


def _resolve_project_id(meeting_id: Optional[str]) -> Optional[str]:
    if not meeting_id:
        return None
    if meeting_id in project_cache:
        return project_cache[meeting_id]
    try:
        db = SessionLocal()
        record = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        project_cache[meeting_id] = str(record.project_id) if record and record.project_id else None
    except Exception:
        project_cache[meeting_id] = None
    finally:
        try:
            db.close()
        except Exception:
            pass
    return project_cache[meeting_id]


def _persist_state_outputs(result: Dict[str, Any]) -> None:
    try:
        db = SessionLocal()
        meeting_id = result.get("meeting_id")
        if meeting_id:
            if result.get("topic_segments"):
                persist_topic_segment(db, meeting_id, result["topic_segments"][-1])
            persist_adr(db, meeting_id, result.get("new_actions", []), result.get("new_decisions", []), result.get("new_risks", []))
            persist_tool_suggestions(db, meeting_id, result.get("tool_suggestions", []))
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass


def _build_state_from_payload(session_id: str, payload: Dict[str, Any]) -> MeetingState:
    meeting_id = payload.get("meeting_id") or session_id
    project_id = payload.get("project_id") or _resolve_project_id(meeting_id)
    seg = {
        "text": payload.get("chunk") or payload.get("text") or "",
        "time_start": payload.get("time_start", 0.0),
        "time_end": payload.get("time_end", 0.0),
        "speaker": payload.get("speaker", "SPEAKER_01"),
        "is_final": payload.get("is_final", True),
        "confidence": payload.get("confidence", 1.0),
        "lang": payload.get("lang", "vi"),
    }
    return {
        "meeting_id": meeting_id,
        "stage": "in",
        "intent": "qa" if payload.get("question") else "tick",
        "project_id": project_id,
        "sla": "realtime",
        "vnpt_segment": seg,
        "transcript_window": payload.get("transcript_window") or seg["text"],
        "full_transcript": payload.get("full_transcript") or transcript_buffers.get(session_id, ""),
        "last_user_question": payload.get("question"),
        "actions": payload.get("actions", []),
        "decisions": payload.get("decisions", []),
        "risks": payload.get("risks", []),
        "tool_suggestions": payload.get("tool_suggestions", []),
        "debug_info": payload.get("debug_info", {}),
    }


async def _publish_state_event(session_id: str, state: Dict[str, Any]) -> None:
    state_versions[session_id] = state_versions.get(session_id, 0) + 1
    await session_bus.publish(
        session_id,
        {
            "event": "state",
            "version": state_versions[session_id],
            "payload": state,
        },
    )


async def _langgraph_consumer(session_id: str, queue: asyncio.Queue) -> None:
    agent = InMeetingAgent()
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=900)
            except asyncio.TimeoutError:
                break
            if event.get("event") != "transcript_event":
                continue
            payload = event.get("payload") or {}
            state = _build_state_from_payload(session_id, payload)
            result = agent.run_with_scheduler(state, force=bool(payload.get("question")))
            if result is None:
                continue
            _persist_state_outputs(result)
            await _publish_state_event(session_id, result)
    except asyncio.CancelledError:
        pass
    finally:
        session_bus.unsubscribe(session_id, queue)
        langgraph_workers.pop(session_id, None)
        transcript_buffers.pop(session_id, None)
        state_versions.pop(session_id, None)


def _ensure_langgraph_worker(session_id: str) -> None:
    task = langgraph_workers.get(session_id)
    if task and not task.done():
        return
    queue = session_bus.subscribe(session_id)
    langgraph_workers[session_id] = asyncio.create_task(_langgraph_consumer(session_id, queue))


@router.websocket("/in-meeting/{session_id}")
async def in_meeting_ingest(websocket: WebSocket, session_id: str):
    await websocket.accept()
    await websocket.send_json({"event": "connected", "channel": "ingest", "session_id": session_id})
    _ensure_langgraph_worker(session_id)
    try:
        while True:
            try:
                payload = await websocket.receive_json()
            except WebSocketDisconnect:
                break
            except Exception as exc:
                await websocket.send_json({"event": "error", "session_id": session_id, "message": str(exc)})
                continue

            meeting_id = payload.get("meeting_id") or session_id
            chunk_text = payload.get("chunk") or payload.get("text") or ""
            transcript_payload: Dict[str, Any] = {
                "meeting_id": meeting_id,
                "chunk": chunk_text,
                "speaker": payload.get("speaker", "SPEAKER_01"),
                "time_start": payload.get("time_start", 0.0),
                "time_end": payload.get("time_end", 0.0),
                "is_final": payload.get("is_final", True),
                "confidence": payload.get("confidence", 1.0),
                "lang": payload.get("lang", "vi"),
                "question": payload.get("question"),
                "project_id": payload.get("project_id"),
                "confidence_source": payload.get("confidence_source"),
            }
            transcript_payload["transcript_window"] = _update_transcript_buffer(session_id, chunk_text)
            transcript_payload["full_transcript"] = transcript_payload["transcript_window"]

            project_id = transcript_payload.get("project_id") or _resolve_project_id(meeting_id)
            if project_id:
                transcript_payload["project_id"] = project_id

            if chunk_text:
                try:
                    db = SessionLocal()
                    persist_transcript(
                        db,
                        meeting_id,
                        {
                            "speaker": transcript_payload["speaker"],
                            "text": chunk_text,
                            "time_start": transcript_payload["time_start"],
                            "time_end": transcript_payload["time_end"],
                            "is_final": transcript_payload["is_final"],
                            "lang": transcript_payload["lang"],
                            "confidence": transcript_payload["confidence"],
                        },
                    )
                except Exception:
                    pass
                finally:
                    try:
                        db.close()
                    except Exception:
                        pass

            envelope = await session_bus.publish(
                session_id,
                {
                    "event": "transcript_event",
                    "payload": transcript_payload,
                },
            )
            await websocket.send_json({"event": "ingest_ack", "session_id": session_id, "seq": envelope.get("seq")})
            _ensure_langgraph_worker(session_id)
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@router.websocket("/frontend/{session_id}")
async def in_meeting_frontend(websocket: WebSocket, session_id: str):
    await websocket.accept()
    queue = session_bus.subscribe(session_id)
    await websocket.send_json({"event": "connected", "channel": "frontend", "session_id": session_id})
    try:
        while True:
            try:
                event = await queue.get()
            except asyncio.CancelledError:
                break
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        session_bus.unsubscribe(session_id, queue)
        try:
            await websocket.close()
        except Exception:
            pass
