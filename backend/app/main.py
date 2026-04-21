"""
FastAPI Application — main entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_tables, SessionLocal
from app.models import User
from app.auth.security import hash_password
from app.utils.logger import get_logger

logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables and default user."""
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    
    # 1. Create tables
    create_tables()
    logger.info("Database tables ready")
    
    # 2. Create default user if none exists
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("No users found. Creating default admin user...")
            default_user = User(
                email="admin@leonex.net",
                username="admin",
                hashed_password=hash_password("password123"),
                full_name="System Admin",
                role="admin",
                is_active=True
            )
            db.add(default_user)
            db.commit()
            logger.info("Default user created: admin@leonex.net / password123")
    except Exception as e:
        logger.error("Failed to create default user: %s", e)
    finally:
        db.close()
        
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
from app.api.routes import router as tender_router
app.include_router(tender_router)                  # /api/tenders, /api/search, etc.

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

# Admin Portal router
try:
    from app.api.admin_api import router as admin_router
    app.include_router(admin_router)              # /api/admin/*
    logger.info("Admin router loaded")
except Exception as exc:
    logger.warning("Admin router failed to load: %s", exc)


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Don't intercept HTTPException — let FastAPI handle them with the correct status code
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        raise exc
    logger.error("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})