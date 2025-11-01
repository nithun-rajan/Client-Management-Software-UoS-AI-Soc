import pytest
from fastapi import status

def test_search_properties_by_bedrooms(client):
    """Test searching properties by bedroom count"""
    # Create test properties
    properties = [
        {"address": "1 Bed Flat", "postcode": "SO15", "property_type": "flat", 
         "bedrooms": 1, "bathrooms": 1, "rent": 800.00},
        {"address": "2 Bed Flat", "postcode": "SO16", "property_type": "flat", 
         "bedrooms": 2, "bathrooms": 1, "rent": 1200.00},
        {"address": "3 Bed House", "postcode": "SO17", "property_type": "house", 
         "bedrooms": 3, "bathrooms": 2, "rent": 1500.00}
    ]
    
    for prop in properties:
        client.post("/api/v1/properties/", json=prop)
    
    # Search for 2 bedroom properties
    response = client.get("/api/v1/search/properties?bedrooms=2")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert all(prop["bedrooms"] == 2 for prop in data)


def test_search_properties_by_rent_range(client):
    """Test searching properties by rent range"""
    # Create properties
    properties = [
        {"address": "Cheap Flat", "postcode": "SO15", "property_type": "flat", 
         "bedrooms": 1, "bathrooms": 1, "rent": 700.00},
        {"address": "Mid Flat", "postcode": "SO16", "property_type": "flat", 
         "bedrooms": 2, "bathrooms": 1, "rent": 1100.00},
        {"address": "Expensive House", "postcode": "SO17", "property_type": "house", 
         "bedrooms": 4, "bathrooms": 3, "rent": 2000.00}
    ]
    
    for prop in properties:
        client.post("/api/v1/properties/", json=prop)
    
    # Search for properties between £1000 and £1500
    response = client.get("/api/v1/search/properties?rent_min=1000&rent_max=1500")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert all(1000 <= prop["rent"] <= 1500 for prop in data)


def test_search_properties_by_postcode(client):
    """Test searching properties by postcode"""
    # Create properties
    client.post("/api/v1/properties/", json={
        "address": "Southampton Property", 
        "postcode": "SO15 2AB",
        "property_type": "flat",
        "bedrooms": 2,
        "bathrooms": 1,
        "rent": 1000.00
    })
    
    # Search by postcode
    response = client.get("/api/v1/search/properties?postcode=SO15")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert "SO15" in data[0]["postcode"]


def test_search_count_endpoint(client):
    """Test the search count endpoint"""
    # Create some properties
    for i in range(5):
        client.post("/api/v1/properties/", json={
            "address": f"Property {i}",
            "postcode": f"SO1{i}",
            "property_type": "flat",
            "bedrooms": 2,
            "bathrooms": 1,
            "rent": 1000.00 + (i * 100)
        })
    
    response = client.get("/api/v1/search/properties/count?bedrooms=2")
    
    assert response.status_code == status.HTTP_200_OK
    # Note: Your search.py might be cut off, so this test might need adjustment