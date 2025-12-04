from fastapi import APIRouter
from app.schemas.document import Document, DocumentBase
from app.services import document_service

router = APIRouter()


@router.get('/', response_model=list[Document])
def list_documents():
    return document_service.list_documents()


@router.post('/', response_model=Document)
def create_document(payload: DocumentBase):
    return document_service.create_document(payload)