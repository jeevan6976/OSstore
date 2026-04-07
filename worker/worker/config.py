from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://osstore:osstore_secret_2026@localhost:5432/osstore"
    REDIS_URL: str = "redis://localhost:6379/0"
    MEILI_URL: str = "http://localhost:7700"
    MEILI_MASTER_KEY: str = "masterKey_change_me_in_prod"
    GITHUB_TOKEN: str = ""

    class Config:
        env_file = ".env"

    @property
    def sync_database_url(self) -> str:
        """Convert asyncpg URL to psycopg2 for sync worker."""
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
