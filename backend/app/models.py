"""
SQLAlchemy Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, UniqueConstraint, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """Application users — passwords stored as bcrypt hash, never plain."""
    __tablename__ = "users"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email          = Column(String(255), unique=True, index=True, nullable=False)
    username       = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name      = Column(String(200), nullable=True)
    role           = Column(String(30), default="user")      # "user" | "admin"
    is_active      = Column(Boolean, default=True)
    is_verified    = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    last_login     = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id":         str(self.id),
            "email":      self.email,
            "username":   self.username,
            "full_name":  self.full_name,
            "role":       self.role,
            "is_active":  self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id    = Column(String(200), index=True, nullable=True)   # source's own ref no
    source       = Column(String(50),  index=True, nullable=False)  # gem | tender247 | tenderdetail | tenderontime | biddetail
    title        = Column(String(600), nullable=True)               # tender headline / description
    description  = Column(Text,        nullable=True)               # full brief text
    location     = Column(String(300), nullable=True)
    start_date   = Column(String(100), nullable=True)
    end_date     = Column(String(100), nullable=True)               # deadline / submission date
    link         = Column(String(800), nullable=True)               # source URL
    keyword      = Column(String(300), nullable=True)               # matched search keyword
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    # Prevent exact duplicates
    __table_args__ = (
        UniqueConstraint("tender_id", "source", name="uq_tender_source"),
        Index("ix_tenders_source_created", "source", "created_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id":          str(self.id),
            "tender_id":   self.tender_id,
            "source":      self.source,
            "title":       self.title,
            "description": self.description,
            "location":    self.location,
            "start_date":  self.start_date,
            "end_date":    self.end_date,
            "link":        self.link,
            "keyword":     self.keyword,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
        }


class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source          = Column(String(50),  index=True)
    keyword         = Column(String(300), nullable=True)
    status          = Column(String(30),  default="running")  # running | completed | failed
    tenders_found   = Column(String(20),  default="0")
    tenders_saved   = Column(String(20),  default="0")
    pages_scanned   = Column(String(20),  default="0")
    error_message   = Column(Text,        nullable=True)
    started_at      = Column(DateTime(timezone=True), server_default=func.now())
    completed_at    = Column(DateTime(timezone=True), nullable=True)


class GoogleResult(Base):
    __tablename__ = "google_results"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_type     = Column(String(20),  index=True, nullable=False)  # "all" | "filtered"
    title           = Column(String(800), nullable=True)
    description     = Column(Text,        nullable=True)
    link            = Column(String(1000),nullable=True)
    search_query    = Column(String(500), nullable=True)
    keywords        = Column(Text,        nullable=True)  # JSON list stored as text
    page_excerpt    = Column(Text,        nullable=True)
    is_pdf          = Column(String(5),   default="false")
    scraped_at      = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        Index("ix_google_results_type_scraped", "result_type", "scraped_at"),
    )

    def to_dict(self) -> dict:
        import json
        try:
            kws = json.loads(self.keywords) if self.keywords else []
        except Exception:
            kws = []
        return {
            "id":           str(self.id),
            "result_type":  self.result_type,
            "title":        self.title,
            "description":  self.description,
            "link":         self.link,
            "search_query": self.search_query,
            "keywords":     kws,
            "page_excerpt": self.page_excerpt,
            "is_pdf":       self.is_pdf == "true",
            "scraped_at":   self.scraped_at.isoformat() if self.scraped_at else None,
        }