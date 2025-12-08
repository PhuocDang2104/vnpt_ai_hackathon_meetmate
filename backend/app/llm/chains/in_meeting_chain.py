from typing import Any, Dict, List
from app.llm.prompts.in_meeting_prompts import (
    RECW_PROMPT,
    ADR_PROMPT,
    QA_PROMPT,
    TOPIC_SEGMENT_PROMPT,
)
from app.llm.gemini_client import GeminiChat, get_gemini_client


def _call_gemini(prompt: str) -> str:
    client = get_gemini_client()
    if not client:
        return ""
    try:
        resp = client.generate_content(prompt)
        return getattr(resp, "text", None) or ""
    except Exception as e:
        print(f"[Gemini] error: {e}")
        return ""


def summarize_transcript(transcript_window: str, topic: str | None, intent: str | None) -> str:
    """Use Gemini if available; fallback to stub."""
    body = (transcript_window or "").strip()
    prompt = RECW_PROMPT + f"\n\nTranscript window:\n{body}\n\nTopic: {topic or 'N/A'}\nIntent: {intent or 'N/A'}"
    summary = _call_gemini(prompt)
    if summary:
        return summary.strip()
    # Fallback stub
    parts = []
    if topic:
        parts.append(f"[Topic {topic}]")
    if intent:
        parts.append(f"[Intent {intent}]")
    if len(body) > 200:
        body = body[:200] + "..."
    parts.append(body or "No transcript in window")
    return " ".join(parts)


def extract_adr(transcript_window: str, topic_id: str | None) -> Dict[str, List[Dict[str, Any]]]:
    """ADR extraction via Gemini if available, else stub JSON."""
    window = (transcript_window or "").strip()
    base: Dict[str, List[Dict[str, Any]]] = {
        "actions": [],
        "decisions": [],
        "risks": [],
    }
    if not window:
        return base

    prompt = ADR_PROMPT + f"\n\nTranscript window:\n{window}\n\nTopic: {topic_id or 'N/A'}"
    text = _call_gemini(prompt)
    if text:
        # Cheap parse attempt for demo; production should parse JSON strictly.
        # Assume model returns JSON block.
        try:
            import json
            parsed = json.loads(text)
            for k in base:
                if k in parsed and isinstance(parsed[k], list):
                    base[k] = parsed[k]
            return base
        except Exception:
            pass

    # Stub fallback
    base["actions"] = [{
        "task": "Follow up on discussed item",
        "owner": None,
        "due_date": None,
        "priority": "medium",
        "topic_id": topic_id,
    }]
    base["decisions"] = [{
        "title": "Decision noted from transcript window",
        "rationale": None,
        "impact": None,
    }]
    base["risks"] = [{
        "desc": "Potential risk identified in conversation",
        "severity": "medium",
        "mitigation": None,
        "owner": None,
    }]
    return base


def answer_question(question: str, rag_docs: list, transcript_window: str) -> Dict[str, Any]:
    """Q&A combining transcript + RAG snippets."""
    snippet = (transcript_window or "").strip()
    if len(snippet) > 160:
        snippet = snippet[:160] + "..."
    prompt = QA_PROMPT + f"\n\nQuestion: {question}\n\nTranscript window:\n{snippet}\n\nRAG snippets:\n{rag_docs}"
    content = _call_gemini(prompt)
    if not content:
        content = f"[Stub] {question} — Context: {snippet or 'no transcript'}"
    return {"answer": content, "citations": rag_docs or []}


def segment_topic(transcript_window: str, current_topic_id: str | None) -> Dict[str, Any]:
    payload = {
        "new_topic": False,
        "topic_id": current_topic_id or "T0",
        "title": "General",
        "start_t": 0.0,
        "end_t": 0.0,
    }
    body = (transcript_window or "").strip()
    if not body:
        return payload

    prompt = TOPIC_SEGMENT_PROMPT + f"\n\nTranscript window:\n{body}\n\nCurrent topic: {current_topic_id or 'T0'}"
    text = _call_gemini(prompt)
    if text:
        try:
            import json

            parsed = json.loads(text)
            payload.update(parsed)
            return payload
        except Exception:
            pass

    # Heuristic fallback: if window is long, propose a new topic with first 6 words.
    if len(body) > 400:
        tokens = body.split()
        title = " ".join(tokens[:6]) if tokens else "New topic"
        payload.update({"new_topic": True, "topic_id": f"T{abs(hash(title)) % 100}", "title": title})
    return payload
