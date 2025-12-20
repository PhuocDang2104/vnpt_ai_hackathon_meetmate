import asyncio
import inspect
import json
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.realtime_security import verify_audio_ingest_token
from app.db.session import SessionLocal
from app.llm.agents.in_meeting_agent import InMeetingAgent
from app.llm.graphs.state import MeetingState
from app.models.meeting import Meeting
from app.schemas.realtime import AudioStartMessage
from app.services.in_meeting_persistence import (
    persist_topic_segment,
    persist_adr,
    persist_tool_suggestions,
)
from app.services.realtime_bus import session_bus
from app.services.realtime_ingest import ingestTranscript
from app.services.realtime_session_store import session_store
from app.services.smartvoice_streaming import SmartVoiceStreamingConfig, is_smartvoice_configured, stream_recognize

router = APIRouter()
langgraph_workers: Dict[str, asyncio.Task] = {}
project_cache: Dict[str, Optional[str]] = {}
logger = logging.getLogger(__name__)


class _AudioClock:
    def __init__(self, sample_rate_hz: int, channels: int, bytes_per_sample: int = 2) -> None:
        self.sample_rate_hz = sample_rate_hz
        self.channels = channels
        self.bytes_per_sample = bytes_per_sample
        self.total_samples = 0

    def advance(self, byte_len: int) -> None:
        if byte_len <= 0 or self.sample_rate_hz <= 0 or self.channels <= 0:
            return
        samples = byte_len // (self.bytes_per_sample * self.channels)
        self.total_samples += max(0, int(samples))

    def now_s(self) -> float:
        if self.sample_rate_hz <= 0:
            return 0.0
        return float(self.total_samples) / float(self.sample_rate_hz)


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
    sess = session_store.get(session_id)
    transcript_window = payload.get("transcript_window") or (sess.transcript_buffer if sess else "")
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
        "transcript_window": transcript_window or seg["text"],
        "full_transcript": transcript_window or "",
        "last_user_question": payload.get("question"),
        "actions": payload.get("actions", []),
        "decisions": payload.get("decisions", []),
        "risks": payload.get("risks", []),
        "tool_suggestions": payload.get("tool_suggestions", []),
        "debug_info": payload.get("debug_info", {}),
    }


async def _publish_state_event(session_id: str, state: Dict[str, Any]) -> None:
    version = session_store.next_state_version(session_id)
    await session_bus.publish(
        session_id,
        {
            "event": "state",
            "version": version,
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
            is_final = payload.get("is_final", True)
            force = bool(payload.get("question"))
            # For ADR/recap extraction, prefer running on FINAL chunks; allow question-triggered tick.
            if not is_final and not force:
                continue
            state = _build_state_from_payload(session_id, payload)
            try:
                result = agent.run_with_scheduler(state, force=force)
            except Exception:
                continue
            if result is None:
                continue
            _persist_state_outputs(result)
            await _publish_state_event(session_id, result)
    except asyncio.CancelledError:
        pass
    finally:
        session_bus.unsubscribe(session_id, queue)
        langgraph_workers.pop(session_id, None)


def _ensure_langgraph_worker(session_id: str) -> None:
    task = langgraph_workers.get(session_id)
    if task and not task.done():
        return
    queue = session_bus.subscribe(session_id)
    langgraph_workers[session_id] = asyncio.create_task(_langgraph_consumer(session_id, queue))


async def _safe_send_json(websocket: WebSocket, lock: asyncio.Lock, payload: Dict[str, Any]) -> None:
    async with lock:
        await websocket.send_json(payload)


async def _smartvoice_to_bus(
    session_id: str,
    audio_queue: "asyncio.Queue[Optional[bytes]]",
    cfg: SmartVoiceStreamingConfig,
    audio_clock: _AudioClock,
    websocket: WebSocket,
    send_lock: asyncio.Lock,
) -> None:
    last_end = 0.0
    try:
        stream_iter = stream_recognize(audio_queue, cfg)
        if inspect.isawaitable(stream_iter):
            stream_iter = await stream_iter
        if not hasattr(stream_iter, "__aiter__"):
            raise TypeError("stream_recognize must return an async iterator")
        async for res in stream_iter:
            time_end = res.time_end if res.time_end is not None else audio_clock.now_s()
            time_start = res.time_start if res.time_start is not None else last_end
            if time_end < time_start:
                time_end = time_start
            last_end = time_end

            transcript_payload: Dict[str, Any] = {
                "meeting_id": session_id,
                "chunk": res.text,
                "speaker": res.speaker or "SPEAKER_01",
                "time_start": float(time_start),
                "time_end": float(time_end),
                "is_final": bool(res.is_final),
                "confidence": float(res.confidence),
                "lang": res.lang or "vi",
                "question": False,
            }
            try:
                await ingestTranscript(session_id, transcript_payload, source="smartvoice_stt")
            except Exception:
                pass
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.exception("smartvoice stream failed (session_id=%s)", session_id)
        try:
            await _safe_send_json(
                websocket,
                send_lock,
                {
                    "event": "error",
                    "session_id": session_id,
                    "message": f"smartvoice_error: {exc}",
                },
            )
        except Exception:
            pass


@router.websocket("/audio/{session_id}")
async def audio_ingest(websocket: WebSocket, session_id: str):
    token = websocket.query_params.get("token")
    if not token or not verify_audio_ingest_token(token, expected_session_id=session_id):
        await websocket.close(code=1008)
        return

    session = session_store.get(session_id)
    if not session:
        await websocket.accept()
        await websocket.send_json(
            {
                "event": "error",
                "session_id": session_id,
                "message": "Session not found. Create it via POST /api/v1/sessions first.",
            }
        )
        await websocket.close(code=1008)
        return

    await websocket.accept()
    await websocket.send_json({"event": "connected", "channel": "audio", "session_id": session_id})
    send_lock = asyncio.Lock()
    _ensure_langgraph_worker(session_id)

    try:
        raw = await websocket.receive_text()
        start_msg = AudioStartMessage.model_validate(json.loads(raw))
    except Exception as exc:
        await _safe_send_json(
            websocket,
            send_lock,
            {"event": "error", "session_id": session_id, "message": f"invalid_start: {exc}"},
        )
        await websocket.close(code=1003)
        return

    expected = session.config.expected_audio
    if (
        start_msg.audio.codec != expected.codec
        or start_msg.audio.sample_rate_hz != expected.sample_rate_hz
        or start_msg.audio.channels != expected.channels
    ):
        await _safe_send_json(
            websocket,
            send_lock,
            {
                "event": "error",
                "session_id": session_id,
                "message": "audio_format_mismatch",
                "expected_audio": {
                    "codec": expected.codec,
                    "sample_rate_hz": expected.sample_rate_hz,
                    "channels": expected.channels,
                },
            },
        )
        await websocket.close(code=1003)
        return

    stt_param = (websocket.query_params.get("stt") or "").strip().lower()
    if stt_param in {"0", "false", "off", "no"}:
        stt_enabled = False
    elif stt_param in {"1", "true", "on", "yes"}:
        stt_enabled = True
    else:
        stt_enabled = is_smartvoice_configured()

    await _safe_send_json(
        websocket,
        send_lock,
        {
            "event": "audio_start_ack",
            "session_id": session_id,
            "accepted_audio": {
                "codec": expected.codec,
                "sample_rate_hz": expected.sample_rate_hz,
                "channels": expected.channels,
            },
            "stt_enabled": stt_enabled,
        },
    )

    audio_queue: asyncio.Queue[Optional[bytes]] | None = None
    audio_clock = _AudioClock(sample_rate_hz=expected.sample_rate_hz, channels=expected.channels)
    stt_task: asyncio.Task | None = None
    if stt_enabled:
        audio_queue = asyncio.Queue(maxsize=50)
        stt_cfg = SmartVoiceStreamingConfig(
            language_code=start_msg.language_code or session.config.language_code,
            sample_rate_hz=expected.sample_rate_hz,
            interim_results=session.config.interim_results,
            enable_word_time_offsets=session.config.enable_word_time_offsets,
        )
        stt_task = asyncio.create_task(
            _smartvoice_to_bus(session_id, audio_queue, stt_cfg, audio_clock, websocket, send_lock)
        )
    else:
        try:
            await _safe_send_json(
                websocket,
                send_lock,
                {"event": "stt_disabled", "session_id": session_id, "reason": "smartvoice_not_configured_or_disabled"},
            )
        except Exception:
            pass

    ingest_ok_sent = False
    received_bytes = 0
    received_frames = 0

    try:
        while True:
            if stt_task is not None and stt_task.done():
                break
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break
            if message.get("bytes") is not None:
                chunk = message["bytes"]
                if chunk:
                    received_bytes += len(chunk)
                    received_frames += 1
                    if not ingest_ok_sent:
                        ingest_ok_sent = True
                        await _safe_send_json(
                            websocket,
                            send_lock,
                            {
                                "event": "audio_ingest_ok",
                                "session_id": session_id,
                                "received_bytes": received_bytes,
                                "received_frames": received_frames,
                            },
                        )

                    if audio_queue is not None:
                        if audio_queue.full():
                            suggested = min(
                                max(start_msg.frame_ms * 2, session.config.recommended_frame_ms),
                                session.config.max_frame_ms,
                            )
                            await _safe_send_json(
                                websocket,
                                send_lock,
                                {"event": "throttle", "reason": "stt_backpressure", "suggested_frame_ms": suggested},
                            )
                        await audio_queue.put(chunk)
                    audio_clock.advance(len(chunk))
                    session_store.touch(session_id)
                continue

            if message.get("text") is not None:
                try:
                    obj = json.loads(message["text"])
                    if obj.get("type") == "stop":
                        break
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        if audio_queue is not None:
            try:
                audio_queue.put_nowait(None)
            except Exception:
                try:
                    await audio_queue.put(None)
                except Exception:
                    pass
        if stt_task is not None:
            try:
                await asyncio.wait_for(stt_task, timeout=5)
            except Exception:
                stt_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass


@router.websocket("/in-meeting/{session_id}")
async def in_meeting_ingest(websocket: WebSocket, session_id: str):
    await websocket.accept()
    await websocket.send_json({"event": "connected", "channel": "ingest", "session_id": session_id})
    session_store.ensure(session_id)
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
            }
            try:
                seq = await ingestTranscript(session_id, transcript_payload, source="transcript_test_ws")
                await websocket.send_json({"event": "ingest_ack", "session_id": session_id, "seq": seq})
            except Exception as exc:
                await websocket.send_json({"event": "error", "session_id": session_id, "message": str(exc)})
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
            if event.get("event") == "transcript_event":
                # Keep frontend contract minimal; strip internal-only fields.
                payload = dict(event.get("payload") or {})
                payload.pop("transcript_window", None)
                payload.pop("source", None)
                payload.pop("question", None)
                cleaned = dict(event)
                cleaned["payload"] = payload
                await websocket.send_json(cleaned)
            else:
                await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        session_bus.unsubscribe(session_id, queue)
        try:
            await websocket.close()
        except Exception:
            pass
