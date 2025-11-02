import pytest
from fastapi import status

def test_create_property(client):
    """Test creating a new property"""
    property_data = {
        "address": "123 Test Street",
        "postcode": "SO15 2AB",
        "property_type": "flat",
        "bedrooms": 2,
        "bathrooms": 1,
        "rent": 1200.00,
        "description": "Beautiful test property"
    }
    
    response = client.post("/api/v1/properties/", json=property_data)
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["address"] == property_data["address"]
    assert data["postcode"] == property_data["postcode"]
    assert data["status"] == "available"
    assert "id" in data


def test_list_properties(client):
    """Test listing all properties"""
    # Create a property first
    property_data = {
        "address": "456 Another Street",
        "postcode": "SO16 3CD",
        "property_type": "house",
        "bedrooms": 3,
        "bathrooms": 2,
        "rent": 1500.00
    }
    client.post("/api/v1/properties/", json=property_data)
    
    # List properties
    response = client.get("/api/v1/properties/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_property(client):
    """Test getting a specific property"""
    # Create a property
    property_data = {
        "address": "789 Test Avenue",
        "postcode": "SO17 4EF",
        "property_type": "maisonette",
        "bedrooms": 2,
        "bathrooms": 1,
        "rent": 1000.00
    }
    create_response = client.post("/api/v1/properties/", json=property_data)
    property_id = create_response.json()["id"]
    
    # Get the property
    response = client.get(f"/api/v1/properties/{property_id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == property_id
    assert data["address"] == property_data["address"]


def test_update_property(client):
    """Test updating a property"""
    # Create a property
    property_data = {
        "address": "Update Test Street",
        "postcode": "SO18 5GH",
        "property_type": "flat",
        "bedrooms": 1,
        "bathrooms": 1,
        "rent": 900.00
    }
    create_response = client.post("/api/v1/properties/", json=property_data)
    property_id = create_response.json()["id"]
    
    # Update the property
    update_data = {
        "rent": 950.00,
        "status": "let_by"
    }
    response = client.put(f"/api/v1/properties/{property_id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["rent"] == 950.00
    assert data["status"] == "let_by"


def test_delete_property(client):
    """Test deleting a property"""
    # Create a property
    property_data = {
        "address": "Delete Test Street",
        "postcode": "SO19 6IJ",
        "property_type": "house",
        "bedrooms": 4,
        "bathrooms": 2,
        "rent": 2000.00
    }
    create_response = client.post("/api/v1/properties/", json=property_data)
    property_id = create_response.json()["id"]
    
    # Delete the property
    response = client.delete(f"/api/v1/properties/{property_id}")
    
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify it's deleted
    get_response = client.get(f"/api/v1/properties/{property_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_get_nonexistent_property(client):
    """Test getting a property that doesn't exist"""
    response = client.get("/api/v1/properties/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND