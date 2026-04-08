"""
Configuration — pydantic-settings based, reads from .env
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # App
    APP_NAME: str = "Tender Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/tenderdb"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Scraping
    HEADLESS_MODE: bool = False
    MAX_PAGES: int = 10
    MAX_CONCURRENT_TABS: int = 3
    SCRAPE_TIMEOUT: int = 30
    RESET_SCRATCH_PAD: bool = True

    # Directories
    DATA_DIR: str = "data"
    LOGS_DIR: str = "logs"

    # CORS
    CORS_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # All MDM/Tender keywords
    SEARCH_KEYWORDS: List[str] = [
        "Data Cataloguing",
        "codification",
        "master data",
        "Material Codification",
        "Master data management",
        "Material master data cleansing",
        "Implementation of Material Data Governance",
        "Material Data Governance",
        "Data governance solution",
        "Vendor Data Governance software",
        "Material master catalogue",
        "SOFTWARE TOOL FOR MASTER DATA MANAGEMENT",
        "Data Enrichment",
        "codification of material",
        "Supply and implementation of Vendor data",
        "data catalogue",
        "data processing",
        "Data Validation (deduplication, cleansing)",
        "Deduplication, Cleansing and Standardization",
        "Data Cleansing and Enrichment services",
        "Data Standardization",
        "Cataloguing and standardizing",
        "Material codification, Cataloguing and classification",
        "Service master",
        "Vendor master",
        "Asset Master",
        "Asset Verification",
        "bill of material",
        "Material master",
        "data codification",
        "mdm"
    ]


settings = Settings()