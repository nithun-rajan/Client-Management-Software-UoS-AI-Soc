# app/models/user.py
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, JSON
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.schemas.user import Role


class User(BaseModel):
    __tablename__ = "users"
    

    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    role = Column(SQLEnum(Role))

    # Use Column(String, ...) for all ForeignKeys
    organization_id = Column(String, ForeignKey("organizations.id"))
    branch_id = Column(String, ForeignKey("branches.id"), nullable=True)
    
    # Agent profile settings (stored as JSON)
    agent_profile = Column(JSON, nullable=True)  # Stores: title, phone, office, qualifications, avatarUrl, kpis

    # Relationships
    organization = relationship("Organization", back_populates="users")
    branch = relationship("Branch", back_populates="users")