"""
Database — SQLAlchemy engine, session, Base
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables. Called on startup."""
    import app.models  # Ensure models are loaded
    Base.metadata.create_all(bind=engine)


def drop_and_recreate():
    """Drop all tables and recreate — for clean reset."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)