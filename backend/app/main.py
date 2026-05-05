from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.agent.scheduler import agent_scheduler
from app.agent.websocket_manager import websocket_manager
from app.api.api_v1.router import api_router
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await agent_scheduler.start()
    app.state.agent_scheduler = agent_scheduler
    yield
    # Shutdown
    await agent_scheduler.stop()
    await websocket_manager.shutdown()


openapi_url = f"{settings.API_V1_STR}/openapi.json" if not settings.is_production else None
docs_url = "/docs" if not settings.is_production else None
redoc_url = "/redoc" if not settings.is_production else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=openapi_url,
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Length"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"VALIDATION ERROR: {exc.errors()}")
    print(f"BODY: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.get("/")
async def root():
    return {"message": "Welcome to Online Dietitian Platform API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(api_router, prefix=settings.API_V1_STR)
