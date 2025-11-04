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
    metadata = Column(JSON)  # Store additional context
    side_effects_executed = Column(JSON)  # List of automated actions
    
    # Index for faster queries
    __table_args__ = (
        Index('ix_workflow_transitions_domain_entity', 'domain', 'entity_id'),
        Index('ix_workflow_transitions_created_at', 'created_at'),
    )