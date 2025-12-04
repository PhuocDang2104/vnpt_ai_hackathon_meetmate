from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: str | None = 'pmo'


class User(UserBase):
    id: str

    class Config:
        orm_mode = True