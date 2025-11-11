from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./test.db"
    
    # Security
    SECRET_KEY: str = "hackathon-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    DATA_STREET_API_KEY: Optional[str] = None

    # Email Service
    SENDGRID_API_KEY: Optional[str] = None
    DEFAULT_FROM_EMAIL: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")  # NEW WAY


    
settings = Settings()
    

