"""Main application entrypoint and lifespan management for Parvaah API."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.api.router import api_router


# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("parvaah.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables and real GIS monitoring stations on startup."""
    logger.info("Initializing Parvaah Landslide Early Warning backend...")
    init_db()
    db = SessionLocal()
    try:
        from app.ingest.real_data_loader import run_real_ingestion
        run_real_ingestion(db)
    except Exception as exc:
        logger.warning("GIS station init: %s", exc)
    finally:
        db.close()
    yield
    logger.info("Shutting down Parvaah API service.")



app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for North Eastern Region (NER) Landslide Risk Monitoring and Early Warning",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Apply Security Headers Defense Middleware
from app.security_middleware import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware)

# Enable CORS for Web Dashboard and Flutter clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "ok",
        "service": "parvaah-landslide-early-warning-api",
        "region": "NER India",
        "version": settings.VERSION,
    }


@app.get("/", tags=["Health"])
def root_endpoint():
    """Service landing endpoint with API documentation pointer."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR,
    }


app.include_router(api_router, prefix=settings.API_V1_STR)
