import pytest
from fastapi import status

def test_create_landlord(client):
    """Test creating a new landlord"""
    landlord_data = {
        "full_name": "John Smith",
        "email": "john.smith@example.com",
        "phone": "07700900123",
        "address": "10 Landlord Lane, Southampton"
    }
    
    response = client.post("/api/v1/landlords/", json=landlord_data)
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["full_name"] == landlord_data["full_name"]
    assert data["email"] == landlord_data["email"]
    assert data["aml_verified"] == False
    assert "id" in data


def test_create_landlord_duplicate_email(client):
    """Test creating landlord with duplicate email"""
    landlord_data = {
        "full_name": "Jane Doe",
        "email": "duplicate@example.com",
        "phone": "07700900456"
    }
    
    # Create first landlord
    client.post("/api/v1/landlords/", json=landlord_data)
    
    # Try to create duplicate
    response = client.post("/api/v1/landlords/", json=landlord_data)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"].lower()


def test_list_landlords(client):
    """Test listing all landlords"""
    # Create landlords
    landlords = [
        {"full_name": "Alice Johnson", "email": "alice@example.com"},
        {"full_name": "Bob Williams", "email": "bob@example.com"}
    ]
    
    for landlord in landlords:
        client.post("/api/v1/landlords/", json=landlord)
    
    response = client.get("/api/v1/landlords/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2


def test_update_landlord_aml_status(client):
    """Test updating landlord AML verification"""
    # Create landlord
    landlord_data = {
        "full_name": "Charlie Brown",
        "email": "charlie@example.com"
    }
    create_response = client.post("/api/v1/landlords/", json=landlord_data)
    landlord_id = create_response.json()["id"]
    
    # Update AML status
    update_data = {
        "aml_verified": True,
        "aml_verification_date": "2025-11-01"
    }
    response = client.put(f"/api/v1/landlords/{landlord_id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["aml_verified"] == True