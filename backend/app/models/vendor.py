from sqlalchemy import Column, Date, String, Text, DateTime, Numeric
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import VendorStatus
from app.models.enums_sales import InstructionType

class Vendor(BaseModel):
    __tablename__ = "vendors"
   

    # Core identity
    title = Column(String)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    primary_phone = Column(String, nullable=False)
    secondary_phone = Column(String)

    # Compliance (AML/KYC)
    current_address = Column(Text)
    date_of_birth = Column(Date)
    nationality = Column(String)
    aml_status = Column(String, default="pending")

    # Sales instruction
    status = Column(String, default=VendorStatus.NEW)
    instruction_type = Column(String)  # sole_agency, multi_agency
    agreed_commission = Column(String)  # e.g., "1.5% + VAT"
    minimum_fee = Column(String)

    # Relationships
    tasks = relationship("Task", back_populates="vendor")
    sales_progression = relationship("SalesProgression", back_populates="vendor")

    # Sales instruction details
    instruction_type = Column(String, default=InstructionType.SOLE_AGENCY)
    instruction_date = Column(DateTime(timezone=True))
    agreed_commission = Column(Numeric(5, 2))
    minimum_fee = Column(Numeric(10, 2))
    contract_expiry_date = Column(DateTime(timezone=True))