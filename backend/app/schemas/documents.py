from pydantic import BaseModel
from datetime import datetime
import uuid
from enum import Enum
from typing import Optional

# --- NEW: Added document categories ---
# This is crucial for your lettings workflow (e.g., checking if a Right-to-Rent doc exists)
class DocumentCategory(str, Enum):
    REFERENCING = "referencing"
    RIGHT_TO_RENT = "right_to_rent"
    TENANCY_AGREEMENT = "tenancy_agreement"
    GAS_SAFETY = "gas_safety"
    EPC = "epc"
    INVENTORY = "inventory"
    OTHER = "other"

class DocumentBase(BaseModel):
    file_name: str
    file_type: Optional[str] = None
    category: DocumentCategory = DocumentCategory.OTHER
    tenancy_id: Optional[uuid.UUID] = None
    property_id: Optional[uuid.UUID] = None

class DocumentCreate(DocumentBase):
    file_path: str
    uploaded_by_id: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: uuid.UUID
    created_at: datetime
    uploaded_by_id: Optional[str] = None

    class Config:
        from_attributes = True

# --- NEW: Schema for the secure download link ---
class DocumentLinkResponse(BaseModel):
    file_name: str
    download_url: str
