from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import TaskStatus


class Task(BaseModel):
    __tablename__ = "tasks"
    


    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default=TaskStatus.TODO)
    due_date = Column(DateTime)
    priority = Column(String, default="medium")

    # Polymorphic relationship
    related_entity_type = Column(String)
    related_entity_id = Column(String)

    # Specific relationships
    tenancy_id = Column(String, ForeignKey('tenancies.id'), nullable=True)
    vendor_id = Column(String, ForeignKey('vendors.id'), nullable=True)
    maintenance_issue_id = Column(String, ForeignKey('maintenance_issues.id'), nullable=True)

    # Relationships
    tenancy = relationship("Tenancy", back_populates="tasks")
    vendor = relationship("Vendor", back_populates="tasks")
    maintenance_issue = relationship("MaintenanceIssue", back_populates="related_tasks")

    assigned_to = Column(String)
