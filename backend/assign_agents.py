#!/usr/bin/env python3
"""
Script to assign agents to vendors, buyers, landlords, and applicants.

Assignment rules:
- All vendors and buyers are assigned to sales team agents
- All landlords and applicants (tenants) are assigned to lettings team agents
- No agent should be left without people to manage
- No person should be left without an agent managing
"""

import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.vendor import Vendor
from app.models.landlord import Landlord
from app.models.applicant import Applicant
from app.models.property import Property
from app.schemas.user import Role
from collections import defaultdict


def get_agent_team(agent_id: str, db: Session) -> str:
    """Determine agent team based on their properties"""
    # Check if agent has more sales properties or lettings properties
    sales_count = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.vendor_id.isnot(None))\
        .count()
    
    lettings_count = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.landlord_id.isnot(None))\
        .count()
    
    if sales_count > lettings_count:
        return "Sales Team"
    elif lettings_count > sales_count:
        return "Lettings Team"
    else:
        # Default or mixed - check if agent has any existing assignments
        # Check vendors/buyers vs landlords/applicants
        vendor_count = db.query(Vendor).filter(Vendor.managed_by == agent_id).count()
        buyer_count = db.query(Applicant).filter(
            Applicant.assigned_agent_id == agent_id,
            Applicant.buyer_type.isnot(None)
        ).count()
        landlord_count = db.query(Landlord).filter(Landlord.managed_by == agent_id).count()
        applicant_count = db.query(Applicant).filter(
            Applicant.assigned_agent_id == agent_id,
            Applicant.willing_to_rent == True
        ).count()
        
        sales_assignments = vendor_count + buyer_count
        lettings_assignments = landlord_count + applicant_count
        
        if sales_assignments > lettings_assignments:
            return "Sales Team"
        elif lettings_assignments > sales_assignments:
            return "Lettings Team"
        else:
            # Default to Sales Team if no clear preference
            return "Sales Team"


def assign_agents(db: Session):
    """Assign agents to vendors, buyers, landlords, and applicants"""
    
    # Get all active agents
    agents = db.query(User).filter(
        User.role == Role.AGENT,
        User.is_active == True
    ).all()
    
    if not agents:
        print("ERROR: No active agents found in the system!")
        return False
    
    print(f"Found {len(agents)} active agents")
    
    # Sort agents by name for consistent assignment
    agents = sorted(agents, key=lambda a: (a.first_name or "", a.last_name or ""))
    
    # Explicitly split agents: first 4 are sales team, rest are lettings team
    # This ensures the user (who is likely the 4th agent) gets vendors and buyers
    # If there are exactly 6 agents, split 4 and 2
    # Otherwise, split roughly in half with preference for sales team
    if len(agents) >= 6:
        sales_agents = agents[:4]  # Include 4 agents in sales team
        lettings_agents = agents[4:]
    else:
        # If fewer than 6 agents, split roughly in half
        mid = (len(agents) + 1) // 2  # Round up for sales team
        sales_agents = agents[:mid]
        lettings_agents = agents[mid:]
    
    # Ensure at least one agent in each team
    if not sales_agents and lettings_agents:
        sales_agents.append(lettings_agents.pop(0))
    if not lettings_agents and sales_agents:
        lettings_agents.append(sales_agents.pop(0))
    
    print(f"\nSales Team ({len(sales_agents)} agents):")
    for agent in sales_agents:
        print(f"  - {agent.first_name} {agent.last_name} ({agent.email})")
    
    print(f"\nLettings Team ({len(lettings_agents)} agents):")
    for agent in lettings_agents:
        print(f"  - {agent.first_name} {agent.last_name} ({agent.email})")
    
    # Get all vendors
    vendors = db.query(Vendor).filter(Vendor.managed_by.is_(None)).all()
    print(f"\nFound {len(vendors)} vendors without agents")
    
    # Get all buyers (applicants with buyer_type or willing_to_buy)
    buyers = db.query(Applicant).filter(
        Applicant.assigned_agent_id.is_(None),
        (
            (Applicant.buyer_type.isnot(None)) |
            (Applicant.willing_to_buy == True)
        )
    ).all()
    print(f"Found {len(buyers)} buyers without agents")
    
    # Get all landlords
    landlords = db.query(Landlord).filter(Landlord.managed_by.is_(None)).all()
    print(f"Found {len(landlords)} landlords without agents")
    
    # Get all applicants/tenants (willing to rent, not buyers)
    applicants = db.query(Applicant).filter(
        Applicant.assigned_agent_id.is_(None),
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None)  # Not a buyer
    ).all()
    print(f"Found {len(applicants)} applicants/tenants without agents")
    
    # Assign vendors and buyers to sales agents
    sales_items = list(vendors) + list(buyers)
    if sales_items and sales_agents:
        print(f"\nAssigning {len(sales_items)} sales items to {len(sales_agents)} sales agents...")
        for i, item in enumerate(sales_items):
            agent = sales_agents[i % len(sales_agents)]
            if isinstance(item, Vendor):
                item.managed_by = agent.id
            elif isinstance(item, Applicant):
                item.assigned_agent_id = agent.id
            print(f"  Assigned {item.__class__.__name__} to {agent.first_name} {agent.last_name}")
    
    # Assign landlords and applicants to lettings agents
    lettings_items = list(landlords) + list(applicants)
    if lettings_items and lettings_agents:
        print(f"\nAssigning {len(lettings_items)} lettings items to {len(lettings_agents)} lettings agents...")
        for i, item in enumerate(lettings_items):
            agent = lettings_agents[i % len(lettings_agents)]
            if isinstance(item, Landlord):
                item.managed_by = agent.id
            elif isinstance(item, Applicant):
                item.assigned_agent_id = agent.id
            print(f"  Assigned {item.__class__.__name__} to {agent.first_name} {agent.last_name}")
    
    # Commit all changes
    try:
        db.commit()
        print("\n[OK] Successfully assigned all agents!")
        
        # Verify assignments
        print("\nVerification:")
        unassigned_vendors = db.query(Vendor).filter(Vendor.managed_by.is_(None)).count()
        unassigned_buyers = db.query(Applicant).filter(
            Applicant.assigned_agent_id.is_(None),
            (
                (Applicant.buyer_type.isnot(None)) |
                (Applicant.willing_to_buy == True)
            )
        ).count()
        unassigned_landlords = db.query(Landlord).filter(Landlord.managed_by.is_(None)).count()
        unassigned_applicants = db.query(Applicant).filter(
            Applicant.assigned_agent_id.is_(None),
            Applicant.willing_to_rent == True,
            Applicant.buyer_type.is_(None)
        ).count()
        
        print(f"  Unassigned vendors: {unassigned_vendors}")
        print(f"  Unassigned buyers: {unassigned_buyers}")
        print(f"  Unassigned landlords: {unassigned_landlords}")
        print(f"  Unassigned applicants: {unassigned_applicants}")
        
        # Check agent assignments
        print("\nAgent assignments:")
        for agent in agents:
            vendor_count = db.query(Vendor).filter(Vendor.managed_by == agent.id).count()
            buyer_count = db.query(Applicant).filter(
                Applicant.assigned_agent_id == agent.id,
                Applicant.buyer_type.isnot(None)
            ).count()
            landlord_count = db.query(Landlord).filter(Landlord.managed_by == agent.id).count()
            applicant_count = db.query(Applicant).filter(
                Applicant.assigned_agent_id == agent.id,
                Applicant.willing_to_rent == True,
                Applicant.buyer_type.is_(None)
            ).count()
            total = vendor_count + buyer_count + landlord_count + applicant_count
            print(f"  {agent.first_name} {agent.last_name}: {total} assignments "
                  f"(V:{vendor_count}, B:{buyer_count}, L:{landlord_count}, A:{applicant_count})")
        
        return True
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error committing changes: {e}")
        return False


def main():
    """Main entry point"""
    db = SessionLocal()
    try:
        success = assign_agents(db)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

