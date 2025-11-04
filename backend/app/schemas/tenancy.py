from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


# Fields common to Create and Response
class TenancyBase(BaseModel):
    property_id: str
    primary_applicant_id: str
    rent_amount: float
    deposit_amount: float
    start_date: date
    end_date: date | None = None
    status: str = "pending"

    deposit_scheme: str | None = None
    deposit_scheme_ref: str | None = None
    notice_period_days: int | None = 30
    notice_given_date: date | None = None
    offer_accepted_date: date | None = None
    referencing_completed_date: date | None = None
    contract_sent_date: date | None = None
    contract_signed_date: date | None = None
    keys_collected_date: date | None = None
    right_to_rent_verified: bool | None = False
    right_to_rent_verified_date: date | None = None
    inventory_completed: bool | None = False
    inventory_completed_date: date | None = None
    additional_occupants: str | None = None  # Assuming JSON as a string
    notes: str | None = None


# Schema for CREATING a tenancy (matches your other 'Create' schemas)
class TenancyCreate(TenancyBase):
    pass


# Schema for UPDATING a tenancy (matches your other 'Update' schemas)
class TenancyUpdate(BaseModel):
    property_id: str | None = None
    primary_applicant_id: str | None = None
    rent_amount: float | None = None
    deposit_amount: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    deposit_scheme: str | None = None
    deposit_scheme_ref: str | None = None
    notice_period_days: int | None = None
    notice_given_date: date | None = None
    offer_accepted_date: date | None = None
    referencing_completed_date: date | None = None
    contract_sent_date: date | None = None
    contract_signed_date: date | None = None
    keys_collected_date: date | None = None
    right_to_rent_verified: bool | None = None
    right_to_rent_verified_date: date | None = None
    inventory_completed: bool | None = None
    inventory_completed_date: date | None = None
    additional_occupants: str | None = None
    notes: str | None = None


# Schema for RESPONDING with a tenancy (matches your other 'Response' schemas)
class TenancyResponse(TenancyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
