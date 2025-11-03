from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    api_title: str = "Skin Cancer Detection API"
    api_version: str = "1.0.0"
    model_path: str = "models/skin_cancer_model.h5"
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")  # Change this in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    allowed_origins: List[str] = [
        "http://localhost",
        "http://localhost:4200",
        "https://skin-cancer-detection-production-3d57.up.railway.app",
        "https://*.onrender.com",  # Allow all Render subdomains
        # Add your specific Render URL here after deployment:
        # "https://your-service-name.onrender.com",
    ]
    
    EMAIL_USER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    FROM_EMAIL: Optional[str] = None
    # MongoDB URI with fallback to memory DB if unavailable
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb+srv://skincancer:skincancerdb@skincancer.oihitsl.mongodb.net/")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "skin_cancer")
    # Use memory DB for development if set to true
    USE_MEMORY_DB: bool = os.getenv("USE_MEMORY_DB", "false").lower() == "true"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
