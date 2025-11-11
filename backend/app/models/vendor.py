from sqlalchemy import Column, Date, String, Text, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import VendorStatus
from app.models.enums_sales import InstructionType

class Vendor(BaseModel):
    __tablename__ = "vendors"
   

    # Core identity
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    primary_phone = Column(String, nullable=False)

    # Compliance (AML/KYC)
    current_address = Column(Text)
    date_of_birth = Column(Date)
    nationality = Column(String)
    aml_status = Column(String, default="pending")

    # Essential AML additions from Page 48
    aml_verification_date = Column(DateTime(timezone=True))  # When AML was completed
    aml_verification_expiry = Column(DateTime(timezone=True))  # For automated reminders
    proof_of_ownership_uploaded = Column(Boolean, default=False)  # Land Registry title

    # Sales instruction
    status = Column(String, default=VendorStatus.NEW)
    minimum_fee = Column(String)
    instruction_type = Column(String, default=InstructionType.SOLE_AGENCY)
    instruction_date = Column(DateTime(timezone=True))
    agreed_commission = Column(Numeric(5, 2))
    contract_expiry_date = Column(DateTime(timezone=True))

    # Essential relationship tracking from Page 50
    source_of_lead = Column(String)  # Portal, Referral, Board, Past Client
    marketing_consent = Column(Boolean, default=False)  # GDPR marketing opt-in

    # Conveyancer link from Page 51
    conveyancer_name = Column(String)  # Solicitor/conveyancer name
    conveyancer_firm = Column(String)  # Law firm name
    conveyancer_contact = Column(String)  # Phone/email
    # Linked property for sales progression
    instructed_property_id = Column(String, ForeignKey("properties.id"), index=True)
    
    # Complete info flag (similar to buyer_questions_answered)
    vendor_complete_info = Column(Boolean, default=False)
    
    # Contact tracking
    last_contacted_at = Column(DateTime(timezone=True), nullable=True, index=True)  # When last contacted (updated on communication)
<<<<<<< HEAD
    
    # CRM fields - Agent assignment
    managed_by = Column(String, ForeignKey('users.id'), nullable=True, index=True)  # Which agent manages this vendor
=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

    # Relationships
    tasks = relationship("Task", back_populates="vendor")
    sales_progression = relationship("SalesProgression", back_populates="vendor")
<<<<<<< HEAD
    managed_agent = relationship("User", foreign_keys=[managed_by])
=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

    
    def __repr__(self):
        return f"<Vendor({self.first_name} {self.last_name}, email={self.email})>"


