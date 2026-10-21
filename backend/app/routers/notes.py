from __future__ import annotations
"""CRUD endpoints for notes.

All note mutations (create, update, delete) invalidate the Redis cache
and, where applicable, publish a job to the Go worker for async
processing.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Note
from app.redis_client import (
    get_cached_notes,
    invalidate_notes_cache,
    publish_note_job,
    set_cached_notes,
)
from app.schemas import NoteCreate, NoteListResponse, NoteOut, NoteUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notes", tags=["notes"])


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("", response_model=NoteListResponse)
def list_notes(db: Session = Depends(get_db)) -> NoteListResponse:
    """Return all notes, served from Redis cache when available.

    The cache has a 10-second TTL. Cache misses fall through to
    PostgreSQL and the result is written back to the cache.
    """
    cached_notes, ttl_remaining = get_cached_notes()
    if cached_notes is not None:
        return NoteListResponse(
            notes=cached_notes,
            cached=True,
            source="redis-cache",
            ttl_remaining=ttl_remaining,
            count=len(cached_notes),
        )

    notes = db.query(Note).order_by(Note.created_at.desc()).all()
    notes_data = [NoteOut.model_validate(n).model_dump(mode="json") for n in notes]
    set_cached_notes(notes_data)

    return NoteListResponse(
        notes=notes_data,
        cached=False,
        source="postgres",
        ttl_remaining=None,
        count=len(notes_data),
    )


# ---------------------------------------------------------------------------
# Get by ID
# ---------------------------------------------------------------------------


@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: int, db: Session = Depends(get_db)) -> NoteOut:
    """Retrieve a single note by its primary key."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if note is None:
        raise HTTPException(status_code=404, detail=f"Note with id {note_id} not found")
    return NoteOut.model_validate(note)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("", response_model=NoteOut, status_code=201)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)) -> NoteOut:
    """Create a new note and dispatch it to the Go worker for processing.

    The note is initially saved with ``status='pending'``. The Go worker
    will compute ``word_count`` and ``summary`` asynchronously.
    """
    tags_str = ",".join(payload.tags) if isinstance(payload.tags, list) else (payload.tags or "")

    note = Note(
        title=payload.title,
        content=payload.content,
        tags=tags_str,
        status="pending",
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    logger.info("Created note id=%d title='%s'", note.id, note.title)

    # Publish processing job to Go worker
    publish_note_job(note.id, note.content)

    # Invalidate the list cache
    invalidate_notes_cache()

    return NoteOut.model_validate(note)


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)) -> NoteOut:
    """Update an existing note.

    Only the fields present in the request body are modified. After the
    update, a new processing job is published so the Go worker can
    recompute ``word_count`` and ``summary``.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    if note is None:
        raise HTTPException(status_code=404, detail=f"Note with id {note_id} not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "tags" in update_data and update_data["tags"] is not None:
        if isinstance(update_data["tags"], list):
            update_data["tags"] = ",".join(update_data["tags"])

    for field, value in update_data.items():
        setattr(note, field, value)

    # Reset processing status so the worker re-processes
    note.status = "pending"
    note.word_count = None
    note.summary = None

    db.commit()
    db.refresh(note)

    logger.info("Updated note id=%d", note.id)

    # Re-publish for processing
    publish_note_job(note.id, note.content)

    # Invalidate the list cache
    invalidate_notes_cache()

    return NoteOut.model_validate(note)


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note by its primary key."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if note is None:
        raise HTTPException(status_code=404, detail=f"Note with id {note_id} not found")

    db.delete(note)
    db.commit()

    logger.info("Deleted note id=%d", note_id)

    invalidate_notes_cache()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
