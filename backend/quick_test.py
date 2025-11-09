"""Quick test for My Applicants endpoint"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

print("\n" + "="*60)
print("  QUICK TEST: My Applicants Endpoint")
print("="*60)

# 1. Login
print("\n[1] Logging in...")
login_data = {
    "username": "agent.test@example.com",
    "password": "testpassword123"
}

try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get("access_token")
        print(f"   [OK] Login successful")
        print(f"   Token: {access_token[:50]}...")
    else:
        print(f"   [FAIL] Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"   [ERROR] {e}")
    exit(1)

# 2. Get current user
print("\n[2] Getting user info...")
headers = {"Authorization": f"Bearer {access_token}"}
try:
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if response.status_code == 200:
        user_info = response.json()
        print(f"   [OK] User: {user_info.get('first_name')} {user_info.get('last_name')}")
        print(f"   Email: {user_info.get('email')}")
        print(f"   ID: {user_info.get('id')}")
        agent_id = user_info.get('id')
    else:
        print(f"   [FAIL] Failed to get user: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"   [ERROR] {e}")
    exit(1)

# 3. Test /my-applicants endpoint
print("\n[3] Testing /my-applicants endpoint...")
try:
    response = requests.get(f"{BASE_URL}/applicants/my-applicants", headers=headers)
    if response.status_code == 200:
        my_applicants = response.json()
        print(f"   [OK] Success! Found {len(my_applicants)} applicants")
        
        if my_applicants:
            print("\n   Applicants assigned to you:")
            for app in my_applicants:
                print(f"   - {app.get('first_name')} {app.get('last_name')}")
                print(f"     Email: {app.get('email')}")
                print(f"     Status: {app.get('status')}")
                print(f"     Last contacted: {app.get('last_contacted_at', 'Never')}")
                print(f"     Notes: {app.get('notes', 'None')}")
                print()
        else:
            print("   [WARNING] No applicants found")
    elif response.status_code == 401:
        print(f"   [FAIL] Unauthorized - token invalid")
    else:
        print(f"   [FAIL] Status {response.status_code}: {response.text}")
except Exception as e:
    print(f"   [ERROR] {e}")

# 4. Test filtered applicants
print("\n[4] Testing filtered applicants (all applicants by agent)...")
try:
    response = requests.get(
        f"{BASE_URL}/applicants?assigned_agent_id={agent_id}",
        headers=headers
    )
    if response.status_code == 200:
        filtered = response.json()
        print(f"   [OK] Found {len(filtered)} applicants assigned to agent")
    else:
        print(f"   [INFO] Status {response.status_code}")
except Exception as e:
    print(f"   [INFO] {e}")

print("\n" + "="*60)
print("  TEST COMPLETE")
print("="*60)
print("\nTo test in frontend:")
print(f"1. Open browser console")
print(f"2. Run: localStorage.setItem('auth_token', '{access_token}')")
print(f"3. Refresh /applicants page")
print(f"4. Click 'My Applicants' tab")
print()

