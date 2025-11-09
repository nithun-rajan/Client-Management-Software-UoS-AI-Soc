"""
Quick script to create test data for My Applicants feature
Creates organization, user (agent), and assigns applicants
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.user import User
from app.models.applicant import Applicant
from app.models.communication import Communication
from app.core.security import get_password_hash
from app.schemas.user import Role
from datetime import datetime, timezone, timedelta
import uuid

def create_test_data():
    """Create test organization, user, and assign applicants"""
    db = SessionLocal()
    
    try:
        print("[*] Creating test organization...")
        # Create or get organization
        org = db.query(Organization).filter(Organization.name == "Test Agency").first()
        if not org:
            org = Organization(name="Test Agency")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"[OK] Created organization: {org.id}")
        else:
            print(f"[OK] Using existing organization: {org.id}")
        
        print("\n[*] Creating test agent user...")
        # Create or get test agent
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
        
        print("\n[*] Getting applicants...")
        applicants = db.query(Applicant).limit(5).all()
        print(f"[OK] Found {len(applicants)} applicants")
        
        if applicants:
            print("\n[*] Assigning applicants to agent...")
            assigned_count = 0
            for i, applicant in enumerate(applicants[:3]):  # Assign first 3
                applicant.assigned_agent_id = agent.id
                applicant.notes = f"Test assignment to {agent.first_name} {agent.last_name}"
                assigned_count += 1
                print(f"   [OK] Assigned: {applicant.first_name} {applicant.last_name}")
            
            db.commit()
            print(f"[OK] Assigned {assigned_count} applicants to agent")
            
            # Create a communication for the first applicant to set last_contacted_at
            print("\n[*] Creating test communication...")
            if applicants:
                # Try to convert applicant ID to int if possible (Communication uses Integer FK)
                applicant_id = applicants[0].id
                try:
                    # If it's a UUID string, we'll need to handle it differently
                    # For now, just set last_contacted_at directly
                    applicants[0].last_contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
                    db.commit()
                    print(f"[OK] Updated last_contacted_at for {applicants[0].first_name}")
                    print(f"     last_contacted_at set to 2 days ago")
                except Exception as e:
                    print(f"   ⚠ Note: Could not create communication (ID type mismatch): {e}")
                    print("   ⚠ Setting last_contacted_at directly instead...")
                    applicants[0].last_contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
                    db.commit()
                    print(f"[OK] Updated last_contacted_at for {applicants[0].first_name}")
        
        print("\n" + "="*60)
        print("[OK] TEST DATA CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"Organization ID: {org.id}")
        print(f"Agent ID: {agent.id}")
        print(f"Agent Email: {agent.email}")
        print(f"Agent Password: testpassword123")
        print(f"Applicants assigned: {assigned_count if applicants else 0}")
        print("\nYou can now:")
        print("1. Run: python test_my_applicants.py")
        print("2. Or login in frontend with:")
        print(f"   Email: {agent.email}")
        print("   Password: testpassword123")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n[ERROR] Error creating test data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()

