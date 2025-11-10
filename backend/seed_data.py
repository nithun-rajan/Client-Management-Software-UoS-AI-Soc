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
from app.models.enums import ApplicantStatus, PropertyStatus, TaskStatus
from app.models.landlord import Landlord
from app.models.property import Property
from app.models.vendor import Vendor
from app.models.enums_sales import SalesStatus
from datetime import datetime, timedelta

# Import all models to ensure they're registered with SQLAlchemy
# This ensures all relationships are properly configured
from app.models import (
    Applicant, Landlord, Property, Task, Tenancy, Vendor,
    Communication, Organization, Branch, User, Offer,
    Viewing, MatchHistory, Document, MaintenanceIssue, SalesProgression, SalesOffer
)

# Ensure all mapped classes are loaded

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
            willing_to_rent=True,  # All existing applicants are tenants
            willing_to_buy=False,
        )

        db.add(applicant)
        applicants.append(applicant)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} applicants...")

    db.commit()
    print(f"[OK] Created {count} applicants (tenants)")
    return applicants

def create_buyers(db: Session, count: int = 10):
    """Create realistic buyers (applicants willing to buy)"""
    print(f"\n[*] Creating {count} buyers...")

    uk_postcodes = ["SO14", "SO15", "SO16", "SW1", "SW2", "E1", "E2", "M1", "M2"]

    buyers = []
    for i in range(count):
        bedrooms_min = random.randint(2, 4)
        bedrooms_max = bedrooms_min + random.randint(0, 1)
        desired_bedrooms = f"{bedrooms_min}-{bedrooms_max}"
        # Budget for buying (much higher than rent)
        budget_min = random.randint(200000, 400000)
        budget_max = budget_min + random.randint(50000, 150000)
        
        buyer = Applicant(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            date_of_birth=fake.date_between(start_date='-50y', end_date='-25y'),
            status=ApplicantStatus.NEW,
            desired_bedrooms=desired_bedrooms,
            desired_property_type=random.choice(["flat", "house", "maisonette"]),
            rent_budget_min=budget_min,  # Using rent_budget fields for purchase budget
            rent_budget_max=budget_max,
            preferred_locations=f"{random.choice(uk_postcodes)}, {random.choice(uk_postcodes)}",
            willing_to_rent=False,
            willing_to_buy=True,
            buyer_questions_answered=random.choice([True, True, False]),  # 2/3 have answered
            mortgage_status=random.choice(["not_applied", "applied", "offer_received", "approved"]),
            has_property_to_sell=random.choice([True, False]),
            is_chain_free=random.choice([True, False]),
        )

        db.add(buyer)
        buyers.append(buyer)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} buyers...")

    db.commit()
    print(f"[OK] Created {count} buyers")
    return buyers

def create_properties_for_sale(db: Session, count: int = 15):
    """Create realistic properties for sale"""
    print(f"\n[*] Creating {count} properties for sale...")

    property_types = ["flat", "house", "maisonette"]
    sales_statuses = [SalesStatus.AVAILABLE, SalesStatus.UNDER_OFFER, SalesStatus.SSTC]

    uk_cities = ["Southampton", "London", "Manchester", "Birmingham", "Leeds", "Bristol"]

    properties = []
    for i in range(count):
        city = random.choice(uk_cities)
        property_type = random.choice(property_types)
        bedrooms = random.randint(1, 5)

        address_line1 = fake.street_address()
        address_line2 = fake.secondary_address() if random.choice([True, False]) else None
        
        address_parts = [address_line1]
        if address_line2:
            address_parts.append(address_line2)
        address_parts.append(city)
        full_address = ", ".join(address_parts)
        
        # Calculate realistic asking price based on bedrooms, city, and property type
        base_price = {
            "Southampton": {1: 120000, 2: 180000, 3: 250000, 4: 320000, 5: 400000},
            "London": {1: 350000, 2: 500000, 3: 750000, 4: 1000000, 5: 1500000},
            "Manchester": {1: 100000, 2: 150000, 3: 200000, 4: 280000, 5: 350000},
            "Birmingham": {1: 90000, 2: 140000, 3: 190000, 4: 260000, 5: 330000},
            "Leeds": {1: 90000, 2: 140000, 3: 190000, 4: 260000, 5: 330000},
            "Bristol": {1: 150000, 2: 220000, 3: 300000, 4: 400000, 5: 500000},
        }
        
        city_prices = base_price.get(city, base_price["Southampton"])
        base_price_value = city_prices.get(bedrooms, city_prices.get(5, 200000))
        
        # Add variation (±15%)
        price_variation = random.uniform(0.85, 1.15)
        asking_price = round(base_price_value * price_variation, 0)
        
        # House typically costs more than flat/maisonette
        if property_type == "house":
            asking_price = round(asking_price * 1.2, 0)
        
        property = Property(
            address=full_address,
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            postcode=fake.postcode(),
            status=PropertyStatus.AVAILABLE,  # Base status
            property_type=property_type,
            bedrooms=bedrooms,
            bathrooms=random.randint(1, min(bedrooms, 3)),
            rent=None,  # No rent for sale properties
            asking_price=asking_price,  # Sale price
            sales_status=random.choice(sales_statuses),
            has_valuation_pack=random.choice([True, False, False]),  # 1/3 have valuation packs
            description=fake.text(max_nb_chars=200) if random.choice([True, False]) else None,
            # Add some photo URLs for demo (some properties have photos, some don't)
            main_photo_url=f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800" if random.choice([True, True, False]) else None
        )

        db.add(property)
        properties.append(property)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} properties for sale...")

    db.commit()
    print(f"[OK] Created {count} properties for sale")
    return properties

def create_vendors(db: Session, count: int = 8):
    """Create realistic vendors"""
    print(f"\n[*] Creating {count} vendors...")

    vendors = []
    for i in range(count):
        vendor = Vendor(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            primary_phone=fake.phone_number(),
            current_address=fake.address().replace('\n', ', '),
            date_of_birth=fake.date_between(start_date='-70y', end_date='-25y'),
            nationality="British",
            aml_status=random.choice(["pending", "verified", "verified"]),  # More verified
            status=random.choice(["new", "valuation_booked", "instructed", "active"]),
            source_of_lead=random.choice(["portal", "referral", "board", "past_client", "walk_in"]),
            marketing_consent=random.choice([True, False]),
            vendor_complete_info=random.choice([True, True, False]),  # 2/3 have complete info
        )

        db.add(vendor)
        vendors.append(vendor)

        if (i + 1) % 3 == 0:
            print(f"   Created {i + 1}/{count} vendors...")

    db.commit()
    print(f"[OK] Created {count} vendors")
    return vendors

def create_tasks(db: Session, landlords: list, vendors: list, applicants: list, count: int = 30):
    """Create diverse tasks with different priorities, statuses, and assignments"""
    print(f"\n[*] Creating {count} tasks...")
    
    from app.models.task import Task
    
    # Task templates with variety
    task_templates = [
        # High priority urgent tasks
        {"title": "Follow up on viewing feedback", "priority": "urgent", "status": TaskStatus.TODO},
        {"title": "Complete AML verification", "priority": "urgent", "status": TaskStatus.IN_PROGRESS},
        {"title": "Send contract to client", "priority": "urgent", "status": TaskStatus.TODO},
        {"title": "Schedule property inspection", "priority": "high", "status": TaskStatus.TODO},
        {"title": "Process deposit payment", "priority": "urgent", "status": TaskStatus.IN_PROGRESS},
        
        # Medium priority tasks
        {"title": "Update property listing photos", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Review tenant application", "priority": "medium", "status": TaskStatus.IN_PROGRESS},
        {"title": "Prepare viewing schedule", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Contact landlord about maintenance", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Update CRM records", "priority": "medium", "status": TaskStatus.COMPLETED},
        {"title": "Send welcome email to new tenant", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Schedule property viewing", "priority": "medium", "status": TaskStatus.IN_PROGRESS},
        {"title": "Review offer details", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Prepare tenancy agreement", "priority": "medium", "status": TaskStatus.IN_PROGRESS},
        
        # Low priority tasks
        {"title": "Archive old documents", "priority": "low", "status": TaskStatus.TODO},
        {"title": "Update marketing materials", "priority": "low", "status": TaskStatus.TODO},
        {"title": "Review quarterly reports", "priority": "low", "status": TaskStatus.COMPLETED},
        {"title": "Organize client database", "priority": "low", "status": TaskStatus.TODO},
        {"title": "Plan next month viewings", "priority": "low", "status": TaskStatus.TODO},
        
        # Vendor-related tasks
        {"title": "Verify vendor AML documents", "priority": "high", "status": TaskStatus.TODO},
        {"title": "Schedule property valuation", "priority": "high", "status": TaskStatus.IN_PROGRESS},
        {"title": "Prepare sales instruction contract", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Follow up on vendor inquiry", "priority": "medium", "status": TaskStatus.TODO},
        
        # Tenant/Applicant related tasks
        {"title": "Conduct tenant reference check", "priority": "high", "status": TaskStatus.IN_PROGRESS},
        {"title": "Process tenant application", "priority": "high", "status": TaskStatus.TODO},
        {"title": "Schedule move-in inspection", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Send viewing confirmation", "priority": "medium", "status": TaskStatus.COMPLETED},
        
        # Landlord related tasks
        {"title": "Collect landlord bank details", "priority": "medium", "status": TaskStatus.TODO},
        {"title": "Update landlord contact information", "priority": "low", "status": TaskStatus.TODO},
        {"title": "Schedule property maintenance", "priority": "high", "status": TaskStatus.IN_PROGRESS},
    ]
    
    priorities = ["low", "medium", "high", "urgent"]
    statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED]
    
    # Collect all assignable people
    assignable_people = []
    
    # Add landlords (using full_name)
    for landlord in landlords:
        assignable_people.append(landlord.full_name)
    
    # Add vendors (using first_name + last_name)
    for vendor in vendors:
        assignable_people.append(f"{vendor.first_name} {vendor.last_name}")
    
    # Add applicants (using first_name + last_name)
    for applicant in applicants:
        assignable_people.append(f"{applicant.first_name} {applicant.last_name}")
    
    tasks = []
    for i in range(count):
        # Pick a random template or create a custom one
        if i < len(task_templates):
            template = task_templates[i]
        else:
            # Generate random task
            action_verbs = ["Review", "Process", "Schedule", "Update", "Contact", "Prepare", "Send", "Follow up on"]
            nouns = ["application", "contract", "viewing", "payment", "inspection", "documentation", "inquiry", "feedback"]
            template = {
                "title": f"{random.choice(action_verbs)} {random.choice(nouns)}",
                "priority": random.choice(priorities),
                "status": random.choice(statuses)
            }
        
        # Generate due date (some past, some future, some today)
        days_offset = random.choice([
            -7, -5, -3, -2, -1,  # Past dates
            0,  # Today
            1, 2, 3, 5, 7, 10, 14, 21, 30  # Future dates
        ])
        due_date = datetime.now() + timedelta(days=days_offset)
        # Set time to end of day for due dates
        due_date = due_date.replace(hour=17, minute=0, second=0, microsecond=0)
        
        # Randomly assign to someone (70% chance of assignment)
        assigned_to = None
        if random.random() < 0.7 and assignable_people:
            assigned_to = random.choice(assignable_people)
        
        # Add description sometimes
        description = None
        if random.random() < 0.4:
            descriptions = [
                "Please ensure all documentation is complete before proceeding.",
                "Follow up within 24 hours if no response.",
                "Priority task - needs attention today.",
                "Standard procedure - no rush.",
                "Client has requested urgent action on this matter.",
                "Part of ongoing property management workflow.",
            ]
            description = random.choice(descriptions)
        
        task = Task(
            title=template["title"],
            description=description,
            status=template["status"],
            priority=template["priority"],
            due_date=due_date if random.random() < 0.8 else None,  # 80% have due dates
            assigned_to=assigned_to,
        )
        
        db.add(task)
        tasks.append(task)
        
        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} tasks...")
    
    db.commit()
    print(f"[OK] Created {count} tasks")
    return tasks

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
        properties_rent = create_properties(db, count=20)
        properties_sale = create_properties_for_sale(db, count=15)
        landlords = create_landlords(db, count=10)
        tenants = create_applicants(db, count=15)  # All are tenants
        buyers = create_buyers(db, count=10)
        vendors = create_vendors(db, count=8)
        
        # Create diverse tasks
        tasks = create_tasks(db, landlords, vendors, tenants, count=30)

        # Link landlords to properties-for-let
        print("\n[*] Linking landlords to properties...")
        for i, property in enumerate(properties_rent):
            if landlords:
                property.landlord_id = landlords[i % len(landlords)].id
        db.commit()
        print("[OK] Linked landlords to properties")

        # Link vendors to properties-for-sale
        print("\n[*] Linking vendors to properties-for-sale...")
        for i, vendor in enumerate(vendors):
            if properties_sale and i < len(properties_sale):
                vendor.instructed_property_id = properties_sale[i].id
        db.commit()
        print("[OK] Linked vendors to properties-for-sale")

        # Assign properties to landlords
        print("\n[*] Assigning properties to landlords...")
        for i, property in enumerate(properties_rent):
            # Assign each property to a random landlord
            landlord = random.choice(landlords)
            property.landlord_id = landlord.id
        
        db.commit()
        print("[OK] Properties assigned to landlords")

        # Summary
        print("\n" + "="*60)
        print("[OK] SEEDING COMPLETE!")
        print("="*60)
        print("Summary:")
        print(f"   - {len(properties_rent)} Properties for Letting")
        print(f"   - {len(properties_sale)} Properties for Sale")
        print(f"   - {len(landlords)} Landlords")
        print(f"   - {len(tenants)} Tenants")
        print(f"   - {len(buyers)} Buyers")
        print(f"   - {len(vendors)} Vendors")
        print(f"   - {len(tasks)} Tasks")
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
