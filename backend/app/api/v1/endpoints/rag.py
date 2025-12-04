from fastapi import APIRouter
from app.schemas.rag import RagQuery, RagResponse, RagCitation

router = APIRouter()


@router.post('/query', response_model=RagResponse)
def rag_query(payload: RagQuery):
    return RagResponse(
        answer=f"Stub response for: {payload.query}",
        citations=[RagCitation(source='policy.pdf', snippet='mock snippet')],
    )