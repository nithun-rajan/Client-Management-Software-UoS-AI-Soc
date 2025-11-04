from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    SECRET_KEY: str = "hackathon-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API Keys for external services
    DATA_STREET_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    
    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env")  # NEW WAY

settings = Settings()
