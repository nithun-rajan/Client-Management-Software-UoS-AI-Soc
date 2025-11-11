from app.schemas.model_config import AppBaseModel
from app.models.enums import TenancyStatus

from datetime import date, datetime
from typing import Optional


# Fields common to Create and Response
class TenancyBase(AppBaseModel):
    property_id: str
    primary_applicant_id: str
    rent_amount: float
    deposit_amount: float
    start_date: date
    end_date: Optional[date] = None
    status: str = "pending"
    

    deposit_scheme: Optional[str] = None
    deposit_scheme_ref: Optional[str] = None
    notice_period_days: Optional[int] = 30
    notice_given_date: Optional[date] = None
    offer_accepted_date: Optional[date] = None
    referencing_completed_date: Optional[date] = None
    contract_sent_date: Optional[date] = None
    contract_signed_date: Optional[date] = None
    keys_collected_date: Optional[date] = None
    right_to_rent_verified: Optional[bool] = False
    right_to_rent_verified_date: Optional[date] = None
    inventory_completed: Optional[bool] = False
    inventory_completed_date: Optional[date] = None
    additional_occupants: Optional[str] = None # Assuming JSON as a string
    notes: Optional[str] = None

# Schema for CREATING a tenancy (matches your other 'Create' schemas)
class TenancyCreate(TenancyBase):
    pass

# Schema for UPDATING a tenancy (matches your other 'Update' schemas)
class TenancyUpdate(AppBaseModel):
    property_id: Optional[str] = None
    primary_applicant_id: Optional[str] = None
    rent_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[TenancyStatus] = None
    status: Optional[str] = None
    deposit_scheme: Optional[str] = None
    deposit_scheme_ref: Optional[str] = None
    notice_period_days: Optional[int] = None
    notice_given_date: Optional[date] = None
    offer_accepted_date: Optional[date] = None
    referencing_completed_date: Optional[date] = None
    contract_sent_date: Optional[date] = None
    contract_signed_date: Optional[date] = None
    keys_collected_date: Optional[date] = None
    right_to_rent_verified: Optional[bool] = None
    right_to_rent_verified_date: Optional[date] = None
    inventory_completed: Optional[bool] = None
    inventory_completed_date: Optional[date] = None
    additional_occupants: Optional[str] = None
    notes: Optional[str] = None

# Schema for RESPONDING with a tenancy (matches your other 'Response' schemas)
class TenancyResponse(TenancyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
