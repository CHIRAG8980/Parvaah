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
    """Create all tables in the database and ensure schema columns are up to date."""
    Base.metadata.create_all(bind=engine)

    # Ensure all ml_* columns exist in terrain_features
    ml_cols = [
        ("ml_aspect", "FLOAT"),
        ("ml_geomorphology", "FLOAT"),
        ("ml_lineament", "FLOAT"),
        ("ml_lulc", "FLOAT"),
        ("ml_curvature", "FLOAT"),
        ("ml_distance_to_road", "FLOAT"),
        ("ml_distance_to_settlements", "FLOAT"),
        ("ml_distance_to_streams", "FLOAT"),
        ("ml_elevation", "FLOAT"),
        ("ml_ndvi", "FLOAT"),
        ("ml_sar_coherence", "FLOAT"),
        ("ml_sar_intensity", "FLOAT"),
        ("ml_sar_ratio", "FLOAT"),
        ("ml_static_susceptibility", "FLOAT"),
        ("ml_features_source", "VARCHAR(64)"),
        ("ml_features_extracted_at", "TIMESTAMP WITH TIME ZONE"),
    ]

    with engine.begin() as conn:
        for col_name, col_type in ml_cols:
            try:
                conn.execute(
                    text(f"ALTER TABLE terrain_features ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                )
            except Exception:
                try:
                    conn.execute(
                        text(f"ALTER TABLE terrain_features ADD COLUMN {col_name} {col_type};")
                    )
                except Exception:
                    pass

    logger.info("Database schema initialized and columns verified.")

