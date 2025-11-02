import pytest
from fastapi import status

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Team 67 CRM API"
    assert data["version"] == "1.0.0"


def test_landing_page(client):
    """Test landing page loads"""
    response = client.get("/")
    
    assert response.status_code == status.HTTP_200_OK
    assert "Team 67" in response.text
    assert "Estate Agency CRM API" in response.text


def test_api_docs(client):
    """Test API documentation is accessible"""
    response = client.get("/docs")
    assert response.status_code == status.HTTP_200_OK


def test_openapi_json(client):
    """Test OpenAPI schema is accessible"""
    response = client.get("/openapi.json")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == "🏢 Team 67 Estate Agency CRM"