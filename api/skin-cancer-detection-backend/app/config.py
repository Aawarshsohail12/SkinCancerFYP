from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    api_title: str = "Skin Cancer Detection API"
    api_version: str = "1.0.0"
    model_path: str = "models/skin_cancer_model.h5"
    secret_key: str = "your-secret-key-here"  # Change this in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    allowed_origins: List[str] = [
        "http://localhost",
        "http://localhost:4200",
        "https://skin-cancer-detection-production-3d57.up.railway.app",
    ]
    
    EMAIL_USER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    FROM_EMAIL: Optional[str] = None
    MONGO_URI: str = "mongodb+srv://skincancer:skincancerdb@skincancer.oihitsl.mongodb.net/"  # Default MongoDB URI
    MONGO_DB_NAME: str = "skin_cancer"  # Default database name

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
