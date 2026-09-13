"""Database connection, engine configuration, and session management."""

import logging
from collections.abc import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("parvaah.database")

Base = declarative_base()


def create_db_engine():
    """Create database engine with fallback handling."""
    primary_url = settings.DATABASE_URL
    try:
        engine = create_engine(
            primary_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected successfully to PostgreSQL database.")
        return engine
    except Exception as exc:
        logger.warning(
            "Failed connecting to PostgreSQL (%s). Falling back to SQLite.",
            exc,
        )
        fallback_engine = create_engine(
            settings.FALLBACK_SQLITE_URL,
            connect_args={"check_same_thread": False},
        )
        return fallback_engine


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")
