from __future__ import annotations
"""Health-check and visit-counter endpoints."""

import logging

from fastapi import APIRouter
from sqlalchemy import text

from app.database import SessionLocal
from app.redis_client import check_redis_health, check_worker_health, increment_visits
from app.schemas import HealthResponse, VisitsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Return the health status of PostgreSQL, Redis, and the Go worker.

    Each dependency is checked independently; the overall ``status`` is
    ``"ok"`` only when all three are healthy, otherwise ``"degraded"``.
    """
    # PostgreSQL
    pg_status = "down"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        pg_status = "ok"
    except Exception:
        logger.exception("PostgreSQL health check failed")
    finally:
        try:
            db.close()
        except Exception:
            pass

    # Redis
    redis_status = "ok" if check_redis_health() else "down"

    # Worker heartbeat
    worker_status = "ok" if check_worker_health() else "down"

    overall = "ok" if all(s == "ok" for s in (pg_status, redis_status, worker_status)) else "degraded"

    return HealthResponse(
        status=overall,
        postgres=pg_status,
        redis=redis_status,
        worker=worker_status,
    )


@router.get("/visits", response_model=VisitsResponse)
def get_visits() -> VisitsResponse:
    """Atomically increment and return the global visit counter stored in Redis."""
    count = increment_visits()
    return VisitsResponse(visits=count, source="redis")
