from sqlalchemy import Column, Integer, String, Boolean, Date
from app.core.database import Base

class Landlord(Base):
    __tablename__ = "landlords"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    address = Column(String)
    
    # Compliance fields (simplified for now)
    aml_verified = Column(Boolean, default=False)
    aml_verification_date = Column(Date, nullable=True)
    
    # Banking (simplified)
    bank_account_name = Column(String)
    sort_code = Column(String)
    account_number = Column(String)
    
    # Notes
    notes = Column(String)