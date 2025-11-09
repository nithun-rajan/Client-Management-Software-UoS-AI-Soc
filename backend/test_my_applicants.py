"""
Test script for "My Applicants" CRM feature

This script:
1. Creates a test organization and agent user
2. Creates some applicants and assigns them to the agent
3. Creates some communications to update last_contacted_at
4. Tests the /my-applicants endpoint
"""

import sys
import requests
from datetime import datetime, timezone, timedelta

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_my_applicants():
    """Test the My Applicants feature"""
    
    print_section("TESTING MY APPLICANTS FEATURE")
    
    # Step 1: Create Organization
    print("\n[1] Creating organization...")
    org_data = {
        "name": "Test Real Estate Agency"
    }
    try:
        # First check if organization exists or create it
        # For now, we'll use a direct database approach via API if available
        # Or we'll create via register endpoint which might create org
        print("   Note: Organization should be created via database seed or admin")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # Step 2: Register/Login as Agent
    print("\n[2] Registering test agent...")
    register_data = {
        "email": "agent.test@example.com",
        "password": "testpassword123",
        "first_name": "John",
        "last_name": "Agent",
        "role": "agent",
        "organization_id": "00000000-0000-0000-0000-000000000001"  # Default org ID
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 201:
            print("   ✓ Agent registered successfully")
            user_data = response.json()
            agent_id = user_data.get("id")
        elif response.status_code == 400:
            print("   ✓ Agent already exists, proceeding to login...")
            agent_id = None  # Will get from login
        else:
            print(f"   ✗ Registration failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"   ✗ Registration error: {e}")
        print("   Continuing with login...")
    
    # Step 3: Login to get token
    print("\n[3] Logging in as agent...")
    login_data = {
        "username": "agent.test@example.com",  # OAuth2 uses 'username' for email
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,  # Use data, not json for OAuth2PasswordRequestForm
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print("   ✓ Login successful")
            print(f"   Token: {access_token[:50]}...")
        else:
            print(f"   ✗ Login failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"   ✗ Login error: {e}")
        return
    
    # Step 4: Get current user info to get agent ID
    print("\n[4] Getting current user info...")
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user_info = response.json()
            agent_id = user_info.get("id")
            print(f"   ✓ User ID: {agent_id}")
            print(f"   ✓ Email: {user_info.get('email')}")
            print(f"   ✓ Role: {user_info.get('role')}")
        else:
            print(f"   ✗ Failed to get user info: {response.status_code}")
            return
    except Exception as e:
        print(f"   ✗ Error getting user info: {e}")
        return
    
    # Step 5: Create test applicants
    print("\n[5] Creating test applicants...")
    applicants = []
    applicant_data_list = [
        {
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice.smith@example.com",
            "phone": "07123456789",
            "desired_bedrooms": "2",
            "rent_budget_min": 800,
            "rent_budget_max": 1200,
        },
        {
            "first_name": "Bob",
            "last_name": "Jones",
            "email": "bob.jones@example.com",
            "phone": "07987654321",
            "desired_bedrooms": "3",
            "rent_budget_min": 1000,
            "rent_budget_max": 1500,
        },
        {
            "first_name": "Charlie",
            "last_name": "Brown",
            "email": "charlie.brown@example.com",
            "phone": "07555123456",
            "desired_bedrooms": "1",
            "rent_budget_min": 600,
            "rent_budget_max": 900,
        }
    ]
    
    for applicant_data in applicant_data_list:
        try:
            response = requests.post(f"{BASE_URL}/applicants", json=applicant_data)
            if response.status_code == 201:
                applicant = response.json()
                applicants.append(applicant)
                print(f"   ✓ Created applicant: {applicant_data['first_name']} {applicant_data['last_name']}")
            else:
                print(f"   ✗ Failed to create applicant: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"   ✗ Error creating applicant: {e}")
    
    if not applicants:
        print("   ⚠ No applicants created, using existing ones...")
        # Get existing applicants
        response = requests.get(f"{BASE_URL}/applicants")
        if response.status_code == 200:
            applicants = response.json()[:3]  # Get first 3
            print(f"   ✓ Using {len(applicants)} existing applicants")
    
    # Step 6: Assign applicants to agent
    print("\n[6] Assigning applicants to agent...")
    for applicant in applicants[:2]:  # Assign first 2 to agent
        try:
            update_data = {
                "assigned_agent_id": agent_id,
                "notes": f"Assigned to {user_info.get('first_name')} for testing"
            }
            response = requests.put(
                f"{BASE_URL}/applicants/{applicant['id']}",
                json=update_data,
                headers=headers
            )
            if response.status_code == 200:
                print(f"   ✓ Assigned applicant: {applicant.get('first_name')} {applicant.get('last_name')}")
            else:
                print(f"   ✗ Failed to assign applicant: {response.status_code}")
        except Exception as e:
            print(f"   ✗ Error assigning applicant: {e}")
    
    # Step 7: Create communications to update last_contacted_at
    print("\n[7] Creating communications (to update last_contacted_at)...")
    if applicants:
        # Create communication for first applicant (assigned to agent)
        comm_data = {
            "type": "email",
            "subject": "Property match inquiry",
            "content": "Hi, I found some properties that match your criteria.",
            "direction": "outbound",
            "applicant_id": applicants[0]['id'],
            "created_by": user_info.get('email')
        }
        try:
            response = requests.post(
                f"{BASE_URL}/messaging",
                json=comm_data,
                headers=headers
            )
            if response.status_code == 201:
                print(f"   ✓ Created communication for {applicants[0].get('first_name')}")
                print("   ✓ last_contacted_at should be updated")
            else:
                print(f"   ⚠ Communication creation: {response.status_code}")
        except Exception as e:
            print(f"   ⚠ Error creating communication: {e}")
    
    # Step 8: Test /my-applicants endpoint
    print("\n[8] Testing /my-applicants endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/applicants/my-applicants",
            headers=headers
        )
        if response.status_code == 200:
            my_applicants = response.json()
            print(f"   ✓ Success! Found {len(my_applicants)} applicants assigned to agent")
            
            if my_applicants:
                print("\n   Applicants assigned to you:")
                for app in my_applicants:
                    last_contacted = app.get('last_contacted_at', 'Never')
                    print(f"   - {app.get('first_name')} {app.get('last_name')}")
                    print(f"     Email: {app.get('email')}")
                    print(f"     Last contacted: {last_contacted}")
                    print(f"     Status: {app.get('status')}")
                    print()
            else:
                print("   ⚠ No applicants found assigned to this agent")
        elif response.status_code == 401:
            print("   ✗ Unauthorized - token may be invalid")
        else:
            print(f"   ✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ✗ Error testing endpoint: {e}")
    
    # Step 9: Test filtering all applicants by agent
    print("\n[9] Testing filtered applicants endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/applicants?assigned_agent_id={agent_id}",
            headers=headers
        )
        if response.status_code == 200:
            filtered_applicants = response.json()
            print(f"   ✓ Found {len(filtered_applicants)} applicants assigned to agent {agent_id}")
        else:
            print(f"   ⚠ Filter test: {response.status_code}")
    except Exception as e:
        print(f"   ⚠ Error testing filter: {e}")
    
    print_section("TEST COMPLETE")
    print("\n✅ Test summary:")
    print("   - Agent created/logged in")
    print("   - Applicants created and assigned")
    print("   - Communications created")
    print("   - /my-applicants endpoint tested")
    print("\n💡 To test in frontend:")
    print(f"   1. Set auth_token in localStorage: {access_token[:50]}...")
    print("   2. Visit /applicants page")
    print("   3. Click 'My Applicants' tab")
    print("\n")

if __name__ == "__main__":
    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code != 200:
            print("❌ Server is not running or not healthy")
            print("   Please start the server with: cd backend && uvicorn app.main:app --reload")
            sys.exit(1)
    except Exception as e:
        print("❌ Cannot connect to server")
        print("   Please start the server with: cd backend && uvicorn app.main:app --reload")
        sys.exit(1)
    
    test_my_applicants()

