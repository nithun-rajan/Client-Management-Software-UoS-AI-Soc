# app/schemas/user.py
from pydantic import EmailStr
from enum import Enum
import uuid
from app.schemas.model_config import AppBaseModel

class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"
    VIEWER = "viewer"

# Base properties
class UserBase(AppBaseModel):
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
    agent_profile: dict | None = None  # Agent profile settings

# Agent profile update schema
class AgentProfileUpdate(AppBaseModel):
    name: str | None = None
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    office: str | None = None
    qualifications: str | None = None
    avatarUrl: str | None = None
    kpis: dict | None = None

