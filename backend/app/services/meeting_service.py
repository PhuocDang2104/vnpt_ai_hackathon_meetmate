from datetime import datetime
from app.schemas.meeting import Meeting, MeetingCreate


MOCK_MEETINGS = [
    Meeting(id='core-banking', title='Steering Committee - Core Banking', phase='pre', scheduled_at=datetime.utcnow().isoformat()),
    Meeting(id='mobile-app', title='Weekly Project Status - Mobile', phase='in', scheduled_at=datetime.utcnow().isoformat()),
]


def list_meetings() -> list[Meeting]:
    return MOCK_MEETINGS


def create_meeting(payload: MeetingCreate) -> Meeting:
    meeting = Meeting(id=f"meeting-{len(MOCK_MEETINGS)+1}", **payload.dict())
    MOCK_MEETINGS.append(meeting)
    return meeting