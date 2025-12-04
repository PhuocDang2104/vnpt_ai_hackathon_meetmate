from fastapi import APIRouter
from app.schemas.user import User
from app.services import user_service

router = APIRouter()


@router.get('/', response_model=User)
def get_me():
    return user_service.get_user_stub()