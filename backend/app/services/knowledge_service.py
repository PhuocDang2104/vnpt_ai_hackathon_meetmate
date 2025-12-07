"""
Knowledge Service - Document management and search for Knowledge Hub
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
import logging
import re

from sqlalchemy.orm import Session

from app.schemas.knowledge import (
    KnowledgeDocument,
    KnowledgeDocumentCreate,
    KnowledgeDocumentUpdate,
    KnowledgeDocumentList,
    KnowledgeDocumentUploadResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeQueryRequest,
    KnowledgeQueryResponse,
)
from app.llm.gemini_client import GeminiChat, is_gemini_available

logger = logging.getLogger(__name__)

# In-memory storage for mock knowledge documents
_mock_knowledge_docs: dict[str, KnowledgeDocument] = {}


def _init_mock_knowledge_docs():
    """Initialize with mock knowledge documents"""
    mock_data = [
        {
            "id": UUID("k0000001-0000-0000-0000-000000000001"),
            "title": "Thông tư 09/2020/TT-NHNN - Quản lý rủi ro CNTT",
            "description": "Quy định về quản lý rủi ro công nghệ thông tin trong hoạt động ngân hàng",
            "document_type": "regulation",
            "source": "NHNN",
            "file_type": "pdf",
            "file_size": 2048000,
            "file_url": "/mock/knowledge/nhnn-09-2020.pdf",
            "tags": ["NHNN", "Compliance", "Risk Management", "IT"],
            "category": "Compliance",
            "uploaded_by": UUID("b0000001-0000-0000-0000-000000000001"),
            "uploaded_by_name": "Nguyễn Văn A",
            "uploaded_at": datetime.now(),
            "view_count": 45,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000002-0000-0000-0000-000000000002"),
            "title": "LPBank Security Policy v3.0",
            "description": "Chính sách bảo mật thông tin của LPBank - Phiên bản 3.0",
            "document_type": "policy",
            "source": "SharePoint",
            "file_type": "pdf",
            "file_size": 1536000,
            "file_url": "/mock/knowledge/security-policy-v3.pdf",
            "tags": ["Security", "Policy", "Encryption", "MFA"],
            "category": "Security",
            "uploaded_by": UUID("b0000004-0000-0000-0000-000000000004"),
            "uploaded_by_name": "Phạm Văn D - CTO",
            "uploaded_at": datetime.now(),
            "view_count": 32,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000003-0000-0000-0000-000000000003"),
            "title": "Core Banking Integration Guide",
            "description": "Hướng dẫn tích hợp với hệ thống Core Banking mới",
            "document_type": "technical",
            "source": "SharePoint",
            "file_type": "docx",
            "file_size": 3072000,
            "file_url": "/mock/knowledge/core-banking-integration.docx",
            "tags": ["Core Banking", "Integration", "API", "Technical"],
            "category": "Technical",
            "uploaded_by": UUID("b0000005-0000-0000-0000-000000000005"),
            "uploaded_by_name": "Hoàng Thị E - Tech Lead",
            "uploaded_at": datetime.now(),
            "view_count": 28,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000004-0000-0000-0000-000000000004"),
            "title": "KYC Policy 2024",
            "description": "Chính sách Know Your Customer - Cập nhật 2024",
            "document_type": "policy",
            "source": "LOffice",
            "file_type": "pdf",
            "file_size": 1024000,
            "file_url": "/mock/knowledge/kyc-policy-2024.pdf",
            "tags": ["KYC", "Policy", "Compliance", "Customer"],
            "category": "Compliance",
            "uploaded_by": UUID("b0000001-0000-0000-0000-000000000001"),
            "uploaded_by_name": "Nguyễn Văn A",
            "uploaded_at": datetime.now(),
            "view_count": 19,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000005-0000-0000-0000-000000000005"),
            "title": "Risk Assessment Template",
            "description": "Template đánh giá rủi ro dự án",
            "document_type": "template",
            "source": "SharePoint",
            "file_type": "xlsx",
            "file_size": 512000,
            "file_url": "/mock/knowledge/risk-assessment-template.xlsx",
            "tags": ["Risk", "Template", "Assessment"],
            "category": "Project",
            "uploaded_by": UUID("b0000009-0000-0000-0000-000000000009"),
            "uploaded_by_name": "Bùi Văn I - CRO",
            "uploaded_at": datetime.now(),
            "view_count": 15,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000006-0000-0000-0000-000000000006"),
            "title": "Thông tư 35/2016/TT-NHNN - Chuyển mạch thanh toán",
            "description": "Quy định về chuyển mạch thanh toán điện tử",
            "document_type": "regulation",
            "source": "NHNN",
            "file_type": "pdf",
            "file_size": 1792000,
            "file_url": "/mock/knowledge/nhnn-35-2016.pdf",
            "tags": ["NHNN", "Payment", "Compliance"],
            "category": "Compliance",
            "uploaded_by": UUID("b0000001-0000-0000-0000-000000000001"),
            "uploaded_by_name": "Nguyễn Văn A",
            "uploaded_at": datetime.now(),
            "view_count": 12,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000007-0000-0000-0000-000000000007"),
            "title": "Mobile Banking API Documentation",
            "description": "Tài liệu API cho ứng dụng Mobile Banking",
            "document_type": "technical",
            "source": "Wiki",
            "file_type": "md",
            "file_size": 768000,
            "file_url": "/mock/knowledge/mobile-api-docs.md",
            "tags": ["Mobile Banking", "API", "Documentation"],
            "category": "Technical",
            "uploaded_by": UUID("b0000006-0000-0000-0000-000000000006"),
            "uploaded_by_name": "Ngô Thị F - Tech Lead Mobile",
            "uploaded_at": datetime.now(),
            "view_count": 24,
            "last_accessed_at": datetime.now(),
        },
        {
            "id": UUID("k0000008-0000-0000-0000-000000000008"),
            "title": "Change Request Process Guide",
            "description": "Hướng dẫn quy trình xử lý Change Request",
            "document_type": "policy",
            "source": "SharePoint",
            "file_type": "pdf",
            "file_size": 1280000,
            "file_url": "/mock/knowledge/cr-process-guide.pdf",
            "tags": ["Change Request", "Process", "PMO"],
            "category": "Project",
            "uploaded_by": UUID("b0000001-0000-0000-0000-000000000001"),
            "uploaded_by_name": "Nguyễn Văn A",
            "uploaded_at": datetime.now(),
            "view_count": 18,
            "last_accessed_at": datetime.now(),
        },
    ]
    
    for doc_data in mock_data:
        doc = KnowledgeDocument(**doc_data)
        _mock_knowledge_docs[str(doc.id)] = doc


# Initialize mock data
_init_mock_knowledge_docs()


async def list_documents(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    document_type: Optional[str] = None,
    source: Optional[str] = None,
    category: Optional[str] = None,
) -> KnowledgeDocumentList:
    """List all knowledge documents with optional filters"""
    docs = list(_mock_knowledge_docs.values())
    
    # Apply filters
    if document_type:
        docs = [d for d in docs if d.document_type == document_type]
    if source:
        docs = [d for d in docs if d.source == source]
    if category:
        docs = [d for d in docs if d.category == category]
    
    # Sort by uploaded_at desc
    docs.sort(key=lambda x: x.uploaded_at, reverse=True)
    
    return KnowledgeDocumentList(
        documents=docs[skip:skip + limit],
        total=len(docs),
    )


async def get_document(db: Session, document_id: UUID) -> Optional[KnowledgeDocument]:
    """Get a single document by ID and increment view count"""
    doc = _mock_knowledge_docs.get(str(document_id))
    if doc:
        # Increment view count
        doc_dict = doc.model_dump()
        doc_dict["view_count"] = doc.view_count + 1
        doc_dict["last_accessed_at"] = datetime.now()
        updated_doc = KnowledgeDocument(**doc_dict)
        _mock_knowledge_docs[str(document_id)] = updated_doc
        return updated_doc
    return None


async def upload_document(
    db: Session,
    data: KnowledgeDocumentCreate,
) -> KnowledgeDocumentUploadResponse:
    """Upload a new knowledge document (mock - just stores metadata)"""
    doc_id = uuid4()
    
    # Generate mock file URL
    file_ext = data.file_type.lower()
    file_url = data.file_url or f"/mock/knowledge/{doc_id}.{file_ext}"
    
    # Get uploaded_by name (mock - would query user table in production)
    uploaded_by_name = "Current User"  # Would fetch from user table
    
    doc = KnowledgeDocument(
        id=doc_id,
        title=data.title,
        description=data.description,
        document_type=data.document_type,
        source=data.source or "Uploaded",
        file_type=data.file_type,
        file_size=data.file_size or 1024000,  # Default 1MB
        file_url=file_url,
        tags=data.tags or [],
        category=data.category,
        uploaded_by=data.uploaded_by,
        uploaded_by_name=uploaded_by_name,
        uploaded_at=datetime.now(),
        view_count=0,
        last_accessed_at=None,
    )
    
    _mock_knowledge_docs[str(doc_id)] = doc
    logger.info(f"[Mock] Uploaded knowledge document: {doc.title}")
    
    return KnowledgeDocumentUploadResponse(
        id=doc_id,
        title=doc.title,
        file_url=file_url,
        message="Tài liệu đã được tải lên thành công (mock)",
    )


async def update_document(
    db: Session,
    document_id: UUID,
    data: KnowledgeDocumentUpdate,
) -> Optional[KnowledgeDocument]:
    """Update a document"""
    doc = _mock_knowledge_docs.get(str(document_id))
    if not doc:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    doc_dict = doc.model_dump()
    doc_dict.update(update_data)
    
    updated_doc = KnowledgeDocument(**doc_dict)
    _mock_knowledge_docs[str(document_id)] = updated_doc
    return updated_doc


async def delete_document(db: Session, document_id: UUID) -> bool:
    """Delete a document"""
    if str(document_id) in _mock_knowledge_docs:
        del _mock_knowledge_docs[str(document_id)]
        return True
    return False


async def search_documents(
    db: Session,
    request: KnowledgeSearchRequest,
) -> KnowledgeSearchResponse:
    """Search documents by query string"""
    docs = list(_mock_knowledge_docs.values())
    
    # Simple text search in title, description, tags
    query_lower = request.query.lower()
    matching_docs = []
    
    for doc in docs:
        score = 0
        if query_lower in doc.title.lower():
            score += 10
        if doc.description and query_lower in doc.description.lower():
            score += 5
        if doc.tags:
            for tag in doc.tags:
                if query_lower in tag.lower():
                    score += 3
        
        if score > 0:
            matching_docs.append((score, doc))
    
    # Sort by score desc
    matching_docs.sort(key=lambda x: x[0], reverse=True)
    results = [doc for _, doc in matching_docs]
    
    # Apply additional filters
    if request.document_type:
        results = [d for d in results if d.document_type == request.document_type]
    if request.source:
        results = [d for d in results if d.source == request.source]
    if request.category:
        results = [d for d in results if d.category == request.category]
    if request.tags:
        tag_set = set(t.lower() for t in request.tags)
        results = [d for d in results if d.tags and any(t.lower() in tag_set for t in d.tags)]
    
    return KnowledgeSearchResponse(
        documents=results[request.offset:request.offset + request.limit],
        total=len(results),
        query=request.query,
    )


async def query_knowledge_ai(
    db: Session,
    request: KnowledgeQueryRequest,
) -> KnowledgeQueryResponse:
    """Query knowledge base using AI"""
    
    # Get relevant documents
    relevant_docs = []
    if request.include_documents:
        search_req = KnowledgeSearchRequest(
            query=request.query,
            limit=request.limit,
        )
        search_result = await search_documents(db, search_req)
        relevant_docs = search_result.documents[:request.limit]
    
    # Build context from documents
    context_parts = []
    for doc in relevant_docs:
        context_parts.append(f"Tài liệu: {doc.title}")
        if doc.description:
            context_parts.append(f"Mô tả: {doc.description}")
        if doc.tags:
            context_parts.append(f"Tags: {', '.join(doc.tags)}")
        context_parts.append(f"Nguồn: {doc.source}")
        context_parts.append("")
    
    context = "\n".join(context_parts) if context_parts else "Không có tài liệu liên quan."
    
    # Use AI to generate answer
    if is_gemini_available():
        try:
            chat = GeminiChat()
            prompt = f"""Dựa trên knowledge base sau, trả lời câu hỏi: {request.query}

KNOWLEDGE BASE:
{context}

Yêu cầu:
- Trả lời ngắn gọn, chính xác
- KHÔNG sử dụng markdown (không dùng **, ##)
- KHÔNG chào hỏi
- Nếu có thông tin trong knowledge base, trích dẫn tài liệu cụ thể
- Nếu không có thông tin, nói rõ "Tôi không tìm thấy thông tin này trong knowledge base"
"""
            answer = await chat.chat(prompt)
            
            # Extract citations from answer
            citations = []
            for doc in relevant_docs:
                if doc.title.lower() in answer.lower():
                    citations.append(doc.title)
            
            return KnowledgeQueryResponse(
                answer=answer,
                relevant_documents=relevant_docs,
                confidence=0.90 if relevant_docs else 0.60,
                citations=citations,
            )
        except Exception as e:
            logger.error(f"AI query error: {e}")
    
    # Fallback response
    if relevant_docs:
        answer = f"Dựa trên knowledge base, tôi tìm thấy {len(relevant_docs)} tài liệu liên quan: {', '.join([d.title for d in relevant_docs[:3]])}"
    else:
        answer = "Tôi không tìm thấy thông tin liên quan trong knowledge base."
    
    return KnowledgeQueryResponse(
        answer=answer,
        relevant_documents=relevant_docs,
        confidence=0.70,
        citations=[],
    )

