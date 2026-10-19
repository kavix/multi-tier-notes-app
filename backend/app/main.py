import json
import logging
from contextlib import asynccontextmanager
from typing import Optional

import redis
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from .config import settings
from .database import engine, Base, get_db, wait_for_database
from .models import Note
from .schemas import (
    NoteCreate,
    NoteOut,
    NotesListResponse,
    VisitResponse,
    HealthResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notes_app.main")

# Redis connection pool
redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    decode_responses=True
)

REDIS_VISIT_KEY = "visit_counter"
REDIS_NOTES_CACHE_KEY = "notes_cache"

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing multi-tier notes backend...")
    # Wait for PostgreSQL and create tables
    try:
        wait_for_database()
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")

    # Verify Redis connectivity
    try:
        redis_client.ping()
        logger.info("Successfully connected to Redis.")
    except Exception as e:
        logger.warning(f"Initial Redis connection warning: {e}")

    yield
    logger.info("Shutting down backend...")

app = FastAPI(
    title="Multi-Tier Notes API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    postgres_status = "ok"
    redis_status = "ok"

    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"PostgreSQL health check failed: {e}")
        postgres_status = "down"

    try:
        redis_client.ping()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "down"

    overall_status = "ok" if (postgres_status == "ok" and redis_status == "ok") else "degraded"
    return HealthResponse(
        status=overall_status,
        postgres=postgres_status,
        redis=redis_status
    )

@app.get("/api/visits", response_model=VisitResponse)
def count_visit():
    """
    Increments and retrieves the global visit counter in Redis.
    """
    try:
        current_visits = redis_client.incr(REDIS_VISIT_KEY)
        return VisitResponse(visits=current_visits, source="redis")
    except Exception as e:
        logger.error(f"Failed to increment visit count in Redis: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis visit counter unavailable"
        )

@app.get("/api/notes", response_model=NotesListResponse)
def get_notes(db: Session = Depends(get_db)):
    """
    Retrieves notes with a 10-second Redis cache layer.
    """
    # 1. Try reading from Redis cache
    try:
        cached_data = redis_client.get(REDIS_NOTES_CACHE_KEY)
        if cached_data is not None:
            notes_list = json.loads(cached_data)
            ttl = redis_client.ttl(REDIS_NOTES_CACHE_KEY)
            return NotesListResponse(
                notes=notes_list,
                cached=True,
                source="redis-cache",
                ttl_remaining=ttl if ttl >= 0 else None,
                count=len(notes_list)
            )
    except Exception as e:
        logger.warning(f"Redis cache read error (falling back to database): {e}")

    # 2. Cache miss: Query PostgreSQL
    db_notes = db.query(Note).order_by(Note.created_at.desc()).all()
    notes_out = [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "created_at": n.created_at.isoformat()
        }
        for n in db_notes
    ]

    # 3. Store in Redis with 10s TTL
    try:
        redis_client.setex(
            REDIS_NOTES_CACHE_KEY,
            settings.notes_cache_ttl_seconds,
            json.dumps(notes_out)
        )
    except Exception as e:
        logger.warning(f"Failed to save notes to Redis cache: {e}")

    return NotesListResponse(
        notes=notes_out,
        cached=False,
        source="postgres",
        ttl_remaining=settings.notes_cache_ttl_seconds,
        count=len(notes_out)
    )

@app.post("/api/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    """
    Persists note in PostgreSQL and invalidates Redis cache.
    """
    new_note = Note(
        title=payload.title.strip(),
        content=payload.content.strip()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    # Invalidate Redis cache so subsequent reads immediately reflect the new note
    try:
        redis_client.delete(REDIS_NOTES_CACHE_KEY)
    except Exception as e:
        logger.warning(f"Failed to invalidate Redis notes cache: {e}")

    return new_note
