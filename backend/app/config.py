from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/medical_app"
    jwt_secret: str = "dev-only-secret-change-me-in-production-0123456789"
    jwt_expire_minutes: int = 480
    upload_dir: str = "uploads"
    access_grant_days: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
