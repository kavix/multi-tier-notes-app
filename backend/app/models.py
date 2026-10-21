from __future__ import annotations
"""SQLAlchemy ORM models for the notes application."""

from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.database import Base


class Note(Base):
    """Represents a note in the system.

    Attributes:
        id: Auto-incrementing primary key.
        title: Short title for the note.
        content: Full text content of the note.
        tags: Comma-separated tag strings for categorisation.
        word_count: Word count computed asynchronously by the Go worker.
        summary: AI-generated summary computed by the Go worker.
        status: Processing status — one of 'pending', 'processing', 'completed'.
        created_at: Timestamp when the note was first created.
        updated_at: Timestamp of the most recent update.
    """

    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String(500), nullable=True, default="")
    word_count = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Note(id={self.id}, title='{self.title}', status='{self.status}')>"
