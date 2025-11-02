# app/schemas/organization.py
from pydantic import BaseModel
import uuid

# Schemas for your new models
class BranchBase(BaseModel):
    name: str
    address: str | None = None

class BranchCreate(BranchBase):
    pass

class BranchRead(BranchBase):
    id: uuid.UUID
    organization_id: uuid.UUID

    class Config:
        from_attributes = True

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationRead(OrganizationBase):
    id: uuid.UUID
    branches: list[BranchRead] = []

    class Config:
        from_attributes = True