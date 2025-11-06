from sqlalchemy import Column, Date, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import VendorStatus


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
