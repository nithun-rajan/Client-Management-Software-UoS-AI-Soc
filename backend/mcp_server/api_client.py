"""HTTP Client for making requests to FastAPI backend"""
import httpx
from typing import Dict, Any, Optional
import sys
from pathlib import Path

# Add parent directory to path for imports
if __name__ != "__main__":
    try:
        from .config import config
    except ImportError:
        # Fallback for direct execution
        parent_dir = Path(__file__).parent
        sys.path.insert(0, str(parent_dir))
        from config import config
else:
    from config import config


class APIClient:
    """Async HTTP client for FastAPI backend"""
    
    def __init__(self):
        self.base_url = config.FASTAPI_BASE_URL
        self.timeout = config.HTTP_TIMEOUT
        self.headers = {
            "Content-Type": "application/json",
        }
        
        # Add API key if configured
        if config.API_KEY:
            self.headers["Authorization"] = f"Bearer {config.API_KEY}"
    
    async def get(
        self, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make GET request to FastAPI"""
        url = config.get_api_url(endpoint)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    url, 
                    params=params, 
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
            except httpx.RequestError as e:
                raise Exception(f"Request error: {str(e)}")
    
    async def post(
        self, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make POST request to FastAPI"""
        url = config.get_api_url(endpoint)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    url, 
                    json=data,
                    params=params,
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
            except httpx.RequestError as e:
                raise Exception(f"Request error: {str(e)}")
    
    async def put(
        self, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make PUT request to FastAPI"""
        url = config.get_api_url(endpoint)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.put(
                    url, 
                    json=data, 
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
            except httpx.RequestError as e:
                raise Exception(f"Request error: {str(e)}")
    
    async def patch(
        self, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make PATCH request to FastAPI"""
        url = config.get_api_url(endpoint)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.patch(
                    url, 
                    json=data, 
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
            except httpx.RequestError as e:
                raise Exception(f"Request error: {str(e)}")
    
    async def delete(
        self, 
        endpoint: str
    ) -> Optional[Dict[str, Any]]:
        """Make DELETE request to FastAPI"""
        url = config.get_api_url(endpoint)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.delete(
                    url, 
                    headers=self.headers
                )
                response.raise_for_status()
                
                # DELETE might return 204 No Content
                if response.status_code == 204:
                    return {"success": True}
                
                return response.json()
            except httpx.HTTPStatusError as e:
                raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
            except httpx.RequestError as e:
                raise Exception(f"Request error: {str(e)}")


# Singleton instance
api_client = APIClient()

