# In-meeting realtime flow (MeetMate)

This is the reference flow for MeetMate realtime: one ingress, session-scoped bus, two consumers, one frontend egress. It matches the Google Meet Media API + VNPT SmartVoice STT notes.

## Data path: ingress -> bus -> consumers -> egress
1) Ingress (`/api/v1/ws/in-meeting/{session_id}`)  
   - GoMeet media client (or Meet Media API bridge) sends transcript chunks over WS.  
   - Backend appends to the transcript store (DB) and publishes `transcript_event` into the session event bus.
2) Session event bus (in-memory, session-scoped)  
   - Pub/sub fan-out per `session_id`, ordered by `seq`.  
   - Every subscriber gets both transcript events and state updates.
3) Consumers (fan-out)  
   - Consumer A: frontend subscribers receive `transcript_event` immediately for live caption.  
   - Consumer B: LangGraph in-meeting worker subscribes to the same bus, runs the graph, persists ADR/topic/tool suggestions, and publishes `state` events back to the bus.
4) Egress (`/api/v1/ws/frontend/{session_id}`)  
   - Frontend opens one WS and receives both `transcript_event` (caption) and `state` (recap/ADR/QA/tools) in near realtime.

## WebSocket contracts
### Ingest WS (GoMeet/SmartVoice -> backend)
- Endpoint: `wss://<host>/api/v1/ws/in-meeting/{session_id}`
- Client sends JSON:
```json
{
  "meeting_id": "9c3b...",
  "chunk": "Speaker text ...",
  "speaker": "SPEAKER_01",
  "time_start": 12.3,
  "time_end": 15.8,
  "is_final": true,
  "confidence": 0.91,
  "lang": "vi",
  "question": null
}
```
- Backend replies `{"event": "ingest_ack", "seq": <bus_seq>}`. Chunks are persisted (best effort) and published to the bus.

### Frontend subscribe WS
- Endpoint: `wss://<host>/api/v1/ws/frontend/{session_id}`
- Server pushes two event types:
```json
{
  "event": "transcript_event",
  "session_id": "9c3b...",
  "seq": 101,
  "payload": {
    "meeting_id": "9c3b...",
    "chunk": "Speaker text ...",
    "speaker": "SPEAKER_01",
    "time_start": 12.3,
    "time_end": 15.8,
    "is_final": true,
    "confidence": 0.91,
    "lang": "vi"
  }
}
```
```json
{
  "event": "state",
  "session_id": "9c3b...",
  "seq": 132,
  "version": 7,
  "payload": {
    "live_recap": "Short recap ...",
    "actions": [/* merged actions */],
    "new_actions": [/* latest */],
    "decisions": [],
    "risks": [],
    "tool_suggestions": [],
    "topic_segments": [],
    "last_qa_answer": null
  }
}
```
- Frontend behavior: `transcript_event` -> append/update caption UI; `state` -> render recap/ADR/QA/tool panels.

## SmartVoice STT -> transcript payload
- SmartVoice streaming gRPC: first message `streaming_config`, following messages `audio_content` (PCM 16-bit, mono, 16 kHz recommended). Chunk length 200–1000 ms for low latency; SmartVoice doc suggests 3–10 s max.
- Minimal `RecognitionConfig`:
```json
{
  "language_code": "vi-VN",
  "sample_rate_hertz": 16000,
  "encoding": "LINEAR16",
  "model": "fast_streaming",
  "enable_word_time_offsets": true
}
```
- Map SmartVoice partial/final results into ingest WS payload:
  - `chunk`: concatenated transcript string from STT result.
  - `time_start`/`time_end`: use word or alternative offsets if available; otherwise running audio clock.
  - `is_final`: map from `is_final` flag in `StreamingRecognizeResponse`.
  - `confidence`: SmartVoice confidence or average of alternatives.
  - `speaker`: `SPEAKER_01` if diarization not available.

## Google Meet Media API bridge (PoC)
1. Meet Media API client joins call, subscribes to audio track.  
2. Decode WebRTC/Opus -> PCM 16-bit mono, resample to 16 kHz.  
3. Stream PCM into SmartVoice `StreamingRecognize`.  
4. For every interim/final STT response, emit ingest WS payload above to the backend (`chunk`, `speaker`, `time_start`, `time_end`, `is_final`, `confidence`, `lang`).  
5. Backend bus fans out to frontend (transcript) and LangGraph (state) as described.

## Persistence and cadence notes
- Transcript chunks are appended to DB when `chunk` is non-empty; in-memory transcript window is trimmed (~4000 chars) per session for graph context.
- LangGraph ticks are throttled by the per-session scheduler; `question` in payload forces an immediate run for live QA.
