from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class DocumentType:
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


class DocumentStatus:
    PENDING = "pending"
    VALID = "valid"
    EXPIRING = "expiring"  # Within 30 days
    EXPIRED = "expired"
    REJECTED = "rejected"


class Document(BaseModel):
    __tablename__ = "documents"

    document_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)

    # File details
    file_url = Column(String, nullable=False)
    file_name = Column(String)
    file_size = Column(Integer)  # bytes
    mime_type = Column(String)

    issue_date = Column(Date)
    expiry_date = Column(Date)
    status = Column(String, default=DocumentStatus.VALID)

    property_id = Column(String, ForeignKey("properties.id"), nullable=True)
    property = relationship("Property")

    landlord_id = Column(String, ForeignKey("landlords.id"), nullable=True)
    landlord = relationship("Landlord")

    tenancy_id = Column(String, ForeignKey("tenancies.id"), nullable=True)
    tenancy = relationship("Tenancy")

    applicant_id = Column(String, ForeignKey("applicants.id"), nullable=True)
    applicant = relationship("Applicant")

    # Uploaded by
    uploaded_by_user_id = Column(String)  # Future: link to User model
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Verification
    verified = Column(Boolean, default=False)
    verified_by = Column(String)
    verified_at = Column(DateTime)

    # Version control
    version = Column(Integer, default=1)
    previous_document_id = Column(String, ForeignKey("documents.id"))

    extracted_text = Column(Text)
    ocr_processed = Column(Boolean, default=False)
    ocr_confidence = Column(Float)

    # Reminder tracking
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime)

    @property
    def days_until_expiry(self):
        if not self.expiry_date:
            return None
        return (self.expiry_date - datetime.now(timezone.utc).date()).days

    @property
    def is_expiring(self):
        days = self.days_until_expiry
        return days is not None and 0 < days <= 30

    @property
    def is_expired(self):
        days = self.days_until_expiry
        return days is not None and days < 0

    def update_status(self):
        if not self.expiry_date:
            self.status = DocumentStatus.VALID
        elif self.is_expired:
            self.status = DocumentStatus.EXPIRED
        elif self.is_expiring:
            self.status = DocumentStatus.EXPIRING
        else:
            self.status = DocumentStatus.VALID
        return self.status
