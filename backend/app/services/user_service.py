from app.schemas.user import User


def get_user_stub() -> User:
    return User(id='pmo-user', email='pmo@lpbank.vn', full_name='Head of PMO', role='pmo')