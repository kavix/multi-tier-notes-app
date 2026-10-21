"""Redis client singleton and helper utilities.

Provides a shared Redis connection used across the application for
caching, pub/sub, and visit counting.
"""

import json
import logging
from typing import Any

import redis

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level Redis client — initialised on first import.
redis_client: redis.Redis = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry_on_timeout=True,
)

# ---------------------------------------------------------------------------
# Cache constants
# ---------------------------------------------------------------------------

NOTES_CACHE_KEY = "cache:notes:all"
NOTES_CACHE_TTL = 10  # seconds
VISIT_COUNTER_KEY = "visits:counter"

# ---------------------------------------------------------------------------
# Pub/Sub channels
# ---------------------------------------------------------------------------

NOTE_JOBS_CHANNEL = "note_jobs"
NOTE_RESULTS_CHANNEL = "note_results"


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def publish_note_job(note_id: int, content: str) -> None:
    """Publish a processing job to the note_jobs Redis channel.

    The Go worker subscribes to this channel and will pick up the job
    to compute word count and generate a summary.

    Args:
        note_id: The database ID of the note.
        content: The full text content of the note.
    """
    message = json.dumps({
        "action": "process",
        "note_id": note_id,
        "content": content,
    })
    try:
        redis_client.publish(NOTE_JOBS_CHANNEL, message)
        logger.info("Published job for note_id=%d to %s", note_id, NOTE_JOBS_CHANNEL)
    except redis.RedisError:
        logger.exception("Failed to publish job for note_id=%d", note_id)


def invalidate_notes_cache() -> None:
    """Delete the cached notes list so the next request fetches fresh data."""
    try:
        redis_client.delete(NOTES_CACHE_KEY)
        logger.debug("Invalidated notes cache key %s", NOTES_CACHE_KEY)
    except redis.RedisError:
        logger.exception("Failed to invalidate notes cache")


def get_cached_notes() -> tuple[list[dict[str, Any]] | None, int | None]:
    """Retrieve the cached notes list and its remaining TTL.

    Returns:
        A tuple of (cached_notes_list_or_None, ttl_remaining_or_None).
    """
    try:
        cached = redis_client.get(NOTES_CACHE_KEY)
        if cached is not None:
            ttl = redis_client.ttl(NOTES_CACHE_KEY)
            return json.loads(cached), max(ttl, 0)
    except redis.RedisError:
        logger.exception("Redis error while reading notes cache")
    return None, None


def set_cached_notes(notes_data: list[dict[str, Any]]) -> None:
    """Store the notes list in the cache with the configured TTL."""
    try:
        redis_client.setex(NOTES_CACHE_KEY, NOTES_CACHE_TTL, json.dumps(notes_data, default=str))
    except redis.RedisError:
        logger.exception("Redis error while writing notes cache")


def increment_visits() -> int:
    """Atomically increment and return the visit counter."""
    return redis_client.incr(VISIT_COUNTER_KEY)


def check_redis_health() -> bool:
    """Return True if Redis is reachable."""
    try:
        return redis_client.ping()
    except redis.RedisError:
        return False


def check_worker_health() -> bool:
    """Return True if the Go worker heartbeat key exists in Redis."""
    try:
        return redis_client.exists("worker:heartbeat") > 0
    except redis.RedisError:
        return False
