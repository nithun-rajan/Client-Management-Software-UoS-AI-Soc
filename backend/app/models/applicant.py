from sqlalchemy import Column, String, Date, Text, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import ApplicantStatus
from app.models.enums_sales import MortgageStatus, BuyerType


class Applicant(BaseModel):
    __tablename__ = "applicants"

    # Basic identity (from page 22-23)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    date_of_birth = Column(Date)
    
    # Applicant status (page 23)
    status = Column(String, default=ApplicantStatus.NEW)
    
    # Property requirements (page 23-24)
    desired_bedrooms = Column(String)
    desired_property_type = Column(String)
    rent_budget_min = Column(Float)
    rent_budget_max = Column(Float)
    preferred_locations = Column(Text)
    move_in_date = Column(Date)
    
    # Additional criteria
    has_pets = Column(Boolean, default=False)
    pet_details = Column(Text)
    special_requirements = Column(Text)
    
    # Relationships
    tenancies = relationship("Tenancy", back_populates="applicant")
    communications = relationship("Communication", back_populates="applicant")
    letting_offers = relationship("Offer", back_populates="applicant")  # Lettings offers
    sales_progression = relationship("SalesProgression", back_populates="buyer")
    sales_offers = relationship("SalesOffer", back_populates="buyer")  # Sales offers

    # Sales buyer specific fields
    buyer_type = Column(String)
    mortgage_status = Column(String, default=MortgageStatus.NOT_APPLIED)
    has_property_to_sell = Column(Boolean, default=False)
    is_chain_free = Column(Boolean, default=False)
    
    # Willingness flags
    willing_to_rent = Column(Boolean, default=True)
    willing_to_buy = Column(Boolean, default=False)
    
    # Buyer registration questions
    buyer_questions_answered = Column(Boolean, default=False)  # Flag indicating if buyer answered registration questions

    
