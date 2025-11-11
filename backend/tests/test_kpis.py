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
<<<<<<< HEAD
    assert "landlords" in data
    assert "applicants" in data
=======
    assert "properties_letting" in data
    assert "properties_sale" in data
    assert "landlords" in data
    assert "applicants" in data
    assert "tenants" in data
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

    # Check property KPIs
    assert data["properties"]["total"] >= 1
    assert data["properties"]["available"] >= 1
    assert "avg_rent" in data["properties"]

<<<<<<< HEAD
=======
    # check letting kpis
    letting = data["properties_letting"]
    assert letting["total"] >= 0
    assert letting["available"] >= 0
    assert "avg_rent" in letting

    # check sale kpis include new metrics
    sales = data["properties_sale"]
    assert "avg_price_per_bedroom" in sales
    assert "price_comparison" in sales
    assert "listing_to_sales" in sales
    assert set(sales["price_comparison"].keys()) == {
        "avg_asking_price",
        "avg_achieved_price",
        "achievement_rate",
        "price_gap",
    }

    listing_to_sales = sales["listing_to_sales"]
    assert {"total_listed", "total_completed", "conversion_rate", "total_losses", "loss_breakdown"}.issubset(
        listing_to_sales.keys()
    )

>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    # Check landlord KPIs
    assert data["landlords"]["total"] >= 1
    assert "verification_rate" in data["landlords"]

    # Check applicant KPIs
    assert data["applicants"]["total"] >= 1
