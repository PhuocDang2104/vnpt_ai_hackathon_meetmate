"""
Meeting Minutes API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.schemas.minutes import (
    MeetingMinutesCreate, MeetingMinutesUpdate,
    MeetingMinutesResponse, MeetingMinutesList,
    DistributionLogList,
    GenerateMinutesRequest, DistributeMinutesRequest
)
from app.services import minutes_service, participant_service

router = APIRouter()


@router.get('/{meeting_id}', response_model=MeetingMinutesList)
def list_minutes(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """List all minutes versions for a meeting"""
    return minutes_service.list_minutes(db, meeting_id)


@router.get('/{meeting_id}/latest', response_model=dict)
def get_latest_minutes(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """Get the latest minutes for a meeting"""
    minutes = minutes_service.get_latest_minutes(db, meeting_id)
    if not minutes:
        return {'meeting_id': meeting_id, 'minutes': None, 'message': 'No minutes available'}
    return minutes.model_dump()


@router.post('/', response_model=MeetingMinutesResponse)
def create_minutes(
    data: MeetingMinutesCreate,
    db: Session = Depends(get_db)
):
    """Create new meeting minutes"""
    return minutes_service.create_minutes(db, data)


@router.put('/{minutes_id}', response_model=MeetingMinutesResponse)
def update_minutes(
    minutes_id: str,
    data: MeetingMinutesUpdate,
    edited_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update meeting minutes"""
    minutes = minutes_service.update_minutes(db, minutes_id, data, edited_by)
    if not minutes:
        raise HTTPException(status_code=404, detail="Minutes not found")
    return minutes


@router.post('/{minutes_id}/approve', response_model=MeetingMinutesResponse)
def approve_minutes(
    minutes_id: str,
    approved_by: str,
    db: Session = Depends(get_db)
):
    """Approve meeting minutes"""
    minutes = minutes_service.approve_minutes(db, minutes_id, approved_by)
    if not minutes:
        raise HTTPException(status_code=404, detail="Minutes not found")
    return minutes


# ============================================
# AI-Powered Generation
# ============================================

@router.post('/generate', response_model=MeetingMinutesResponse)
async def generate_minutes(
    request: GenerateMinutesRequest,
    db: Session = Depends(get_db)
):
    """Generate meeting minutes using AI"""
    try:
        minutes = await minutes_service.generate_minutes_with_ai(db, request)
        return minutes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate minutes: {str(e)}")


# ============================================
# Distribution
# ============================================

@router.get('/{meeting_id}/distribution', response_model=DistributionLogList)
def list_distribution_logs(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """List distribution logs for a meeting"""
    return minutes_service.list_distribution_logs(db, meeting_id)


@router.post('/distribute')
async def distribute_minutes(
    request: DistributeMinutesRequest,
    db: Session = Depends(get_db)
):
    """Distribute meeting minutes to participants"""
    from app.schemas.minutes import DistributionLogCreate
    
    # Get participants if no specific recipients
    recipients = request.recipients
    if not recipients:
        participants = participant_service.list_participants(db, request.meeting_id)
        recipients = [p.user_id for p in participants.participants]
    
    results = []
    for channel in request.channels:
        for user_id in recipients:
            # In production, this would send actual emails/Teams messages
            # For demo, we just log the distribution
            log = minutes_service.create_distribution_log(db, DistributionLogCreate(
                minutes_id=request.minutes_id,
                meeting_id=request.meeting_id,
                user_id=user_id,
                channel=channel,
                status='sent'
            ))
            results.append(log.model_dump())
    
    return {
        'status': 'success',
        'distributed_to': len(recipients),
        'channels': request.channels,
        'logs': results
    }

