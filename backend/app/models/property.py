from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import PropertyStatus


class Property(BaseModel):
    __tablename__ = "properties"

    address_line1 = Column(String, nullable=False)
    address_line2 = Column(String)
    city = Column(String, nullable=False)
    postcode = Column(String, nullable=False)
    status = Column(String, default=PropertyStatus.AVAILABLE)  # Using correct enum

    # Property details
    property_type = Column(String)  # flat, house, etc
    bedrooms = Column(String)
    bathrooms = Column(String)

    # Relationships
    landlord_id = Column(String, ForeignKey('landlords.id'))
    landlord = relationship("Landlord", back_populates="properties")

    tenancies = relationship("Tenancy", back_populates="property")
