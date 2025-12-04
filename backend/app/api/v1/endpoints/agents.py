from fastapi import APIRouter

router = APIRouter()


@router.get('/pre', response_model=dict)
def pre_agent():
    return {"agent": "pre_meeting", "status": "ok"}


@router.get('/in', response_model=dict)
def in_agent():
    return {"agent": "in_meeting", "status": "ok"}


@router.get('/post', response_model=dict)
def post_agent():
    return {"agent": "post_meeting", "status": "ok"}