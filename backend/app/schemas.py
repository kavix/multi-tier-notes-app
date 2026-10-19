from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Note title")
    content: str = Field(..., min_length=1, description="Note body content")

class NoteOut(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class NotesListResponse(BaseModel):
    notes: List[NoteOut]
    cached: bool
    source: str
    ttl_remaining: Optional[int] = None
    count: int

class VisitResponse(BaseModel):
    visits: int
    source: str = "redis"

class HealthResponse(BaseModel):
    status: str
    postgres: str
    redis: str
