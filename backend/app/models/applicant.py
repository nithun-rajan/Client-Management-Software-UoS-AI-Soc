from sqlalchemy import Column, String, Integer, Date, Text, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import ApplicantStatus

class Applicant(BaseModel):
    __tablename__ = "applicants"
    
    # Core fields aligning with API schema/tests and frontend types
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String)
    date_of_birth = Column(Date, nullable=True)
    
    # Search criteria and budgets
    desired_bedrooms = Column(String, nullable=True)  # Changed to match frontend
    desired_property_type = Column(String, nullable=True)  # Added to match frontend
    rent_budget_min = Column(Float, nullable=True)
    rent_budget_max = Column(Float, nullable=True)
    preferred_locations = Column(Text, nullable=True)  # Changed from desired_locations
    move_in_date = Column(Date, nullable=True)
    
    # Status and checks
    status = Column(String, default=ApplicantStatus.NEW)
    references_passed = Column(Boolean, default=False)
    right_to_rent_checked = Column(Boolean, default=False)
    
    # Pet information (from frontend types)
    has_pets = Column(Boolean, default=False)
    pet_details = Column(Text, nullable=True)
    
    # Special requirements
    special_requirements = Column(Text, nullable=True)
    
    # Notes
    notes = Column(Text)
    
    # Relationships
    tenancies = relationship("Tenancy", back_populates="applicant")
    communications = relationship("Communication", back_populates="applicant")