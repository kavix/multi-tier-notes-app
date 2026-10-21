"""Pydantic schemas for request/response validation.

Separates input (create/update) schemas from the output schema
to control which fields are exposed in API responses.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------


class NoteCreate(BaseModel):
    """Schema for creating a new note."""

    title: str = Field(..., min_length=1, max_length=255, description="Note title")
    content: str = Field(..., min_length=1, description="Note body text")
    tags: Optional[Union[List[str], str]] = Field(default_factory=list, description="Tags list or comma-separated tags")

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: Any) -> list[str]:
        if v is None:
            return []
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        if isinstance(v, list):
            return [str(t).strip() for t in v if str(t).strip()]
        return []


class NoteUpdate(BaseModel):
    """Schema for updating an existing note.

    All fields are optional — only supplied fields will be updated.
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = Field(default=None, min_length=1)
    tags: Optional[Union[List[str], str]] = Field(default=None)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: Any) -> Optional[list[str]]:
        if v is None:
            return None
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        if isinstance(v, list):
            return [str(t).strip() for t in v if str(t).strip()]
        return None


# ---------------------------------------------------------------------------
# Output schemas
# ---------------------------------------------------------------------------


class NoteOut(BaseModel):
    """Schema returned to the client for a single note."""

    id: int
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)
    word_count: Optional[int] = None
    summary: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags_for_out(cls, v: Any) -> list[str]:
        if v is None:
            return []
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        if isinstance(v, list):
            return [str(t).strip() for t in v if str(t).strip()]
        return []

    model_config = ConfigDict(from_attributes=True)


class NoteListResponse(BaseModel):
    """Response wrapper for the list-notes endpoint."""

    notes: List[NoteOut]
    cached: bool
    source: str
    ttl_remaining: Optional[int] = None
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
    last_heartbeat: Optional[str] = None
