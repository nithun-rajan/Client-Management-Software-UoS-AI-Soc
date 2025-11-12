#!/usr/bin/env python3
"""
Script to redistribute vendors and buyers from the first 3 sales agents to the 4th agent (the user).
This ensures the user gets some vendors and buyers assigned to them.
"""

import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.vendor import Vendor
from app.models.applicant import Applicant
from app.schemas.user import Role


def redistribute_to_user(db: Session, user_email: str = None):
    """Redistribute vendors and buyers to the specified user"""
    
    # Get all active agents sorted by name
    agents = db.query(User).filter(
        User.role == Role.AGENT,
        User.is_active == True
    ).order_by(User.first_name, User.last_name).all()
    
    if len(agents) < 2:
        print(f"ERROR: Need at least 2 agents, but only found {len(agents)}")
        return False
    
    # Find the user by email or name
    user = None
    if user_email:
        user = db.query(User).filter(
            User.email == user_email,
            User.role == Role.AGENT,
            User.is_active == True
        ).first()
    else:
        # Try to find Tom Smith by name
        for agent in agents:
            if agent.first_name and agent.first_name.lower() == "tom" and agent.last_name and agent.last_name.lower() == "smith":
                user = agent
                break
    
    if not user:
        print("ERROR: Could not find the specified user")
        print("Available agents:")
        for agent in agents:
            print(f"  - {agent.first_name} {agent.last_name} ({agent.email})")
        if not user_email:
            print("\nUsage: python redistribute_to_user.py <your-email>")
        return False
    
    # Get all other sales team agents as coworkers
    coworkers = [a for a in agents if a.id != user.id]
    
    print(f"Redistributing vendors and buyers to: {user.first_name} {user.last_name} ({user.email})")
    print(f"\nFrom coworkers:")
    for coworker in coworkers:
        print(f"  - {coworker.first_name} {coworker.last_name} ({coworker.email})")
    
    # Get all vendors assigned to coworkers
    coworker_ids = [c.id for c in coworkers]
    vendors_from_coworkers = db.query(Vendor).filter(Vendor.managed_by.in_(coworker_ids)).all()
    
    # Get all buyers assigned to coworkers
    buyers_from_coworkers = db.query(Applicant).filter(
        Applicant.assigned_agent_id.in_(coworker_ids),
        (
            (Applicant.buyer_type.isnot(None)) |
            (Applicant.willing_to_buy == True)
        )
    ).all()
    
    print(f"\nFound {len(vendors_from_coworkers)} vendors assigned to coworkers")
    print(f"Found {len(buyers_from_coworkers)} buyers assigned to coworkers")
    
    # Redistribute: take about 25% from each coworker and assign to user
    vendors_to_assign = max(1, len(vendors_from_coworkers) // 4)  # Take 25%
    buyers_to_assign = max(1, len(buyers_from_coworkers) // 4)  # Take 25%
    
    print(f"\nRedistributing {vendors_to_assign} vendors and {buyers_to_assign} buyers to {user.first_name} {user.last_name}")
    
    # Assign vendors
    assigned_vendors = 0
    for vendor in vendors_from_coworkers[:vendors_to_assign]:
        vendor.managed_by = user.id
        assigned_vendors += 1
        print(f"  [OK] Assigned vendor: {vendor.first_name} {vendor.last_name}")
    
    # Assign buyers
    assigned_buyers = 0
    for buyer in buyers_from_coworkers[:buyers_to_assign]:
        buyer.assigned_agent_id = user.id
        assigned_buyers += 1
        print(f"  [OK] Assigned buyer: {buyer.first_name} {buyer.last_name}")
    
    # Commit changes
    try:
        db.commit()
        print(f"\n[OK] Successfully redistributed {assigned_vendors} vendors and {assigned_buyers} buyers to {user.first_name} {user.last_name}!")
        
        # Verify final assignments
        print("\nFinal assignments:")
        for agent in agents[:4]:  # Show first 4 agents
            vendor_count = db.query(Vendor).filter(Vendor.managed_by == agent.id).count()
            buyer_count = db.query(Applicant).filter(
                Applicant.assigned_agent_id == agent.id,
                (
                    (Applicant.buyer_type.isnot(None)) |
                    (Applicant.willing_to_buy == True)
                )
            ).count()
            print(f"  {agent.first_name} {agent.last_name}: {vendor_count} vendors, {buyer_count} buyers")
        
        return True
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error committing changes: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point"""
    user_email = None
    if len(sys.argv) > 1:
        user_email = sys.argv[1]
    
    db = SessionLocal()
    try:
        success = redistribute_to_user(db, user_email)
        sys.exit(0 if success else 1)
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

