from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from pathlib import Path


def find_env_file():
    """Find .env.local file in project"""
    possible_paths = [
        Path(__file__).parent.parent.parent.parent / 'infra' / 'env' / '.env.local',
        Path.cwd() / 'infra' / 'env' / '.env.local',
        Path.cwd().parent / 'infra' / 'env' / '.env.local',
    ]
    for p in possible_paths:
        if p.exists():
            return str(p)
    return None


class Settings(BaseSettings):
    env: str = 'development'
    api_v1_prefix: str = '/api/v1'
    project_name: str = 'MeetMate'
    
    # Database - supports both local and cloud (Supabase/Railway)
    database_url: str = 'postgresql+psycopg2://meetmate:meetmate@localhost:5433/meetmate'
    
    # AI API Keys
    openai_api_key: str = ''
    gemini_api_key: str = ''
    
    # AI Model settings - Gemini 2.5 Flash Live
    gemini_model: str = 'gemini-2.5-flash-preview-05-20'
    ai_temperature: float = 0.7
    ai_max_tokens: int = 2048
    
    # Security
    secret_key: str = 'dev-secret-key-change-in-production'
    
    # CORS - comma separated origins or "*" for all
    cors_origins: str = '*'

    model_config = SettingsConfigDict(
        env_file=find_env_file(),
        env_file_encoding='utf-8',
        extra='ignore'
    )


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    # Fallback to environment variable
    if not settings.gemini_api_key:
        settings.gemini_api_key = os.getenv('GEMINI_API_KEY', '')
    return settings
