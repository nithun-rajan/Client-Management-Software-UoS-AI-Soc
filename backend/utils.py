#!/usr/bin/env python3
"""
Consolidated Utility Scripts for Database Management

This script consolidates all utility functions for:
- Assigning data to users/agents
- Generating test data
- Maintenance operations
- Query operations

Usage:
    python utils.py <command> [arguments]

Commands:
    assign-demo <user_email>          - Distribute demo data evenly across all agents
    assign-agents                     - Assign agents to vendors, buyers, landlords, applicants
    assign-applicants <email> [count] - Assign applicants to a specific user
    assign-to-user <email> [%]        - Assign percentage of vendors/buyers to user
    redistribute <email>              - Redistribute vendors/buyers to user from coworkers
    generate-tasks <email> [count]    - Generate tasks for a user
    find-and-generate <first> <last>  - Find user by name and generate tasks
    create-test-data                  - Create test organization and agent
    clear-photos                      - Clear all property photos
    get-orgs                          - List all organizations
"""

import sys
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.vendor import Vendor
from app.models.landlord import Landlord
from app.models.applicant import Applicant
from app.models.property import Property
from app.models.task import Task
from app.models.maintenance import MaintenanceIssue, MaintenanceStatus, MaintenancePriority, MaintenanceType
from app.models.tickets import Ticket, TicketStatus, TicketUrgency
from app.models.organization import Organization
from app.schemas.user import Role
from app.core.security import get_password_hash
from datetime import datetime, timedelta, timezone
from collections import defaultdict

# ============================================================================
# ASSIGNMENT UTILITIES
# ============================================================================

def assign_demo_to_test_user(db: Session, user_email: str = "agent.test@example.com"):
    """Assign comprehensive demo data evenly across all agents in the team."""
    # Import from the original file (these large functions remain in separate files for now)
    try:
        from assign_demo_to_test_user import assign_demo_to_test_user as original_func
        return original_func(db, user_email)
    except ImportError:
        print("[ERROR] assign_demo_to_test_user.py not found")
        return False


def assign_agents(db: Session):
    """Assign agents to vendors, buyers, landlords, and applicants."""
    # Import from the original file (these large functions remain in separate files for now)
    try:
        from assign_agents import assign_agents as original_func
        return original_func(db)
    except ImportError:
        print("[ERROR] assign_agents.py not found")
        return False


def assign_applicants_to_user(db: Session, user_email: str, count: int = 3):
    """Assign applicants to a specific user."""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        print(f"[ERROR] User with email {user_email} not found")
        return False
    
    print(f"[*] Found user: {user.first_name} {user.last_name} ({user.email})")
    
    applicants = db.query(Applicant).filter(
        (Applicant.assigned_agent_id.is_(None)) | 
        (Applicant.assigned_agent_id != user.id)
    ).limit(count).all()
    
    if not applicants:
        applicants = db.query(Applicant).limit(count).all()
    
    if not applicants:
        print(f"[ERROR] No applicants found in database")
        return False
    
    print(f"\n[*] Assigning {len(applicants)} applicants to {user.first_name}...")
    
    for applicant in applicants:
        applicant.assigned_agent_id = user.id
        applicant.notes = f"Assigned to {user.first_name} {user.last_name}"
        if applicants.index(applicant) == 0:
            applicant.last_contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
        print(f"   [OK] Assigned: {applicant.first_name} {applicant.last_name}")
    
    db.commit()
    print(f"\n[OK] Successfully assigned {len(applicants)} applicants")
    return True


def assign_to_user(db: Session, user_email: str, percentage: float = 0.25):
    """Assign a percentage of vendors and buyers to the specified user."""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        print(f"ERROR: User with email '{user_email}' not found!")
        return False
    
    all_vendors = db.query(Vendor).filter(Vendor.managed_by.isnot(None)).all()
    all_buyers = db.query(Applicant).filter(
        Applicant.assigned_agent_id.isnot(None),
        ((Applicant.buyer_type.isnot(None)) | (Applicant.willing_to_buy == True))
    ).all()
    
    vendors_to_redistribute = [v for v in all_vendors if v.managed_by != user.id]
    buyers_to_redistribute = [b for b in all_buyers if b.assigned_agent_id != user.id]
    
    vendors_to_assign = max(1, int(len(vendors_to_redistribute) * percentage))
    buyers_to_assign = max(1, int(len(buyers_to_redistribute) * percentage))
    
    for vendor in vendors_to_redistribute[:vendors_to_assign]:
        vendor.managed_by = user.id
        print(f"  ✓ Assigned vendor: {vendor.first_name} {vendor.last_name}")
    
    for buyer in buyers_to_redistribute[:buyers_to_assign]:
        buyer.assigned_agent_id = user.id
        print(f"  ✓ Assigned buyer: {buyer.first_name} {buyer.last_name}")
    
    db.commit()
    print(f"\n[OK] Successfully assigned {vendors_to_assign} vendors and {buyers_to_assign} buyers")
    return True


def redistribute_to_user(db: Session, user_email: str = None):
    """Redistribute vendors and buyers to the specified user from coworkers."""
    agents = db.query(User).filter(
        User.role == Role.AGENT,
        User.is_active == True
    ).order_by(User.first_name, User.last_name).all()
    
    if len(agents) < 2:
        print(f"ERROR: Need at least 2 agents, but only found {len(agents)}")
        return False
    
    user = None
    if user_email:
        user = db.query(User).filter(User.email == user_email, User.role == Role.AGENT, User.is_active == True).first()
    else:
        for agent in agents:
            if agent.first_name and agent.first_name.lower() == "tom" and agent.last_name and agent.last_name.lower() == "smith":
                user = agent
                break
    
    if not user:
        print("ERROR: Could not find the specified user")
        return False
    
    coworkers = [a for a in agents if a.id != user.id]
    coworker_ids = [c.id for c in coworkers]
    
    vendors_from_coworkers = db.query(Vendor).filter(Vendor.managed_by.in_(coworker_ids)).all()
    buyers_from_coworkers = db.query(Applicant).filter(
        Applicant.assigned_agent_id.in_(coworker_ids),
        ((Applicant.buyer_type.isnot(None)) | (Applicant.willing_to_buy == True))
    ).all()
    
    vendors_to_assign = max(1, len(vendors_from_coworkers) // 4)
    buyers_to_assign = max(1, len(buyers_from_coworkers) // 4)
    
    for vendor in vendors_from_coworkers[:vendors_to_assign]:
        vendor.managed_by = user.id
        print(f"  [OK] Assigned vendor: {vendor.first_name} {vendor.last_name}")
    
    for buyer in buyers_from_coworkers[:buyers_to_assign]:
        buyer.assigned_agent_id = user.id
        print(f"  [OK] Assigned buyer: {buyer.first_name} {buyer.last_name}")
    
    db.commit()
    print(f"\n[OK] Successfully redistributed {vendors_to_assign} vendors and {buyers_to_assign} buyers")
    return True


# ============================================================================
# DATA GENERATION UTILITIES
# ============================================================================

def generate_my_tasks(db: Session, user_email: str, count: int = 10):
    """Generate tasks assigned to a specific user."""
    from app.models.enums import TaskStatus
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        print(f"[ERROR] User with email {user_email} not found")
        return False
    
    user_full_name = f"{user.first_name} {user.last_name}"
    print(f"[*] Found user: {user_full_name} ({user.email})")
    
    task_templates = [
        {"title": "Follow up on viewing feedback", "priority": "urgent", "status": TaskStatus.TODO},
        {"title": "Complete AML verification", "priority": "urgent", "status": TaskStatus.IN_PROGRESS},
        {"title": "Send contract to client", "priority": "urgent", "status": TaskStatus.TODO},
        {"title": "Schedule property inspection", "priority": "high", "status": TaskStatus.TODO},
        {"title": "Process deposit payment", "priority": "urgent", "status": TaskStatus.IN_PROGRESS},
    ]
    
    priorities = ["low", "medium", "high", "urgent"]
    statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED]
    
    print(f"\n[*] Generating {count} tasks for {user_full_name}...")
    
    for i in range(count):
        if i < len(task_templates):
            template = task_templates[i]
        else:
            action_verbs = ["Review", "Process", "Schedule", "Update", "Contact"]
            nouns = ["application", "contract", "viewing", "payment", "inspection"]
            template = {
                "title": f"{random.choice(action_verbs)} {random.choice(nouns)}",
                "priority": random.choice(priorities),
                "status": random.choice(statuses)
            }
        
        days_offset = random.choice([-2, -1, 0, 1, 2, 3, 5, 7, 10])
        due_date = datetime.now() + timedelta(days=days_offset)
        due_date = due_date.replace(hour=17, minute=0, second=0, microsecond=0)
        
        task = Task(
            title=template["title"],
            description=None,
            status=template["status"],
            priority=template["priority"],
            due_date=due_date if random.random() < 0.9 else None,
            assigned_to=user_full_name,
        )
        
        db.add(task)
        print(f"   Created task: {task.title}")
    
    db.commit()
    print(f"\n[OK] Created {count} tasks assigned to {user_full_name}")
    return True


def find_and_generate_tasks(db: Session, first_name: str, last_name: str):
    """Find user by name and generate tasks."""
    user = db.query(User).filter(
        User.first_name == first_name,
        User.last_name == last_name
    ).first()
    
    if not user:
        print(f"[ERROR] User '{first_name} {last_name}' not found")
        return False
    
    print(f"[*] Found user: {user.first_name} {user.last_name} ({user.email})")
    return generate_my_tasks(db, user.email, 15)


def create_test_data(db: Session):
    """Create test organization, user, and assign applicants."""
    org = db.query(Organization).filter(Organization.name == "Test Agency").first()
    if not org:
        org = Organization(name="Test Agency")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"[OK] Created organization: {org.id}")
    else:
        print(f"[OK] Using existing organization: {org.id}")
    
    agent_email = "agent.test@example.com"
    agent = db.query(User).filter(User.email == agent_email).first()
    if not agent:
        agent = User(
            email=agent_email,
            first_name="John",
            last_name="Agent",
            role=Role.AGENT,
            hashed_password=get_password_hash("testpassword123"),
            organization_id=org.id,
            is_active=True
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
        print(f"[OK] Created agent: {agent.id} ({agent.email})")
    else:
        print(f"[OK] Using existing agent: {agent.id} ({agent.email})")
    
    applicants = db.query(Applicant).limit(5).all()
    if applicants:
        for applicant in applicants[:3]:
            applicant.assigned_agent_id = agent.id
            applicant.notes = f"Test assignment to {agent.first_name} {agent.last_name}"
        if applicants:
            applicants[0].last_contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
        db.commit()
        print(f"[OK] Assigned {min(3, len(applicants))} applicants to agent")
    
    print("\n[OK] TEST DATA CREATED SUCCESSFULLY!")
    return True


# ============================================================================
# MAINTENANCE UTILITIES
# ============================================================================

def clear_property_photos(db: Session):
    """Clear all property photos from the database."""
    properties = db.query(Property).all()
    print(f"[*] Found {len(properties)} properties")
    
    updated_count = 0
    for property in properties:
        if property.main_photo_url or property.photo_urls:
            property.main_photo_url = None
            property.photo_urls = None
            updated_count += 1
    
    db.commit()
    print(f"[OK] Cleared photos from {updated_count} properties")
    return True


# ============================================================================
# QUERY UTILITIES
# ============================================================================

def get_organizations(db: Session):
    """List all organizations."""
    orgs = db.query(Organization).all()
    
    if orgs:
        for org in orgs:
            print(f"\nOrganization: {org.name}")
            print(f"  ID: {org.id}")
            print(f"  Created: {org.created_at}")
    else:
        print("\n[WARNING] No organizations found!")
    
    return True


# ============================================================================
# MAIN CLI
# ============================================================================

def main():
    """Main entry point for CLI."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    db = SessionLocal()
    
    try:
        if command == "assign-demo":
            user_email = sys.argv[2] if len(sys.argv) > 2 else "agent.test@example.com"
            success = assign_demo_to_test_user(db, user_email)
            sys.exit(0 if success else 1)
        
        elif command == "assign-agents":
            success = assign_agents(db)
            sys.exit(0 if success else 1)
        
        elif command == "assign-applicants":
            if len(sys.argv) < 3:
                print("Usage: python utils.py assign-applicants <email> [count]")
                sys.exit(1)
            user_email = sys.argv[2]
            count = int(sys.argv[3]) if len(sys.argv) > 3 else 3
            success = assign_applicants_to_user(db, user_email, count)
            sys.exit(0 if success else 1)
        
        elif command == "assign-to-user":
            if len(sys.argv) < 3:
                print("Usage: python utils.py assign-to-user <email> [percentage]")
                sys.exit(1)
            user_email = sys.argv[2]
            percentage = float(sys.argv[3]) if len(sys.argv) > 3 else 0.25
            success = assign_to_user(db, user_email, percentage)
            sys.exit(0 if success else 1)
        
        elif command == "redistribute":
            user_email = sys.argv[2] if len(sys.argv) > 2 else None
            success = redistribute_to_user(db, user_email)
            sys.exit(0 if success else 1)
        
        elif command == "generate-tasks":
            if len(sys.argv) < 3:
                print("Usage: python utils.py generate-tasks <email> [count]")
                sys.exit(1)
            user_email = sys.argv[2]
            count = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            success = generate_my_tasks(db, user_email, count)
            sys.exit(0 if success else 1)
        
        elif command == "find-and-generate":
            if len(sys.argv) < 4:
                print("Usage: python utils.py find-and-generate <first_name> <last_name>")
                sys.exit(1)
            first_name = sys.argv[2]
            last_name = sys.argv[3]
            success = find_and_generate_tasks(db, first_name, last_name)
            sys.exit(0 if success else 1)
        
        elif command == "create-test-data":
            success = create_test_data(db)
            sys.exit(0 if success else 1)
        
        elif command == "clear-photos":
            success = clear_property_photos(db)
            sys.exit(0 if success else 1)
        
        elif command == "get-orgs":
            success = get_organizations(db)
            sys.exit(0 if success else 1)
        
        else:
            print(f"Unknown command: {command}")
            print(__doc__)
            sys.exit(1)
    
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

