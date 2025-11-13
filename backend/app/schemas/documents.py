from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class DocumentBase(BaseModel):
    file_name: str
    mime_type: Optional[str] = None
    document_type: str
    tenancy_id: Optional[str] = None
    property_id: Optional[str] = None
    applicant_id: Optional[str] = None

class DocumentCreate(DocumentBase):
    title: str
    file_url: str
    file_size: Optional[int] = None
    uploaded_by_user_id: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str
    title: str
    file_url: str
    file_size: Optional[int] = None
    uploaded_at: datetime
    status: str
    uploaded_by_user_id: Optional[str] = None

    class Config:
        from_attributes = True

# --- NEW: Schema for the secure download link ---
class DocumentLinkResponse(BaseModel):
    file_name: str
    download_url: str
