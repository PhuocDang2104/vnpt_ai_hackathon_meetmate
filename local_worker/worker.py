import os
import sounddevice as sd
import numpy as np
from pyannote.audio import Pipeline

from audio_buffer import AudioBuffer
from api_client import APIClient

HF_TOKEN = os.environ["HF_TOKEN"]

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization",
    use_auth_token=HF_TOKEN
)

buffer = AudioBuffer()
api = APIClient(
    base_url="https://your-server.com",
    meeting_id="meeting_001"
)

def audio_callback(indata, frames, time, status):
    samples = indata[:, 0].astype(np.float32)
    buffer.push(samples)

    chunk = buffer.pop_chunk()
    if chunk is None:
        return

    diarization = pipeline({
        "waveform": chunk,
        "sample_rate": 16000
    })

    segments = []
    for segment, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "speaker_local": speaker,
            "start": segment.start,
            "end": segment.end
        })

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
