from pydantic import BaseModel


class MeetingBase(BaseModel):
    title: str
    phase: str = 'pre'
    scheduled_at: str | None = None


class MeetingCreate(MeetingBase):
    pass


class Meeting(MeetingBase):
    id: str

    class Config:
        orm_mode = True