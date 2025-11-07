"""
Simple test script for workflow API
Run this while the backend server is running
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
PROPERTY_ID = "1ff0d1e6-399c-419c-bbc8-6726df4d0bd9"

def test_get_transitions():
    """Test GET available transitions"""
    url = f"{BASE_URL}/api/v1/workflows/property/{PROPERTY_ID}/transitions"
    
    print(f"Testing: GET {url}")
    print("-" * 60)
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS!")
            print(json.dumps(data, indent=2))
            
            print(f"\nCurrent Status: {data.get('current_status')}")
            print(f"Available Transitions: {data.get('available_transitions')}")
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to server!")
        print("Make sure the backend server is running:")
        print("  cd backend")
        print("  python -m uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_post_transition(new_status="under_offer"):
    """Test POST status transition"""
    url = f"{BASE_URL}/api/v1/workflows/property/{PROPERTY_ID}/transitions"
    
    payload = {
        "new_status": new_status,
        "notes": "Test transition from script"
    }
    
    print(f"\nTesting: POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("-" * 60)
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS!")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to server!")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Workflow API Test Script")
    print("=" * 60)
    
    # Test GET
    test_get_transitions()
    
    # Ask user if they want to test POST
    print("\n" + "-" * 60)
    response = input("Do you want to test a status transition? (y/n): ")
    if response.lower() == 'y':
        current_status = input(f"Current status is shown above. Enter new status to transition to (or press Enter to skip): ")
        if current_status.strip():
            print("\n")
            test_post_transition(current_status.strip())
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)

