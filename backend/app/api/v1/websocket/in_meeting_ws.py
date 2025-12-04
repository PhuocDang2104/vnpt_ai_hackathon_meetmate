from fastapi import APIRouter, WebSocket
from app.websocket.manager import manager

router = APIRouter()


@router.websocket('/in-meeting')
async def in_meeting_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await manager.send_json({"event": "connected", "channel": "in-meeting"}, websocket)
        while True:
            await websocket.receive_text()
            await manager.broadcast({"event": "heartbeat", "message": "stub"})
    except Exception:
        await manager.disconnect(websocket)