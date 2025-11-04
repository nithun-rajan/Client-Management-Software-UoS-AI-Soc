from sqlalchemy import Boolean, Column, Date, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Landlord(BaseModel):
    __tablename__ = "landlords"

    # Core fields (keeping your existing structure)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    phone = Column(String)
    address = Column(Text)

    # Compliance fields
    aml_verified = Column(Boolean, default=False)
    aml_verification_date = Column(Date, nullable=True)

    # Banking
    bank_account_name = Column(String)
    sort_code = Column(String)
    account_number = Column(String)

    # Notes
    notes = Column(Text)

    # Relationships
    properties = relationship("Property", back_populates="landlord")
    communications = relationship("Communication", back_populates="landlord")
