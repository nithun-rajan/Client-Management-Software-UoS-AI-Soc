#import relevant enums for the table
from enum import Enum


class PropertyStatus(str, Enum):
    # From pages 9, 29-31 - Lettings lifecycle
    AVAILABLE = "available"
    LET_AGREED = "let_agreed"  # Page 29: "Change Property Status to 'Let Agreed'"
    LET_BY = "let_by"          # Page 29: "Change Property Status to 'Let by'"
    TENANTED = "tenanted"      # Page 34: "Tenanted - Fully Managed"
    UNDER_OFFER = "under_offer"
    BLOCKED = "blocked"        # Page 10: Current status includes "Blocked"
    MAINTENANCE = "maintenance" # Page 10: Current status includes "Maintenance"

    # Sales equivalents (implied from sales sections)
    SSTC = "sstc"              # Sold Subject to Contract
    EXCHANGED = "exchanged"
    COMPLETED = "completed"

class ApplicantStatus(str, Enum):
    # From page 23 - Applicant lifecycle
    NEW = "new"
    QUALIFIED = "qualified"
    VIEWING_BOOKED = "viewing_booked"
    OFFER_SUBMITTED = "offer_submitted"
    OFFER_ACCEPTED = "offer_accepted"  # Page 29: "Change Applicant Status to 'Offer Accepted'"
    REFERENCES = "references"
    LET_AGREED = "let_agreed"          # Page 23 progression
    TENANCY_STARTED = "tenancy_started"
    ARCHIVED = "archived"

class TenancyStatus(str, Enum):
    # From progression workflow pages 29-34
    DRAFT = "draft"
    OFFER_ACCEPTED = "offer_accepted"      # Stage 1.2
    REFERENCING = "referencing"            # Stage 2
    DOCUMENTATION = "documentation"        # Stage 3
    MOVE_IN_PREP = "move_in_prep"          # Stage 4
    ACTIVE = "active"                      # Stage 5.1
    ENDED = "ended"
    TERMINATED = "terminated"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VendorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_VERIFICATION = "pending_verification"
    INSTRUCTED = "instructed"  # From sales progression
    SSTC = "sstc"              # Sold Subject to Contract
    COMPLETED = "completed"
