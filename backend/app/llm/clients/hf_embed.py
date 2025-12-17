"""
Hugging Face Inference API client for embeddings.

Uses HF_TOKEN and HF_EMBED_MODEL (default all-MiniLM-L6-v2) to call the
hosted inference endpoint and return embedding vectors.
"""
import os
import requests
from typing import List
from app.core.config import get_settings

settings = get_settings()

HF_TOKEN = os.getenv("HF_TOKEN")
HF_EMBED_MODEL = os.getenv("HF_EMBED_MODEL", "nomic-ai/nomic-embed-text-v1.5")
# Use router.huggingface.co per latest requirement (api-inference.huggingface.co returns 410)
HF_API_BASE = os.getenv("HF_API_BASE", "https://router.huggingface.co/hf-inference")
HF_PIPELINE = os.getenv("HF_PIPELINE")  # ví dụ: sentence-similarity
if HF_PIPELINE:
    HF_URL = f"{HF_API_BASE}/models/{HF_EMBED_MODEL}/pipeline/{HF_PIPELINE}"
else:
    HF_URL = f"{HF_API_BASE}/models/{HF_EMBED_MODEL}"


def is_hf_available() -> bool:
    return bool(HF_TOKEN)


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Call HF Inference API to get embeddings for a list of texts.
    Returns list of vectors.
    """
    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN is not set")
    if not texts:
        return []
    resp = requests.post(
        HF_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json={"inputs": texts},
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    # HF returns list[list[float]] for sentence-transformers
    return data
