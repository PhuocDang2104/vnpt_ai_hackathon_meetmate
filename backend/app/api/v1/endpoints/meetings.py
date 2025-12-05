from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.schemas.meeting import (
    Meeting, 
    MeetingCreate, 
    MeetingUpdate, 
    MeetingWithParticipants,
    MeetingList
)
from app.db.session import get_db
from app.services import meeting_service

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
