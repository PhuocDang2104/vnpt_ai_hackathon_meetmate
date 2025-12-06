"""
Authentication Service
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status

from app.schemas.auth import (
    UserRegister, UserRegisterResponse, UserLogin, Token,
    CurrentUser, PasswordChange
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
)


def get_user_by_email(db: Session, email: str) -> Optional[dict]:
    """Get user by email with password hash"""
    # First try with password_hash column
    try:
        query = text("""
            SELECT 
                u.id::text, u.email, u.display_name, u.role,
                u.password_hash, u.department_id::text, u.avatar_url,
                u.organization_id::text, u.created_at,
                d.name as department_name
            FROM user_account u
            LEFT JOIN department d ON u.department_id = d.id
            WHERE u.email = :email
        """)
        
        result = db.execute(query, {'email': email})
        row = result.fetchone()
        
        if not row:
            return None
        
        return {
            'id': row[0],
            'email': row[1],
            'display_name': row[2],
            'role': row[3] or 'user',
            'password_hash': row[4],
            'department_id': row[5],
            'avatar_url': row[6],
            'organization_id': row[7],
            'created_at': row[8],
            'department_name': row[9]
        }
    except Exception:
        # Fallback: password_hash column might not exist
        query = text("""
            SELECT 
                u.id::text, u.email, u.display_name, u.role,
                u.department_id::text, u.avatar_url,
                u.organization_id::text, u.created_at,
                d.name as department_name
            FROM user_account u
            LEFT JOIN department d ON u.department_id = d.id
            WHERE u.email = :email
        """)
        
        result = db.execute(query, {'email': email})
        row = result.fetchone()
        
        if not row:
            return None
        
        return {
            'id': row[0],
            'email': row[1],
            'display_name': row[2],
            'role': row[3] or 'user',
            'password_hash': None,  # No password hash column
            'department_id': row[4],
            'avatar_url': row[5],
            'organization_id': row[6],
            'created_at': row[7],
            'department_name': row[8]
        }


def get_user_by_id(db: Session, user_id: str) -> Optional[CurrentUser]:
    """Get user by ID (without password)"""
    query = text("""
        SELECT 
            u.id::text, u.email, u.display_name, u.role,
            u.department_id::text, u.avatar_url,
            u.organization_id::text, u.created_at,
            d.name as department_name
        FROM user_account u
        LEFT JOIN department d ON u.department_id = d.id
        WHERE u.id = :user_id
    """)
    
    result = db.execute(query, {'user_id': user_id})
    row = result.fetchone()
    
    if not row:
        return None
    
    return CurrentUser(
        id=row[0],
        email=row[1],
        display_name=row[2],
        role=row[3] or 'user',
        department_id=row[4],
        avatar_url=row[5],
        organization_id=row[6],
        created_at=row[7],
        department_name=row[8]
    )


def register_user(db: Session, data: UserRegister) -> UserRegisterResponse:
    """Register a new user"""
    # Check if email already exists
    existing = get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_id = str(uuid4())
    password_hash = hash_password(data.password)
    now = datetime.utcnow()
    
    query = text("""
        INSERT INTO user_account (
            id, email, display_name, password_hash, role,
            department_id, organization_id, created_at, updated_at
        )
        VALUES (
            :id, :email, :display_name, :password_hash, 'user',
            :department_id, :organization_id, :created_at, :updated_at
        )
        RETURNING id::text
    """)
    
    try:
        db.execute(query, {
            'id': user_id,
            'email': data.email,
            'display_name': data.display_name,
            'password_hash': password_hash,
            'department_id': data.department_id,
            'organization_id': data.organization_id,
            'created_at': now,
            'updated_at': now
        })
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
    
    return UserRegisterResponse(
        id=user_id,
        email=data.email,
        display_name=data.display_name,
        role='user',
        message="User registered successfully. Please login to continue."
    )


def authenticate_user(db: Session, email: str, password: str) -> Optional[dict]:
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    # Check if user has password_hash (for users created before auth)
    if not user.get('password_hash'):
        # For demo: allow login for existing users without password
        # In production, you would require password reset
        return user
    
    if not verify_password(password, user['password_hash']):
        return None
    
    return user


def login(db: Session, data: UserLogin) -> Token:
    """Login user and return tokens"""
    user = authenticate_user(db, data.email, data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    token_data = {
        "sub": user['id'],
        "email": user['email'],
        "role": user['role']
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type='bearer',
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


def refresh_tokens(db: Session, refresh_token: str) -> Token:
    """Refresh access token using refresh token"""
    payload = verify_token(refresh_token, token_type="refresh")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    user = get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role
    }
    
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type='bearer',
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


def change_password(
    db: Session, 
    user_id: str, 
    data: PasswordChange
) -> dict:
    """Change user password"""
    # Get user with password hash
    query = text("""
        SELECT password_hash FROM user_account WHERE id = :user_id
    """)
    result = db.execute(query, {'user_id': user_id})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password (if set)
    if row[0] and not verify_password(data.current_password, row[0]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hash = hash_password(data.new_password)
    update_query = text("""
        UPDATE user_account 
        SET password_hash = :password_hash, updated_at = :updated_at
        WHERE id = :user_id
    """)
    
    db.execute(update_query, {
        'user_id': user_id,
        'password_hash': new_hash,
        'updated_at': datetime.utcnow()
    })
    db.commit()
    
    return {"message": "Password changed successfully"}


# ============================================
# Legacy stub for backward compatibility
# ============================================

def login_stub(username: str, password: str) -> Token:
    """Stub login for testing (deprecated)"""
    from app.services import user_service
    user = user_service.get_user_stub()
    return Token(
        access_token=f"fake-token-for-{user.id}",
        token_type='bearer',
        expires_in=3600
    )
