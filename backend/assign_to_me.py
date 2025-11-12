#!/usr/bin/env python3
"""
Script to assign some vendors and buyers to the current user.
This script redistributes vendors and buyers from other sales team agents to the specified user.
"""

import sys
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.vendor import Vendor
from app.models.applicant import Applicant


def assign_to_user(user_email: str, db: Session, percentage: float = 0.25):
    """
    Assign a percentage of vendors and buyers to the specified user.
    
    Args:
        user_email: Email of the user to assign vendors/buyers to
        percentage: Percentage of vendors/buyers to assign (default 25%)
    """
    
    # Find the user
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        print(f"ERROR: User with email '{user_email}' not found!")
        return False
    
    if not user.is_active:
        print(f"ERROR: User '{user_email}' is not active!")
        return False
    
    print(f"Assigning vendors and buyers to: {user.first_name} {user.last_name} ({user.email})")
    
    # Get all vendors currently assigned to other sales team agents
    all_vendors = db.query(Vendor).filter(Vendor.managed_by.isnot(None)).all()
    
    # Get all buyers currently assigned to other sales team agents
    all_buyers = db.query(Applicant).filter(
        Applicant.assigned_agent_id.isnot(None),
        (
            (Applicant.buyer_type.isnot(None)) |
            (Applicant.willing_to_buy == True)
        )
    ).all()
    
    # Filter out vendors/buyers already assigned to this user
    vendors_to_redistribute = [v for v in all_vendors if v.managed_by != user.id]
    buyers_to_redistribute = [b for b in all_buyers if b.assigned_agent_id != user.id]
    
    print(f"Found {len(vendors_to_redistribute)} vendors assigned to other agents")
    print(f"Found {len(buyers_to_redistribute)} buyers assigned to other agents")
    
    # Calculate how many to assign
    vendors_to_assign = max(1, int(len(vendors_to_redistribute) * percentage))
    buyers_to_assign = max(1, int(len(buyers_to_redistribute) * percentage))
    
    print(f"\nAssigning {vendors_to_assign} vendors and {buyers_to_assign} buyers to {user.first_name} {user.last_name}")
    
    # Assign vendors
    assigned_vendors = 0
    for vendor in vendors_to_redistribute[:vendors_to_assign]:
        vendor.managed_by = user.id
        assigned_vendors += 1
        print(f"  ✓ Assigned vendor: {vendor.first_name} {vendor.last_name}")
    
    # Assign buyers
    assigned_buyers = 0
    for buyer in buyers_to_redistribute[:buyers_to_assign]:
        buyer.assigned_agent_id = user.id
        assigned_buyers += 1
        print(f"  ✓ Assigned buyer: {buyer.first_name} {buyer.last_name}")
    
    # Commit changes
    try:
        db.commit()
        print(f"\n[OK] Successfully assigned {assigned_vendors} vendors and {assigned_buyers} buyers to {user.first_name} {user.last_name}!")
        
        # Verify
        user_vendor_count = db.query(Vendor).filter(Vendor.managed_by == user.id).count()
        user_buyer_count = db.query(Applicant).filter(
            Applicant.assigned_agent_id == user.id,
            (
                (Applicant.buyer_type.isnot(None)) |
                (Applicant.willing_to_buy == True)
            )
        ).count()
        
        print(f"\nVerification:")
        print(f"  Total vendors now managed by {user.first_name}: {user_vendor_count}")
        print(f"  Total buyers now managed by {user.first_name}: {user_buyer_count}")
        
        return True
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error committing changes: {e}")
        return False


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python assign_to_me.py <user_email> [percentage]")
        print("Example: python assign_to_me.py user@example.com 0.25")
        print("  This will assign 25% of vendors and buyers to the specified user")
        sys.exit(1)
    
    user_email = sys.argv[1]
    percentage = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
    
    if not 0 < percentage <= 1:
        print("ERROR: Percentage must be between 0 and 1 (e.g., 0.25 for 25%)")
        sys.exit(1)
    
    db = SessionLocal()
    try:
        success = assign_to_user(user_email, db, percentage)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

