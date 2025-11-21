"""Configuration for MCP Server"""
import os
from typing import Optional

class Config:
    """MCP Server Configuration"""
    
    # FastAPI backend URL
    FASTAPI_BASE_URL: str = os.getenv("FASTAPI_BASE_URL", "http://localhost:8000")
    
    # MCP Server settings
    MCP_SERVER_NAME: str = "crm-mcp-server"
    MCP_SERVER_VERSION: str = "1.0.0"
    MCP_SERVER_PORT: int = int(os.getenv("MCP_SERVER_PORT", "8001"))
    
    # HTTP Client settings
    HTTP_TIMEOUT: int = 30  # seconds
    HTTP_MAX_RETRIES: int = 3
    
    # Authentication (for future use)
    API_KEY: Optional[str] = os.getenv("API_KEY", None)
    
    @classmethod
    def get_api_url(cls, endpoint: str) -> str:
        """Build full API URL from endpoint"""
        # Remove leading slash if present to avoid double slashes
        endpoint = endpoint.lstrip("/")
        return f"{cls.FASTAPI_BASE_URL}/{endpoint}"


config = Config()

