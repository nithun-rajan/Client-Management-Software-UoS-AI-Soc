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
from app.models.enums import ApplicantStatus, PropertyStatus, TaskStatus, TicketStatus, TicketUrgency
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
    Viewing, MatchHistory, Document, MaintenanceIssue, SalesProgression, SalesOffer, Ticket
)
from app.core.security import get_password_hash
from app.schemas.user import Role

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
    """Create realistic applicants with criteria that match existing properties"""
    print(f"\n[*] Creating {count} applicants (with property matching in mind)...")

    # Get status values from ApplicantStatus class - focus on active applicants
    statuses = [
        ApplicantStatus.NEW,
        ApplicantStatus.NEW,
        ApplicantStatus.NEW,  # More new applicants for matching
        ApplicantStatus.QUALIFIED,
        ApplicantStatus.VIEWING_BOOKED,
    ]
    
    uk_cities = ["Southampton", "London", "Manchester", "Birmingham", "Leeds", "Bristol"]

    # Define bedroom preferences (mix of exact and ranges)
    bedroom_options = [
        "1", "2", "3", "4",  # Exact matches
        "1-2", "2-3", "3-4",  # Ranges
    ]

    applicants = []
    for i in range(count):
        # Pick bedroom preference
        desired_bedrooms = random.choice(bedroom_options)
        
        # Calculate budget based on bedroom preference
        # This ensures they match the property rent ranges we created
        if "1" in desired_bedrooms:
            rent_min = random.randint(500, 800)
            rent_max = rent_min + random.randint(300, 700)
        elif "2" in desired_bedrooms:
            rent_min = random.randint(700, 1000)
            rent_max = rent_min + random.randint(400, 800)
        elif "3" in desired_bedrooms:
            rent_min = random.randint(900, 1300)
            rent_max = rent_min + random.randint(500, 1000)
        else:  # 4+ bedrooms
            rent_min = random.randint(1200, 1600)
            rent_max = rent_min + random.randint(600, 1200)
        
        # Vary some budgets to create partial matches
        if random.random() < 0.3:  # 30% have tighter budgets
            rent_max = rent_min + random.randint(200, 400)
        
        move_date = fake.date_between(start_date='today', end_date='+3m')
        has_pets = random.choice([True, False, False])  # 1/3 have pets
        has_parking_requirement = random.choice([True, False])
        
        # Create applicant
        applicant = Applicant(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            date_of_birth=fake.date_between(start_date='-40y', end_date='-21y'),
            status=random.choice(statuses),
            desired_bedrooms=desired_bedrooms,
            desired_property_type=random.choice(["flat", "house", "maisonette"]),
            rent_budget_min=rent_min,
            rent_budget_max=rent_max,
            preferred_locations=random.choice(uk_cities),  # Use city names for easier matching
            move_in_date=move_date,
            has_pets=has_pets,
            pet_details=(
                random.choice(["Has a small dog", "Has a cat", "Has two cats"]) 
                if has_pets else None
            ),
            special_requirements=(
                random.choice([
                    "Parking required",
                    "Ground floor preferred",
                    "Near schools",
                    "Good transport links",
                    "Quiet area preferred"
                ]) if random.random() < 0.4 else None
            ),
            willing_to_rent=True,  # All these applicants are tenants
            willing_to_buy=False,
        )

        db.add(applicant)
        applicants.append(applicant)

        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} applicants...")

    db.commit()
    print(f"[OK] Created {count} applicants (tenants) with matching criteria")
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

def create_tickets(db: Session, properties: list, applicants: list, count: int = 25):
    """Create diverse tickets with different statuses, urgencies, priorities, and categories"""
    print(f"\n[*] Creating {count} tickets...")
    
    from app.models.tickets import Ticket
    
    ticket_templates = [
        {"title": "Leaking tap in kitchen", "category": "Plumbing", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.NEW, "priority": "low"},
        {"title": "Boiler not working", "category": "Heating", "urgency": TicketUrgency.URGENT, "status": TicketStatus.OPEN, "priority": "urgent"},
        {"title": "Broken window latch", "category": "Structural", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.IN_PROGRESS, "priority": "medium"},
        {"title": "Faulty electrical socket", "category": "Electrical", "urgency": TicketUrgency.URGENT, "status": TicketStatus.OPEN, "priority": "high"},
        {"title": "Blocked drain", "category": "Plumbing", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.RESOLVED, "priority": "medium"},
        {"title": "Washing machine not draining", "category": "Appliance", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.NEW, "priority": "low"},
        {"title": "No hot water", "category": "Heating", "urgency": TicketUrgency.URGENT, "status": TicketStatus.IN_PROGRESS, "priority": "urgent"},
        {"title": "Cracked tile in bathroom", "category": "Structural", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.NEW, "priority": "low"},
        {"title": "Smoke alarm beeping", "category": "Electrical", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.RESOLVED, "priority": "medium"},
        {"title": "Garden overgrown", "category": "Gardening", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.CLOSED, "priority": "low"},
        {"title": "Front door lock jammed", "category": "Structural", "urgency": TicketUrgency.URGENT, "status": TicketStatus.OPEN, "priority": "high"},
        {"title": "Dishwasher not starting", "category": "Appliance", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.IN_PROGRESS, "priority": "medium"},
        {"title": "Water leak from ceiling", "category": "Plumbing", "urgency": TicketUrgency.EMERGENCY, "status": TicketStatus.OPEN, "priority": "urgent"},
        {"title": "Fridge not cooling", "category": "Appliance", "urgency": TicketUrgency.URGENT, "status": TicketStatus.IN_PROGRESS, "priority": "high"},
        {"title": "Loose banister rail", "category": "Structural", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.NEW, "priority": "medium"},
        {"title": "Flickering lights", "category": "Electrical", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.RESOLVED, "priority": "medium"},
        {"title": "Radiator not heating", "category": "Heating", "urgency": TicketUrgency.URGENT, "status": TicketStatus.OPEN, "priority": "high"},
        {"title": "Toilet not flushing", "category": "Plumbing", "urgency": TicketUrgency.URGENT, "status": TicketStatus.IN_PROGRESS, "priority": "urgent"},
        {"title": "Oven not heating", "category": "Appliance", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.NEW, "priority": "medium"},
        {"title": "Window won't close", "category": "Structural", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.CLOSED, "priority": "low"},
        {"title": "Power cut in one room", "category": "Electrical", "urgency": TicketUrgency.URGENT, "status": TicketStatus.OPEN, "priority": "high"},
        {"title": "Shower head broken", "category": "Plumbing", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.RESOLVED, "priority": "low"},
        {"title": "Central heating not working", "category": "Heating", "urgency": TicketUrgency.EMERGENCY, "status": TicketStatus.IN_PROGRESS, "priority": "urgent"},
        {"title": "Gutter overflowing", "category": "Structural", "urgency": TicketUrgency.NORMAL, "status": TicketStatus.NEW, "priority": "medium"},
        {"title": "Tumble dryer not working", "category": "Appliance", "urgency": TicketUrgency.ROUTINE, "status": TicketStatus.CLOSED, "priority": "low"},
    ]
    
    ticket_categories = ["Plumbing", "Electrical", "Heating", "Structural", "Appliance", "Cleaning", "Gardening", "Decoration", "Emergency", "Other"]
    statuses = [TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED]
    urgencies = [TicketUrgency.ROUTINE, TicketUrgency.NORMAL, TicketUrgency.URGENT, TicketUrgency.EMERGENCY]
    priorities = ["low", "medium", "high", "urgent"]
    
    tickets = []
    for i in range(count):
        # Pick a random template or create a custom one
        if i < len(ticket_templates):
            template = ticket_templates[i]
        else:
            # Generate random ticket
            issues = ["leak", "not working", "broken", "faulty", "blocked", "damaged", "missing", "stuck"]
            locations = ["kitchen", "bathroom", "bedroom", "living room", "hallway", "garden", "basement", "attic"]
            category = random.choice(ticket_categories)
            template = {
                "title": f"{random.choice(issues).capitalize()} {random.choice(locations)}",
                "category": category,
                "urgency": random.choice(urgencies),
                "status": random.choice(statuses),
                "priority": random.choice(priorities)
            }
        
        # Generate reported date (some past, some future, some today)
        days_offset = random.choice([
            -30, -21, -14, -7, -5, -3, -2, -1,  # Past dates
            0,  # Today
            1, 2, 3  # Recent future dates
        ])
        reported_date = datetime.now() + timedelta(days=days_offset)
        reported_date = reported_date.date()  # Convert to date only
        
        # Assign to a random property (required)
        property = random.choice(properties) if properties else None
        if not property:
            continue  # Skip if no properties available
        
        # Randomly assign to an applicant (60% chance)
        applicant = None
        if random.random() < 0.6 and applicants:
            applicant = random.choice(applicants)
        
        # Add description sometimes
        description = None
        if random.random() < 0.5:
            descriptions = [
                "Issue reported by tenant. Please investigate and resolve as soon as possible.",
                "Tenant has reported this issue multiple times. Requires urgent attention.",
                "Standard maintenance request. No rush required.",
                "Emergency situation - please respond immediately.",
                "Part of routine property maintenance schedule.",
                "Tenant has provided photos. Issue visible and needs repair.",
            ]
            description = random.choice(descriptions)
        
        ticket = Ticket(
            title=template["title"],
            description=description,
            status=template["status"],
            urgency=template["urgency"],
            ticket_category=template["category"],
            priority=template["priority"],
            reported_date=reported_date,
            property_id=property.id,
            applicant_id=applicant.id if applicant else None,
            assigned_contractor_id=None,  # Can be assigned later
        )
        
        db.add(ticket)
        tickets.append(ticket)
        
        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} tickets...")
    
    db.commit()
    print(f"[OK] Created {count} tickets")
    return tickets

def create_agents(db: Session, count: int = 5):
    """Create realistic agents (users with AGENT role)"""
    print(f"\n[*] Creating {count} agents...")
    
    # First, create or get an organization
    org = db.query(Organization).filter(Organization.name == "UoS Scouting Challenge").first()
    if not org:
        org = Organization(name="UoS Scouting Challenge")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"   Created organization: {org.name}")
    
    # Agent names and details
    agent_data = [
        {
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@uos-crm.co.uk",
            "title": "Senior Sales & Lettings Manager – Southampton",
        },
        {
            "first_name": "Sarah",
            "last_name": "Johnson",
            "email": "sarah.johnson@uos-crm.co.uk",
            "title": "Lettings Specialist – Southampton",
        },
        {
            "first_name": "Michael",
            "last_name": "Brown",
            "email": "michael.brown@uos-crm.co.uk",
            "title": "Sales Manager – Southampton",
        },
        {
            "first_name": "Emma",
            "last_name": "Davis",
            "email": "emma.davis@uos-crm.co.uk",
            "title": "Property Consultant – Southampton",
        },
        {
            "first_name": "David",
            "last_name": "Wilson",
            "email": "david.wilson@uos-crm.co.uk",
            "title": "Senior Property Advisor – Southampton",
        },
    ]
    
    agents = []
    for i in range(min(count, len(agent_data))):
        agent_info = agent_data[i]
        # Check if agent already exists
        existing = db.query(User).filter(User.email == agent_info["email"]).first()
        if existing:
            agents.append(existing)
            continue
            
        agent = User(
            email=agent_info["email"],
            first_name=agent_info["first_name"],
            last_name=agent_info["last_name"],
            role=Role.AGENT,
            hashed_password=get_password_hash("password123"),  # Default password for all agents
            organization_id=org.id,
            is_active=True,
        )
        
        db.add(agent)
        agents.append(agent)
        
        if (i + 1) % 2 == 0:
            print(f"   Created {i + 1}/{count} agents...")
    
    db.commit()
    print(f"[OK] Created {len(agents)} agents")
    return agents

def create_offers(db: Session, properties: list, applicants: list, count: int = 20):
    """Create diverse offers with different statuses, rent amounts, terms, and dates"""
    print(f"\n[*] Creating {count} offers...")
    
    from app.models.offer import Offer
    
    offer_statuses = ["submitted", "accepted", "rejected", "countered", "withdrawn"]
    term_months_options = [6, 12, 18, 24]
    
    special_conditions_templates = [
        "Pet clause required",
        "Early move-in requested",
        "Furnished property preferred",
        "Parking space required",
        "Garden access essential",
        "No break clause",
        "Flexible start date",
        "Furniture to be removed",
        "Professional cleaning required",
        None, None, None  # More chance of no special conditions
    ]
    
    applicant_notes_templates = [
        "Perfect location for work commute",
        "Love the property, very interested",
        "Looking for long-term tenancy",
        "First-time renter, very excited",
        "Moving for new job opportunity",
        "Family relocating to area",
        "Student accommodation needed",
        "Downsizing from larger property",
        None, None, None  # More chance of no notes
    ]
    
    offers = []
    for i in range(count):
        # Pick a random property (only those with rent set)
        property = random.choice([p for p in properties if p.rent])
        asking_rent = property.rent
        
        # Pick a random applicant
        applicant = random.choice(applicants)
        
        # Generate offered rent (some above asking, some below, some at asking)
        rent_variation = random.choice([
            -0.15, -0.10, -0.05, -0.02,  # Below asking
            0,  # At asking
            0.02, 0.05, 0.10  # Above asking
        ])
        offered_rent = round(asking_rent * (1 + rent_variation), 2)
        
        # Pick status (weighted towards submitted)
        status_weights = {
            "submitted": 0.4,
            "accepted": 0.2,
            "rejected": 0.15,
            "countered": 0.15,
            "withdrawn": 0.1
        }
        status = random.choices(
            list(status_weights.keys()),
            weights=list(status_weights.values())
        )[0]
        
        # Generate proposed start date (some past, some future)
        days_offset = random.choice([
            -30, -21, -14, -7,  # Past dates
            0,  # Today
            7, 14, 21, 30, 45, 60, 90  # Future dates
        ])
        proposed_start_date = datetime.now() + timedelta(days=days_offset)
        proposed_start_date = proposed_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Pick term
        proposed_term_months = random.choice(term_months_options)
        
        # Generate submitted date (before start date)
        submitted_days_before = random.randint(1, 60)
        submitted_at = proposed_start_date - timedelta(days=submitted_days_before)
        submitted_at = submitted_at.replace(hour=random.randint(9, 17), minute=random.randint(0, 59))
        
        # Set responded_at and accepted_at based on status
        responded_at = None
        accepted_at = None
        if status in ["accepted", "rejected", "countered"]:
            responded_at = submitted_at + timedelta(days=random.randint(1, 7))
            if status == "accepted":
                accepted_at = responded_at
        
        # Counter offer rent (if countered)
        counter_offer_rent = None
        if status == "countered":
            counter_variation = random.choice([0.02, 0.05, 0.10])
            counter_offer_rent = round(offered_rent * (1 + counter_variation), 2)
        
        # Special conditions
        special_conditions = random.choice(special_conditions_templates)
        
        # Applicant notes
        applicant_notes = random.choice(applicant_notes_templates)
        
        # Agent notes (for some offers)
        agent_notes = None
        if status in ["accepted", "rejected", "countered"] and random.random() < 0.5:
            agent_notes_templates = [
                "Applicant passed all checks",
                "Landlord requested higher rent",
                "Property condition concerns",
                "Excellent tenant profile",
                "References pending",
                "Deposit received",
            ]
            agent_notes = random.choice(agent_notes_templates)
        
        # Holding deposit (for accepted offers)
        holding_deposit_paid = False
        holding_deposit_amount = None
        holding_deposit_date = None
        if status == "accepted" and random.random() < 0.7:
            holding_deposit_paid = True
            holding_deposit_amount = round(offered_rent * 0.1, 2)  # 10% of rent
            holding_deposit_date = accepted_at + timedelta(days=random.randint(1, 3))
        
        offer = Offer(
            property_id=property.id,
            applicant_id=applicant.id,
            offered_rent=offered_rent,
            proposed_start_date=proposed_start_date,
            proposed_term_months=proposed_term_months,
            status=status,
            counter_offer_rent=counter_offer_rent,
            special_conditions=special_conditions,
            applicant_notes=applicant_notes,
            agent_notes=agent_notes,
            holding_deposit_paid=holding_deposit_paid,
            holding_deposit_amount=holding_deposit_amount,
            holding_deposit_date=holding_deposit_date,
            submitted_at=submitted_at,
            responded_at=responded_at,
            accepted_at=accepted_at,
        )
        
        db.add(offer)
        offers.append(offer)
        
        if (i + 1) % 5 == 0:
            print(f"   Created {i + 1}/{count} offers...")
    
    db.commit()
    print(f"[OK] Created {count} offers")
    return offers

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

        # Create agents first (they might be needed for assignments)
        agents = create_agents(db, count=5)
        
        # Create all data
        properties_rent = create_properties(db, count=20)
        properties_sale = create_properties_for_sale(db, count=15)
        landlords = create_landlords(db, count=10)
        tenants = create_applicants(db, count=15)  # All are tenants
        buyers = create_buyers(db, count=10)
        vendors = create_vendors(db, count=8)
        
        # Create diverse tasks
        tasks = create_tasks(db, landlords, vendors, tenants, count=30)
        
        # Create diverse tickets
        all_properties = properties_rent + properties_sale
        tickets = create_tickets(db, all_properties, tenants, count=25)
        
        # Create diverse offers (only for letting properties)
        offers = create_offers(db, properties_rent, tenants, count=20)

        # Link landlords to properties-for-let (ensure no sales_status)
        print("\n[*] Linking landlords to properties for letting...")
        for i, property in enumerate(properties_rent):
            if landlords:
                property.landlord_id = landlords[i % len(landlords)].id
            # Ensure properties for letting don't have sales_status
            property.sales_status = None
            property.vendor_id = None
        db.commit()
        print("[OK] Linked landlords to properties for letting")

        # Link vendors to properties-for-sale (set vendor_id on property)
        print("\n[*] Linking vendors to properties-for-sale...")
        for i, property in enumerate(properties_sale):
            if vendors:
                # Assign vendor to property
                vendor = vendors[i % len(vendors)]
                property.vendor_id = vendor.id
            # Ensure properties for sale don't have landlord_id
            property.landlord_id = None
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

        # Create test user for login (agent.test@example.com)
        print("\n" + "="*60)
        print("[*] Creating test user for login...")
        print("="*60)
        
        try:
            # Use the same organization that was created for agents (or create it if it doesn't exist)
            test_org = db.query(Organization).filter(Organization.name == "UoS Scouting Challenge").first()
            if not test_org:
                # Fallback to any existing organization
                test_org = db.query(Organization).first()
                if not test_org:
                    test_org = Organization(name="UoS Scouting Challenge")
                    db.add(test_org)
                    db.commit()
                    db.refresh(test_org)
            
            # Create or get test agent
            agent_email = "agent.test@example.com"
            test_agent = db.query(User).filter(User.email == agent_email).first()
            if not test_agent:
                test_agent = User(
                    email=agent_email,
                    first_name="John",
                    last_name="Agent",
                    role=Role.AGENT,
                    hashed_password=get_password_hash("testpassword123"),
                    organization_id=test_org.id,
                    is_active=True
                )
                db.add(test_agent)
                db.commit()
                db.refresh(test_agent)
                print(f"[OK] Created test agent: {test_agent.email}")
                print(f"     Organization: {test_org.name}")
                print(f"     Password: testpassword123")
            else:
                print(f"[OK] Test agent already exists: {test_agent.email}")
                print(f"     Organization: {test_org.name}")
            
            # Assign some applicants to test agent
            if tenants:
                assigned_count = 0
                for applicant in tenants[:3]:  # Assign first 3
                    if not applicant.assigned_agent_id:
                        applicant.assigned_agent_id = test_agent.id
                        applicant.notes = f"Test assignment to {test_agent.first_name} {test_agent.last_name}"
                        assigned_count += 1
                db.commit()
                if assigned_count > 0:
                    print(f"[OK] Assigned {assigned_count} applicants to test agent")
            
            print("[OK] Test user setup complete")
        except Exception as e:
            print(f"[WARNING] Could not create test user: {e}")
            import traceback
            traceback.print_exc()
            print("   You can create it manually by running: python create_test_data.py")
        
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
        print(f"   - {len(tickets)} Tickets")
        print(f"   - {len(offers)} Offers")
        print(f"   - {len(agents)} Agents")
        print("\n" + "="*60)
        print("🔐 LOGIN CREDENTIALS:")
        print("="*60)
        print("Test User (Agent):")
        print("   Email: agent.test@example.com")
        print("   Password: testpassword123")
        print("\nAlternative Agents (from seed):")
        print("   Email: john.smith@uos-crm.co.uk")
        print("   Password: password123")
        print("   (and other agents with same password)")
        print("\n[*] Your API is now ready for demo!")
        print("   Visit: http://localhost:8000/docs")
        print("   Frontend: http://localhost:8080")
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
