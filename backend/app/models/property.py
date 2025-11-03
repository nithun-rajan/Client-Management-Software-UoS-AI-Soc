from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel
from app.models.enums import PropertyStatus

class Property(BaseModel):
    __tablename__ = "properties"
    
    address = Column(String, nullable=False)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String, nullable=False)
    postcode = Column(String, nullable=False, index=True)
    
    property_type = Column(String, nullable=False)  # flat, house, maisonette
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    floor_area_sqft = Column(Float)
    furnished = Column(Boolean, default=False)
    
    asking_rent = Column(Float)  # What we listed it for
    rent = Column(Float)  # Actual achieved rent
    deposit = Column(Float)
    
    status = Column(String, default=PropertyStatus.AVAILABLE)
    listed_date = Column(DateTime, default=datetime.utcnow)  # When first listed
    let_agreed_date = Column(DateTime, nullable=True)  # When offer accepted
    let_date = Column(DateTime, nullable=True)  # When tenancy started
    last_status_change = Column(DateTime, default=datetime.utcnow)
    
    # Engagement tracking
    viewing_count = Column(Integer, default=0)
    enquiry_count = Column(Integer, default=0)
    offer_count = Column(Integer, default=0)
    
    # Compliance documents 
    epc_rating = Column(String)
    epc_expiry = Column(Date)
    gas_cert_expiry = Column(Date)
    eicr_expiry = Column(Date)
    hmolicence_expiry = Column(Date)
    
    # Additional details
    description = Column(Text)
    features = Column(Text)  # JSON string: ["parking", "garden", "pets_allowed"]
    council_tax_band = Column(String)
    
    # Photos
    main_photo_url = Column(String)
    photo_urls = Column(Text)  # JSON array of URLs
    
    landlord_id = Column(String, ForeignKey('landlords.id'))
    landlord = relationship("Landlord", back_populates="properties")
    
    # tenancies = relationship("Tenancy", back_populates="property")
    
    portal_views = Column(Integer, default=0)
    last_viewed_at = Column(DateTime)
    
    @property
    def days_on_market(self):
        if self.let_date:
            return (self.let_date - self.listed_date).days
        return (datetime.utcnow() - self.listed_date).days if self.listed_date else 0
    
    @property
    def price_achievement_rate(self):
        if self.asking_rent and self.rent:
            return (self.rent / self.asking_rent) * 100
        return None
    
    @property
    def is_compliant(self):
        today = datetime.now().date()
        checks = [
            self.epc_expiry and self.epc_expiry > today,
            self.gas_cert_expiry and self.gas_cert_expiry > today,
            self.eicr_expiry and self.eicr_expiry > today,
        ]
        return all(checks)
    
    @property
    def expiring_documents(self):
        from datetime import timedelta
        today = datetime.now().date()
        soon = today + timedelta(days=30)
        
        expiring = []
        if self.epc_expiry and self.epc_expiry < soon:
            expiring.append({"type": "EPC", "expiry": self.epc_expiry})
        if self.gas_cert_expiry and self.gas_cert_expiry < soon:
            expiring.append({"type": "Gas Safety", "expiry": self.gas_cert_expiry})
        if self.eicr_expiry and self.eicr_expiry < soon:
            expiring.append({"type": "EICR", "expiry": self.eicr_expiry})
        if self.hmolicence_expiry and self.hmolicence_expiry < soon:
            expiring.append({"type": "HMO Licence", "expiry": self.hmolicence_expiry})
            
        return expiring