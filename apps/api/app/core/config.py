from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS & URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Auth & Sessions
    SESSION_SECRET_KEY: str = "dev_secret_key_change_in_production_1234567890abcdef"
    SESSION_COOKIE_NAME: str = "watchparty_session"
    SESSION_EXPIRE_HOURS: int = 72

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./watch_party.db"

    # Redis (Optional)
    REDIS_URL: str = ""

    # LiveKit SFU
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_PUBLIC_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret_dev_key_must_be_changed_in_prod_1234567890abcdef"

    # Room rules
    MAX_PARTICIPANTS_PER_ROOM: int = 10
    INVITATION_EXPIRE_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
