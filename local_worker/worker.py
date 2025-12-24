import os
import sys
import numpy as np
import sounddevice as sd
from pyannote.audio import Pipeline

from audio_buffer import AudioBuffer
from api_client import APIClient

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    sys.exit("HF_TOKEN is required for pyannote diarization")

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000/api/v1")
SESSION_ID = os.getenv("SESSION_ID")
if not SESSION_ID:
    sys.exit("SESSION_ID env var required")

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization",
    use_auth_token=HF_TOKEN,
)

buffer = AudioBuffer()
api = APIClient(
    base_url=BACKEND_BASE_URL,
    session_id=SESSION_ID,
)


def audio_callback(indata, frames, time, status):
    samples = indata[:, 0].astype(np.float32)
    buffer.push(samples)

    chunk = buffer.pop_chunk()
    if chunk is None:
        return

    diarization = pipeline(
        {
            "waveform": chunk,
            "sample_rate": 16000,
        }
    )

    segments = []
    for segment, _, speaker in diarization.itertracks(yield_label=True):
        segments.append(
            {
                "speaker": speaker,
                "start": float(segment.start),
                "end": float(segment.end),
                "confidence": 1.0,
            }
        )

    if segments:
        api.send_segments(segments)


print("🎙️ Diarization worker started")

with sd.InputStream(
    samplerate=16000,
    channels=1,
    callback=audio_callback,
):
    while True:
        pass
