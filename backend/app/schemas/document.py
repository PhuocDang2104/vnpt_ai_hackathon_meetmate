from pydantic import BaseModel


class DocumentBase(BaseModel):
    name: str | None = None
    source_url: str | None = None
    meeting_id: str | None = None


class Document(DocumentBase):
    id: str

    class Config:
        orm_mode = True