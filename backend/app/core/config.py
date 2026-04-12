from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Online Dietitian Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IT"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 gün
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "online_dietitian_v1"
    
    # Google OAuth2 ayarları
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # n8n webhook base URL (sondaki slash olmadan)
    N8N_BASE_URL: str = "http://localhost:5678"

    # CORS izin verilen origin'ler (virgülle ayrılmış)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"

    @property
    def cors_origins_list(self) -> List[str]:
        """CORS_ORIGINS string'ini listeye çevirir"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"

settings = Settings()

