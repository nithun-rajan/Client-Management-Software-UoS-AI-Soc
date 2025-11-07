# Test Status Transition - Next Step

## ✅ Test 1 Complete!
The GET endpoint works perfectly! Your property is currently `tenanted`.

## Test 2: Transition Property Status

### Option A: Test in Browser (FastAPI Docs)

1. Go to: `http://localhost:8000/docs`
2. Find: `POST /api/v1/workflows/{domain}/{entity_id}/transitions`
3. Click "Try it out"
4. Enter:
   - `domain`: `property`
   - `entity_id`: `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9`
5. Request body:
```json
{
  "new_status": "managed",
  "notes": "Moving to managed status for testing"
}
```
6. Click "Execute"

### Option B: Use PowerShell

```powershell
$body = @{
    new_status = "managed"
    notes = "Testing transition to managed status"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Expected Response

You should see:
```json
{
  "success": true,
  "message": "Successfully transitioned property from 'tenanted' to 'managed'",
  "previous_status": "tenanted",
  "new_status": "managed",
  "domain": "property",
  "entity_id": "1ff0d1e6-399c-419c-bbc8-6726df4d0bd9",
  "side_effects_executed": [],
  "transitions_available": ["available"]
}
```

### Verify the Change

After the transition, check the status again:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions" | ConvertTo-Json
```

You should see `current_status: "managed"` now!

## Test 3: Check if Tasks Were Created

After the transition, check if tasks were created:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/" | ConvertTo-Json -Depth 5
```

Look for tasks related to the property transition.

## Next: Test Frontend

Once backend transitions work:
1. Start frontend: `cd frontend && npm run dev`
2. Go to: `http://localhost:5173/pipeline`
3. Check if Pipeline page loads
4. Go to a property details page and see the PropertyPipeline component

