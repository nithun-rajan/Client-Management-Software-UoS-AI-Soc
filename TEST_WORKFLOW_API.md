# Testing Workflow API - Quick Guide

## Step 1: Start Backend Server

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

Wait for: `Application startup complete`

## Step 2: Test the Endpoint

**Your Property ID**: `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9`

### Option A: Using PowerShell (Recommended)

```powershell
# Test GET available transitions
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions" -Method Get | ConvertTo-Json -Depth 10
```

### Option B: Using Browser

1. Open browser
2. Go to: `http://localhost:8000/docs`
3. Find: `GET /api/v1/workflows/{domain}/{entity_id}/transitions`
4. Click "Try it out"
5. Enter:
   - `domain`: `property`
   - `entity_id`: `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9`
6. Click "Execute"

### Option C: Using curl (if installed)

```bash
curl http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions
```

## Expected Response

```json
{
  "domain": "property",
  "entity_id": "1ff0d1e6-399c-419c-bbc8-6726df4d0bd9",
  "current_status": "available",
  "available_transitions": [
    "under_offer",
    "let_agreed",
    "withdrawn",
    "maintenance"
  ],
  "side_effects": {
    "under_offer": [
      "log_offer_received",
      "create_activity_log",
      "notify_landlord"
    ],
    "let_agreed": [
      "update_portal_status",
      "collect_holding_deposit_property",
      "send_offer_confirmation_property"
    ],
    ...
  }
}
```

## Step 3: Test a Status Transition (POST)

### Using PowerShell:

```powershell
$body = @{
    new_status = "under_offer"
    notes = "Testing workflow transition"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Using Browser (FastAPI Docs):

1. Find: `POST /api/v1/workflows/{domain}/{entity_id}/transitions`
2. Click "Try it out"
3. Enter:
   - `domain`: `property`
   - `entity_id`: `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9`
4. Request body:
```json
{
  "new_status": "under_offer",
  "notes": "Testing workflow transition"
}
```
5. Click "Execute"

## Common Errors

### 400 Bad Request - "Invalid domain"
- Make sure domain is: `property`, `tenancy`, `applicant`, or `vendor`
- Make sure URL is: `/api/v1/workflows/{domain}/{entity_id}/transitions`
- ❌ Wrong: `/api/v1/workflows/domain/property/transitions`
- ✅ Correct: `/api/v1/workflows/property/{property_id}/transitions`

### 404 Not Found
- Property ID doesn't exist
- Get a valid property ID: `GET /api/v1/properties/`

### Connection Refused
- Backend server is not running
- Make sure server is on `http://localhost:8000`

## Next Steps

Once the GET endpoint works:
1. Test POST endpoint (status transition)
2. Check that tasks are created
3. Test frontend Pipeline page
4. Test PropertyPipeline component

