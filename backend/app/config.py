from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/medical_app"
    jwt_secret: str = "dev-only-secret-change-me-in-production-0123456789"
    jwt_expire_minutes: int = 480
    upload_dir: str = "uploads"
    access_grant_days: int = 30
    # Clinic EHR import (/external/ehr)
    clinic_api_key: str = "dev-clinic-key-change-me"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    # Vertex AI via gcloud Application Default Credentials — used instead of
    # the API key when an ADC file is available.
    google_application_credentials: str = ""
    google_cloud_project: str = ""
    google_cloud_location: str = "global"

    class Config:
        env_file = ".env"


settings = Settings()
