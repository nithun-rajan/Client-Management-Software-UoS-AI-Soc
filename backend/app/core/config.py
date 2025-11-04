from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    IMPORTANT: Never hardcode secrets! Always use environment variables.
    See .env.example for required variables.
    """
    DATABASE_URL: str = "sqlite:///./test.db"
    
    # SECRET_KEY must be set via environment variable
    # For development: Use a test key from .env file
    # For production: Generate a strong key: python -c "import secrets; print(secrets.token_urlsafe(32))"
    # No default value - must be provided via environment variable
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API Keys for external services (optional - only needed for specific features)
    DATA_STREET_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    
    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate secret key is set
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "SECRET_KEY must be set via environment variable and be at least 32 characters long. "
                "Generate a strong key: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )

settings = Settings()
