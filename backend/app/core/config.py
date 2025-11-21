from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    SECRET_KEY: str = "hackathon-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str
    
    # Security
    BCRYPT_ROUNDS: int = 12
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    DATA_STREET_API_KEY: Optional[str] = None

    # Email Service
    SENDGRID_API_KEY: Optional[str] = None
    DEFAULT_FROM_EMAIL: Optional[str] = None

    # AI Call Agent (Ultravox + Twilio)
    ULTRAVOX_API_KEY: Optional[str] = None
    ULTRAVOX_AGENT_ID: Optional[str] = None  # Ultravox Agent ID for calls
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None  # Your Twilio phone in E.164 format (e.g., +14155552671)
    # Referencing service
    REFERENCING_API_KEY : Optional[str] = None
    REFERENCING_API_URL : Optional[str] = None

    # Deposit service
    DEPOSIT_API_KEY : Optional[str] = None
    DEPOSIT_API_URL : Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")  # NEW WAY


    
settings = Settings()
    

