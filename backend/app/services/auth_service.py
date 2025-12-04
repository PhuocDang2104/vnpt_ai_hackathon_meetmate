from app.schemas.auth import Token
from app.services import user_service


def login_stub(username: str, password: str) -> Token:
    # Stub: always succeed and return a fake token referencing the PMO user
    user = user_service.get_user_stub()
    return Token(access_token=f"fake-token-for-{user.id}")