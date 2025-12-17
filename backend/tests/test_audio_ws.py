import asyncio
import inspect
import json
import os
import wave

import websockets

"""
Manual test script (not a pytest test).

Goal: stream a WAV (PCM S16LE mono 16kHz) into MeetMate audio ingress WS:
  WS /api/v1/ws/audio/{session_id}?token=...

Requirements:
- Backend must have SmartVoice env configured, otherwise you'll receive `smartvoice_error`.
- WAV must be 16kHz, mono, 16-bit PCM.
"""

HOST = os.getenv("MEETMATE_HOST", "vnpt-ai-hackathon-meetmate.onrender.com")
SESSION_ID = os.getenv("MEETMATE_SESSION_ID", "c0000002-0000-0000-0000-000000000002")
AUDIO_INGEST_TOKEN = os.getenv("MEETMATE_AUDIO_INGEST_TOKEN", "")
WAV_PATH = os.getenv("MEETMATE_WAV_PATH", "")

FRAME_MS = int(os.getenv("MEETMATE_FRAME_MS", "250"))


async def _listen_frontend(stop: asyncio.Event):
    url = f"wss://{HOST}/api/v1/ws/frontend/{SESSION_ID}"
    async with websockets.connect(url, ping_interval=20, ping_timeout=20, close_timeout=5) as ws:
        while not stop.is_set():
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=1)
            except asyncio.TimeoutError:
                continue
            print("FEED ⬅️", msg)


async def _stream_audio(stop: asyncio.Event):
    if not AUDIO_INGEST_TOKEN:
        raise RuntimeError("Missing MEETMATE_AUDIO_INGEST_TOKEN (call POST /api/v1/sessions/{id}/sources first)")
    if not WAV_PATH:
        raise RuntimeError("Missing MEETMATE_WAV_PATH (path to a 16kHz mono 16-bit PCM wav)")

    url = f"wss://{HOST}/api/v1/ws/audio/{SESSION_ID}?token={AUDIO_INGEST_TOKEN}"

    connect_kwargs = dict(
        ping_interval=20,
        ping_timeout=20,
        close_timeout=5,
        max_size=8 * 1024 * 1024,
    )

    # Support both websockets v11/v12 headers params (kept for parity with other scripts)
    sig = inspect.signature(websockets.connect)
    if "additional_headers" in sig.parameters:
        pass
    elif "extra_headers" in sig.parameters:
        pass

    async with websockets.connect(url, **connect_kwargs) as ws:
        print("✅ Connected:", url)

        # Consume initial connected event (optional)
        try:
            hello = await asyncio.wait_for(ws.recv(), timeout=2)
            print("AUDIO ⬅️", hello)
        except asyncio.TimeoutError:
            pass

        start_msg = {
            "type": "start",
            "platform": "dev_wav",
            "platform_meeting_ref": f"wav:{os.path.basename(WAV_PATH)}",
            "audio": {"codec": "PCM_S16LE", "sample_rate_hz": 16000, "channels": 1},
            "language_code": "vi-VN",
            "frame_ms": FRAME_MS,
            "stream_id": "aud_01",
            "client_ts_ms": int(asyncio.get_event_loop().time() * 1000),
        }
        await ws.send(json.dumps(start_msg))
        ack = await asyncio.wait_for(ws.recv(), timeout=5)
        print("AUDIO ⬅️", ack)

        with wave.open(WAV_PATH, "rb") as wf:
            assert wf.getnchannels() == 1, "WAV must be mono"
            assert wf.getsampwidth() == 2, "WAV must be 16-bit PCM"
            assert wf.getframerate() == 16000, "WAV must be 16kHz"

            bytes_per_frame = int(16000 * 2 * 1 * FRAME_MS / 1000)
            while True:
                data = wf.readframes(bytes_per_frame // 2)  # 2 bytes/sample
                if not data:
                    break
                await ws.send(data)
                await asyncio.sleep(FRAME_MS / 1000)

        await asyncio.sleep(1.0)
        stop.set()


async def main():
    stop = asyncio.Event()
    await asyncio.gather(_listen_frontend(stop), _stream_audio(stop))


if __name__ == "__main__":
    asyncio.run(main())

