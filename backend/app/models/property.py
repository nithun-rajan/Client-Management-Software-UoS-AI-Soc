from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, DateTime, Date, Boolean, Numeric, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel
from app.models.enums import PropertyStatus
from app.models.enums_sales import SalesStatus

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
    listed_date = Column(DateTime, default=datetime.now(timezone.utc) ) # When first listed
    let_agreed_date = Column(DateTime, nullable=True)  # When offer accepted
    let_date = Column(DateTime, nullable=True)  # When tenancy started
    last_status_change = Column(DateTime, default=datetime.now(timezone.utc))
    
    # Engagement tracking
    viewing_count = Column(Integer, default=0)
    enquiry_count = Column(Integer, default=0)
    offer_count = Column(Integer, default=0)
    
    # Compliance documents 
    epc_rating = Column(String)
    epc_date = Column(Date, nullable=True)  # Date EPC was issued
    epc_expiry = Column(Date, nullable=True)  # Date EPC expires
    gas_safety_date = Column(Date, nullable=True)  # Date gas safety certificate was issued
    gas_cert_expiry = Column(Date, nullable=True)  # Date gas safety certificate expires
    eicr_date = Column(Date, nullable=True)  # Date EICR was issued
    eicr_expiry = Column(Date, nullable=True)  # Date EICR expires
    hmolicence_date = Column(Date, nullable=True)  # Date HMO licence was issued
    hmolicence_expiry = Column(Date, nullable=True)  # Date HMO licence expires
    
    # Additional details
    description = Column(Text)
    features = Column(Text)  # JSON string: ["parking", "garden", "pets_allowed"]
    council_tax_band = Column(String)
    
    # Photos
    main_photo_url = Column(String)
    photo_urls = Column(Text)  # JSON array of URLs
    virtual_tour_url = Column(String)  # Matterport/360 virtual tour
    
    portal_views = Column(Integer, default=0)
    last_viewed_at = Column(DateTime)
    landlord_id = Column(String, ForeignKey('landlords.id'))
    vendor_id = Column(String, ForeignKey('vendors.id'), nullable=True)  # For sales properties
    
    # Property management
    managed_by = Column(String, ForeignKey('users.id'), nullable=True)  # Property manager user_id
    management_type = Column(String, nullable=True)  # fully_managed, let_only, rent_collection
    management_notes = Column(Text, nullable=True)  # Notes like "Managed by John Doe", key numbers, etc.
    
    # Complaints tracking
    complaints_count = Column(Integer, default=0)  # Total number of complaints
    active_complaints_count = Column(Integer, default=0)  # Currently open complaints
    last_complaint_date = Column(DateTime, nullable=True)  # Date of last complaint

    # Relationships
    landlord = relationship("Landlord", back_populates="properties")
    vendor = relationship("Vendor", foreign_keys=[vendor_id])
    tenancies = relationship("Tenancy", back_populates="property")
    communications = relationship("Communication", back_populates="property")
    maintenance_issues = relationship("MaintenanceIssue", back_populates="property", cascade="all, delete-orphan")
    sales_progression = relationship("SalesProgression", back_populates="property", uselist=False)
    valuations = relationship("Valuation", back_populates="property")
    offers = relationship("Offer", back_populates="property")  # Lettings offers
    sales_offers = relationship("SalesOffer", back_populates="property")  # Sales offers
    tickets = relationship("Ticket", back_populates="property", cascade="all, delete-orphan")    


    # Sales specific fields
    sales_status = Column(String, default=SalesStatus.AVAILABLE, index=True)
    asking_price = Column(Numeric(12, 2))
    price_qualifier = Column(String)
    has_valuation_pack = Column(Boolean, default=False)  # Flag for valuation pack generation


    
    @property
    def days_on_market(self):
        if self.let_date:
            return (self.let_date - self.listed_date).days
        return (datetime.now(timezone.utc)  - self.listed_date).days if self.listed_date else 0
    
    @property
    def price_achievement_rate(self):
        if self.asking_rent and self.rent:
            return (self.rent / self.asking_rent) * 100
        return None
    
    @property
    def is_compliant(self):
        """Check if property has all required valid certificates"""
        today = datetime.now(timezone.utc).date()
        checks = []
        
        # EPC must be valid (expires in more than 0 days)
        if self.epc_expiry:
            checks.append(self.epc_expiry > today)
        
        # Gas safety certificate must be valid
        if self.gas_cert_expiry:
            checks.append(self.gas_cert_expiry > today)
        
        # EICR must be valid (if applicable)
        if self.eicr_expiry:
            checks.append(self.eicr_expiry > today)
        
        # HMO Licence must be valid (if applicable)
        if self.hmolicence_expiry:
            checks.append(self.hmolicence_expiry > today)
        
        return all(checks) if checks else False
    
    @property
    def expiring_documents(self):
        from datetime import timedelta
        today = datetime.now(timezone.utc).date()
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
    
    @property
    def active_tenancy(self):
        """Get the current active tenancy"""
        from datetime import date
        today = date.today()
        for tenancy in self.tenancies:
            if tenancy.status == "active" and tenancy.start_date <= today <= tenancy.end_date:
                return tenancy
        return None
    
    @property
    def current_tenant_id(self):
        """Get the current tenant ID from active tenancy"""
        active = self.active_tenancy
        return active.applicant_id if active else None