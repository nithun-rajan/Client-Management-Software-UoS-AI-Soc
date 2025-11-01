from sqlalchemy import Column, Integer, String, Float, Enum as SQLEnum
from app.core.database import Base
import enum

class PropertyStatus(str, enum.Enum):
    AVAILABLE = "available"
    LET_BY = "let_by"
    MANAGED = "managed"

class PropertyType(str, enum.Enum):
    FLAT = "flat"
    HOUSE = "house"
    MAISONETTE = "maisonette"

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    postcode = Column(String, index=True)
    property_type = Column(SQLEnum(PropertyType), nullable=False)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    rent = Column(Float)
    status = Column(SQLEnum(PropertyStatus), default=PropertyStatus.AVAILABLE)
    description = Column(String)