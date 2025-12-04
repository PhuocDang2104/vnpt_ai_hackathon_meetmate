from app.schemas.document import Document, DocumentBase


def list_documents() -> list[Document]:
    return [Document(id='doc-1', name='BRD', source_url='sharepoint://brd', meeting_id=None)]


def create_document(payload: DocumentBase) -> Document:
    return Document(id='doc-created', **payload.dict())