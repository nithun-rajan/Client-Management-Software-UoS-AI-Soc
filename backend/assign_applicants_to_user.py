"""Assign applicants to a specific user"""
from app.core.database import SessionLocal
from app.models.applicant import Applicant
from app.models.user import User
from datetime import datetime, timezone, timedelta

def assign_applicants_to_user(user_email: str, count: int = 3):
    """Assign applicants to a user"""
    db = SessionLocal()
    
    try:
        # Get the user
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            print(f"[ERROR] User with email {user_email} not found")
            return
        
        print(f"[*] Found user: {user.first_name} {user.last_name} ({user.email})")
        print(f"    User ID: {user.id}")
        
        # Get applicants that are not assigned or assigned to someone else
        applicants = db.query(Applicant).filter(
            (Applicant.assigned_agent_id.is_(None)) | 
            (Applicant.assigned_agent_id != user.id)
        ).limit(count).all()
        
        if not applicants:
            print(f"[WARNING] No unassigned applicants found")
            # Get any applicants and reassign them
            applicants = db.query(Applicant).limit(count).all()
        
        if not applicants:
            print(f"[ERROR] No applicants found in database")
            print("   Run 'python seed_data.py' to create test applicants")
            return
        
        print(f"\n[*] Assigning {len(applicants)} applicants to {user.first_name}...")
        
        assigned_count = 0
        for applicant in applicants:
            applicant.assigned_agent_id = user.id
            applicant.notes = f"Assigned to {user.first_name} {user.last_name}"
            
            # Set last_contacted_at for first applicant
            if assigned_count == 0:
                applicant.last_contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
            
            assigned_count += 1
            print(f"   [OK] Assigned: {applicant.first_name} {applicant.last_name} ({applicant.email})")
        
        db.commit()
        
        print(f"\n[OK] Successfully assigned {assigned_count} applicants to {user.first_name} {user.last_name}")
        print(f"\nYou can now test /my-applicants endpoint with user: {user.email}")
        print(f"User ID: {user.id}")
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    # Default to test@example.com if no argument provided
    user_email = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    print("\n" + "="*60)
    print(f"  ASSIGN APPLICANTS TO USER")
    print("="*60)
    print(f"User email: {user_email}")
    print(f"Count: {count}")
    print("="*60 + "\n")
    
    assign_applicants_to_user(user_email, count)


