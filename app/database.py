import time
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

logger = logging.getLogger("notes_app.database")

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_database(max_retries: int = 15, delay_seconds: int = 2):
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as connection:
                logger.info("Successfully connected to PostgreSQL database.")
                return
        except Exception as e:
            logger.warning(
                f"Database connection attempt {attempt}/{max_retries} failed: {e}. Retrying in {delay_seconds}s..."
            )
            time.sleep(delay_seconds)
    raise RuntimeError("Failed to connect to PostgreSQL database after multiple attempts.")
