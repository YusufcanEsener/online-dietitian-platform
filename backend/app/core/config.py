import os
from typing import List, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Online Dietitian Platform"
    API_V1_STR: str = "/api/v1"

    # Guvenlik: default deger yok, env'den zorunlu alinir.
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    # MongoDB baglanti ayarlari
    MONGODB_URL: Optional[str] = None
    DATABASE_NAME: str = "online_dietitian_v1"
    MONGO_APP_USERNAME: Optional[str] = None
    MONGO_APP_PASSWORD: Optional[str] = None
    MONGO_HOST: str = "mongo"
    MONGO_PORT: int = 27017

    # Google OAuth2 ayarlari
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # n8n webhook base URL (sondaki slash olmadan)
    N8N_BASE_URL: str = "http://n8n:5678"
    N8N_AGENT_SECRET: str = ""

    # Agentic AI ve scheduler ayarlari
    OPENAI_API_KEY: str = ""
    OPENAI_AGENT_MODEL: str = "gpt-4o-mini"
    ENABLE_AGENT: bool = False
    AGENT_INSTANCE_ID: Optional[str] = None
    AGENT_SCHEDULER_INTERVAL_SECONDS: int = 86400
    AGENT_SCHEDULER_TIMEZONE: str = "Europe/Istanbul"
    AGENT_SCHEDULER_RUN_HOUR_LOCAL: int = 6
    AGENT_SCHEDULER_RUN_MINUTE_LOCAL: int = 0
    AGENT_LOCK_TTL_SECONDS: int = 120
    AGENT_NOTIFICATION_COOLDOWN_HOURS: int = 12
    AGENT_WEBSOCKET_DELAY_MS: int = 200

    # CORS izin verilen origin'ler (virgulle ayrilmis)
    CORS_ORIGINS: str = ""

    # Environment modu
    NODE_ENV: str = "production"

    @property
    def cors_origins_list(self) -> List[str]:
        """CORS_ORIGINS string'ini listeye cevirir."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV == "production"

    @model_validator(mode="after")
    def populate_mongodb_url(self) -> "Settings":
        if not self.MONGODB_URL and self.MONGO_APP_USERNAME and self.MONGO_APP_PASSWORD:
            auth_source = self.DATABASE_NAME or "admin"
            self.MONGODB_URL = (
                f"mongodb://{self.MONGO_APP_USERNAME}:{self.MONGO_APP_PASSWORD}"
                f"@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.DATABASE_NAME}"
                f"?authSource={auth_source}"
            )
        if not self.AGENT_INSTANCE_ID:
            self.AGENT_INSTANCE_ID = os.getenv("HOSTNAME") or "agent-instance-local"
        return self


settings = Settings()
