"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    anthropic_api_key: str = ""
    ai_model: str = "claude-opus-4-8"

    secret_key: str = "change-me-to-a-long-random-string"
    access_token_expire_minutes: int = 60 * 12

    admin_username: str = "admin"
    admin_password: str = "admin123"

    database_url: str = "sqlite:///./recruitai.db"

    log_level: str = "INFO"
    log_format: str = "structured"
    rate_limit_per_minute: int = 0
    ai_model_fast: str = "claude-sonnet-4-20250514"
    ai_model_quality: str = "claude-opus-4-8"
    ai_cache_ttl_seconds: int = 0

    firebase_credentials: str = ""
    firebase_service_account_path: str = ""
    firebase_storage_bucket: str = ""
    firebase_database_id: str = ""
    firebase_web_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
