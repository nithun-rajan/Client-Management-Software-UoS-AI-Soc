# Frontend Authentication Guide

## Overview
The frontend now has a complete authentication system that allows users to:
- Register new accounts
- Login with email and password
- Access protected routes
- View their profile information
- Logout

## Features

### 1. Login Page (`/login`)
- Email and password login
- Redirects to dashboard after successful login
- Shows error messages for failed login attempts
- Includes link to registration page

### 2. Registration Page (`/register`)
- Create new user accounts
- Requires:
  - First name
  - Last name
  - Email
  - Password (minimum 8 characters)
  - Role (Agent, Manager, Admin, Viewer)
  - Organization ID (pre-filled with test organization)
- Redirects to login after successful registration

### 3. Protected Routes
- All main application routes are now protected
- Users must be authenticated to access:
  - Dashboard
  - Properties
  - Landlords
  - Applicants
  - Messages
  - Search
  - KPIs
  - Settings
- Unauthenticated users are automatically redirected to `/login`

### 4. User Profile in Header
- User avatar with initials
- Dropdown menu showing:
  - User name
  - Email
  - Role
  - Settings link
  - Logout button

### 5. Automatic Token Management
- JWT tokens stored in `localStorage`
- Token automatically included in API requests
- Automatic logout on 401 (unauthorized) errors
- Token refresh support (ready for implementation)

## How to Use

### For Users

1. **First Time Setup:**
   - Navigate to `/register`
   - Fill in your details
   - Select your role
   - Click "Create Account"
   - You'll be redirected to login

2. **Login:**
   - Navigate to `/login` (or you'll be redirected automatically)
   - Enter your email and password
   - Click "Sign In"
   - You'll be redirected to the dashboard

3. **Logout:**
   - Click your avatar in the top right
   - Click "Logout"
   - You'll be redirected to the login page

### For Developers

#### Testing with Existing User

If you have a test user created (e.g., via `create_test_data.py`):

```bash
# Login credentials
Email: test@example.com
Password: testpassword123
```

#### Creating a New User via Frontend

1. Start the backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/register`
4. Fill in the registration form
5. Use an existing organization ID (you can find this by running `python backend/get_organization_id.py`)

#### Testing the Authentication Flow

1. **Test Login:**
   - Try logging in with invalid credentials (should show error)
   - Try logging in with valid credentials (should redirect to dashboard)

2. **Test Protected Routes:**
   - Logout
   - Try accessing `/properties` directly (should redirect to login)
   - Login again (should redirect back to dashboard)

3. **Test Token Expiry:**
   - Login
   - Wait for token to expire (or manually remove from localStorage)
   - Try to make an API request (should redirect to login)

## API Integration

The authentication system integrates with the backend API:

- **Login:** `POST /api/v1/auth/login`
  - Uses OAuth2 password grant flow
  - Returns `access_token` and `refresh_token`

- **Register:** `POST /api/v1/auth/register`
  - Creates a new user account
  - Requires organization_id

- **Get Current User:** `GET /api/v1/auth/me`
  - Returns current authenticated user information
  - Requires Bearer token in Authorization header

## Technical Details

### Auth Hook (`useAuth`)
Located in `frontend/src/hooks/useAuth.ts`:
- Manages authentication state
- Provides login, register, and logout functions
- Automatically fetches current user on mount
- Handles token storage in localStorage

### Protected Route Component
Located in `frontend/src/components/ProtectedRoute.tsx`:
- Wraps protected routes
- Checks authentication status
- Shows loading spinner while checking
- Redirects to login if not authenticated

### API Interceptor
Located in `frontend/src/lib/api.ts`:
- Automatically adds Bearer token to requests
- Handles 401 errors by clearing tokens and redirecting to login

## Notes

- The organization ID is currently hardcoded in the Register page (test organization)
- In production, you should fetch organizations from an API endpoint
- Token refresh is not yet implemented (tokens expire after a set time)
- Password requirements: minimum 8 characters (can be enhanced)
- Email validation is handled by the backend

## Troubleshooting

### "Login failed" error
- Check that the backend is running
- Verify email and password are correct
- Check browser console for detailed error messages

### Redirect loop
- Clear localStorage: `localStorage.clear()`
- Check that the backend `/api/v1/auth/me` endpoint is working
- Verify token is being stored correctly

### 401 Unauthorized errors
- Token may have expired
- Try logging out and logging back in
- Check that the token is being sent in the Authorization header

## Next Steps

1. **Implement token refresh** - Automatically refresh tokens before they expire
2. **Add password reset** - Allow users to reset forgotten passwords
3. **Add email verification** - Verify email addresses during registration
4. **Fetch organizations** - Get organization list from API instead of hardcoding
5. **Add role-based access control** - Restrict routes based on user role
6. **Add session timeout warning** - Warn users before token expires


