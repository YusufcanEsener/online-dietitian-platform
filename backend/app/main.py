from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.api_v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (eğer gerekirse cleanup işlemleri buraya)

# Production'da Swagger dokümantasyonu kapatılır
openapi_url = f"{settings.API_V1_STR}/openapi.json" if not settings.is_production else None
docs_url = "/docs" if not settings.is_production else None
redoc_url = "/redoc" if not settings.is_production else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=openapi_url,
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan
)

# CORS Middleware — sadece gerekli method/header'lar açık
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Length"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Online Dietitian Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(api_router, prefix=settings.API_V1_STR)
