# app/schemas/organization.py
from app.schemas.model_config import AppBaseModel
import uuid

# Schemas for your new models
class BranchBase(AppBaseModel):
    name: str
    address: str | None = None

class BranchCreate(BranchBase):
    pass

class BranchRead(BranchBase):
    id: uuid.UUID
    organization_id: uuid.UUID

    class Config:
        from_attributes = True

class OrganizationBase(AppBaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationRead(OrganizationBase):
    id: uuid.UUID
    branches: list[BranchRead] = []

