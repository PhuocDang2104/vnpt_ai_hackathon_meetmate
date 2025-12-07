from typing import Any, Dict, Tuple


INTENT_LABELS = [
    "NO_INTENT",
    "ASK_AI",
    "ACTION_COMMAND",
    "SCHEDULE_COMMAND",
    "DECISION_STATEMENT",
    "RISK_STATEMENT",
]


def predict_intent(text: str, lang: str | None = "vi") -> Tuple[str, Dict[str, Any]]:
    """Stub for VNPT SmartBot intent API.
    Returns (label, slots) where label is one of INTENT_LABELS."""
    lower = (text or "").lower()
    if "?" in lower or "ai" in lower:
        return "ASK_AI", {"question": text}
    if any(k in lower for k in ["giao", "assign", "task"]):
        return "ACTION_COMMAND", {"task": text}
    if any(k in lower for k in ["lịch", "schedule", "meeting"]):
        return "SCHEDULE_COMMAND", {"title": text}
    if any(k in lower for k in ["quyết định", "decide", "chốt"]):
        return "DECISION_STATEMENT", {"title": text}
    if any(k in lower for k in ["rủi ro", "risk", "lo ngại"]):
        return "RISK_STATEMENT", {"risk": text}
    return "NO_INTENT", {}
