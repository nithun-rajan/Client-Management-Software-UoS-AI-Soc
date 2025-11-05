from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Get the root directory (3 levels up from this file: config.py -> core -> app -> backend -> root)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    SECRET_KEY: str = "hackathon-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Data.Street API Configuration
    # Can be set as DATA_STREET_API_KEY or X_API_KEY in .env file
    DATA_STREET_API_KEY: str = ""

    # OpenAI API Configuration
    OPENAI_API_KEY: str = ""  # Set in .env file for AI-powered rent estimation

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
