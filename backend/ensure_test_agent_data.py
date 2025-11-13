"""Ensure test agent gets minimum required data"""
from sqlalchemy.orm import Session
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.user import User


def ensure_test_agent_gets_data(db: Session, test_agent: User, tenants: list, buyers: list, landlords: list):
    """Ensure test agent gets some tenants, buyers, and landlords if they have none"""
    if not test_agent:
        return
    
    test_agent_tenants_count = db.query(Applicant).filter(
        Applicant.assigned_agent_id == test_agent.id,
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None)
    ).count()
    test_agent_buyers_count = db.query(Applicant).filter(
        Applicant.assigned_agent_id == test_agent.id,
        ((Applicant.willing_to_buy == True) | (Applicant.buyer_type.isnot(None)))
    ).count()
    test_agent_landlords_count = db.query(Landlord).filter(
        Landlord.managed_by == test_agent.id
    ).count()
    
    # Reassign some tenants to test agent if they have none
    if test_agent_tenants_count == 0 and tenants:
        print(f"\n[*] Ensuring test agent gets some tenants...")
        tenants_to_reassign = tenants[:min(3, len(tenants))]
        for tenant in tenants_to_reassign:
            tenant.assigned_agent_id = test_agent.id
        db.commit()
        print(f"[OK] Reassigned {len(tenants_to_reassign)} tenants to test agent")
    
    # Reassign some buyers to test agent if they have none
    if test_agent_buyers_count == 0 and buyers:
        print(f"\n[*] Ensuring test agent gets some buyers...")
        buyers_to_reassign = buyers[:min(3, len(buyers))]
        for buyer in buyers_to_reassign:
            buyer.assigned_agent_id = test_agent.id
        db.commit()
        print(f"[OK] Reassigned {len(buyers_to_reassign)} buyers to test agent")
    
    # Reassign some landlords to test agent if they have none
    if test_agent_landlords_count == 0 and landlords:
        print(f"\n[*] Ensuring test agent gets some landlords...")
        landlords_to_reassign = landlords[:min(3, len(landlords))]
        for landlord in landlords_to_reassign:
            landlord.managed_by = test_agent.id
        db.commit()
        print(f"[OK] Reassigned {len(landlords_to_reassign)} landlords to test agent")

