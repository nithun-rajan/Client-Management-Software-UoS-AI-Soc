# In a new file: backend/app/services/deposit_service.py
import httpx
from app.core.config import settings # To get API keys
from app.models.tenancy import Tenancy

# Get API keys from settings
DEPOSIT_API_KEY = settings.DEPOSIT_API_KEY
DEPOSIT_API_URL = settings.DEPOSIT_API_URL 

async def register_deposit(tenancy: Tenancy):
    """
    Registers a deposit with the external protection scheme.
    """
    if not tenancy.property or not tenancy.applicant:
        raise Exception("Missing property or applicant data")

    # 1. Build the data payload they require
    payload = {
        "property_address": tenancy.property.address,
        "rent_amount": tenancy.rent_amount,
        "deposit_amount": tenancy.deposit_amount,
        "start_date": tenancy.start_date.isoformat(),
        "tenant_name": f"{tenancy.applicant.first_name} {tenancy.applicant.last_name}",
        "tenant_email": tenancy.applicant.email,
        # ... (and landlord details, etc.)
    }
    
    headers = {"Authorization": f"Bearer {DEPOSIT_API_KEY}"}

    # 2. Make the API call
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{DEPOSIT_API_URL}/register", json=payload, headers=headers)
            response.raise_for_status() # Raises an error if the call fails
            
            # 3. Get the registration reference number
            data = response.json()
            return data.get("registration_id")
            
        except httpx.HTTPStatusError as e:
            print(f"ERROR: API call failed: {e.response.text}")
            raise Exception(f"Failed to register deposit: {e.response.text}")