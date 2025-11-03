from fastapi import status


def test_create_applicant(client):
    """Test creating a new applicant"""
    applicant_data = {
        "full_name": "Sarah Johnson",
        "email": "sarah.j@example.com",
        "phone": "07700900789",
        "bedrooms_min": 2,
        "bedrooms_max": 3,
        "rent_budget_min": 1000.00,
        "rent_budget_max": 1500.00,
        "desired_locations": "SO15, SO16"
    }

    response = client.post("/api/v1/applicants/", json=applicant_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["full_name"] == applicant_data["full_name"]
    assert data["email"] == applicant_data["email"]
    assert data["status"] == "new"
    assert data["references_passed"] == False


def test_create_applicant_duplicate_email(client):
    """Test creating applicant with duplicate email"""
    applicant_data = {
        "full_name": "Test User",
        "email": "duplicate.applicant@example.com"
    }

    client.post("/api/v1/applicants/", json=applicant_data)
    response = client.post("/api/v1/applicants/", json=applicant_data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_update_applicant_status(client):
    """Test updating applicant status"""
    # Create applicant
    applicant_data = {
        "full_name": "Tom Wilson",
        "email": "tom.w@example.com",
        "bedrooms_min": 1,
        "rent_budget_max": 1200.00
    }
    create_response = client.post("/api/v1/applicants/", json=applicant_data)
    applicant_id = create_response.json()["id"]

    # Update status
    update_data = {
        "status": "qualified",
        "references_passed": True
    }
    response = client.put(f"/api/v1/applicants/{applicant_id}", json=update_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "qualified"
    assert data["references_passed"] == True
