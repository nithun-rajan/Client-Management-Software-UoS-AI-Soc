from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func
from app.core.database import Base  # This is SQLAlchemy's declarative_base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class BaseModel(Base):  # all tables should log the following fields, hence all tables should inherit this one.
    __abstract__ = True  
    
    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())