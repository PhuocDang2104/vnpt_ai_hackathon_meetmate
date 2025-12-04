import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class Meeting(Base):
    __tablename__ = 'meetings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    phase = Column(String, default='pre')
    scheduled_at = Column(DateTime(timezone=True), nullable=True)