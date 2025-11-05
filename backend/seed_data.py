"""
Seed script to populate database with realistic test data
Run with: python seed_data.py
"""

import json
import random

from faker import Faker
from sqlalchemy.orm import Session

# Import your database and models
from app.core.database import Base, SessionLocal, engine
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property


fake = Faker("en_GB")


def clear_database():
    """Clear all existing data"""
    print("🗑️  Clearing existing data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Database cleared and recreated")


def create_properties(db: Session, count: int = 20):
    """Create realistic properties"""
    print(f"\n🏠 Creating {count} properties...")

    property_types = ["flat", "house", "maisonette"]
    statuses = ["available", "let_by", "tenanted"]

    uk_cities = [
        "Southampton",
        "London",
        "Manchester",
        "Birmingham",
        "Leeds",
        "Bristol",
    ]

    properties = []
    for i in range(count):
        city = random.choice(uk_cities)
        property_type = random.choice(property_types)
        bedrooms = random.randint(1, 5)

        # ADD THESE LINES HERE
        address_line1 = fake.street_address()
        address_line2 = (
            fake.secondary_address() if random.choice([True, False]) else None
        )

        # Realistic rent based on bedrooms and city
        base_rent = 800 if city != "London" else 1500
        rent = base_rent + (bedrooms * 200) + random.randint(-100, 300)

        # Create full address from components
        full_address = f"{address_line1}, {city}"
        if address_line2:
            full_address = f"{address_line1}, {address_line2}, {city}"

        # Generate property features for matching
        feature_options = [
            "parking",
            "garden",
            "balcony",
            "pets_allowed",
            "near_school",
            "modern",
            "renovated",
            "transport_links",
        ]
        num_features = random.randint(2, 5)
        features = random.sample(feature_options, num_features)
        features_json = json.dumps(features)

        property = Property(
            address=full_address,  # Required field
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            postcode=fake.postcode(),
            status=random.choice(statuses),
            property_type=property_type,
            bedrooms=bedrooms,
            bathrooms=random.randint(1, min(bedrooms, 3)),
            rent=round(rent, 2),
            furnished=random.choice([True, False]),
            features=features_json,
            description=f"Beautiful {property_type} in {city} with {bedrooms} bedrooms. "
            f"{'Modern and spacious' if rent > 1500 else 'Cozy and affordable'} property. "
            f"{'Close to transport links.' if random.choice([True, False]) else 'Quiet neighborhood.'}",
        )

        db.add(property)
        properties.append(property)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} properties...")

    db.commit()
    print(f"✅ Created {count} properties")
    return properties


def create_landlords(db: Session, count: int = 10):
    """Create realistic landlords"""
    print(f"\n👔 Creating {count} landlords...")

    landlords = []
    for i in range(count):
        landlord = Landlord(
            full_name=fake.name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            address=fake.address().replace("\n", ", "),
            aml_verified=random.choice([True, True, True, False]),  # 75% verified
            aml_verification_date=fake.date_between(start_date="-1y", end_date="today")
            if random.choice([True, False])
            else None,
            bank_account_name=fake.name(),
            sort_code=f"{random.randint(10, 99)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
            account_number=f"{random.randint(10000000, 99999999)}",
            notes=f"{'Experienced' if random.choice([True, False]) else 'New'} landlord. "
            f"Owns {random.randint(1, 8)} properties.",
        )

        db.add(landlord)
        landlords.append(landlord)

        if (i + 1) % 3 == 0:
            print(f"   Created {i + 1}/{count} landlords...")

    db.commit()
    print(f"✅ Created {count} landlords")
    return landlords


def create_applicants(db: Session, count: int = 15):
    print(f"\n👥 Creating {count} applicants...")

    statuses = ["new", "qualified", "viewing_booked", "offer_submitted", "let_agreed"]
    cities = ["Southampton", "Manchester", "Bristol", "Leeds", "London"]
    property_types = ["flat", "house", "maisonette"]

    applicants = []
    for i in range(count):
        bedrooms_min = random.randint(1, 3)
        bedrooms_min + random.randint(0, 2)

        rent_min = random.randint(800, 1500)
        rent_max = rent_min + random.randint(500, 1500)

        move_date = fake.date_between(start_date="today", end_date="+3m")
        has_pets = random.choice([True, False, False])

        # Generate realistic special requirements
        requirements = []
        if random.choice([True, False]):
            requirements.append("Near schools")
        if random.choice([True, False]):
            requirements.append("Parking required")
        if random.choice([True, False]):
            requirements.append("Good transport links")

        applicant = Applicant(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            desired_bedrooms=str(bedrooms_min),
            desired_property_type=random.choice(property_types),
            rent_budget_min=rent_min,
            rent_budget_max=rent_max,
            preferred_locations=f"{random.choice(cities)}, {random.choice(cities)}",
            move_in_date=move_date,
            status=random.choice(statuses),
            has_pets=has_pets,
            pet_details="Small dog"
            if has_pets and random.choice([True, False])
            else ("Cat" if has_pets else None),
            special_requirements=", ".join(requirements) if requirements else None,
        )

        db.add(applicant)
        applicants.append(applicant)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} applicants...")

    db.commit()
    print(f"✅ Created {count} applicants")
    return applicants


def main():
    """Main seed function"""
    print("\n" + "=" * 60)
    print("🌱 TEAM 67 CRM - DATABASE SEEDING SCRIPT")
    print("=" * 60)

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
        print("\n" + "=" * 60)
        print("✅ SEEDING COMPLETE!")
        print("=" * 60)
        print("📊 Summary:")
        print(f"   • {len(properties)} Properties")
        print(f"   • {len(landlords)} Landlords")
        print(f"   • {len(applicants)} Applicants")
        print("\n🚀 Your API is now ready for demo!")
        print("   Visit: http://localhost:8000/docs")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
