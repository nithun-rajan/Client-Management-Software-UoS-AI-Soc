import pytest
from fastapi import status

def test_kpis_endpoint(client):
    """Test KPI dashboard endpoint"""
    # Create some test data
    client.post("/api/v1/properties/", json={
        "address": "KPI Test Property",
        "postcode": "SO15",
        "property_type": "flat",
        "bedrooms": 2,
        "bathrooms": 1,
        "rent": 1200.00,
        "status": "available"
    })
    
    client.post("/api/v1/landlords/", json={
        "full_name": "KPI Test Landlord",
        "email": "kpi@example.com",
        "aml_verified": True
    })
    
    client.post("/api/v1/applicants/", json={
        "full_name": "KPI Test Applicant",
        "email": "kpi.applicant@example.com",
        "references_passed": True
    })
    
    # Get KPIs
    response = client.get("/api/v1/kpis/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check structure
    assert "properties" in data
    assert "landlords" in data
    assert "applicants" in data
    
    # Check property KPIs
    assert data["properties"]["total"] >= 1
    assert data["properties"]["available"] >= 1
    assert "avg_rent" in data["properties"]
    
    # Check landlord KPIs
    assert data["landlords"]["total"] >= 1
    assert "verification_rate" in data["landlords"]
    
    # Check applicant KPIs
    assert data["applicants"]["total"] >= 1