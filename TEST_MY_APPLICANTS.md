# Testing "My Applicants" Feature

## ✅ Setup Complete

1. **Database migration** - ✅ Completed
   - Added `assigned_agent_id`, `last_contacted_at`, `notes` to applicants table
   - Added `management_notes` to properties table

2. **Backend endpoints** - ✅ Completed
   - `GET /api/v1/applicants/my-applicants` - Get current agent's applicants
   - `GET /api/v1/applicants?assigned_agent_id=xxx` - Filter by agent
   - Auto-updates `last_contacted_at` when creating communications

3. **Frontend integration** - ✅ Completed
   - Added "My Applicants" tab on Applicants page
   - Shows last contacted time
   - API client includes auth token interceptor

4. **Test data** - ✅ Created
   - Organization: Test Agency
   - Agent: agent.test@example.com / testpassword123
   - 3 applicants assigned to agent
   - 1 applicant has last_contacted_at set (2 days ago)

## 🧪 Manual Testing Steps

### Option 1: Test via API (Swagger UI)

1. **Start the server** (if not running):
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Open Swagger UI**: http://localhost:8000/docs

3. **Login to get token**:
   - Find `/api/v1/auth/login` endpoint
   - Click "Try it out"
   - Use:
     - username: `agent.test@example.com`
     - password: `testpassword123`
   - Click "Execute"
   - Copy the `access_token` from response

4. **Authorize in Swagger**:
   - Click the "Authorize" button (top right)
   - Enter: `Bearer <your_access_token>`
   - Click "Authorize"

5. **Test /my-applicants endpoint**:
   - Find `/api/v1/applicants/my-applicants`
   - Click "Try it out"
   - Click "Execute"
   - Should return 3 applicants assigned to the agent

6. **Test filtered applicants**:
   - Find `/api/v1/applicants?assigned_agent_id=xxx`
   - Replace `xxx` with agent ID from login response
   - Should return same 3 applicants

### Option 2: Test via Frontend

1. **Start backend server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login and set token**:
   - Open browser console (F12)
   - Login via API to get token (or use Swagger UI)
   - Set token in localStorage:
     ```javascript
     localStorage.setItem('auth_token', 'YOUR_ACCESS_TOKEN_HERE');
     ```

4. **Test "My Applicants"**:
   - Navigate to `/applicants` page
   - Click "My Applicants" tab
   - Should see 3 applicants
   - Should see "Last contacted: 2 days ago" for one applicant
   - Should see "Never contacted" for others

### Option 3: Test via Python Script

1. **Run the test script**:
   ```bash
   cd backend
   python quick_test.py
   ```

   Note: You may need to adjust the path based on your current directory.

## 📋 Expected Results

### Backend Endpoint: `/api/v1/applicants/my-applicants`

**Response (200 OK)**:
```json
[
  {
    "id": "...",
    "first_name": "Shane",
    "last_name": "Stephenson",
    "email": "...",
    "status": "new",
    "assigned_agent_id": "2ee7e775-8452-4e82-97b3-5aabd18cef89",
    "last_contacted_at": "2025-11-07T00:00:00Z",
    "notes": "Test assignment to John Agent"
  },
  {
    "id": "...",
    "first_name": "Beverley",
    "last_name": "Warren",
    "email": "...",
    "status": "qualified",
    "assigned_agent_id": "2ee7e775-8452-4e82-97b3-5aabd18cef89",
    "last_contacted_at": null,
    "notes": "Test assignment to John Agent"
  },
  {
    "id": "...",
    "first_name": "Suzanne",
    "last_name": "Armstrong",
    "email": "...",
    "status": "viewing_booked",
    "assigned_agent_id": "2ee7e775-8452-4e82-97b3-5aabd18cef89",
    "last_contacted_at": null,
    "notes": "Test assignment to John Agent"
  }
]
```

### Frontend: "My Applicants" Tab

- Shows 3 applicants
- Sorted by `last_contacted_at` (most recent first)
- Shows "Last contacted: 2 days ago" for Shane
- Shows "Never contacted" for Beverley and Suzanne
- Each applicant card shows contact information and status

## 🔍 Verification Checklist

- [ ] Can login as agent
- [ ] `/my-applicants` endpoint returns only agent's applicants
- [ ] Applicants are sorted by last_contacted_at
- [ ] Frontend shows "My Applicants" tab
- [ ] Frontend displays last contacted time correctly
- [ ] Frontend shows "Never contacted" for applicants without contact history
- [ ] Creating a communication updates last_contacted_at

## 🐛 Troubleshooting

1. **401 Unauthorized**: 
   - Check that auth token is valid
   - Make sure token is set in Authorization header: `Bearer <token>`

2. **404 Not Found**:
   - Check that server is running
   - Check that auth router is enabled in `main.py`

3. **No applicants returned**:
   - Check that applicants are assigned to the agent
   - Verify `assigned_agent_id` matches the logged-in user's ID

4. **Frontend not showing "My Applicants"**:
   - Check browser console for errors
   - Verify token is set in localStorage
   - Check network tab for API responses

## 📝 Notes

- The auth router was commented out in `main.py` - it's now enabled
- Test data includes 3 applicants assigned to the test agent
- One applicant (Shane) has `last_contacted_at` set to 2 days ago
- The endpoint requires authentication (Bearer token)

