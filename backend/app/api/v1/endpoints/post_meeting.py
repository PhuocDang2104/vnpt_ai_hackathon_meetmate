from fastapi import APIRouter

router = APIRouter()


@router.get('/summary', response_model=dict)
def post_summary():
    return {"status": "pending", "note": "Post-meeting generation queued"}