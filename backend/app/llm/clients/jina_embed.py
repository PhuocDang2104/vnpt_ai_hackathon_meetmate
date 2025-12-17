"""
Jina Inference API client for embeddings.

Env required:
- JINA_API_KEY
Optional:
- JINA_EMBED_MODEL (default: jina-embeddings-v3)
- JINA_EMBED_TASK (default: text-matching)
- JINA_EMBED_DIMENSIONS (optional int, e.g., 1024 or 512)
"""
import os
import requests
from typing import List

JINA_API_KEY = os.getenv("JINA_API_KEY", "")
JINA_EMBED_MODEL = os.getenv("JINA_EMBED_MODEL", "jina-embeddings-v3")
JINA_EMBED_TASK = os.getenv("JINA_EMBED_TASK", "text-matching")
JINA_EMBED_DIM = os.getenv("JINA_EMBED_DIMENSIONS")  # set to "512" or "1024" if needed
JINA_URL = "https://api.jina.ai/v1/embeddings"


def is_jina_available() -> bool:
    return bool(JINA_API_KEY)


def embed_texts(texts: List[str]) -> List[List[float]]:
    if not JINA_API_KEY:
        raise RuntimeError("JINA_API_KEY is not set")
    if not texts:
        return []
    payload = {
        "model": JINA_EMBED_MODEL,
        "task": JINA_EMBED_TASK,
        "input": texts,
    }
    if JINA_EMBED_DIM:
        try:
            payload["dimensions"] = int(JINA_EMBED_DIM)
        except ValueError:
            pass
    # ensure encoding format float for pgvector
    payload["encoding_format"] = "float"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}",
    }
    resp = requests.post(JINA_URL, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return [item["embedding"] for item in data.get("data", [])]
