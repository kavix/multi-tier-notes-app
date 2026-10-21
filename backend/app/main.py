from __future__ import annotations
"""FastAPI application entry-point.

Configures logging, registers routers, creates database tables on
startup, and manages the background worker-listener thread via
the FastAPI lifespan context manager.
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import health, notes, worker
from app.worker_listener import start_listener, stop_listener

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage startup and shutdown tasks.

    Startup:
        1. Create all database tables (if they don't exist yet).
        2. Launch the background thread that listens for Go worker results.

    Shutdown:
        1. Gracefully stop the listener thread.
    """
    logger.info("Starting up — creating database tables …")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready")

    logger.info("Starting worker-results listener …")
    start_listener()

    yield  # ← application is running

    logger.info("Shutting down — stopping worker-results listener …")
    stop_listener()
    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Multi-Tier Notes API",
    description="FastAPI backend for the multi-tier notes application. "
    "Notes are processed asynchronously by a Go worker via Redis pub/sub.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins in development; tighten in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health.router)
app.include_router(notes.router)
app.include_router(worker.router)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    """Root endpoint — confirms the API is reachable."""
    return {"message": "Multi-Tier Notes API", "docs": "/docs"}
