"""
FastAPI Application — main entry point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_tables
from app.api.routes import router
from app.utils.logger import get_logger

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables (includes users table)."""
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    create_tables()
    logger.info("Database tables ready")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS — allow the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
# Auth (public — login, register, etc.)
from app.auth.routes import router as auth_router
app.include_router(auth_router)
logger.info("Auth router loaded")

# Tender routes
app.include_router(router)                        # /api/tenders, /api/search, etc.

# Google Search router
try:
    from app.api.google_routes import router as google_router
    app.include_router(google_router)             # /api/google/*
    logger.info("Google router loaded")
except Exception as exc:
    logger.warning("Google router failed to load: %s", exc)

# AI Chat router (graceful — won't crash if Ollama is down)
try:
    from app.ai.routes.chat_routes import router as chat_router
    app.include_router(chat_router)               # /api/ai/chat, /api/ai/health
    logger.info("AI Chat router loaded")
except Exception as exc:
    logger.warning("AI Chat router failed to load: %s", exc)


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})