"""
Maintenance Issue Model

Tracks maintenance requests, complaints, and work orders for properties
As per Blueprint: Property management section for maintenance tracking
"""

from sqlalchemy import Column, String, Text, DateTime, Date, ForeignKey, Float, Boolean, Integer, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from builtins import property as builtin_property
from app.models.base import BaseModel


class MaintenancePriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MaintenanceStatus:
    REPORTED = "reported"  # Initial report
    ACKNOWLEDGED = "acknowledged"  # Property manager acknowledged
    INSPECTED = "inspected"  # Inspection completed
    QUOTED = "quoted"  # Quote received from contractor
    APPROVED = "approved"  # Landlord approved work
    IN_PROGRESS = "in_progress"  # Work in progress
    COMPLETED = "completed"  # Work completed
    CLOSED = "closed"  # Issue closed (tenant satisfied)
    CANCELLED = "cancelled"  # Work cancelled


class MaintenanceType:
    REPAIR = "repair"  # General repair
    EMERGENCY = "emergency"  # Emergency repair (burst pipe, no heating, etc.)
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    HEATING = "heating"
    STRUCTURAL = "structural"
    APPLIANCE = "appliance"
    CLEANING = "cleaning"
    GARDENING = "gardening"
    DECORATION = "decoration"
    COMPLIANCE = "compliance"  # Safety compliance issue
    OTHER = "other"


class ComplaintType:
    NOISE = "noise"
    NEIGHBOUR = "neighbour"
    PROPERTY_CONDITION = "property_condition"
    MAINTENANCE = "maintenance"
    RENT = "rent"
    DEPOSIT = "deposit"
    OTHER = "other"


class MaintenanceIssue(BaseModel):
    """
    Maintenance Issue Model
    
    Tracks all maintenance requests, complaints, and work orders
    Links to Property, Tenancy, Tenant, and Landlord
    """
    __tablename__ = "maintenance_issues"
    
    # Core fields
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    issue_type = Column(String, default=MaintenanceType.REPAIR)  # repair, emergency, plumbing, etc.
    status = Column(String, default=MaintenanceStatus.REPORTED)
    priority = Column(String, default=MaintenancePriority.MEDIUM)
    
    # Complaint tracking
    is_complaint = Column(Boolean, default=False)  # Is this a complaint?
    complaint_type = Column(String, nullable=True)  # Type of complaint if applicable
    
    # Reporting
    reported_by = Column(String, nullable=True)  # Tenant name or contact
    reported_by_phone = Column(String)
    reported_by_email = Column(String)
<<<<<<< HEAD
    reported_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
=======
    reported_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    reported_via = Column(String)  # phone, email, portal, in_person
    
    # Property and tenancy relationships
    property_id = Column(String, ForeignKey('properties.id'), nullable=False, index=True)
    property = relationship("Property", back_populates="maintenance_issues")
    
    tenancy_id = Column(String, ForeignKey('tenancies.id'), nullable=True, index=True)
    tenancy = relationship("Tenancy", back_populates="maintenance_issues")
    
    landlord_id = Column(String, ForeignKey('landlords.id'), nullable=True, index=True)
    landlord = relationship("Landlord", back_populates="maintenance_issues")
    
    # Property manager assignment
    managed_by = Column(String, ForeignKey('users.id'), nullable=True)  # Property manager user_id
    assigned_to = Column(String, nullable=True)  # Contractor or staff member handling
    
    # Dates and timing
    acknowledged_date = Column(DateTime, nullable=True)
    inspection_date = Column(DateTime, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)  # When work is scheduled
    started_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    closed_date = Column(DateTime, nullable=True)
    
    # Financial tracking
    estimated_cost = Column(Float, nullable=True)
    actual_cost = Column(Float, nullable=True)
    quote_received = Column(Boolean, default=False)
    quote_amount = Column(Float, nullable=True)
    landlord_approved = Column(Boolean, default=False)
    landlord_approval_date = Column(DateTime, nullable=True)
    
    # Contractor information
    contractor_name = Column(String, nullable=True)
    contractor_contact = Column(String, nullable=True)
    contractor_quote_ref = Column(String, nullable=True)
    contractor_invoice_ref = Column(String, nullable=True)
    
    # Resolution
    resolution_notes = Column(Text, nullable=True)
    tenant_satisfied = Column(Boolean, default=False)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime, nullable=True)
    
    # Photos and documents
    photos_urls = Column(Text, nullable=True)  # JSON array of photo URLs
    documents_urls = Column(Text, nullable=True)  # JSON array of document URLs
    
    # Internal notes
    internal_notes = Column(Text, nullable=True)  # Notes visible only to staff
    public_notes = Column(Text, nullable=True)  # Notes visible to tenant/landlord
    
    # Emergency handling
    is_emergency = Column(Boolean, default=False)
    emergency_response_time = Column(DateTime, nullable=True)  # When emergency response arrived
    
    # Recurring issues
    is_recurring = Column(Boolean, default=False)
    parent_issue_id = Column(String, ForeignKey('maintenance_issues.id'), nullable=True)
    recurrence_count = Column(Integer, default=0)
    
    # Compliance flags
    requires_epc_update = Column(Boolean, default=False)
    requires_gas_safety_update = Column(Boolean, default=False)
    requires_eicr_update = Column(Boolean, default=False)
    
    # Relationships
    related_tasks = relationship("Task", back_populates="maintenance_issue", cascade="all, delete-orphan")
    
    @builtin_property
    def days_open(self):
        """Calculate days since issue was reported"""
<<<<<<< HEAD
        if self.closed_date:
            return (self.closed_date - self.reported_date).days
        return (datetime.now(timezone.utc) - self.reported_date).days
=======
        now = datetime.now(timezone.utc)
        
        # Normalize reported_date to UTC-aware datetime
        if self.reported_date:
            if self.reported_date.tzinfo is None:
                # If naive, assume UTC
                reported_date = self.reported_date.replace(tzinfo=timezone.utc)
            else:
                reported_date = self.reported_date.astimezone(timezone.utc)
        else:
            return 0
        
        if self.closed_date:
            # Normalize closed_date to UTC-aware datetime
            if self.closed_date.tzinfo is None:
                closed_date = self.closed_date.replace(tzinfo=timezone.utc)
            else:
                closed_date = self.closed_date.astimezone(timezone.utc)
            return (closed_date - reported_date).days
        
        return (now - reported_date).days
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    
    @builtin_property
    def is_overdue(self):
        """Check if issue is overdue based on priority"""
        if self.status in [MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED, MaintenanceStatus.CANCELLED]:
            return False
        
        days_open = self.days_open
        if self.is_emergency or self.priority == MaintenancePriority.URGENT:
            return days_open > 1
        elif self.priority == MaintenancePriority.HIGH:
            return days_open > 7
        elif self.priority == MaintenancePriority.MEDIUM:
            return days_open > 14
        else:
            return days_open > 30
    
    @builtin_property
    def requires_attention(self):
        """Check if issue requires immediate attention"""
        return (
            self.is_emergency or
            self.priority == MaintenancePriority.URGENT or
            self.is_overdue or
            self.status == MaintenanceStatus.REPORTED and self.days_open > 2
        )

