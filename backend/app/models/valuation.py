from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, DateTime, Date, Boolean, Numeric, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel


class Valuation(BaseModel):
    __tablename__ = "valuations"
    
    # Core property reference
    property_id = Column(String, ForeignKey('properties.id'), nullable=False, index=True)
    
    # Valuation details
    valuation_type = Column(String, nullable=False)  # 'sales', 'lettings'
    estimated_value = Column(Numeric(12, 2))
    value_range_min = Column(Numeric(12, 2))
    value_range_max = Column(Numeric(12, 2))
    confidence = Column(String)  # 'high', 'medium', 'low'
    
    # Market analysis
    market_conditions = Column(Text)
    comparable_properties = Column(JSON)  # Store comparable sales/rentals data
    key_factors = Column(JSON)  # Positive, negative, neutral factors
    
    # Recommendation and pricing strategy
    recommended_price = Column(Numeric(12, 2))
    pricing_strategy = Column(String)  # 'quick_sale', 'premium', 'balanced'
    recommendations = Column(JSON)  # List of actionable recommendations
    
    # Property-specific analysis
    property_advantages = Column(Text)
    property_limitations = Column(Text)
    location_analysis = Column(Text)
    
    # Technical details
    valuation_date = Column(DateTime, default=datetime.now(timezone.utc))
    valuation_method = Column(String)  # 'ai_analysis', 'manual', 'comparison'
    model_used = Column(String)  # 'gpt-4o', etc.

    #capture detailed valuation logic:
    valuation_logic = Column(Text)  # Detailed reasoning like Pg 46 paragraphs
    location_infrastructure = Column(Text)  # Transport, schools, amenities (Pg 8, 46)
    market_trends_analysis = Column(Text)  # Interest rates, buyer demand (Pg 46)
    investment_appeal = Column(Text)  # Investor appeal analysis (Pg 8)
    
    # Status
    status = Column(String, default='active')  # 'active', 'superseded', 'draft'
    
    # Relationships
    property = relationship("Property", back_populates="valuations")


class ComparableSale(BaseModel):
    __tablename__ = "comparable_sales"
    
    valuation_id = Column(String, ForeignKey('valuations.id'), nullable=False, index=True)
    
    # Comparable property details
    address = Column(String, nullable=False)
    distance_km = Column(Float)
    property_type = Column(String)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    floor_area_sqft = Column(Float)
    
    # Sale details
    sale_price = Column(Numeric(12, 2))
    sale_date = Column(Date)
    price_per_sqft = Column(Numeric(8, 2))
    
    # Comparison metrics
    similarity_score = Column(Float)  # 0-1 how similar to subject property
    adjustment_factor = Column(Float)  # Positive/negative adjustment for differences
    
    # Source
    data_source = Column(String)  # 'land_registry', 'rightmove', 'zoopla'
    source_url = Column(String)

    
    
    # Relationships
    valuation = relationship("Valuation", back_populates="comparable_sales")
    