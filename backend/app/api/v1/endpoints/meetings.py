from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.schemas.meeting import (
    Meeting, 
    MeetingCreate, 
    MeetingUpdate, 
    MeetingWithParticipants,
    MeetingList,
    MeetingNotifyRequest,
)
from app.db.session import get_db
from app.services import meeting_service
from app.services import participant_service, agenda_service
from app.services import email_service, knowledge_service
from app.services.storage_client import generate_presigned_get_url
from app.schemas.knowledge import KnowledgeDocument
from datetime import datetime

router = APIRouter()


@router.get('/', response_model=MeetingList)
def list_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    phase: Optional[str] = None,
    meeting_type: Optional[str] = None,
    project_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all meetings with optional filters"""
    meetings, total = meeting_service.list_meetings(
        db=db,
        skip=skip,
        limit=limit,
        phase=phase,
        meeting_type=meeting_type,
        project_id=project_id
    )
    return MeetingList(meetings=meetings, total=total)


@router.post('/', response_model=Meeting, status_code=201)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db)
):
    """Create a new meeting"""
    return meeting_service.create_meeting(db=db, payload=payload)


@router.get('/{meeting_id}', response_model=MeetingWithParticipants)
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Get a single meeting by ID with participants"""
    meeting = meeting_service.get_meeting(db=db, meeting_id=meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.put('/{meeting_id}', response_model=Meeting)
def update_meeting(
    meeting_id: str,
    payload: MeetingUpdate,
    db: Session = Depends(get_db)
):
    """Update a meeting"""
    meeting = meeting_service.update_meeting(db=db, meeting_id=meeting_id, payload=payload)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.delete('/{meeting_id}', status_code=204)
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Delete a meeting"""
    success = meeting_service.delete_meeting(db=db, meeting_id=meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return None


@router.post('/{meeting_id}/notify')
async def notify_meeting(
    meeting_id: str,
    payload: MeetingNotifyRequest,
    db: Session = Depends(get_db)
):
    """Send meeting notification email to selected recipients."""
    meeting = meeting_service.get_meeting(db=db, meeting_id=meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Build sections
    agenda_items = []
    if payload.include_agenda:
        try:
            agenda_items = agenda_service.list_items(db, meeting_id)
        except Exception:
            agenda_items = []

    documents: List[KnowledgeDocument] = []
    if payload.include_documents:
        try:
            doc_list = await knowledge_service.list_documents(db, meeting_id=meeting_id, limit=50, skip=0, document_type=None, source=None, category=None, project_id=None)
            documents = doc_list.documents if hasattr(doc_list, "documents") else []
        except Exception:
            documents = []

    # Build HTML body (simple template)
    def fmt_datetime(dt):
        if not dt:
            return ""
        dt_obj = datetime.fromisoformat(str(dt).replace('Z', '+00:00'))
        return dt_obj.strftime("%H:%M %d/%m/%Y")

    agenda_html = ""
    if agenda_items:
        agenda_html = "<ul>" + "".join([f"<li>{i.order or idx+1}. {i.title or ''} ({i.duration_minutes or 0} phút) - {i.presenter or ''}</li>" for idx, i in enumerate(agenda_items)]) + "</ul>"
    docs_html = ""
    if documents:
        docs_html = "<ul>" + "".join([f"<li>{d.title} ({d.file_type})</li>" for d in documents]) + "</ul>"

    body_html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h3>Thông báo cuộc họp: {meeting.title}</h3>
      <p><b>Thời gian:</b> {fmt_datetime(meeting.start_time)} - {fmt_datetime(meeting.end_time)}</p>
      <p><b>Hình thức:</b> {meeting.location or 'Online'} {(' - ' + meeting.teams_link) if meeting.teams_link else ''}</p>
      {"<h4>Chương trình họp</h4>" + agenda_html if agenda_html else ""}
      {"<h4>Tài liệu</h4>" + docs_html if docs_html else ""}
      {"<h4>Ghi chú</h4><p>" + (payload.custom_message or '') + "</p>" if payload.custom_message else ""}
      <p style="color:#666;">Được gửi từ MeetMate.</p>
    </div>
    """
    body_text = f"Thông báo cuộc họp: {meeting.title}\nThời gian: {fmt_datetime(meeting.start_time)} - {fmt_datetime(meeting.end_time)}\nĐịa điểm: {meeting.location or 'Online'}\n"
    if payload.custom_message:
        body_text += f"\nGhi chú: {payload.custom_message}\n"

    to_emails = [r.email for r in payload.recipients if r.email]
    if not to_emails:
        raise HTTPException(status_code=400, detail="No recipients provided")

    if not email_service.is_email_enabled():
        return {"success": False, "error": "Email not configured", "sent_to": [], "failed": to_emails}

    result = email_service.send_email(
        to_emails=to_emails,
        subject=f"[MeetMate] Thông báo cuộc họp: {meeting.title}",
        body_text=body_text,
        body_html=body_html,
    )
    return result


@router.post('/{meeting_id}/participants', response_model=Meeting)
def add_participant(
    meeting_id: str,
    user_id: str,
    role: str = 'attendee',
    db: Session = Depends(get_db)
):
    """Add a participant to a meeting"""
    meeting = meeting_service.add_participant(
        db=db, 
        meeting_id=meeting_id, 
        user_id=user_id, 
        role=role
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.patch('/{meeting_id}/phase', response_model=Meeting)
def update_meeting_phase(
    meeting_id: str,
    phase: str,
    db: Session = Depends(get_db)
):
    """Update meeting phase (pre -> in -> post)"""
    if phase not in ['pre', 'in', 'post']:
        raise HTTPException(status_code=400, detail="Invalid phase. Must be: pre, in, post")
    
    meeting = meeting_service.update_phase(db=db, meeting_id=meeting_id, phase=phase)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting
