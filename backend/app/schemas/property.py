from pydantic import ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import date 

from app.models.enums import PropertyStatus

from app.schemas.model_config import AppBaseModel

class PropertyBase(AppBaseModel):
    address: str | None = None
    postcode: str
    property_type: str
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    rent: float | None = None
    description: str | None = None

class PropertyCreate(PropertyBase):
    city: str
    landlord_id: str | None = None
    vendor_id: str | None = None

    # COMPLIANCE DATES
    epc_expiry: date | None = None # Energy Performance Certificate.
    gas_cert_expiry: date | None = None # gas_cert_expiry.
    eicr_expiry: date | None = None # Electrical Installation Condition Report.
    hmolicence_expiry: date | None = None # HMO status.

class PropertyUpdate(AppBaseModel):
    address: str | None = None
    city: str | None = None
    postcode: str | None = None
    property_type: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    rent: float | None = None
    status: str | None = None
    description: str | None = None
    sales_status: str | None = None
    asking_price: float | None = None
    price_qualifier: str | None = None
    has_valuation_pack: bool | None = None
    landlord_id: str | None = None
    vendor_id: str | None = None
    managed_by: str | None = None
    management_type: str | None = None
    management_notes: str | None = None
    main_photo_url: str | None = None
    photo_urls: str | None = None  # JSON array of photo URLs

    # COMPLIANCE DATES
    epc_expiry: date | None = None # Energy Performance Certificate.
    gas_cert_expiry: date | None = None # gas_cert_expiry.
    eicr_expiry: date | None = None # Electrical Installation Condition Report.
    hmolicence_expiry: date | None = None # HMO status.

class LandlordInfo(AppBaseModel):
    """Basic landlord information for property responses"""
    id: str
    full_name: str
    email: str
    phone: str | None = None

class VendorInfo(AppBaseModel):
    """Basic vendor information for property responses"""
    id: str
    first_name: str
    last_name: str
    email: str
    primary_phone: str | None = None

class PropertyResponse(PropertyBase):
    id: str
    status: PropertyStatus
    city: str
    address_line1: str | None = None
    address_line2: str | None = None
    landlord_id: str | None = None
    landlord: LandlordInfo | None = None
    vendor_id: str | None = None
    vendor: VendorInfo | None = None
    sales_status: str | None = None
    asking_price: float | None = None
    price_qualifier: str | None = None
    has_valuation_pack: bool | None = None
    managed_by: str | None = None
    management_type: str | None = None
    management_notes: str | None = None
    managed_by_name: str | None = None  # Full name of agent managing the landlord/vendor
    main_photo_url: str | None = None
    photo_urls: str | None = None  # JSON array of photo URLs

    # COMPLIANCE DATES
    epc_expiry: date | None = None # Energy Performance Certificate.
    gas_cert_expiry: date | None = None # gas_cert_expiry.
    eicr_expiry: date | None = None # Electrical Installation Condition Report.
    hmolicence_expiry: date | None = None # HMO status.

    # COMPUTED COMPLIANCE FIELDS 
    is_compliant: bool = Field(description="Computed property: True if all documents are valid.")
    expiring_documents: List[Dict[str, Any]] = Field(description="Computed property: List of documents expiring soon or expired.")
