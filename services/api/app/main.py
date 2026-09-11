"""
FastAPI Backend - AI-Based Early Warning and Landslide Risk Monitoring System (NER)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import api_router

app = FastAPI(
    title="Parvaah - Landslide Early Warning System API",
    description="REST API for North Eastern Region (NER) Landslide Risk Monitoring and Early Warning",
    version="1.0.0",
)

# Enable CORS for Next.js web dashboard and Flutter mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint to verify backend service status.
    """
    return {
        "status": "ok",
        "service": "landslide-early-warning-api",
        "region": "NER India",
    }

app.include_router(api_router, prefix="/api/v1")
