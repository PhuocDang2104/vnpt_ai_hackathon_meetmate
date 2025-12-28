from pydantic import BaseModel, EmailStr
from datetime import datetime

class MarketingLeadBase(BaseModel):
    email: EmailStr

class MarketingLeadCreate(MarketingLeadBase):
    pass

class MarketingLead(MarketingLeadBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
