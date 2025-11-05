"""
Enums for the CRM system
All status types and categories in one place
"""
from enum import Enum


class PropertyStatus(str, Enum):
    """Property status enum - Blueprint page 13"""
    AVAILABLE = "available"
    LET_AGREED = "let_agreed"
    LET_BY = "let_by"
    TENANTED = "tenanted"
    UNDER_OFFER = "under_offer"
    BLOCKED = "blocked"
    MAINTENANCE = "maintenance"
    WITHDRAWN = "withdrawn"

class ApplicantStatus(str, Enum):
    """Applicant status enum - Blueprint page 23"""
    NEW = "new"
    QUALIFIED = "qualified"
    VIEWING_BOOKED = "viewing_booked"
    OFFER_SUBMITTED = "offer_submitted"
    OFFER_ACCEPTED = "offer_accepted"
    REFERENCES = "references"
    LET_AGREED = "let_agreed"
    TENANCY_STARTED = "tenancy_started"
    ARCHIVED = "archived"

class TenancyStatus(str, Enum):
    """Tenancy status"""
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    RENEWED = "renewed"

class DocumentType(str, Enum):
    """Document types"""
    # Property compliance
    EPC = "epc"
    GAS_SAFETY = "gas_safety"
    EICR = "eicr"
    HMO_LICENCE = "hmo_licence"
    FIRE_RISK = "fire_risk_assessment"
    
    # Landlord documents
    PROOF_OF_ID = "proof_of_id"
    PROOF_OF_ADDRESS = "proof_of_address"
    AML_CHECK = "aml_check"
    
    # Tenancy documents
    TENANCY_AGREEMENT = "tenancy_agreement"
    INVENTORY = "inventory"
    RIGHT_TO_RENT = "right_to_rent"
    REFERENCE = "reference"
    
    # Photos
    PROPERTY_PHOTO = "property_photo"
    DAMAGE_PHOTO = "damage_photo"

class DocumentStatus(str, Enum):
    """Document status"""
    PENDING = "pending"
    VALID = "valid"
    EXPIRING = "expiring"
    EXPIRED = "expired"
    REJECTED = "rejected"

class EventType(str, Enum):
    """Event types for event bus"""
    # Property events
    PROPERTY_LISTED = "property.listed"
    PROPERTY_LET = "property.let"
    PROPERTY_WITHDRAWN = "property.withdrawn"
    PROPERTY_VIEWED = "property.viewed"
    
    # Applicant events
    APPLICANT_REGISTERED = "applicant.registered"
    APPLICANT_VIEWING_BOOKED = "applicant.viewing_booked"
    APPLICANT_OFFER_MADE = "applicant.offer_made"
    
    # Tenancy events
    TENANCY_STARTED = "tenancy.started"
    TENANCY_EXPIRING = "tenancy.expiring"
    TENANCY_RENEWED = "tenancy.renewed"
    TENANCY_TERMINATED = "tenancy.terminated"
    
    # Document events
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_EXPIRING = "document.expiring"
    DOCUMENT_EXPIRED = "document.expired"
    
    # Compliance events
    COMPLIANCE_ALERT = "compliance.alert"
    AML_VERIFIED = "aml.verified"
    
    # Offer events
    OFFER_ACCEPTED = "offer.accepted"
    OFFER_REJECTED = "offer.rejected"

class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, Enum):
    """Task status"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VendorStatus(str, Enum):
    """Vendor/Sales status"""
    NEW = "new"
    INSTRUCTED = "instructed"
    ACTIVE = "active"
    SOLD = "sold"
    WITHDRAWN = "withdrawn"
    LOST = "lost"

class UserRole(str, Enum):
    """User roles for RBAC"""
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"
    VIEWER = "viewer"

class CommunicationType(str, Enum):
    """Communication/Activity types for activity feed"""
    EMAIL = "email"
    CALL = "call"
    SMS = "sms"
    NOTE = "note"
    TASK = "task"
    MEETING = "meeting"
    VIEWING = "viewing"

class CommunicationDirection(str, Enum):
    """Communication direction"""
    INBOUND = "inbound"
    OUTBOUND = "outbound"
