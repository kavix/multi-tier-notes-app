from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_user: str = "notes_user"
    postgres_password: str = "notes_password"
    postgres_db: str = "notes_db"
    postgres_host: str = "postgres"
    postgres_port: int = 5432

    redis_host: str = "redis"
    redis_port: int = 6379

    notes_cache_ttl_seconds: int = 10

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
