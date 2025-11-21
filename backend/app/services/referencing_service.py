import httpx
from app.core.config import settings
from app.models.tenancy import Tenancy

# Get these from your .env and config.py
REFERENCING_API_KEY = settings.REFERENCING_API_KEY
REFERENCING_API_URL = settings.REFERENCING_API_URL

async def start_referencing(tenancy: Tenancy):
    """
    Submits a tenancy to an external referencing partner.
    """
    if not tenancy.property or not tenancy.applicant:
        raise Exception("Missing property or applicant data")

    # 1. Build the data payload for the referencing partner
    payload = {
        "tenancy": {
            "property_address": tenancy.property.address,
            "rent_amount": tenancy.rent_amount,
            "start_date": tenancy.start_date.isoformat(),
        },
        "applicant": {
            "first_name": tenancy.applicant.first_name,
            "last_name": tenancy.applicant.last_name,
            "email": tenancy.applicant.email,
            "phone": tenancy.applicant.phone,
        }
        # ... (and any other required fields)
    }
    
    headers = {"Authorization": f"Bearer {REFERENCING_API_KEY}"}

    # 2. Make the API call
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{REFERENCING_API_URL}/references", json=payload, headers=headers)
            response.raise_for_status()
            
            # 3. Get the reference ID
            data = response.json()
            return data.get("reference_id")
            
        except httpx.HTTPStatusError as e:
            print(f"ERROR: Referencing API call failed: {e.response.text}")
            raise Exception(f"Failed to start referencing: {e.response.text}")