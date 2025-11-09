# Authentication Testing Guide

## Quick Steps to Test Auth

### Step 1: Get Organization ID

First, you need a valid organization ID. You have two options:

**Option A: Use existing test organization**
```bash
cd backend
python get_organization_id.py
```
This will show you the organization ID from the test data.

**Option B: Create a new organization**
```bash
cd backend
python create_test_data.py
```
This creates "Test Agency" organization and shows its ID.

### Step 2: Register a User

1. Open Swagger UI: http://localhost:8000/docs
2. Find `/api/v1/auth/register`
3. Click "Try it out"
4. Use this JSON (replace `organization_id` with the ID from Step 1):

```json
{
  "email": "test@example.com",
  "first_name": "Ali",
  "last_name": "Almarzooq",
  "role": "admin",
  "password": "testpassword123",
  "organization_id": "YOUR_ORG_ID_HERE",
  "branch_id": null
}
```

5. Click "Execute"
6. **Copy the `id` from the response** - you'll need it for testing

### Step 3: Login

1. Find `/api/v1/auth/login`
2. Click "Try it out"
3. **IMPORTANT**: In the form:
   - `username`: **Change "Ali" to your email** (`test@example.com`)
   - `password`: `testpassword123`
   - `grant_type`: `password` (should be auto-filled)
4. Click "Execute"
5. **Copy the `access_token`** from the response

### Step 4: Authorize in Swagger

1. Click the **"Authorize"** button (lock icon, top right of Swagger UI)
2. In the "Value" field, enter: `Bearer YOUR_ACCESS_TOKEN_HERE`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click "Authorize"
4. Click "Close"

### Step 5: Test Protected Endpoints

Now you can test `/api/v1/auth/me` and `/api/v1/applicants/my-applicants`:

1. **Test `/api/v1/auth/me`**:
   - Click "Try it out"
   - Click "Execute"
   - Should return your user info

2. **Test `/api/v1/applicants/my-applicants`**:
   - Click "Try it out"
   - Click "Execute"
   - Should return applicants assigned to you (if any)

## Common Issues

### Issue 1: "Incorrect email or password"
- **Cause**: Used first name instead of email in login
- **Fix**: Use your **email address** as the username

### Issue 2: "Not authenticated" (401)
- **Cause**: Didn't authorize with token
- **Fix**: Click "Authorize" button and paste `Bearer YOUR_TOKEN`

### Issue 3: Organization ID doesn't exist
- **Cause**: Used placeholder UUID from Swagger example
- **Fix**: Run `python get_organization_id.py` to get a real ID

### Issue 4: Foreign key constraint error
- **Cause**: Organization ID doesn't exist in database
- **Fix**: Create organization first, then register user

## Quick Test Script

You can also use the test script:

```bash
cd backend
python quick_test.py
```

This will:
1. Login as the test agent
2. Test the `/my-applicants` endpoint
3. Show you the results

## Frontend Testing

To test in the frontend:

1. Login via Swagger UI and get your token
2. Open browser console (F12)
3. Run:
   ```javascript
   localStorage.setItem('auth_token', 'YOUR_ACCESS_TOKEN_HERE');
   ```
4. Refresh the page
5. Go to `/applicants` page
6. Click "My Applicants" tab

## Test Credentials

If you used `create_test_data.py`, you can login with:

- **Email**: `agent.test@example.com`
- **Password**: `testpassword123`
- **Organization ID**: Check output of `create_test_data.py`

