"""
Document Service - Mock implementation for document management
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
import logging
import os
from fastapi import UploadFile

from sqlalchemy.orm import Session

from app.schemas.document import (
    Document,
    DocumentCreate,
    DocumentUpdate,
    DocumentList,
    DocumentUploadResponse,
)

logger = logging.getLogger(__name__)

# In-memory storage for mock documents (simulating database)
_mock_documents: dict[str, Document] = {}


def _init_mock_documents():
    """Initialize with some mock documents"""
    mock_data = [
        {
            "id": UUID("e0000001-0000-0000-0000-000000000001"),
            "meeting_id": UUID("c0000001-0000-0000-0000-000000000001"),
            "title": "Core Banking Q4 2024 - Project Status Report.pdf",
            "file_type": "pdf",
            "file_size": 2048000,
            "description": "Báo cáo tiến độ dự án Core Banking Q4 2024",
            "file_url": "/mock/docs/project-status-q4.pdf",
            "uploaded_by": UUID("b0000001-0000-0000-0000-000000000001"),
            "uploaded_at": datetime.now(),
        },
        {
            "id": UUID("e0000002-0000-0000-0000-000000000002"),
            "meeting_id": UUID("c0000001-0000-0000-0000-000000000001"),
            "title": "Budget Review - Core Banking.xlsx",
            "file_type": "xlsx",
            "file_size": 512000,
            "description": "Bảng theo dõi ngân sách dự án",
            "file_url": "/mock/docs/budget-review.xlsx",
            "uploaded_by": UUID("b0000001-0000-0000-0000-000000000001"),
            "uploaded_at": datetime.now(),
        },
        {
            "id": UUID("e0000003-0000-0000-0000-000000000003"),
            "meeting_id": UUID("c0000001-0000-0000-0000-000000000001"),
            "title": "Risk Assessment Matrix.pptx",
            "file_type": "pptx",
            "file_size": 1024000,
            "description": "Ma trận đánh giá rủi ro dự án",
            "file_url": "/mock/docs/risk-matrix.pptx",
            "uploaded_by": UUID("b0000009-0000-0000-0000-000000000009"),
            "uploaded_at": datetime.now(),
        },
        {
            "id": UUID("e0000004-0000-0000-0000-000000000004"),
            "meeting_id": UUID("c0000002-0000-0000-0000-000000000002"),
            "title": "Sprint 23 - User Stories.pdf",
            "file_type": "pdf",
            "file_size": 768000,
            "description": "Danh sách User Stories cho Sprint 23",
            "file_url": "/mock/docs/sprint23-stories.pdf",
            "uploaded_by": UUID("b0000002-0000-0000-0000-000000000002"),
            "uploaded_at": datetime.now(),
        },
        {
            "id": UUID("e0000005-0000-0000-0000-000000000005"),
            "meeting_id": UUID("c0000002-0000-0000-0000-000000000002"),
            "title": "Mobile App Wireframes v2.3.pdf",
            "file_type": "pdf",
            "file_size": 3072000,
            "description": "Wireframes cho Mobile Banking App phiên bản mới",
            "file_url": "/mock/docs/wireframes-v2.3.pdf",
            "uploaded_by": UUID("b0000006-0000-0000-0000-000000000006"),
            "uploaded_at": datetime.now(),
        },
    ]
    
    for doc_data in mock_data:
        doc = Document(**doc_data)
        _mock_documents[str(doc.id)] = doc


# Initialize mock data
_init_mock_documents()


async def list_documents(
    db: Session,
    meeting_id: UUID,
    skip: int = 0,
    limit: int = 50,
) -> DocumentList:
    """List all documents for a meeting"""
    docs = [
        doc for doc in _mock_documents.values()
        if doc.meeting_id == meeting_id
    ]
    docs.sort(key=lambda x: x.uploaded_at, reverse=True)
    
    return DocumentList(
        documents=docs[skip:skip + limit],
        total=len(docs),
    )


async def list_all_documents(
    db: Session,
    meeting_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
) -> DocumentList:
    """List all documents (mock) with optional meeting filter"""
    docs = list(_mock_documents.values())
    if meeting_id:
        docs = [d for d in docs if d.meeting_id == meeting_id]
    docs.sort(key=lambda x: x.uploaded_at, reverse=True)
    return DocumentList(documents=docs[skip:skip + limit], total=len(docs))


async def get_document(db: Session, document_id: UUID) -> Optional[Document]:
    """Get a single document by ID"""
    return _mock_documents.get(str(document_id))


async def upload_document(
    db: Session,
    data: DocumentCreate,
) -> DocumentUploadResponse:
    """Upload a new document (mock - just stores metadata)"""
    doc_id = uuid4()
    
    # Generate mock file URL
    file_ext = data.file_type.lower()
    file_url = data.file_url or f"/mock/docs/{doc_id}.{file_ext}"
    
    doc = Document(
        id=doc_id,
        meeting_id=data.meeting_id,
        title=data.title,
        file_type=data.file_type,
        file_size=data.file_size or 1024000,  # Default 1MB
        description=data.description,
        file_url=file_url,
        uploaded_by=data.uploaded_by,
        uploaded_at=datetime.now(),
    )
    
    _mock_documents[str(doc_id)] = doc
    logger.info(f"[Mock] Uploaded document: {doc.title}")
    
    return DocumentUploadResponse(
        id=doc_id,
        title=doc.title,
        file_url=file_url,
        message="Tài liệu đã được tải lên thành công (mock)",
    )


async def upload_document_file(
    db: Session,
    file: UploadFile,
    meeting_id: Optional[UUID] = None,
    uploaded_by: Optional[UUID] = None,
    description: Optional[str] = None,
) -> DocumentUploadResponse:
    """Upload a real file to local storage and register metadata (still using in-memory registry)."""
    storage_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploaded_files")
    os.makedirs(storage_dir, exist_ok=True)

    doc_id = uuid4()
    filename = file.filename or f"{doc_id}"
    file_ext = filename.split(".")[-1] if "." in filename else "bin"
    stored_name = f"{doc_id}.{file_ext}"
    stored_path = os.path.join(storage_dir, stored_name)

    # Stream to disk
    with open(stored_path, "wb") as out:
        content = await file.read()
        out.write(content)

    file_size = len(content)
    file_url = f"/files/{stored_name}"

    doc = Document(
        id=doc_id,
        meeting_id=meeting_id or UUID("00000000-0000-0000-0000-000000000000"),
        title=filename,
        file_type=file_ext,
        file_size=file_size,
        description=description,
        file_url=file_url,
        uploaded_by=uploaded_by,
        uploaded_at=datetime.now(),
    )
    _mock_documents[str(doc_id)] = doc

    logger.info(f"[Upload] Stored file {filename} as {stored_name}, size={file_size} bytes")

    return DocumentUploadResponse(
        id=doc_id,
        title=filename,
        file_url=file_url,
        message="Tải lên thành công",
    )


async def update_document(
    db: Session,
    document_id: UUID,
    data: DocumentUpdate,
) -> Optional[Document]:
    """Update a document"""
    doc = _mock_documents.get(str(document_id))
    if not doc:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)
    
    _mock_documents[str(document_id)] = doc
    return doc


async def delete_document(db: Session, document_id: UUID) -> bool:
    """Delete a document"""
    if str(document_id) in _mock_documents:
        del _mock_documents[str(document_id)]
        return True
    return False
