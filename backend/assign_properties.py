"""Assign properties to agents"""
from sqlalchemy.orm import Session
from app.models.property import Property
from app.models.user import User
from app.schemas.user import Role


def assign_properties_to_agents(db: Session, properties: list, agents: list):
    """Assign properties to agents (managed_by)"""
    print(f"\n[*] Assigning properties to agents...")
    for i, property in enumerate(properties):
        # Distribute properties evenly across all agents
        agent = agents[i % len(agents)]
        property.managed_by = agent.id
    db.commit()
    print(f"[OK] Assigned {len(properties)} properties to agents")

