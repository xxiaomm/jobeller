from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://jobell:jobell@localhost:5433/jobell"
    redis_url: str = "redis://localhost:6380/0"
    cors_origins: str = "http://localhost:3001"

    secret_key: str = "dev-secret-key-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8001/api/auth/google/callback"

    frontend_url: str = "http://localhost:3001"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
