# Fix for FastAPI Docs Issue

## The Problem
FastAPI docs UI can be confusing because it shows parameter names that look like values.

## Solution: Use Direct URLs Instead

### Test GET Endpoint
Just paste this in your browser:
```
http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions
```

### Test POST Endpoint
Use PowerShell (easier than the docs UI):

```powershell
$body = @{
    new_status = "available"
    notes = "Testing transition"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

## If You Must Use FastAPI Docs

When you see the form fields in FastAPI docs:

**Field 1: domain**
- ❌ Don't type: `entity_id`
- ✅ Type: `property`

**Field 2: entity_id**  
- ❌ Don't type: `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9 ` (with space)
- ✅ Type: `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9` (no space)

The field labels are just parameter names - you need to fill them with actual values!

## Recommended: Use Python Test Script

I created `backend/test_workflow.py` - just run:
```powershell
cd backend
python test_workflow.py
```

This avoids all the UI confusion!

