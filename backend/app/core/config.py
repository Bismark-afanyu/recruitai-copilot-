"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ---------------------------------------------------------------------------
    # Qwen Cloud (primary AI provider)
    # ---------------------------------------------------------------------------
    dashscope_api_key: str = ""
    qwen_model_quality: str = "qwen3.7-plus"
    qwen_model_fast: str = "qwen3.6-flash"
    qwen_model_reasoning: str = "qwen3.7-max"

    # ---------------------------------------------------------------------------
    # Legacy Claude settings (kept for backward compatibility)
    # ---------------------------------------------------------------------------
    anthropic_api_key: str = ""
    ai_model: str = "qwen3.7-plus"  # Changed default to Qwen
    ai_model_fast: str = "qwen3.6-flash"
    ai_model_quality: str = "qwen3.7-plus"
    ai_cache_ttl_seconds: int = 0

    # ---------------------------------------------------------------------------
    # Application
    # ---------------------------------------------------------------------------
    secret_key: str = "change-me-to-a-long-random-string"
    access_token_expire_minutes: int = 60 * 12

    admin_username: str = "admin"
    admin_password: str = "admin123"

    database_url: str = "sqlite:///./recruitai.db"

    log_level: str = "INFO"
    log_format: str = "structured"
    rate_limit_per_minute: int = 0

    # ---------------------------------------------------------------------------
    # Firebase
    # ---------------------------------------------------------------------------
    firebase_credentials: str = ""
    firebase_service_account_path: str = ""
    firebase_storage_bucket: str = ""
    firebase_database_id: str = ""
    firebase_web_api_key: str = ""

    # ---------------------------------------------------------------------------
    # Alibaba Cloud
    # ---------------------------------------------------------------------------
    alicloud_access_key: str = ""
    alicloud_secret_key: str = ""
    oss_endpoint: str = ""
    oss_bucket: str = ""
    directmail_sender: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
