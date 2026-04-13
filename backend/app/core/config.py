from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Online Dietitian Platform"
    API_V1_STR: str = "/api/v1"
    
    # GÜVENLİK: Default değer YOK — env'den zorunlu alınır
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 gün
    
    # MongoDB bağlantı URL'i — Docker'da container hostname kullanılır
    MONGODB_URL: str
    DATABASE_NAME: str = "online_dietitian_v1"
    
    # Google OAuth2 ayarları
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # n8n webhook base URL (sondaki slash olmadan)
    N8N_BASE_URL: str = "http://n8n:5678"

    # CORS izin verilen origin'ler (virgülle ayrılmış)
    CORS_ORIGINS: str = ""

    # Environment modu
    NODE_ENV: str = "production"

    @property
    def cors_origins_list(self) -> List[str]:
        """CORS_ORIGINS string'ini listeye çevirir"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV == "production"

    class Config:
        env_file = ".env"

settings = Settings()
