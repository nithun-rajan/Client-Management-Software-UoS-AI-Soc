# app/models/organization.py
from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Organization(BaseModel):
    __tablename__ = "organizations"
    name = Column(String, unique=True, index=True)

    # Relationships
    users = relationship("User", back_populates="organization")
    branches = relationship("Branch", back_populates="organization")


class Branch(BaseModel):
    __tablename__ = "branches"
    name = Column(String, index=True)
    address = Column(String, nullable=True)

    # Use Column(String, ...) for all ForeignKeys
    organization_id = Column(String, ForeignKey("organizations.id"))
    organization = relationship("Organization", back_populates="branches")

    # Relationships
    users = relationship("User", back_populates="branch")
