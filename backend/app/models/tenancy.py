from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Tenancy(BaseModel):
    __tablename__ = "tenancies"
    
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False)
    landlord_id = Column(String, ForeignKey('landlords.id'), nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    monthly_rent = Column(Float, nullable=False)
    deposit_amount = Column(Float)
    
    status = Column(String, default="active")
    
    property = relationship("Property", back_populates="tenancies")
    applicant = relationship("Applicant", back_populates="tenancies")
    landlord = relationship("Landlord", back_populates="tenancies")
    tasks = relationship("Task", back_populates="tenancy")