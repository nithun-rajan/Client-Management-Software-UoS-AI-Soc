"""
Seed script to populate database with realistic test data
Run with: python seed_data.py
"""

import random

from faker import Faker
from sqlalchemy.orm import Session

# Import your database and models
from app.core.database import Base, SessionLocal, engine
from app.models.applicant import Applicant
from app.models.enums import ApplicantStatus, PropertyStatus
from app.models.landlord import Landlord
from app.models.property import Property


# Ensure all mapped classes are loaded; avoid importing unused models directly

fake = Faker('en_GB')

def clear_database():
    """Clear all existing data"""
    print("[*] Clearing existing data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Database cleared and recreated")

def create_properties(db: Session, count: int = 20):
    """Create realistic properties"""
    print(f"\n[*] Creating {count} properties...")

    property_types = ["flat", "house", "maisonette"]
    statuses = [PropertyStatus.AVAILABLE, PropertyStatus.LET_BY, PropertyStatus.TENANTED]

    uk_cities = ["Southampton", "London", "Manchester", "Birmingham", "Leeds", "Bristol"]

    properties = []
    for i in range(count):
        city = random.choice(uk_cities)
        property_type = random.choice(property_types)
        bedrooms = random.randint(1, 5)

        address_line1 = fake.street_address()
        address_line2 = fake.secondary_address() if random.choice([True, False]) else None
        
        # Construct full address for the required 'address' field
        address_parts = [address_line1]
        if address_line2:
            address_parts.append(address_line2)
        address_parts.append(city)
        full_address = ", ".join(address_parts)
        
        # Calculate realistic rent based on bedrooms, city, and property type
        base_rent = {
            "Southampton": {1: 600, 2: 800, 3: 1100, 4: 1400, 5: 1700},
            "London": {1: 1200, 2: 1800, 3: 2500, 4: 3200, 5: 4000},
            "Manchester": {1: 500, 2: 700, 3: 950, 4: 1200, 5: 1500},
            "Birmingham": {1: 450, 2: 650, 3: 850, 4: 1100, 5: 1350},
            "Leeds": {1: 450, 2: 650, 3: 850, 4: 1100, 5: 1350},
            "Bristol": {1: 650, 2: 900, 3: 1200, 4: 1500, 5: 1800},
        }
        
        city_rents = base_rent.get(city, base_rent["Southampton"])
        base_rent_value = city_rents.get(bedrooms, city_rents.get(5, 1000))
        
        # Add variation (±20%)
        rent_variation = random.uniform(0.8, 1.2)
        rent = round(base_rent_value * rent_variation, 0)
        
        # House typically costs more than flat/maisonette
        if property_type == "house":
            rent = round(rent * 1.15, 0)
        
        property = Property(
            address=full_address,  # Required field
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            postcode=fake.postcode(),
            status=random.choice(statuses),
            property_type=property_type,
            bedrooms=bedrooms,  # Integer, not string
            bathrooms=random.randint(1, min(bedrooms, 3)),  # Integer, not string
            rent=rent,  # Set realistic rent value
            asking_rent=round(rent * 1.05, 0),  # Asking rent is typically 5% higher
            description=fake.text(max_nb_chars=200) if random.choice([True, False]) else None
        )

        db.add(property)
        properties.append(property)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} properties...")

    db.commit()
    print(f"[OK] Created {count} properties")
    return properties

def create_landlords(db: Session, count: int = 10):
    """Create realistic landlords"""
    print(f"\n[*] Creating {count} landlords...")

    landlords = []
    for i in range(count):
        landlord = Landlord(
            full_name=fake.name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            address=fake.address().replace('\n', ', '),
            aml_verified=random.choice([True, True, True, False]),  # 75% verified
            aml_verification_date=fake.date_between(start_date='-1y', end_date='today') if random.choice([True, False]) else None,
            bank_account_name=fake.name(),
            sort_code=f"{random.randint(10,99)}-{random.randint(10,99)}-{random.randint(10,99)}",
            account_number=f"{random.randint(10000000,99999999)}",
            notes=f"{'Experienced' if random.choice([True, False]) else 'New'} landlord. "
                f"Owns {random.randint(1, 8)} properties."
        )

        db.add(landlord)
        landlords.append(landlord)

        if (i + 1) % 3 == 0:
            print(f"   Created {i + 1}/{count} landlords...")

    db.commit()
    print(f"[OK] Created {count} landlords")
    return landlords

def create_applicants(db: Session, count: int = 15):
    """Create realistic applicants"""
    print(f"\n[*] Creating {count} applicants...")

    # Get status values from ApplicantStatus class
    statuses = [
        ApplicantStatus.NEW,
        ApplicantStatus.QUALIFIED,
        ApplicantStatus.VIEWING_BOOKED,
        ApplicantStatus.OFFER_SUBMITTED,
        ApplicantStatus.OFFER_ACCEPTED,
        ApplicantStatus.REFERENCES,
        ApplicantStatus.LET_AGREED,
        ApplicantStatus.TENANCY_STARTED,
        ApplicantStatus.ARCHIVED,
    ]
    uk_postcodes = ["SO14", "SO15", "SO16", "SW1", "SW2", "E1", "E2", "M1", "M2"]

    applicants = []
    for i in range(count):
        bedrooms_min = random.randint(1, 3)
        bedrooms_max = bedrooms_min + random.randint(0, 2)
        desired_bedrooms = f"{bedrooms_min}-{bedrooms_max}"
        rent_min = random.randint(800, 1500)
        rent_max = rent_min + random.randint(500, 1500)
        move_date = fake.date_between(start_date='today', end_date='+3m')
        has_pets = random.choice([True, False])
        applicant = Applicant(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            date_of_birth=fake.date_between(start_date='-40y', end_date='-18y'),
            status=random.choice(statuses),
            desired_bedrooms=desired_bedrooms,
            desired_property_type=random.choice(["flat", "house", "maisonette"]),
            rent_budget_min=rent_min,
            rent_budget_max=rent_max,
            preferred_locations=f"{random.choice(uk_postcodes)}, {random.choice(uk_postcodes)}",
            move_in_date=move_date,
            has_pets=has_pets,
            pet_details=("Has a small dog" if has_pets else None),
            special_requirements=("Ground floor preferred" if random.choice([True, False]) else None),
        )

        db.add(applicant)
        applicants.append(applicant)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} applicants...")

    db.commit()
    print(f"[OK] Created {count} applicants")
    return applicants

def main():
    """Main seed function"""
    print("\n" + "="*60)
    print("TEAM 67 CRM - DATABASE SEEDING SCRIPT")
    print("="*60)

    # Create database session
    db = SessionLocal()

    try:
        # Clear existing data
        clear_database()

        # Create all data
        properties = create_properties(db, count=20)
        landlords = create_landlords(db, count=10)
        applicants = create_applicants(db, count=15)

        # Summary
        print("\n" + "="*60)
        print("[OK] SEEDING COMPLETE!")
        print("="*60)
        print("Summary:")
        print(f"   - {len(properties)} Properties")
        print(f"   - {len(landlords)} Landlords")
        print(f"   - {len(applicants)} Applicants")
        print("\n[*] Your API is now ready for demo!")
        print("   Visit: http://localhost:8000/docs")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n[ERROR] Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
