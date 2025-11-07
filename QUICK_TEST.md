# Quick Test Guide - Workflow API

## Step 1: Start the Backend Server

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

Wait for: `Application startup complete`

## Step 2: Test with Python Script (Easiest!)

In a **NEW terminal window** (keep server running in first terminal):

```powershell
cd backend
python test_workflow.py
```

This will:
- Test the GET endpoint
- Show you the response
- Tell you if the server is running

## Step 3: Test in Browser (Alternative)

1. Open browser
2. Go to: `http://localhost:8000/docs`
3. Find: `GET /api/v1/workflows/{domain}/{entity_id}/transitions`
4. Click "Try it out"
5. **IMPORTANT**: Fill in the fields:
   - `domain`: type `property` (not "entity_id"!)
   - `entity_id`: type `1ff0d1e6-399c-419c-bbc8-6726df4d0bd9`
6. Click "Execute"

## Step 4: Direct URL Test

Just paste this in your browser:
```
http://localhost:8000/api/v1/workflows/property/1ff0d1e6-399c-419c-bbc8-6726df4d0bd9/transitions
```

## Expected Result

You should see JSON like:
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
    "under_offer": ["log_offer_received", "create_activity_log", "notify_landlord"],
    ...
  }
}
```

## Troubleshooting

**Server not running?**
- Make sure you see `Application startup complete` in the terminal
- Check it's running on port 8000

**400 Bad Request?**
- Make sure domain is `property` (lowercase)
- Make sure property ID is correct (no extra spaces)

**Connection refused?**
- Server might have crashed - check the terminal for errors
- Restart the server

