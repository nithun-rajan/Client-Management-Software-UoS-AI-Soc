"""Assign various entities (vendors, buyers, landlords, tenants) to agents"""
from sqlalchemy.orm import Session
from app.models.vendor import Vendor
from app.models.landlord import Landlord
from app.models.applicant import Applicant


def assign_vendors_to_agents(db: Session, vendors: list, sales_agents: list):
    """Assign vendors to sales agents (managed_by)"""
    print(f"\n[*] Assigning vendors to sales agents...")
    for i, vendor in enumerate(vendors):
        if sales_agents:
            agent = sales_agents[i % len(sales_agents)]
            vendor.managed_by = agent.id
    db.commit()
    print(f"[OK] Assigned {len(vendors)} vendors to sales agents")


def assign_buyers_to_agents(db: Session, buyers: list, sales_agents: list):
    """Assign buyers to sales agents (assigned_agent_id)"""
    print(f"\n[*] Assigning buyers to sales agents...")
    for i, buyer in enumerate(buyers):
        if sales_agents:
            agent = sales_agents[i % len(sales_agents)]
            buyer.assigned_agent_id = agent.id
    db.commit()
    print(f"[OK] Assigned {len(buyers)} buyers to sales agents")


def assign_landlords_to_agents(db: Session, landlords: list, lettings_agents: list):
    """Assign landlords to lettings agents (managed_by)"""
    print(f"\n[*] Assigning landlords to lettings agents...")
    for i, landlord in enumerate(landlords):
        if lettings_agents:
            agent = lettings_agents[i % len(lettings_agents)]
            landlord.managed_by = agent.id
    db.commit()
    print(f"[OK] Assigned {len(landlords)} landlords to lettings agents")


def assign_tenants_to_agents(db: Session, tenants: list, lettings_agents: list):
    """Assign tenants/applicants to lettings agents (assigned_agent_id)"""
    print(f"\n[*] Assigning tenants to lettings agents...")
    for i, tenant in enumerate(tenants):
        if lettings_agents:
            agent = lettings_agents[i % len(lettings_agents)]
            tenant.assigned_agent_id = agent.id
    db.commit()
    print(f"[OK] Assigned {len(tenants)} tenants to lettings agents")

