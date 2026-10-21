"""SQLAlchemy database engine and session management.

Provides a session factory and a FastAPI dependency for injecting
database sessions into route handlers.
"""

import logging
from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, Any, None]:
    """FastAPI dependency that yields a database session.

    The session is automatically closed when the request completes,
    regardless of whether an exception occurred.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
