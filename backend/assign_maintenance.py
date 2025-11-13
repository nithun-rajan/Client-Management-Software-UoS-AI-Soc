"""Assign maintenance issues to agents"""
import random
from sqlalchemy.orm import Session
from app.models.maintenance import MaintenanceIssue
from app.models.property import Property


def assign_maintenance_to_agents(db: Session, maintenance_issues: list):
    """Assign maintenance issues to agents based on property's managed_by agent"""
    print(f"\n[*] Assigning maintenance issues to agents...")
    # Assign based on property's managed_by agent
    for maintenance_issue in maintenance_issues:
        property = db.query(Property).filter(Property.id == maintenance_issue.property_id).first()
        if property and property.managed_by:
            maintenance_issue.managed_by = property.managed_by
    db.commit()
    print(f"[OK] Assigned {len(maintenance_issues)} maintenance issues to agents")


def ensure_test_agent_gets_maintenance(db: Session, maintenance_issues: list, test_agent):
    """Ensure test agent gets some maintenance issues if they have none"""
    if not test_agent:
        return
    
    test_agent_maintenance_count = db.query(MaintenanceIssue).filter(
        MaintenanceIssue.managed_by == test_agent.id
    ).count()
    
    if test_agent_maintenance_count == 0 and maintenance_issues:
        print(f"\n[*] Ensuring test agent gets some maintenance issues...")
        # Get properties managed by test agent
        test_agent_properties = db.query(Property).filter(Property.managed_by == test_agent.id).all()
        if test_agent_properties:
            # Reassign some maintenance issues to test agent's properties
            issues_to_reassign = maintenance_issues[:min(5, len(maintenance_issues))]
            for issue in issues_to_reassign:
                if test_agent_properties:
                    issue.property_id = random.choice(test_agent_properties).id
                    issue.managed_by = test_agent.id
            db.commit()
            print(f"[OK] Reassigned {len(issues_to_reassign)} maintenance issues to test agent")

