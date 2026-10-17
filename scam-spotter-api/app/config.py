from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    store_message_text: bool = True

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    llm_min_score: int = 30
    llm_timeout_s: float = 8.0

    # Link reputation
    google_safe_browsing_api_key: str = ""
    virustotal_api_key: str = ""
    vt_min_malicious: int = 2
    max_links_checked: int = 5
    external_timeout_s: float = 3.0

    # API
    cors_origins: str = "*"
    max_message_chars: int = 5000

    # Risk bands (from the problem statement: Low 0-29, Medium 30-59, High 60-100)
    safe_max: int = 29
    suspicious_max: int = 59


@lru_cache
def get_settings() -> Settings:
    return Settings()
