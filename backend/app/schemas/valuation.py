from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from app.schemas.model_config import AppBaseModel


class ComparableSaleBase(AppBaseModel):
    address: str
    distance_km: Optional[float] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_area_sqft: Optional[float] = None
    sale_price: float
    sale_date: Optional[date] = None
    price_per_sqft: Optional[float] = None
    similarity_score: Optional[float] = None
    adjustment_factor: Optional[float] = None
    data_source: Optional[str] = None
    source_url: Optional[str] = None


class ComparableSaleCreate(ComparableSaleBase):
    valuation_id: str


class ComparableSale(ComparableSaleBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ValuationBase(AppBaseModel):
    property_id: str
    valuation_type: str = Field(..., pattern="^(sales|lettings)$")
    estimated_value: Optional[float] = None
    value_range_min: Optional[float] = None
    value_range_max: Optional[float] = None
    confidence: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    market_conditions: Optional[str] = None
    comparable_properties: Optional[List[Dict[str, Any]]] = None
    key_factors: Optional[Dict[str, List[str]]] = None
    recommended_price: Optional[float] = None
    pricing_strategy: Optional[str] = Field(None, pattern="^(quick_sale|premium|balanced|aspirational)$")
    recommendations: Optional[List[str]] = None
    property_advantages: Optional[str] = None
    property_limitations: Optional[str] = None
    location_analysis: Optional[str] = None
    valuation_logic: Optional[str] = None
    location_infrastructure: Optional[str] = None
    valuation_method: Optional[str] = Field(None, pattern="^(ai_analysis|manual|comparison)$")
    model_used: Optional[str] = None


class ValuationCreate(ValuationBase):
    pass


class ValuationUpdate(AppBaseModel):
    estimated_value: Optional[float] = None
    value_range_min: Optional[float] = None
    value_range_max: Optional[float] = None
    confidence: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    status: Optional[str] = Field(None, pattern="^(active|superseded|draft)$")
    pricing_strategy: Optional[str] = Field(None, pattern="^(quick_sale|premium|balanced|aspirational)$")


class Valuation(ValuationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    valuation_date: datetime
    status: str = Field(..., pattern="^(active|superseded|draft)$")
    
    # Relationships
    comparable_sales: List[ComparableSale] = []
    
    class Config:
        from_attributes = True


class ValuationRequest(BaseModel):
    property_id: str
    valuation_type: str
    include_comparables: bool = True
    market_analysis_depth: str = "comprehensive"
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)
    max_comparables: int = Field(default=10, ge=1, le=50)
    
    @field_validator('valuation_type', mode='before')
    @classmethod
    def validate_valuation_type(cls, v):
        # Convert to string if not already
        if v is None:
            raise ValueError("valuation_type is required")
        v_str = str(v).lower().strip()
        if v_str not in ['sales', 'lettings']:
            raise ValueError(f"valuation_type must be 'sales' or 'lettings', got '{v}'")
        return v_str
    
    @field_validator('market_analysis_depth', mode='before')
    @classmethod
    def validate_market_analysis_depth(cls, v):
        # Convert to string if not already, default if None or invalid
        if v is None:
            return "comprehensive"
        v_str = str(v).lower().strip()
        if v_str not in ['basic', 'standard', 'comprehensive']:
            return "comprehensive"  # Default if invalid
        return v_str
    
    @field_validator('radius_km', mode='before')
    @classmethod
    def validate_radius_km(cls, v):
        if v is None:
            return 5.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 5.0
    
    @field_validator('max_comparables', mode='before')
    @classmethod
    def validate_max_comparables(cls, v):
        if v is None:
            return 10
        try:
            return int(v)
        except (ValueError, TypeError):
            return 10


class ValuationResponse(AppBaseModel):
    success: bool
    valuation: Optional[Valuation] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None
    model_used: Optional[str] = None


class ComparablePropertiesRequest(AppBaseModel):
    property_id: str
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)
    max_results: int = Field(default=10, ge=1, le=50)
    min_bedrooms: Optional[int] = Field(None, ge=0, le=10)
    max_bedrooms: Optional[int] = Field(None, ge=0, le=10)
    property_types: Optional[List[str]] = None
    min_sale_date: Optional[date] = None
    max_sale_date: Optional[date] = None


class ComparablePropertiesResponse(AppBaseModel):
    success: bool
    comparables: List[Dict[str, Any]] = []
    total_found: int
    search_radius: float
    error: Optional[str] = None


# Specific response models for blueprint-structured valuation packs
class SubjectPropertyDetails(AppBaseModel):
    """Pg 42-43: Subject Property Details table"""
    address: str
    property_type: str
    bedrooms: int
    bathrooms: int
    floor_area: Optional[float] = None
    tenure: Optional[str] = None
    council_tax_band: Optional[str] = None
    key_selling_points: Optional[List[str]] = None


class ComparableSaleAnalysis(AppBaseModel):
    """Pg 43-44: Comparative Sales table structure"""
    recent_sales: List[Dict[str, Any]]
    key_takeaways: str


class ActiveMarketComparable(AppBaseModel):
    """Pg 44-45: Active Market Comparables table"""
    address: str
    bedrooms: int
    bathrooms: int
    asking_price: float
    key_features: List[str]
    source: Optional[str] = None


class PriceRange(AppBaseModel):
    """Pg 45: Recommended Valuation and Price Range"""
    quick_sale: float
    balanced: float
    aspirational: float


class ValuationLogic(AppBaseModel):
    """Pg 46: Valuation Logic and Reasoning sections"""
    comparable_property_analysis: str
    premium_factors: List[str]
    location_analysis: str
    market_conditions: str
    investment_appeal: Optional[str] = None


class BlueprintValuationPack(AppBaseModel):
    """Complete valuation pack following blueprint structure (Pg 42-46)"""
    subject_property_details: SubjectPropertyDetails
    comparable_sales_analysis: ComparableSaleAnalysis
    active_market_comparables: List[ActiveMarketComparable]
    recommended_valuation: Dict[str, Any]  # Price ranges and strategy
    valuation_logic: ValuationLogic
    executive_summary: str
    confidence_level: str
    key_recommendations: List[str]


class ValuationPackResponse(AppBaseModel):
    """Response containing blueprint-formatted valuation pack"""
    success: bool
    valuation_pack: Optional[Dict[str, Any]] = None
    valuation_record: Optional[Valuation] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None

