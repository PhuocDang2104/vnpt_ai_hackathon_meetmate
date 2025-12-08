from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models import (
    TranscriptChunk,
    TopicSegment,
    ActionItem,
    DecisionItem,
    RiskItem,
    AdrHistory,
    ToolSuggestion,
    Meeting,
)


def persist_transcript(db: Session, meeting_id: str, seg: Dict[str, Any]) -> Optional[TranscriptChunk]:
    try:
        chunk = TranscriptChunk(
            meeting_id=meeting_id,
            speaker=seg.get("speaker"),
            text=seg.get("text", ""),
            time_start=seg.get("time_start", 0.0),
            time_end=seg.get("time_end", 0.0),
            is_final=seg.get("is_final", True),
            lang=seg.get("lang", "vi"),
            confidence=seg.get("confidence", 1.0),
        )
        db.add(chunk)
        db.commit()
        db.refresh(chunk)
        return chunk
    except Exception as e:
        db.rollback()
        print(f"[persist_transcript] error: {e}")
        return None


def persist_topic_segment(db: Session, meeting_id: str, segment: Dict[str, Any]) -> Optional[TopicSegment]:
    try:
        row = TopicSegment(
            meeting_id=meeting_id,
            topic_id=segment.get("topic_id"),
            title=segment.get("title"),
            start_t=segment.get("start_t", 0.0),
            end_t=segment.get("end_t", 0.0),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except Exception as e:
        db.rollback()
        print(f"[persist_topic_segment] error: {e}")
        return None


def persist_adr(db: Session, meeting_id: str, actions: List[Dict[str, Any]], decisions: List[Dict[str, Any]], risks: List[Dict[str, Any]]) -> None:
    try:
        for a in actions or []:
            db_item = ActionItem(
                meeting_id=meeting_id,
                description=a.get("task"),
                owner=a.get("owner"),
                due_date=a.get("due_date"),
                priority=a.get("priority"),
                topic_id=a.get("topic_id"),
                source_timecode=a.get("source_timecode"),
                source_text=a.get("source_text"),
                external_id=a.get("external_id"),
            )
            db.add(db_item)
            db.add(AdrHistory(meeting_id=meeting_id, item_type="action", payload=a, operation="add"))

        for d in decisions or []:
            db_item = DecisionItem(
                meeting_id=meeting_id,
                title=d.get("title"),
                rationale=d.get("rationale"),
                impact=d.get("impact"),
                topic_id=d.get("topic_id"),
                source_timecode=d.get("source_timecode"),
                source_text=d.get("source_text"),
            )
            db.add(db_item)
            db.add(AdrHistory(meeting_id=meeting_id, item_type="decision", payload=d, operation="add"))

        for r in risks or []:
            db_item = RiskItem(
                meeting_id=meeting_id,
                description=r.get("desc"),
                severity=r.get("severity"),
                mitigation=r.get("mitigation"),
                owner=r.get("owner"),
                topic_id=r.get("topic_id"),
                source_timecode=r.get("source_timecode"),
                source_text=r.get("source_text"),
            )
            db.add(db_item)
            db.add(AdrHistory(meeting_id=meeting_id, item_type="risk", payload=r, operation="add"))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[persist_adr] error: {e}")


def persist_tool_suggestions(db: Session, meeting_id: str, suggestions: List[Dict[str, Any]]) -> None:
    try:
        for s in suggestions or []:
            row = ToolSuggestion(
                meeting_id=meeting_id,
                suggestion_id=s.get("suggestion_id"),
                type=s.get("type"),
                action_hash=s.get("action_hash"),
                payload=s.get("payload"),
            )
            db.add(row)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[persist_tool_suggestions] error: {e}")
