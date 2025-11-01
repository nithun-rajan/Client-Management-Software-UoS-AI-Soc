from sqlalchemy import Column, Integer, String, Float, Boolean, Date, Enum as SQLEnum
from app.core.database import Base
import enum

class ApplicantStatus(str, enum.Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    VIEWING_BOOKED = "viewing_booked"
    OFFER_SUBMITTED = "offer_submitted"
    REFERENCES = "references"
    LET_AGREED = "let_agreed"
    ARCHIVED = "archived"

class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    
    # Requirements
    bedrooms_min = Column(Integer)
    bedrooms_max = Column(Integer)
    rent_budget_min = Column(Float)
    rent_budget_max = Column(Float)
    desired_locations = Column(String)  # Comma-separated postcodes
    move_in_date = Column(Date, nullable=True)
    
    # Status
    status = Column(SQLEnum(ApplicantStatus), default=ApplicantStatus.NEW)
    
    # References
    references_passed = Column(Boolean, default=False)
    right_to_rent_checked = Column(Boolean, default=False)
    
    # Notes
    notes = Column(String)