# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from enum import Enum
import uuid

class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"
    VIEWER = "viewer"

# Base properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: Role

# Properties to receive on creation
class UserCreate(UserBase):
    password: str
    # IDs are now UUIDs
    organization_id: uuid.UUID
    branch_id: uuid.UUID | None = None

# Properties to return to client
class UserRead(UserBase):
    # IDs are now UUIDs
    id: uuid.UUID
    is_active: bool
    organization_id: uuid.UUID
    branch_id: uuid.UUID | None

    class Config:
        from_attributes = True