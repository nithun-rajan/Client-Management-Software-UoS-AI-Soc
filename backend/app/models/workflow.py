#for tracking state transitions


from sqlalchemy import Column, String, Text, JSON, Index
from app.models.base import BaseModel

class WorkflowTransition(BaseModel):
    """Tracks all status transitions for audit purposes"""
    __tablename__ = "workflow_transitions"
    
    domain = Column(String, nullable=False)  # property, tenancy, vendor, applicant
    entity_id = Column(String, nullable=False)  # UUID of the entity
    from_status = Column(String, nullable=False)
    to_status = Column(String, nullable=False)
    user_id = Column(String)  # Who performed the transition
    notes = Column(Text)
<<<<<<< HEAD
    # 'metadata' is a reserved attribute name on declarative classes (Base.metadata).
    # Use a different attribute name but keep the DB column name as 'metadata'
    metadata_json = Column('metadata', JSON)  # Store additional context
=======
    workflow_metadata = Column(JSON)  # Store additional context
>>>>>>> bf7fab4 (fix enum inheritance, add model config to adjust pydantic to used enums)
    side_effects_executed = Column(JSON)  # List of automated actions
    
    # Index for faster queries
    __table_args__ = (
        Index('ix_workflow_transitions_domain_entity', 'domain', 'entity_id'),
        Index('ix_workflow_transitions_created_at', 'created_at'),
    )