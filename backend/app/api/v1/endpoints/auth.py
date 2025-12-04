from fastapi import APIRouter
from app.schemas.auth import Token
from app.services.auth_service import login_stub

router = APIRouter()


@router.post('/token', response_model=Token)
def login(username: str, password: str):
    return login_stub(username, password)