import asyncio, json, time, uuid, inspect
import websockets

WS_URL = "wss://vnpt-ai-hackathon-meetmate.onrender.com/api/v1/ws/in-meeting/c0000002-0000-0000-0000-000000000002"
TOKEN = None  # "Bearer xxx" nếu cần

async def run():
    headers = {}
    if TOKEN:
        headers["Authorization"] = TOKEN

    connect_kwargs = dict(
        ping_interval=20,
        ping_timeout=20,
        close_timeout=5,
        max_size=4 * 1024 * 1024,
    )

    sig = inspect.signature(websockets.connect)
    if headers:
        if "additional_headers" in sig.parameters:
            connect_kwargs["additional_headers"] = headers
        elif "extra_headers" in sig.parameters:
            connect_kwargs["extra_headers"] = headers
        else:
            raise RuntimeError(f"websockets.connect không hỗ trợ headers params. Signature: {sig}")

    async with websockets.connect(WS_URL, **connect_kwargs) as ws:
        print("✅ Connected:", WS_URL)

        segment_id = f"seg_{uuid.uuid4().hex[:8]}"
        msg1 = {
            "type": "transcript_chunk",
            "seq": 1,
            "meeting_id": "weekly-002",
            "segment_id": segment_id,
            "speaker": "spk_0",
            "time_start": 0 ,
            "time_end": 1500,
            "chunk": "xin chào anh chị, hôm nay mình",
            "is_final": False,
            "confidence": 0.82,
            "lang": "vi-VN",
            "question": False
        }
        await ws.send(json.dumps(msg1, ensure_ascii=False))
        print("➡️ sent:", msg1)

        try:
            resp = await asyncio.wait_for(ws.recv(), timeout=5)
            print("⬅️ recv:", resp)
        except asyncio.TimeoutError:
            print("⚠️ No response within 5s (server có thể không auto-ack).")

        msg2 = dict(msg1)
        msg2["seq"] = 2
        msg2["time_end"] = 3200
        msg2["chunk"] = "xin chào anh chị, hôm nay mình họp về ngân sách quý này."
        msg2["is_final"] = True
        await ws.send(json.dumps(msg2, ensure_ascii=False))
        print("➡️ sent:", msg2)

        start = time.time()
        while time.time() - start < 10:
            try:
                resp = await asyncio.wait_for(ws.recv(), timeout=2)
                print("⬅️ recv:", resp)
            except asyncio.TimeoutError:
                pass

if __name__ == "__main__":
    asyncio.run(run())