import asyncio
import json
import os
import time
import uuid
import wave
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning, module="audioop")

import audioop
import httpx
import websockets

"""
Test WS raw audio ingress (MeetMate).

What this script verifies:
✅ WS connects and server returns `audio_start_ack` (API accepted audio start + format)
✅ Audio frames are streamed without WS disconnect
⚠️ If SmartVoice is not configured/working, server may emit `smartvoice_error` and close the WS.

Default WAV path is the one you provided:
  C:\\Users\\ADMIN\\Desktop\\vnpt_meetmate\\vnpt_ai_hackathon\\backend\\tests\\resources\\eLabs-1.wav
The file is 44.1kHz mono 16-bit, so we resample to 16kHz before streaming.
"""

DEFAULT_WAV_PATH = (
    r"C:\Users\ADMIN\Desktop\vnpt_meetmate\vnpt_ai_hackathon\backend\tests\resources\eLabs-1.wav"
)

HTTP_BASE = os.getenv("MEETMATE_HTTP_BASE", "https://vnpt-ai-hackathon-meetmate.onrender.com").strip()
if HTTP_BASE and "://" not in HTTP_BASE and not HTTP_BASE.startswith(("ws://", "wss://")):
    HTTP_BASE = "https://" + HTTP_BASE
HTTP_BASE = HTTP_BASE.rstrip("/")
SESSION_ID = os.getenv("MEETMATE_SESSION_ID", "").strip() or str(uuid.uuid4())
WAV_PATH = os.getenv("MEETMATE_WAV_PATH", DEFAULT_WAV_PATH)
LANGUAGE_CODE = os.getenv("MEETMATE_LANGUAGE_CODE", "vi-VN")
FRAME_MS = int(os.getenv("MEETMATE_FRAME_MS", "250"))
TARGET_SR = int(os.getenv("MEETMATE_TARGET_SR", "16000"))

ACK_TIMEOUT_SEC = float(os.getenv("MEETMATE_ACK_TIMEOUT_SEC", "5.0"))
INGEST_OK_TIMEOUT_SEC = float(os.getenv("MEETMATE_INGEST_OK_TIMEOUT_SEC", "3.0"))

# By default this script only tests audio ingest (no SmartVoice).
# Set MEETMATE_STT=1 if you want to enable STT on the backend.
STT_PARAM = "1" if os.getenv("MEETMATE_STT", "0").strip() in ("1", "true", "True", "on") else "0"


def _ws_base_from_http(http_base: str) -> str:
    if http_base.startswith("https://"):
        return "wss://" + http_base[len("https://") :]
    if http_base.startswith("http://"):
        return "ws://" + http_base[len("http://") :]
    if http_base.startswith("ws://") or http_base.startswith("wss://"):
        return http_base
    return "ws://" + http_base


async def _create_session() -> dict:
    url = f"{HTTP_BASE}/api/v1/sessions"
    payload = {
        "session_id": SESSION_ID,
        "language_code": LANGUAGE_CODE,
        "target_sample_rate_hz": TARGET_SR,
        "audio_encoding": "PCM_S16LE",
        "channels": 1,
        "realtime": True,
        "interim_results": True,
        "enable_word_time_offsets": True,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()


async def _register_source_token() -> str:
    url = f"{HTTP_BASE}/api/v1/sessions/{SESSION_ID}/sources"
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url)
        resp.raise_for_status()
        return resp.json()["audio_ingest_token"]


def _resample_to_16k_mono_s16le(wf: wave.Wave_read, frame_ms: int) -> bytes:
    in_channels = wf.getnchannels()
    in_width = wf.getsampwidth()
    in_rate = wf.getframerate()

    state = None
    out = b""

    # Read chunks from file, resample, and return a contiguous PCM buffer.
    # We keep it simple (file is short) for test usage.
    while True:
        raw = wf.readframes(in_rate)  # ~1s
        if not raw:
            break

        pcm = raw
        if in_width != 2:
            pcm = audioop.lin2lin(pcm, in_width, 2)
            in_width = 2
        if in_channels != 1:
            pcm = audioop.tomono(pcm, in_width, 0.5, 0.5)

        if in_rate != TARGET_SR:
            converted, state = audioop.ratecv(pcm, 2, 1, in_rate, TARGET_SR, state)
        else:
            converted = pcm
        out += converted

    return out


async def main() -> int:
    print("== MeetMate WS Audio Ingest Test ==")
    print("HTTP_BASE:", HTTP_BASE)
    print("SESSION_ID:", SESSION_ID)
    print("WAV_PATH:", WAV_PATH)

    if not os.path.exists(WAV_PATH):
        print(f"❌ WAV file not found: {WAV_PATH}")
        return 1

    # 1) Create session
    try:
        sess = await _create_session()
        print("✅ Session created:", sess.get("session_id"))
    except Exception as exc:
        print("❌ Failed to create session:", exc)
        return 1

    # 2) Register source → token
    try:
        token = await _register_source_token()
        print("✅ Got audio_ingest_token (len={} chars)".format(len(token)))
    except Exception as exc:
        print("❌ Failed to register source token:", exc)
        return 1

    ws_base = _ws_base_from_http(HTTP_BASE).rstrip("/")
    audio_ws_url = f"{ws_base}/api/v1/ws/audio/{SESSION_ID}?token={token}&stt={STT_PARAM}"

    # 3) Connect WS + start
    ack_ok = False
    ingest_ok = asyncio.Event()
    server_error = None
    throttle_events = 0
    stt_disabled_notice = False

    try:
        async with websockets.connect(
            audio_ws_url,
            ping_interval=20,
            ping_timeout=20,
            close_timeout=5,
            max_size=16 * 1024 * 1024,
        ) as ws:
            print("✅ WS connected:", audio_ws_url)

            # Consume optional connected message
            try:
                hello = await asyncio.wait_for(ws.recv(), timeout=2)
                print("⬅️", hello)
            except asyncio.TimeoutError:
                pass

            start_msg = {
                "type": "start",
                "platform": "dev_wav",
                "platform_meeting_ref": f"wav:{os.path.basename(WAV_PATH)}",
                "audio": {"codec": "PCM_S16LE", "sample_rate_hz": TARGET_SR, "channels": 1},
                "language_code": LANGUAGE_CODE,
                "frame_ms": FRAME_MS,
                "stream_id": "aud_01",
                "client_ts_ms": int(time.time() * 1000),
            }
            await ws.send(json.dumps(start_msg))

            # Wait for audio_start_ack
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=ACK_TIMEOUT_SEC)
            except asyncio.TimeoutError:
                print("❌ No audio_start_ack within timeout ({}s).".format(ACK_TIMEOUT_SEC))
                return 1

            print("⬅️", msg)
            if isinstance(msg, str):
                try:
                    data = json.loads(msg)
                except Exception:
                    data = {}
                if data.get("event") == "audio_start_ack":
                    ack_ok = True
                    if data.get("stt_enabled") is False:
                        stt_disabled_notice = True
                    print("✅ audio_start_ack -> API đã accept start + format audio.")
                elif data.get("event") == "error":
                    print("❌ API trả error ngay sau start:", data)
                    return 1

            if not ack_ok:
                print("❌ Không nhận được audio_start_ack hợp lệ.")
                return 1

            async def recv_events():
                nonlocal server_error, throttle_events, stt_disabled_notice
                while True:
                    try:
                        raw = await ws.recv()
                    except Exception:
                        return
                    if not isinstance(raw, str):
                        continue
                    try:
                        data = json.loads(raw)
                    except Exception:
                        continue
                    if not isinstance(data, dict):
                        continue

                    event = data.get("event")
                    if event == "audio_ingest_ok":
                        if not ingest_ok.is_set():
                            ingest_ok.set()
                            print("✅ audio_ingest_ok:", data)
                    elif event == "stt_disabled":
                        stt_disabled_notice = True
                        print("ℹ️ stt_disabled:", data)
                    elif event == "throttle":
                        throttle_events += 1
                        print("⚠️ throttle:", data)
                    elif event == "error":
                        server_error = data
                        print("❌ server error:", data)
                        ingest_ok.set()
                        return

            recv_task = asyncio.create_task(recv_events())

            # 4) Stream WAV as PCM16 mono 16kHz frames
            with wave.open(WAV_PATH, "rb") as wf:
                print(
                    "WAV info: channels={}, width={}, rate={}Hz, frames={}".format(
                        wf.getnchannels(), wf.getsampwidth(), wf.getframerate(), wf.getnframes()
                    )
                )
                pcm = _resample_to_16k_mono_s16le(wf, FRAME_MS)

            bytes_per_frame = int(TARGET_SR * 2 * 1 * FRAME_MS / 1000)
            total_frames = (len(pcm) + bytes_per_frame - 1) // bytes_per_frame
            print(f"Streaming: target_sr={TARGET_SR}, frame_ms={FRAME_MS}, frames={total_frames}")

            sent = 0
            for i in range(total_frames):
                if server_error:
                    break
                chunk = pcm[i * bytes_per_frame : (i + 1) * bytes_per_frame]
                if not chunk:
                    break
                await ws.send(chunk)
                sent += 1
                if sent == 1:
                    try:
                        await asyncio.wait_for(ingest_ok.wait(), timeout=INGEST_OK_TIMEOUT_SEC)
                    except asyncio.TimeoutError:
                        print("❌ Không nhận được audio_ingest_ok (server chưa confirm nhận frame).")
                        recv_task.cancel()
                        return 1
                if sent % 10 == 0:
                    print(f"➡️ sent frames: {sent}/{total_frames}")
                await asyncio.sleep(FRAME_MS / 1000)

            # Signal stop (optional)
            try:
                await ws.send(json.dumps({"type": "stop"}))
            except Exception:
                pass

            await asyncio.sleep(1.0)
            recv_task.cancel()

            if server_error:
                print("❌ FAIL: server reported error while streaming.")
                return 1

            print(f"✅ OK: streamed {sent} frames, throttle_events={throttle_events}.")
            if stt_disabled_notice:
                print("ℹ️ Note: STT đang tắt (đúng mục tiêu test ingest-only).")
            print("✅ Kết luận: API đã hứng audio (audio_start_ack + audio_ingest_ok).")
            return 0

    except Exception as exc:
        print("❌ WS connection/streaming error:", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
