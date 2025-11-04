from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    SECRET_KEY: str = "hackathon-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # External API keys (optional; required for specific features)
    OPENAI_API_KEY: str | None = None
    DATA_STREET_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env")  # NEW WAY


settings = Settings()
