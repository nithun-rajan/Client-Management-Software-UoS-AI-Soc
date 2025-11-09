# tests/test_sales_progression.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import get_db
from backend.app.main import app
from backend.app.models.sales import SalesProgression, Offer
from backend.app.models.enums_sales import SalesStage, SalesStatus, OfferStatus

# Test data
TEST_PROPERTY_ID = "test-property-123"
TEST_VENDOR_ID = "test-vendor-123" 
TEST_BUYER_ID = "test-buyer-123"

@pytest.fixture
def client():
    # Setup test database
    engine = create_engine("sqlite:///./test.db")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_create_sales_progression(client):
    """Test creating a new sales progression"""
    payload = {
        "property_id": TEST_PROPERTY_ID,
        "vendor_id": TEST_VENDOR_ID,
        "buyer_id": TEST_BUYER_ID,
        "current_stage": SalesStage.OFFER_ACCEPTED,
        "sales_status": SalesStatus.UNDER_OFFER,
        "offer_amount": 250000.00,
        "agreed_price": 245000.00,
        "chain_position": "no_chain"
    }
    
    response = client.post("/api/v1/sales-progression", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["property_id"] == TEST_PROPERTY_ID
    assert data["current_stage"] == SalesStage.OFFER_ACCEPTED
    assert data["offer_amount"] == 250000.00

def test_get_sales_progression(client):
    """Test retrieving sales progression"""
    # First create one
    payload = {
        "property_id": TEST_PROPERTY_ID,
        "vendor_id": TEST_VENDOR_ID, 
        "buyer_id": TEST_BUYER_ID,
        "current_stage": SalesStage.OFFER_ACCEPTED,
        "sales_status": SalesStatus.UNDER_OFFER
    }
    client.post("/api/v1/sales-progression", json=payload)
    
    # Then retrieve it
    response = client.get(f"/api/v1/sales-progression/property/{TEST_PROPERTY_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["property_id"] == TEST_PROPERTY_ID

def test_update_sales_stage(client):
    """Test updating sales progression stage"""
    # Create progression
    payload = {
        "property_id": TEST_PROPERTY_ID,
        "vendor_id": TEST_VENDOR_ID,
        "buyer_id": TEST_BUYER_ID, 
        "current_stage": SalesStage.OFFER_ACCEPTED,
        "sales_status": SalesStatus.UNDER_OFFER
    }
    create_response = client.post("/api/v1/sales-progression", json=payload)
    progression_id = create_response.json()["id"]
    
    # Update stage
    response = client.put(
        f"/api/v1/sales-progression/{progression_id}/stage?stage={SalesStage.SSTC}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_stage"] == SalesStage.SSTC
    assert data["sstc_date"] is not None

def test_create_offer(client):
    """Test creating an offer"""
    payload = {
        "property_id": TEST_PROPERTY_ID,
        "buyer_id": TEST_BUYER_ID,
        "offer_amount": 255000.00,
        "status": OfferStatus.PENDING,
        "is_cash_buyer": True,
        "has_chain": False
    }
    
    response = client.post("/api/v1/offers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["offer_amount"] == 255000.00
    assert data["is_cash_buyer"] == True

def test_get_offers_by_property(client):
    """Test retrieving offers for a property"""
    # Create an offer first
    payload = {
        "property_id": TEST_PROPERTY_ID,
        "buyer_id": TEST_BUYER_ID,
        "offer_amount": 255000.00,
        "status": OfferStatus.PENDING
    }
    client.post("/api/v1/offers", json=payload)
    
    # Get offers for property
    response = client.get(f"/api/v1/offers/property/{TEST_PROPERTY_ID}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["property_id"] == TEST_PROPERTY_ID