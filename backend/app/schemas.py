"""Pydantic schemas for request/response validation.

Separates input (create/update) schemas from the output schema
to control which fields are exposed in API responses.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------


class NoteCreate(BaseModel):
    """Schema for creating a new note."""

    title: str = Field(..., min_length=1, max_length=255, description="Note title")
    content: str = Field(..., min_length=1, description="Note body text")
    tags: str | None = Field(default="", max_length=500, description="Comma-separated tags")


class NoteUpdate(BaseModel):
    """Schema for updating an existing note.

    All fields are optional — only supplied fields will be updated.
    """

    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    tags: str | None = Field(default=None, max_length=500)


# ---------------------------------------------------------------------------
# Output schemas
# ---------------------------------------------------------------------------


class NoteOut(BaseModel):
    """Schema returned to the client for a single note."""

    id: int
    title: str
    content: str
    tags: str | None
    word_count: int | None
    summary: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteListResponse(BaseModel):
    """Response wrapper for the list-notes endpoint."""

    notes: list[NoteOut]
    cached: bool
    source: str
    ttl_remaining: int | None
    count: int


class HealthResponse(BaseModel):
    """Response for the health-check endpoint."""

    status: str
    postgres: str
    redis: str
    worker: str


class VisitsResponse(BaseModel):
    """Response for the visit-counter endpoint."""

    visits: int
    source: str


class WorkerStatusResponse(BaseModel):
    """Response for the worker-status endpoint."""

    queue_length: int
    processed_count: int
    worker_status: str
    last_heartbeat: str | None
