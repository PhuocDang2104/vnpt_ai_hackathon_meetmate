from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, AsyncIterator, Optional

import httpx

from app.core.config import get_settings


settings = get_settings()


try:
    from google.api_core.client_options import ClientOptions
    from google.auth.credentials import AnonymousCredentials
    from google.cloud import speech_v1 as speech
except Exception:  # pragma: no cover - optional dependency until SmartVoice is enabled
    speech = None  # type: ignore[assignment]
    ClientOptions = None  # type: ignore[assignment]
    AnonymousCredentials = None  # type: ignore[assignment]


@dataclass(frozen=True)
class SmartVoiceStreamingConfig:
    language_code: str = "vi-VN"
    sample_rate_hz: int = 16000
    model: str = ""
    interim_results: bool = True
    enable_word_time_offsets: bool = True


@dataclass(frozen=True)
class SmartVoiceResult:
    text: str
    is_final: bool
    confidence: float
    time_start: Optional[float]
    time_end: Optional[float]
    lang: str
    speaker: str = "SPEAKER_01"


def is_smartvoice_configured() -> bool:
    if not settings.smartvoice_grpc_endpoint:
        return False
    if settings.smartvoice_access_token:
        return True
    if settings.smartvoice_auth_url and settings.smartvoice_token_id and settings.smartvoice_token_key:
        return True
    return False


def _duration_to_seconds(duration: Any) -> float:
    seconds = float(getattr(duration, "seconds", 0) or 0.0)
    nanos = float(getattr(duration, "nanos", 0) or 0.0)
    return seconds + (nanos / 1_000_000_000.0)


def _extract_token(resp_json: Any) -> Optional[str]:
    if not isinstance(resp_json, dict):
        return None
    for key in ("access_token", "token"):
        if isinstance(resp_json.get(key), str) and resp_json.get(key):
            return resp_json[key]
    data = resp_json.get("data")
    if isinstance(data, dict):
        for key in ("access_token", "token"):
            if isinstance(data.get(key), str) and data.get(key):
                return data[key]
    return None


async def _get_access_token() -> str:
    if settings.smartvoice_access_token:
        return settings.smartvoice_access_token

    if settings.smartvoice_auth_url and settings.smartvoice_token_id and settings.smartvoice_token_key:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                settings.smartvoice_auth_url,
                json={
                    "token_id": settings.smartvoice_token_id,
                    "token_key": settings.smartvoice_token_key,
                },
            )
            resp.raise_for_status()
            token = _extract_token(resp.json())
            if token:
                return token
        raise RuntimeError("SmartVoice auth response missing access_token")

    raise RuntimeError(
        "SmartVoice credentials not configured. Set SMARTVOICE_ACCESS_TOKEN, or SMARTVOICE_AUTH_URL + "
        "SMARTVOICE_TOKEN_ID/SMARTVOICE_TOKEN_KEY."
    )


async def stream_recognize(
    audio_queue: "asyncio.Queue[Optional[bytes]]",
    config: SmartVoiceStreamingConfig,
) -> AsyncIterator[SmartVoiceResult]:
    """
    Stream PCM audio to SmartVoice (gRPC) and yield partial/final transcript results.

    Notes:
    - This implementation is intentionally minimal and expects SmartVoice to be compatible with
      Google Speech-to-Text `StreamingRecognize` proto. Configure endpoint/auth via env.
    """
    if speech is None:
        raise RuntimeError("google-cloud-speech is not installed (add it to backend/requirements.txt)")
    if not settings.smartvoice_grpc_endpoint:
        raise RuntimeError("SMARTVOICE_GRPC_ENDPOINT is not set")

    token = await _get_access_token()

    client = speech.SpeechAsyncClient(
        credentials=AnonymousCredentials(),  # type: ignore[misc]
        client_options=ClientOptions(api_endpoint=settings.smartvoice_grpc_endpoint),  # type: ignore[misc]
    )

    recognition_config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=config.sample_rate_hz,
        language_code=config.language_code,
        model=config.model or settings.smartvoice_model or "fast_streaming",
        enable_word_time_offsets=config.enable_word_time_offsets,
    )
    streaming_config = speech.StreamingRecognitionConfig(
        config=recognition_config,
        interim_results=config.interim_results,
    )

    async def request_gen():
        yield speech.StreamingRecognizeRequest(streaming_config=streaming_config)
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                break
            yield speech.StreamingRecognizeRequest(audio_content=chunk)

    metadata = [("authorization", f"Bearer {token}")]
    responses = client.streaming_recognize(requests=request_gen(), metadata=metadata)

    async for resp in responses:
        for result in getattr(resp, "results", []) or []:
            alternatives = getattr(result, "alternatives", None) or []
            if not alternatives:
                continue
            alt = alternatives[0]
            text = (getattr(alt, "transcript", "") or "").strip()
            if not text:
                continue
            confidence = float(getattr(alt, "confidence", 0.0) or 0.0)

            time_start = None
            time_end = None
            words = getattr(alt, "words", None) or []
            if words:
                try:
                    time_start = _duration_to_seconds(words[0].start_time)
                    time_end = _duration_to_seconds(words[-1].end_time)
                except Exception:
                    time_start = None
                    time_end = None

            lang = (config.language_code.split("-")[0] if config.language_code else "vi").lower()
            yield SmartVoiceResult(
                text=text,
                is_final=bool(getattr(result, "is_final", False)),
                confidence=confidence if confidence else 1.0,
                time_start=time_start,
                time_end=time_end,
                lang=lang,
            )
