from __future__ import annotations
"""Worker status endpoint.

Exposes information about the Go worker's health, the number of jobs
it has processed, and the current queue depth.
"""

import logging

import redis as redis_lib

from fastapi import APIRouter

from app.redis_client import redis_client
from app.schemas import WorkerStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/worker", tags=["worker"])


@router.get("/status", response_model=WorkerStatusResponse)
def worker_status() -> WorkerStatusResponse:
    """Return the Go worker's operational status.

    Checks:
    - ``worker:heartbeat`` — set by the Go worker every 5 seconds.
    - ``worker:processed_count`` — incremented by the Go worker.
    - ``note_jobs_queue`` — Redis list representing pending jobs.
    """
    try:
        # Heartbeat
        heartbeat = redis_client.get("worker:heartbeat")
        status = "online" if heartbeat else "offline"

        # Processed count
        processed_raw = redis_client.get("worker:processed_count")
        processed_count = int(processed_raw) if processed_raw else 0

        # Queue length
        queue_length = redis_client.llen("note_jobs_queue")

        return WorkerStatusResponse(
            queue_length=queue_length,
            processed_count=processed_count,
            worker_status=status,
            last_heartbeat=heartbeat,
        )
    except redis_lib.RedisError:
        logger.exception("Failed to fetch worker status from Redis")
        return WorkerStatusResponse(
            queue_length=0,
            processed_count=0,
            worker_status="offline",
            last_heartbeat=None,
        )
