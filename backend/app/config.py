from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    GITHUB_TOKEN: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
