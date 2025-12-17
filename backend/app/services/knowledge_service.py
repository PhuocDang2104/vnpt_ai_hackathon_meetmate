"""
Knowledge Service - Document management and search for Knowledge Hub
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
import logging
from pathlib import Path
from sqlalchemy import text
import json

from fastapi import UploadFile
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
from app.llm.clients.jina_embed import embed_texts, is_jina_available
from app.vectorstore.pgvector_client import PgVectorClient
from app.services.storage_client import (
    build_object_key,
    generate_presigned_get_url,
    is_storage_configured,
    upload_bytes_to_storage,
)
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# In-memory storage for mock knowledge documents
_mock_knowledge_docs: dict[str, KnowledgeDocument] = {}


def _init_mock_knowledge_docs():
    """Initialize with mock knowledge documents"""
    mock_data = [
        {
            "id": UUID("a0000001-0000-0000-0000-000000000001"),
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
            "id": UUID("a0000002-0000-0000-0000-000000000002"),
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
            "id": UUID("a0000003-0000-0000-0000-000000000003"),
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
            "id": UUID("a0000004-0000-0000-0000-000000000004"),
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
            "id": UUID("a0000005-0000-0000-0000-000000000005"),
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
            "id": UUID("a0000006-0000-0000-0000-000000000006"),
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
            "id": UUID("a0000007-0000-0000-0000-000000000007"),
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
            "id": UUID("a0000008-0000-0000-0000-000000000008"),
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


def _with_presigned_url(doc: KnowledgeDocument) -> KnowledgeDocument:
    """Attach a fresh presigned URL if the document is stored in S3."""
    if doc.storage_key and is_storage_configured():
        url = generate_presigned_get_url(doc.storage_key, expires_in=3600)
        if url:
            doc_dict = doc.model_dump()
            doc_dict["file_url"] = url
            return KnowledgeDocument(**doc_dict)
    return doc


def _row_to_doc(row) -> KnowledgeDocument:
    """Map DB row -> KnowledgeDocument; fill missing fields with defaults."""
    return KnowledgeDocument(
        id=row["id"],
        title=row["title"],
        description=row.get("description"),
        document_type="document",
        source=row.get("source") or "Uploaded",
        file_type=row.get("file_type") or "pdf",
        file_size=row.get("file_size"),
        file_url=row.get("file_url"),
        storage_key=row.get("storage_key"),
        tags=row.get("tags") or [],
        category=row.get("category"),
        uploaded_by=None,
        uploaded_by_name=None,
        uploaded_at=row.get("created_at") or datetime.now(),
        view_count=0,
        last_accessed_at=row.get("updated_at"),
    )
def _chunk_text(text: str, max_len: int = 1200, overlap: int = 200) -> list[str]:
    """Greedy chunk by characters with overlap."""
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + max_len)
        chunk = text[start:end]
        chunks.append(chunk)
        if end == n:
            break
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]


async def list_documents(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    document_type: Optional[str] = None,
    source: Optional[str] = None,
    category: Optional[str] = None,
) -> KnowledgeDocumentList:
    """List all knowledge documents with optional filters"""
    try:
        conditions = ["1=1"]
        params = {"skip": skip, "limit": limit}
        if source:
            conditions.append("source = :source")
            params["source"] = source
        if category:
            conditions.append("category = :category")
            params["category"] = category

        where_clause = " AND ".join(conditions)
        rows = db.execute(
            text(
                f"""
                SELECT id, title, description, source, category, tags,
                       file_type, file_size, storage_key, file_url,
                       created_at, updated_at
                FROM knowledge_document
                WHERE {where_clause}
                ORDER BY created_at DESC NULLS LAST
                LIMIT :limit OFFSET :skip
                """
            ),
            params,
        ).mappings().all()

        total = db.execute(
            text(f"SELECT COUNT(*) FROM knowledge_document WHERE {where_clause}"),
            params,
        ).scalar_one()

        docs = [_with_presigned_url(_row_to_doc(r)) for r in rows]
        return KnowledgeDocumentList(documents=docs, total=total)
    except Exception as exc:
        logger.warning("List documents fallback to mock: %s", exc)
        docs = list(_mock_knowledge_docs.values())
        if document_type:
            docs = [d for d in docs if d.document_type == document_type]
        if source:
            docs = [d for d in docs if d.source == source]
        if category:
            docs = [d for d in docs if d.category == category]
        docs.sort(key=lambda x: x.uploaded_at, reverse=True)
        docs = [_with_presigned_url(d) for d in docs]
        return KnowledgeDocumentList(
            documents=docs[skip:skip + limit],
            total=len(docs),
        )


async def get_document(db: Session, document_id: UUID) -> Optional[KnowledgeDocument]:
    """Get a single document by ID and increment view count"""
    try:
        row = db.execute(
            text(
                """
                SELECT id, title, description, source, category, tags,
                       file_type, file_size, storage_key, file_url,
                       created_at, updated_at
                FROM knowledge_document
                WHERE id = :id
                """
            ),
            {"id": str(document_id)},
        ).mappings().first()
        if row:
            return _with_presigned_url(_row_to_doc(row))
    except Exception as exc:
        logger.warning("Get document fallback to mock: %s", exc)

    doc = _mock_knowledge_docs.get(str(document_id))
    if doc:
        doc_dict = doc.model_dump()
        doc_dict["view_count"] = doc.view_count + 1
        doc_dict["last_accessed_at"] = datetime.now()
        updated_doc = KnowledgeDocument(**doc_dict)
        _mock_knowledge_docs[str(document_id)] = updated_doc
        return _with_presigned_url(updated_doc)
    return None


async def upload_document(
    db: Session,
    data: KnowledgeDocumentCreate,
    file: Optional[UploadFile] = None,
) -> KnowledgeDocumentUploadResponse:
    """Upload a new knowledge document (mock metadata, real storage if configured)"""
    doc_id = uuid4()
    
    file_ext = data.file_type.lower()
    storage_key = None
    file_url = data.file_url or f"/mock/knowledge/{doc_id}.{file_ext}"
    file_size = data.file_size or 0

    # Handle actual file upload if provided
    if file:
        filename = file.filename or f"{doc_id}.{file_ext}"
        content = await file.read()
        file_size = len(content)

        if is_storage_configured():
            try:
                object_key = build_object_key(filename, prefix="knowledge")
                upload_bytes_to_storage(content, object_key, content_type=file.content_type)
                storage_key = object_key
                # Return a presigned URL so the frontend can access the private object
                presigned_url = generate_presigned_get_url(object_key, expires_in=3600)
                if presigned_url:
                    file_url = presigned_url
            except Exception as exc:
                logger.error("Upload to storage failed, falling back to local file: %s", exc)

        # Fallback to local storage if storage not configured or failed
        if not storage_key:
            upload_dir = Path(__file__).parent.parent / "uploaded_files"
            upload_dir.mkdir(parents=True, exist_ok=True)
            stored_name = f"{doc_id}.{file_ext}"
            stored_path = upload_dir / stored_name
            stored_path.write_bytes(content)
            file_url = f"/files/{stored_name}"

    # Get uploaded_by name (mock - would query user table in production)
    uploaded_by_name = "Current User"  # Would fetch from user table
    
    doc = KnowledgeDocument(
        id=doc_id,
        title=data.title,
        description=data.description,
        document_type=data.document_type,
        source=data.source or "Uploaded",
        file_type=data.file_type,
        file_size=file_size or 1024000,  # Default 1MB
        file_url=file_url,
        storage_key=storage_key,
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

    # Persist metadata to DB
    try:
        db.execute(
            text(
                """
                INSERT INTO knowledge_document (
                    id, title, description, source, category, tags,
                    file_type, file_size, storage_key, file_url,
                    org_id, project_id, meeting_id, visibility,
                    created_at, updated_at
                )
                VALUES (
                    :id, :title, :description, :source, :category, :tags,
                    :file_type, :file_size, :storage_key, :file_url,
                    :org_id, :project_id, :meeting_id, :visibility,
                    now(), now()
                )
                ON CONFLICT (id) DO NOTHING
                """
            ),
            {
                "id": str(doc_id),
                "title": doc.title,
                "description": doc.description,
                "source": doc.source,
                "category": doc.category,
                "tags": doc.tags,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "storage_key": doc.storage_key,
                "file_url": doc.file_url,
                "org_id": None,
                "project_id": None,
                "meeting_id": None,
                "visibility": None,
            },
        )
        db.commit()
    except Exception as exc:
        logger.error("Failed to persist knowledge_document to DB: %s", exc)

    # Auto-embed and store chunks if HF is available
    try:
        text_content = ""
        # If original file content is available, try decode
        try:
            if file and "content" in locals() and content:
                text_content = content.decode("utf-8", errors="ignore")
        except Exception:
            text_content = ""

        if not text_content:
            # Fallback: use description/title
            text_parts = [doc.title]
            if doc.description:
                text_parts.append(doc.description)
            text_content = "\n".join(text_parts)

        chunks = _chunk_text(text_content) if text_content else []
        if chunks and is_jina_available():
            embeddings = embed_texts(chunks)
            for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                emb_literal = "[" + ",".join(str(x) for x in emb) + "]"
                db.execute(
                    text(
                        """
                        INSERT INTO knowledge_chunk (
                            id, document_id, chunk_index, content, embedding, created_at
                        )
                        VALUES (
                            :id, :document_id, :chunk_index, :content, :embedding::vector, now()
                        )
                        """
                    ),
                    {
                        "id": str(uuid4()),
                        "document_id": str(doc_id),
                        "chunk_index": idx,
                        "content": chunk,
                        "embedding": emb_literal,
                    },
                )
            db.commit()
    except Exception as exc:
        logger.error("Auto-embed failed: %s", exc, exc_info=True)
    
    return KnowledgeDocumentUploadResponse(
        id=doc_id,
        title=doc.title,
        file_url=file_url,
        message="Tài liệu đã được tải lên thành công",
    )


async def ingest_document(db: Session, document_id: UUID) -> Optional[dict]:
    """
    Ingest a document into vector store.
    Current implementation is a stub: combines metadata text and upserts to PgVectorClient.
    """
    doc = _mock_knowledge_docs.get(str(document_id))
    if not doc:
        return None

    parts = [doc.title]
    if doc.description:
        parts.append(doc.description)
    if doc.tags:
        parts.append(" ".join(doc.tags))
    content = "\n".join(parts)

    settings = get_settings()
    client = PgVectorClient(connection=settings.database_url)
    client.upsert([content])

    logger.info("Ingested document %s into vector store (stub)", document_id)
    return {"status": "embedded", "document_id": document_id}


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
    try:
        conditions = ["1=1"]
        params = {
            "like_q": f"%{request.query}%",
            "offset": request.offset,
            "limit": request.limit,
        }
        conditions.append("(title ILIKE :like_q OR description ILIKE :like_q OR :like_q = ANY(tags))")
        if request.source:
            conditions.append("source = :source")
            params["source"] = request.source
        if request.category:
            conditions.append("category = :category")
            params["category"] = request.category

        where_clause = " AND ".join(conditions)
        rows = db.execute(
            text(
                f"""
                SELECT id, title, description, source, category, tags,
                       file_type, file_size, storage_key, file_url,
                       created_at, updated_at
                FROM knowledge_document
                WHERE {where_clause}
                ORDER BY created_at DESC NULLS LAST
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        ).mappings().all()

        total = db.execute(
            text(f"SELECT COUNT(*) FROM knowledge_document WHERE {where_clause}"),
            params,
        ).scalar_one()

        docs = [_with_presigned_url(_row_to_doc(r)) for r in rows]
        return KnowledgeSearchResponse(documents=docs, total=total, query=request.query)
    except Exception as exc:
        logger.warning("Search documents fallback to mock: %s", exc)

    docs = list(_mock_knowledge_docs.values())
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

    matching_docs.sort(key=lambda x: x[0], reverse=True)
    results = [doc for _, doc in matching_docs]

    if request.document_type:
        results = [d for d in results if d.document_type == request.document_type]
    if request.source:
        results = [d for d in results if d.source == request.source]
    if request.category:
        results = [d for d in results if d.category == request.category]
    if request.tags:
        tag_set = set(t.lower() for t in request.tags)
        results = [d for d in results if d.tags and any(t.lower() in tag_set for t in d.tags)]

    results = [_with_presigned_url(d) for d in results]

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
