from __future__ import annotations
"""Background listener for Go worker results.

Runs a dedicated thread that subscribes to the ``note_results`` Redis
pub/sub channel. When the Go worker finishes processing a note it
publishes a JSON payload containing the computed ``word_count`` and
``summary``. This listener picks up those messages and persists them
to PostgreSQL.
"""

import json
import logging
import threading
from typing import Any

import redis

from app.config import settings
from app.database import SessionLocal
from app.models import Note
from app.redis_client import invalidate_notes_cache

logger = logging.getLogger(__name__)

_listener_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _handle_result(message_data: dict[str, Any]) -> None:
    """Update a note in the database with the worker's results.

    Args:
        message_data: Parsed JSON payload from the Go worker containing
            at minimum ``note_id``, and optionally ``word_count`` and
            ``summary``.
    """
    note_id = message_data.get("note_id")
    if note_id is None:
        logger.warning("Received result without note_id: %s", message_data)
        return

    word_count = message_data.get("word_count")
    summary = message_data.get("summary")

    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note is None:
            logger.warning("Note id=%d not found in DB, skipping result", note_id)
            return

        if word_count is not None:
            note.word_count = word_count
        if summary is not None:
            note.summary = summary
        note.status = "completed"

        db.commit()
        logger.info(
            "Updated note id=%d with word_count=%s, summary length=%d",
            note_id,
            word_count,
            len(summary) if summary else 0,
        )

        # Invalidate notes cache so updated word_count/summary are returned immediately
        try:
            invalidate_notes_cache()
        except Exception:
            pass

    except Exception:
        db.rollback()
        logger.exception("Failed to update note id=%d with worker results", note_id)
    finally:
        db.close()


def _listen_loop() -> None:
    """Subscribe to ``note_results`` and dispatch incoming messages.

    This function runs in its own thread and blocks on the pub/sub
    ``listen()`` iterator. It exits cleanly when ``_stop_event`` is set
    and automatically reconnects on transient Redis failures.
    """
    logger.info("Worker listener thread started")

    while not _stop_event.is_set():
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=0,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            pubsub = r.pubsub()
            pubsub.subscribe("note_results")
            logger.info("Subscribed to 'note_results' channel")

            for message in pubsub.listen():
                if _stop_event.is_set():
                    break

                if message["type"] != "message":
                    continue

                try:
                    data = json.loads(message["data"])
                    logger.debug("Received worker result: %s", data)
                    _handle_result(data)
                except json.JSONDecodeError:
                    logger.warning("Non-JSON message on note_results: %s", message["data"])
                except Exception:
                    logger.exception("Error processing worker result message")

            pubsub.unsubscribe()
            pubsub.close()
        except redis.RedisError:
            if _stop_event.is_set():
                break
            logger.warning("Redis connection lost in listener, reconnecting in 3s …")
            _stop_event.wait(3)
        except Exception:
            if _stop_event.is_set():
                break
            logger.exception("Unexpected error in listener loop, retrying in 5s …")
            _stop_event.wait(5)

    logger.info("Worker listener thread stopped")


def start_listener() -> None:
    """Start the background listener thread (idempotent)."""
    global _listener_thread

    if _listener_thread is not None and _listener_thread.is_alive():
        logger.debug("Listener thread is already running")
        return

    _stop_event.clear()
    _listener_thread = threading.Thread(target=_listen_loop, name="worker-listener", daemon=True)
    _listener_thread.start()
    logger.info("Worker listener thread launched")


def stop_listener() -> None:
    """Signal the listener thread to stop and wait for it to terminate."""
    global _listener_thread

    if _listener_thread is None:
        return

    logger.info("Stopping worker listener thread …")
    _stop_event.set()
    _listener_thread.join(timeout=10)
    if _listener_thread.is_alive():
        logger.warning("Listener thread did not terminate within timeout")
    _listener_thread = None
