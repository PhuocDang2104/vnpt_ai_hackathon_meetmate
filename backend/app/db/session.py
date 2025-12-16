from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=2,          # keep low to respect Supabase pooler limits
    max_overflow=0,       # disable overflow to avoid MaxClients errors
    pool_recycle=300,     # recycle connections to avoid stale sessions
    pool_timeout=30,      # fail fast if pool is exhausted
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
