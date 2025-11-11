from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import os
import uuid
from typing import List

from app.core.database import get_db
from app.models.document import Document
from app.schemas.documents import DocumentCreate, DocumentResponse, DocumentLinkResponse

router = APIRouter(prefix="/documents", tags=["documents"])

def upload_file_to_cloud(file_name: str, file_content: bytes) -> str:
    """
    In a real app, this function would upload the file to S3, GCS, or Azure Blob
    and return the permanent URL or object key.
    
    For this example, we'll save it locally but warn that this is not for production.
    """
    print("WARNING: Saving file to local /uploads directory. NOT FOR PRODUCTION.")
    # Ensure the upload directory exists
    os.makedirs("uploads", exist_ok=True)
    
    file_path = f"uploads/{file_name}"
    
    # --- MODIFIED: Changed to standard sync 'with open' ---
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    # --- END OF MODIFICATION ---
        
    return file_path # In production, this would be the cloud URL/key

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_2_0_CREATED)
def upload_document(
    tenancy_id: str = Form(None),
    property_id: str = Form(None),
    applicant_id: str = Form(None),
    document_type: str = Form(..., description="Specific type, e.g., 'reference', 'right_to_rent', 'epc'"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document and associate it with a tenancy or property.
    """
    if not tenancy_id and not property_id and applicant_id:
        raise HTTPException(status_code=400, detail="A tenancy_id or property_id must be provided.")

    # Generate a unique file name to prevent conflicts

    file_extension = os.path.splitext(file.filename)[1]
    unique_file_name = f"{uuid.uuid4()}{file_extension}"

    file_content = file.file.read()

    try:
        file_path = upload_file_to_cloud(unique_file_name, file_content)
    except Exception as e:
        # Log the error
        print(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed.")

    doc_create = DocumentCreate(
        title=file.filename,
        document_type=document_type,
        file_url=file_path,
        file_name=file.filename,
        file_size=len(file_content),
        mime_type=file.content_type,
        tenancy_id=tenancy_id,
        property_id=property_id,
        applicant_id=applicant_id,
        uploaded_by_user_id="system"
    )

    db_document = Document(**doc_create.model_dump())
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

# --- Secure Download Endpoint ---
@router.get("/{document_id}/download", response_model=DocumentLinkResponse)
def get_document_download_link(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a secure, temporary download link for a document.
    """
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # --- AUTHORIZATION ---
    # In a real app, you would check if current_user is allowed to see this
    # e.g., if current_user.id == db_document.uploaded_by_id or user is admin
    # if not user_is_authorized(current_user, db_document):
    #     raise HTTPException(status_code=403, detail="Not authorized")

    # --- PRE-SIGNED URL LOGIC ---
    # In a real app, you would generate a pre-signed URL from S3/GCS here.
    # For this example, we'll just return a (fake) link to the local file.
    # DO NOT DO THIS IN PRODUCTION.
    
    # Real S3 (boto3) logic would look like:
    # s3_client = boto3.client('s3')
    # download_url = s3_client.generate_presigned_url(
    #     'get_object',
    #     Params={'Bucket': 'your-bucket', 'Key': db_document.file_path},
    #     ExpiresIn=3600 # Link is valid for 1 hour
    # )
    
    # Placeholder logic:
    download_url = f"/static/{db_document.file_path}" # FAKE: This is not secure
    print("WARNING: Returning insecure, direct file path. Implement pre-signed URLs.")

    return DocumentLinkResponse(
        file_name=db_document.file_name,
        download_url=download_url
    )

@router.get("/tenancy/{tenancy_id}", response_model=List[DocumentResponse])
def get_tenancy_documents(
    tenancy_id: str, 
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user) # --- REMOVED auth
):
    """
    Get all documents for a specific tenancy.
    """
    # --- AUTHORIZATION ---
    # Here you would check if the current_user is related to this tenancy
    
    documents = db.query(Document).filter(Document.tenancy_id == tenancy_id).all()
    return documents

@router.get("/property/{property_id}", response_model=List[DocumentResponse])
def get_property_documents(
    property_id: str, 
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user) # --- REMOVED auth
):
    """
    Get all compliance documents for a specific property.
    """
    # --- AUTHORIZATION ---
    # Here you would check if the current_user is related to this property (e.g., is the landlord)

    documents = db.query(Document).filter(Document.property_id == property_id).all()
    return documents
