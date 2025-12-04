# API Contracts (stub)

- `POST /api/v1/auth/token` – obtain access token.
- `GET /api/v1/health` – liveness/readiness stub.
- `GET /api/v1/meetings` – list meetings; `POST /api/v1/meetings` – create stub meeting.
- `POST /api/v1/rag/query` – query knowledge hub with citations placeholder.
- `WS /api/v1/in-meeting` – receive transcript_event/action_event (stub schema in websocket/events.py).