from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = 'development'
    api_v1_prefix: str = '/api/v1'
    project_name: str = 'MeetMate'
    database_url: str = 'postgresql+psycopg2://meetmate:meetmate@localhost:5432/meetmate'
    openai_api_key: str = ''

    class Config:
        env_file = '../../infra/env/.env.local'


def get_settings() -> Settings:
    return Settings()