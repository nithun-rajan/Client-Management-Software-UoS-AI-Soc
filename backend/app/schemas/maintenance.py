from app.schemas.model_config import AppBaseModel
from datetime import datetime, date
from typing import Optional, List
from pydantic import Field


class MaintenanceBase(AppBaseModel):
    """Base schema for maintenance issues"""
    title: str
    description: str
    issue_type: str = "repair"  # repair, emergency, plumbing, electrical, heating, etc.
    status: str = "reported"  # reported, acknowledged, inspected, quoted, approved, in_progress, completed, closed, cancelled
    priority: str = "medium"  # low, medium, high, urgent
    
    # Complaint tracking
    is_complaint: bool = False
    complaint_type: Optional[str] = None  # noise, neighbour, property_condition, maintenance, rent, deposit, other
    
    # Reporting
    reported_by: Optional[str] = None
    reported_by_phone: Optional[str] = None
    reported_by_email: Optional[str] = None
    reported_via: Optional[str] = None  # phone, email, portal, in_person
    
    # Relationships
    property_id: str
    tenancy_id: Optional[str] = None
    landlord_id: Optional[str] = None
    
    # Property manager assignment
    managed_by: Optional[str] = None  # Property manager user_id
    assigned_to: Optional[str] = None  # Contractor or staff member handling
    
    # Dates and timing
    acknowledged_date: Optional[datetime] = None
    inspection_date: Optional[datetime] = None
    scheduled_date: Optional[datetime] = None
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None
    
    # Financial tracking
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    quote_received: bool = False
    quote_amount: Optional[float] = None
    landlord_approved: bool = False
    landlord_approval_date: Optional[datetime] = None
    
    # Contractor information
    contractor_name: Optional[str] = None
    contractor_contact: Optional[str] = None
    contractor_quote_ref: Optional[str] = None
    contractor_invoice_ref: Optional[str] = None
    
    # Resolution
    resolution_notes: Optional[str] = None
    tenant_satisfied: bool = False
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    
    # Photos and documents (JSON arrays stored as strings)
    photos_urls: Optional[str] = None  # JSON array of photo URLs
    documents_urls: Optional[str] = None  # JSON array of document URLs
    
    # Internal notes
    internal_notes: Optional[str] = None
    public_notes: Optional[str] = None
    
    # Emergency handling
    is_emergency: bool = False
    emergency_response_time: Optional[datetime] = None
    
    # Recurring issues
    is_recurring: bool = False
    parent_issue_id: Optional[str] = None
    recurrence_count: int = 0
    
    # Compliance flags
    requires_epc_update: bool = False
    requires_gas_safety_update: bool = False
    requires_eicr_update: bool = False


class MaintenanceCreate(AppBaseModel):
    """Schema for creating a maintenance issue"""
    title: str
    description: str
    property_id: str
    issue_type: str = "repair"
    priority: str = "medium"
    is_emergency: bool = False
    
    # Optional fields
    tenancy_id: Optional[str] = None
    landlord_id: Optional[str] = None
    managed_by: Optional[str] = None
    assigned_to: Optional[str] = None
    reported_by: Optional[str] = None
    reported_by_phone: Optional[str] = None
    reported_by_email: Optional[str] = None
    reported_via: Optional[str] = None
    is_complaint: bool = False
    complaint_type: Optional[str] = None
    estimated_cost: Optional[float] = None
    internal_notes: Optional[str] = None
    public_notes: Optional[str] = None


class MaintenanceUpdate(AppBaseModel):
    """Schema for updating a maintenance issue (all fields optional)"""
    title: Optional[str] = None
    description: Optional[str] = None
    issue_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    is_complaint: Optional[bool] = None
    complaint_type: Optional[str] = None
    reported_by: Optional[str] = None
    reported_by_phone: Optional[str] = None
    reported_by_email: Optional[str] = None
    reported_via: Optional[str] = None
    managed_by: Optional[str] = None
    assigned_to: Optional[str] = None
    acknowledged_date: Optional[datetime] = None
    inspection_date: Optional[datetime] = None
    scheduled_date: Optional[datetime] = None
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    quote_received: Optional[bool] = None
    quote_amount: Optional[float] = None
    landlord_approved: Optional[bool] = None
    landlord_approval_date: Optional[datetime] = None
    contractor_name: Optional[str] = None
    contractor_contact: Optional[str] = None
    contractor_quote_ref: Optional[str] = None
    contractor_invoice_ref: Optional[str] = None
    resolution_notes: Optional[str] = None
    tenant_satisfied: Optional[bool] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[datetime] = None
    photos_urls: Optional[str] = None
    documents_urls: Optional[str] = None
    internal_notes: Optional[str] = None
    public_notes: Optional[str] = None
    is_emergency: Optional[bool] = None
    emergency_response_time: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    parent_issue_id: Optional[str] = None
    recurrence_count: Optional[int] = None
    requires_epc_update: Optional[bool] = None
    requires_gas_safety_update: Optional[bool] = None
    requires_eicr_update: Optional[bool] = None


class MaintenanceResponse(MaintenanceBase):
    """Schema for maintenance issue response"""
    id: str
    reported_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Computed properties (will be calculated from model properties)
    days_open: Optional[int] = None
    is_overdue: Optional[bool] = None
    requires_attention: Optional[bool] = None

