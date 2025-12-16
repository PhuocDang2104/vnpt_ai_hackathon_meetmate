# Realtime transcript ingestion (Google Meet / VNPT GoMeet)

This note explains how to stream realtime transcript into MeetMate during an active meeting and how the UI maps to the backend WebSockets.

## User flow in UI (app/meetings/{id}/detail, tab 2. Trong họp)
1. Click **“Tham gia cuộc họp”** (header). Choose platform (GoMeet / Google Meet), paste the meeting link, and set the **Session ID** (default = `meeting.id`). This Session ID is used by both WS endpoints.
2. The page shows:
   - Platform badge + “Mở link cuộc họp” (opens the pasted link in a new tab).
   - Session ID + two WS endpoints:
     - Ingest: `/api/v1/ws/in-meeting/{session_id}`
     - Frontend feed: `/api/v1/ws/frontend/{session_id}`
3. Paste interim/final transcript text into **Raw transcript (SmartVoice / GoMeet)** and press **Gửi transcript (ingest)**.
   - The ingest WS receives your chunk and publishes it to the session bus.
   - The frontend WS emits `transcript_event` and `state` updates for the UI.

## WS endpoints and payloads
- Ingest (GoMeet/SmartVoice → backend): `wss://<host>/api/v1/ws/in-meeting/{session_id}`
  ```json
  {
    "meeting_id": "<session_id>",
    "chunk": "Speaker text ...",
    "speaker": "SPEAKER_01",
    "time_start": 12.3,
    "time_end": 15.8,
    "is_final": true,
    "confidence": 0.9,
    "lang": "vi"
  }
  ```
  Backend responds with `{"event":"ingest_ack","seq":<n>}` and publishes `transcript_event`.

- Frontend (subscribe): `wss://<host>/api/v1/ws/frontend/{session_id}`
  - Receives `transcript_event` (for caption) and `state` (recap/ADR/QA/tools) as described in `docs/in_meeting_flow.md`.

## SmartVoice STT → ingest mapping
- Use SmartVoice `StreamingRecognize` (PCM 16-bit mono, 16 kHz recommended).
- Map each interim/final response to ingest payload:
  - `chunk`: transcript string.
  - `is_final`: from SmartVoice `is_final`.
  - `confidence`: SmartVoice confidence.
  - `time_start/time_end`: word offsets or running clock.
  - `speaker`: `SPEAKER_01` if diarization not available.

## Tips
- Keep Session ID stable per meeting; it scopes the bus and both WS channels.
- Use small chunks (200–1000 ms) for low latency; SmartVoice docs allow 3–10 s max.
- If WS disconnects, use **Kết nối lại**; both ingest and frontend WS will reconnect with the current Session ID.
