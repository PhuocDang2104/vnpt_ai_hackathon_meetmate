from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from pathlib import Path


def find_env_file():
    """Find .env.local file in project (for local development only)"""
    possible_paths = [
        Path(__file__).parent.parent.parent / '.env.local',  # backend/.env.local
        Path(__file__).parent.parent.parent.parent / 'infra' / 'env' / '.env.local',
        Path.cwd() / '.env.local',
        Path.cwd() / 'infra' / 'env' / '.env.local',
    ]
    for p in possible_paths:
        if p.exists():
            return str(p)
    return None  # No env file found, will use environment variables


class Settings(BaseSettings):
    env: str = 'development'
    api_v1_prefix: str = '/api/v1'
    project_name: str = 'MeetMate'
    
    # Database - supports both local and cloud (Supabase/Railway)
    # Production: Set DATABASE_URL environment variable
    database_url: str = 'postgresql+psycopg2://meetmate:meetmate@localhost:5433/meetmate'
    
    # AI API Keys - Set via environment variable in production
    openai_api_key: str = ''
    gemini_api_key: str = ''
    
    # AI Model settings
    # Valid models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp
    gemini_model: str = 'gemini-2.5-flash-lite'
    ai_temperature: float = 0.7
    ai_max_tokens: int = 2048
    
    # Security
    secret_key: str = 'dev-secret-key-change-in-production'
    
    # CORS - comma separated origins or "*" for all
    cors_origins: str = '*'

    model_config = SettingsConfigDict(
        env_file=find_env_file(),
        env_file_encoding='utf-8',
        extra='ignore',
        # Environment variables take priority over .env file
        env_priority='environment'
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
