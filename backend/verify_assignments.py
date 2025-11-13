"""Verify and report agent assignments"""
from sqlalchemy.orm import Session
from app.models.property import Property
from app.models.landlord import Landlord
from app.models.vendor import Vendor
from app.models.applicant import Applicant
from app.models.task import Task
from app.models.maintenance import MaintenanceIssue
from app.models.user import User


def verify_test_agent_assignments(db: Session, test_agent: User):
    """Verify and print test agent assignments"""
    if not test_agent:
        return
    
    test_agent_properties = db.query(Property).filter(Property.managed_by == test_agent.id).count()
    test_agent_landlords = db.query(Landlord).filter(Landlord.managed_by == test_agent.id).count()
    test_agent_vendors = db.query(Vendor).filter(Vendor.managed_by == test_agent.id).count()
    test_agent_tenants = db.query(Applicant).filter(
        Applicant.assigned_agent_id == test_agent.id,
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None)
    ).count()
    test_agent_buyers = db.query(Applicant).filter(
        Applicant.assigned_agent_id == test_agent.id,
        ((Applicant.willing_to_buy == True) | (Applicant.buyer_type.isnot(None)))
    ).count()
    test_agent_tasks = db.query(Task).filter(Task.assigned_to == f"{test_agent.first_name} {test_agent.last_name}").count()
    test_agent_maintenance = db.query(MaintenanceIssue).filter(MaintenanceIssue.managed_by == test_agent.id).count()
    
    print(f"\n[OK] Test agent ({test_agent.email}) assignments:")
    print(f"     Properties: {test_agent_properties}")
    print(f"     Landlords: {test_agent_landlords}")
    print(f"     Vendors: {test_agent_vendors}")
    print(f"     Tenants: {test_agent_tenants}")
    print(f"     Buyers: {test_agent_buyers}")
    print(f"     Tasks: {test_agent_tasks}")
    print(f"     Maintenance Issues: {test_agent_maintenance}")

