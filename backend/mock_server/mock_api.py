import random

from faker import Faker
from fastapi import FastAPI


fake = Faker("en_GB")  # UK based fake data
app = FastAPI(
    title="Team 67 Mock API",
    description="Mock API with realistic fake data for parallel development",
    version="1.0.0-mock",
)


# Generate fake properties
def generate_fake_property(property_id: int):
    property_types = ["flat", "house", "maisonette"]
    statuses = ["available", "let_by", "managed"]

    return {
        "id": property_id,
        "address": fake.street_address(),
        "postcode": fake.postcode(),
        "property_type": random.choice(property_types),
        "bedrooms": random.randint(1, 5),
        "bathrooms": random.randint(1, 3),
        "rent": round(random.uniform(800, 3000), 2),
        "status": random.choice(statuses),
        "description": f"Beautiful {random.choice(['modern', 'traditional', 'spacious', 'cozy'])} property in {fake.city()}",
    }


# Generate fake landlords
def generate_fake_landlord(landlord_id: int):
    return {
        "id": landlord_id,
        "full_name": fake.name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "address": fake.address().replace("\n", ", "),
        "aml_verified": random.choice([True, False]),
        "aml_verification_date": fake.date_between(
            start_date="-1y", end_date="today"
        ).isoformat()
        if random.choice([True, False])
        else None,
        "bank_account_name": fake.name(),
        "sort_code": f"{random.randint(10, 99)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
        "account_number": f"{random.randint(10000000, 99999999)}",
        "notes": fake.sentence(),
    }


# Generate fake applicants
def generate_fake_applicant(applicant_id: int):
    statuses = [
        "new",
        "qualified",
        "viewing_booked",
        "offer_submitted",
        "references",
        "let_agreed",
        "archived",
    ]
    move_date = fake.date_between(start_date="today", end_date="+3m")

    return {
        "id": applicant_id,
        "full_name": fake.name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "bedrooms_min": random.randint(1, 3),
        "bedrooms_max": random.randint(2, 5),
        "rent_budget_min": round(random.uniform(800, 1500), 2),
        "rent_budget_max": round(random.uniform(1500, 3000), 2),
        "desired_locations": f"{fake.postcode()}, {fake.postcode()}",
        "move_in_date": move_date.isoformat(),
        "status": random.choice(statuses),
        "references_passed": random.choice([True, False]),
        "right_to_rent_checked": random.choice([True, False]),
        "notes": fake.sentence(),
    }


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Team 67 Mock API Server",
        "status": "mock",
        "version": "1.0.0-mock",
        "note": "This server returns fake data for development purposes",
    }


# Properties endpoints
@app.get("/api/v1/properties")
def list_properties(skip: int = 0, limit: int = 20):
    """Get list of fake properties"""
    return [generate_fake_property(i) for i in range(skip + 1, skip + limit + 1)]


@app.get("/api/v1/properties/{property_id}")
def get_property(property_id: int):
    """Get a single fake property"""
    return generate_fake_property(property_id)


@app.post("/api/v1/properties")
def create_property(property_data: dict):
    """Mock create, returns the data with a fake ID"""
    new_property = property_data.copy()
    new_property["id"] = random.randint(1000, 9999)
    new_property["status"] = "available"
    return new_property


# Landlords endpoints
@app.get("/api/v1/landlords")
def list_landlords(skip: int = 0, limit: int = 20):
    """Get list of fake landlords"""
    return [generate_fake_landlord(i) for i in range(skip + 1, skip + limit + 1)]


@app.get("/api/v1/landlords/{landlord_id}")
def get_landlord(landlord_id: int):
    """Get a single fake landlord"""
    return generate_fake_landlord(landlord_id)


@app.post("/api/v1/landlords")
def create_landlord(landlord_data: dict):
    """Mock create, returns the data with a fake ID"""
    new_landlord = landlord_data.copy()
    new_landlord["id"] = random.randint(1000, 9999)
    new_landlord["aml_verified"] = False
    new_landlord["aml_verification_date"] = None
    return new_landlord


# Applicants endpoints
@app.get("/api/v1/applicants")
def list_applicants(skip: int = 0, limit: int = 20):
    """Get list of fake applicants"""
    return [generate_fake_applicant(i) for i in range(skip + 1, skip + limit + 1)]


@app.get("/api/v1/applicants/{applicant_id}")
def get_applicant(applicant_id: int):
    """Get a single fake applicant"""
    return generate_fake_applicant(applicant_id)


@app.post("/api/v1/applicants")
def create_applicant(applicant_data: dict):
    """Mock create - returns the data with a fake ID"""
    new_applicant = applicant_data.copy()
    new_applicant["id"] = random.randint(1000, 9999)
    new_applicant["status"] = "new"
    new_applicant["references_passed"] = False
    new_applicant["right_to_rent_checked"] = False
    return new_applicant


# Search endpoint (simple mock)
@app.get("/api/v1/search")
def search_properties(
    bedrooms: int | None = None,
    min_rent: float | None = None,
    max_rent: float | None = None,
    postcode: str | None = None,
):
    """Mock search endpoint - returns filtered fake data"""
    # Generate 10 properties
    properties = [generate_fake_property(i) for i in range(1, 11)]

    # Simple filtering
    if bedrooms:
        properties = [p for p in properties if p["bedrooms"] == bedrooms]
    if min_rent:
        properties = [p for p in properties if p["rent"] >= min_rent]
    if max_rent:
        properties = [p for p in properties if p["rent"] <= max_rent]

    return {
        "results": properties,
        "total": len(properties),
        "filters": {
            "bedrooms": bedrooms,
            "min_rent": min_rent,
            "max_rent": max_rent,
            "postcode": postcode,
        },
    }


# Health check
@app.get("/health")
def health():
    return {"status": "ok", "mode": "mock"}
