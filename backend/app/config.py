"""Application configuration loaded from environment variables.

Uses pydantic-settings for type-safe config with sensible defaults
for local development.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings sourced from environment variables."""

    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "notes_user"
    POSTGRES_PASSWORD: str = "notes_password"
    POSTGRES_DB: str = "notes_db"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def database_url(self) -> str:
        """Build the SQLAlchemy database URL from individual components."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def redis_url(self) -> str:
        """Build the Redis connection URL."""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
