# Testing Guide - How to Test All Features

## 🧪 Quick Testing Commands

### Setup
1. **Make sure server is running**: `http://localhost:5500`
2. **Login first** to get session cookie (or use API token)

---

## 1. ✅ Test SLA Timers + Overdue Reminders

### Test SLA Deadline Calculation

**Method 1: Via API**
```bash
# Create an offer (will auto-calculate SLA)
curl -X POST http://localhost:5500/api/offers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "property_id": 1,
    "price": 250000,
    "state": "New",
    "terms": "Test SLA"
  }'

# Response will include: "sla_deadline": "2024-11-08T..." (7 days from now for "New" state)
```

**Method 2: Via Database**
```sql
-- Check SLA deadlines
SELECT id, state, sla_deadline, sla_overdue, 
       datetime(sla_deadline) as deadline,
       datetime('now') as now
FROM offers 
WHERE user_id = 1;
```

**Method 3: Via Web Interface**
1. Go to http://localhost:5500/login
2. Login: `demo@example.com` / `demo123`
3. Go to Offers page
4. Create a new offer - it will have SLA deadline set automatically

### Test Overdue Detection

**Method 1: Manual Check Endpoint**
```bash
# Trigger overdue check
curl -X POST http://localhost:5500/api/offers/check-sla \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Response: {"overdue_count": 2, "message": "Checked SLA: 2 offers overdue"}
```

**Method 2: Python Script**
```python
import sqlite3
from datetime import datetime

conn = sqlite3.connect('crm_database.db')
conn.row_factory = sqlite3.Row

# Find overdue offers
overdue = conn.execute('''
    SELECT id, state, sla_deadline, sla_overdue
    FROM offers 
    WHERE sla_deadline < datetime('now')
    AND sla_overdue = 0
    AND state NOT IN ('Complete', 'Withdrawn')
''').fetchall()

print(f"Overdue offers: {len(overdue)}")
for o in overdue:
    print(f"  Offer #{o['id']}: {o['state']} - Deadline: {o['sla_deadline']}")
```

**Method 3: Create Overdue Test Data**
```python
# Manually set an old deadline for testing
import sqlite3
from datetime import datetime, timedelta

conn = sqlite3.connect('crm_database.db')
old_date = (datetime.now() - timedelta(days=1)).isoformat()
conn.execute('''
    UPDATE offers 
    SET sla_deadline = ?, sla_overdue = 0 
    WHERE id = 1
''', (old_date,))
conn.commit()
# Then call check-sla endpoint
```

---

## 2. ✅ Test Sales KPIs (Conversion Rate, Median Days)

### Test KPI Endpoint

**Method 1: API Call**
```bash
curl http://localhost:5500/api/kpi/sales \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Expected response:
# {
#   "conversion_rate": 33.33,
#   "median_days_to_exchange": 12,
#   "median_days_to_complete": 55,
#   "total_offers": 12,
#   "active_offers": 8,
#   "exchanged_offers": 4,
#   "completed_offers": 1,
#   "withdrawn_offers": 1,
#   "overdue_count": 0,
#   "state_distribution": {
#     "New": 2,
#     "Offer": 3,
#     "Exchange": 1,
#     "Complete": 1
#   }
# }
```

**Method 2: Python Test**
```python
import requests
import json

# Login first
session = requests.Session()
login_resp = session.post('http://localhost:5500/api/auth/login', json={
    'email': 'demo@example.com',
    'password': 'demo123'
})
print(f"Login: {login_resp.status_code}")

# Get KPIs
kpi_resp = session.get('http://localhost:5500/api/kpi/sales')
kpis = kpi_resp.json()

print("\n📊 Sales KPIs:")
print(f"  Conversion Rate: {kpis['conversion_rate']}%")
print(f"  Median Days to Exchange: {kpis['median_days_to_exchange']}")
print(f"  Median Days to Complete: {kpis['median_days_to_complete']}")
print(f"  Total Offers: {kpis['total_offers']}")
print(f"  Active Offers: {kpis['active_offers']}")
print(f"  Overdue: {kpis['overdue_count']}")
print(f"\n  State Distribution:")
for state, count in kpis['state_distribution'].items():
    print(f"    {state}: {count}")
```

**Method 3: Via Web Dashboard**
1. Go to http://localhost:5500/dashboard
2. KPIs should display automatically in charts
3. Check browser console for API calls to `/api/kpi/summary`

**Method 4: Test with Different Data**
```python
# Create test offers to affect KPIs
# Create offer in "New" state
# Accept it (→ Exchange) - affects conversion_rate
# Mark milestones → Complete - affects median_days_to_complete
```

---

## 3. ✅ Test Postman Collection + Seed Data

### Using Postman Collection

**Step 1: Import Collection**
1. Open Postman
2. Click "Import" button
3. Select `postman_collection.json`
4. Collection "CRM Sales Pipeline API" appears

**Step 2: Set Up Environment**
1. Create new Environment
2. Add variable: `base_url = http://localhost:5500`
3. Add variable: `offer_id = 1` (will update after creating)

**Step 3: Test Flow**
1. **Authentication → Register** (or use existing login)
2. **Authentication → Login**
   - Save `user_id` from response if needed
3. **Offers → Create Offer**
   - Update `offer_id` variable from response
4. **Offers → List All Offers**
5. **Offers → Accept Offer** (uses `{{offer_id}}`)
6. **Milestones → Mark Searches Completed**
7. **KPIs → Get Sales KPIs**

### Using Seed Data

**Run Seed Script**
```bash
cd /Users/edwardaung/Downloads/AISocProj
python3.13 seed_data.py
```

**Verify Data**
```python
import sqlite3
conn = sqlite3.connect('crm_database.db')
conn.row_factory = sqlite3.Row

# Check users
users = conn.execute('SELECT * FROM users').fetchall()
print(f"Users: {len(users)}")
for u in users:
    print(f"  - {u['email']} ({u['name']})")

# Check properties
props = conn.execute('SELECT * FROM properties').fetchall()
print(f"\nProperties: {len(props)}")
for p in props[:3]:
    print(f"  - {p['name']} (£{p['price']})")

# Check offers by state
offers = conn.execute('''
    SELECT state, COUNT(*) as count 
    FROM offers 
    GROUP BY state
''').fetchall()
print(f"\nOffers by State:")
for o in offers:
    print(f"  - {o['state']}: {o['count']}")

conn.close()
```

---

## 4. ✅ Test Workflow Engine (JSON States & Transitions)

### Test Workflow Configuration

**Method 1: Get Config Endpoint**
```bash
curl http://localhost:5500/api/workflow/config \
  -b cookies.txt

# Returns full workflow JSON with states, transitions, SLA days
```

**Method 2: Test State Transitions**

**Valid Transitions:**
```bash
# New → Viewing ✅
curl -X POST http://localhost:5500/api/offers/1/transition \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state": "Viewing"}'

# Viewing → Offer ✅
curl -X POST http://localhost:5500/api/offers/1/transition \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state": "Offer"}'

# Offer → Exchange ✅
curl -X POST http://localhost:5500/api/offers/1/transition \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state": "Exchange"}'

# Exchange → Complete ✅
curl -X POST http://localhost:5500/api/offers/1/transition \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state": "Complete"}'
```

**Invalid Transitions (Should Fail):**
```bash
# New → Complete ❌ (must go through intermediate states)
curl -X POST http://localhost:5500/api/offers/1/transition \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state": "Complete"}'
# Expected: {"error": "Invalid transition from New to Complete"}

# Complete → Exchange ❌ (can't go backwards)
curl -X POST http://localhost:5500/api/offers/1/transition \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state": "Exchange"}'
# Expected: Error
```

**Method 3: Test SLA Auto-Calculation**

```python
import requests

session = requests.Session()
session.post('http://localhost:5500/api/auth/login', json={
    'email': 'demo@example.com',
    'password': 'demo123'
})

# Create offer in "New" state
offer1 = session.post('http://localhost:5500/api/offers', json={
    'property_id': 1,
    'price': 250000,
    'state': 'New'
}).json()
print(f"New state SLA: {offer1['sla_deadline']}")

# Transition to "Viewing" - SLA should update
session.post(f'http://localhost:5500/api/offers/{offer1["id"]}/transition', 
    json={'state': 'Viewing'})
offer2 = session.get(f'http://localhost:5500/api/offers').json()
for o in offer2:
    if o['id'] == offer1['id']:
        print(f"Viewing state SLA: {o['sla_deadline']}")
        break
```

**Method 4: Database Check**
```sql
-- Check workflow config
SELECT workflow_type, states_config, transitions_config 
FROM workflow_config;

-- Check state transitions in offers
SELECT id, previous_state, state, state_changed_at, sla_deadline
FROM offers 
ORDER BY state_changed_at DESC;
```

---

## 5. ✅ Test Event Emission System

### Test Events Are Created

**Method 1: Check Events Table**
```sql
-- View all events
SELECT event_type, COUNT(*) as count
FROM offer_events
GROUP BY event_type
ORDER BY count DESC;

-- View recent events
SELECT offer_id, event_type, datetime(created_at) as when
FROM offer_events
ORDER BY created_at DESC
LIMIT 10;

-- View events for specific offer
SELECT event_type, event_data, datetime(created_at)
FROM offer_events
WHERE offer_id = 1
ORDER BY created_at;
```

**Method 2: Trigger Events and Check**

```python
import requests
import sqlite3
import time

session = requests.Session()
session.post('http://localhost:5500/api/auth/login', json={
    'email': 'demo@example.com',
    'password': 'demo123'
})

# Create offer - should emit "offer.created"
offer = session.post('http://localhost:5500/api/offers', json={
    'property_id': 1,
    'price': 250000,
    'state': 'New'
}).json()
print(f"Created offer #{offer['id']}")
time.sleep(1)

# Check events
conn = sqlite3.connect('crm_database.db')
events = conn.execute('''
    SELECT event_type FROM offer_events 
    WHERE offer_id = ? 
    ORDER BY created_at DESC
''', (offer['id'],)).fetchall()
print(f"Events emitted: {[e[0] for e in events]}")

# Accept offer - should emit "offer.accepted" and "offer.exchange"
session.post(f'http://localhost:5500/api/offers/{offer["id"]}/accept')
time.sleep(1)

events = conn.execute('''
    SELECT event_type FROM offer_events 
    WHERE offer_id = ? 
    ORDER BY created_at DESC
''', (offer['id'],)).fetchall()
print(f"Events after accept: {[e[0] for e in events]}")

conn.close()
```

**Method 3: Test All Event Types**

```bash
# Create offer → "offer.created"
POST /api/offers

# Accept offer → "offer.accepted" + "offer.exchange"
POST /api/offers/1/accept

# Withdraw offer → "offer.withdrawn"
POST /api/offers/1/withdraw {"reason": "test"}

# Counter offer → "offer.countered"
POST /api/offers/1/counter

# Mark searches → "offer.milestone.searches_completed"
POST /api/offers/1/milestones/searches

# Mark contracts → "offer.milestone.contracts_exchanged"
POST /api/offers/1/milestones/contracts

# Mark funds → "offer.milestone.funds_received"
POST /api/offers/1/milestones/funds

# Complete → "offer.completed" + "offer.complete"
POST /api/offers/1/milestones/complete
```

**Method 4: Check Console Logs**
- Events are logged to server console with `[EVENT]` prefix
- Watch server terminal for event emissions

---

## 6. ✅ Test Workflow Validation

### Test Validation on All Endpoints

**Test Accept Endpoint Validation**
```bash
# Should work: Offer in "Offer" state
curl -X POST http://localhost:5500/api/offers/1/accept \
  -b cookies.txt

# Should fail: Offer in "Complete" state
curl -X POST http://localhost:5500/api/offers/2/accept \
  -b cookies.txt
# Expected: {"error": "Can only accept offers in Offer or New state"}
```

**Test Transition Validation**
```python
import requests

session = requests.Session()
session.post('http://localhost:5500/api/auth/login', json={
    'email': 'demo@example.com',
    'password': 'demo123'
})

# Create offer in "New" state
offer = session.post('http://localhost:5500/api/offers', json={
    'property_id': 1,
    'price': 250000,
    'state': 'New'
}).json()

# Valid: New → Viewing
resp = session.post(f'http://localhost:5500/api/offers/{offer["id"]}/transition', 
    json={'state': 'Viewing'})
print(f"New→Viewing: {resp.status_code}")  # Should be 200

# Invalid: Viewing → Complete (skip states)
resp = session.post(f'http://localhost:5500/api/offers/{offer["id"]}/transition', 
    json={'state': 'Complete'})
print(f"Viewing→Complete: {resp.status_code}")  # Should be 400
print(resp.json())  # Should show error
```

**Test Create Offer with State**
```bash
# Valid: Create with "New" state
curl -X POST http://localhost:5500/api/offers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"property_id": 1, "price": 250000, "state": "New"}'

# Valid: Create with "Offer" state
curl -X POST http://localhost:5500/api/offers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"property_id": 1, "price": 250000, "state": "Offer"}'

# Invalid: Create with "Complete" state (should default to "New")
curl -X POST http://localhost:5500/api/offers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"property_id": 1, "price": 250000, "state": "Complete"}'
# Should create with "New" state instead
```

---

## 🎯 Complete Test Script

Save as `test_all_features.py`:

```python
#!/usr/bin/env python3
"""Complete test script for all features"""
import requests
import sqlite3
import json
from datetime import datetime

BASE_URL = 'http://localhost:5500'
EMAIL = 'demo@example.com'
PASSWORD = 'demo123'

def test_all():
    session = requests.Session()
    
    # Login
    print("🔐 Testing Authentication...")
    login = session.post(f'{BASE_URL}/api/auth/login', json={
        'email': EMAIL,
        'password': PASSWORD
    })
    assert login.status_code == 200, "Login failed"
    print("  ✅ Login successful")
    
    # Test 1: Create Offer
    print("\n📝 Testing Offer Creation...")
    offer = session.post(f'{BASE_URL}/api/offers', json={
        'property_id': 1,
        'price': 275000,
        'state': 'New',
        'terms': 'Test offer'
    }).json()
    print(f"  ✅ Created offer #{offer['id']} with SLA: {offer.get('sla_deadline', 'N/A')}")
    
    # Test 2: Workflow Transitions
    print("\n🔄 Testing Workflow Transitions...")
    transitions = ['Viewing', 'Offer', 'Exchange']
    for state in transitions:
        resp = session.post(f'{BASE_URL}/api/offers/{offer["id"]}/transition', 
            json={'state': state})
        assert resp.status_code == 200, f"Transition to {state} failed"
        print(f"  ✅ Transitioned to {state}")
    
    # Test 3: Milestones
    print("\n🎯 Testing Milestones...")
    milestones = ['searches', 'contracts', 'funds']
    for milestone in milestones:
        resp = session.post(f'{BASE_URL}/api/offers/{offer["id"]}/milestones/{milestone}')
        assert resp.status_code == 200, f"Milestone {milestone} failed"
        print(f"  ✅ Marked {milestone} completed")
    
    # Test 4: Complete
    print("\n✅ Testing Completion...")
    resp = session.post(f'{BASE_URL}/api/offers/{offer["id"]}/milestones/complete')
    assert resp.status_code == 200, "Completion failed"
    print("  ✅ Offer completed")
    
    # Test 5: KPIs
    print("\n📊 Testing Sales KPIs...")
    kpis = session.get(f'{BASE_URL}/api/kpi/sales').json()
    print(f"  ✅ Conversion Rate: {kpis['conversion_rate']}%")
    print(f"  ✅ Median Days to Exchange: {kpis['median_days_to_exchange']}")
    print(f"  ✅ Total Offers: {kpis['total_offers']}")
    
    # Test 6: SLA Check
    print("\n⏰ Testing SLA Check...")
    sla_resp = session.post(f'{BASE_URL}/api/offers/check-sla')
    assert sla_resp.status_code == 200, "SLA check failed"
    print(f"  ✅ Overdue count: {sla_resp.json()['overdue_count']}")
    
    # Test 7: Events
    print("\n📡 Testing Events...")
    conn = sqlite3.connect('crm_database.db')
    events = conn.execute('''
        SELECT event_type FROM offer_events 
        WHERE offer_id = ? 
        ORDER BY created_at
    ''', (offer['id'],)).fetchall()
    event_types = [e[0] for e in events]
    print(f"  ✅ Events emitted: {len(events)}")
    for et in event_types:
        print(f"     - {et}")
    conn.close()
    
    # Test 8: Workflow Config
    print("\n⚙️  Testing Workflow Config...")
    config = session.get(f'{BASE_URL}/api/workflow/config').json()
    print(f"  ✅ States: {config['states']}")
    print(f"  ✅ Transitions: {len(config['transitions'])} rules")
    print(f"  ✅ SLA Days: {config['sla_days']}")
    
    print("\n🎉 All tests passed!")

if __name__ == '__main__':
    test_all()
```

**Run it:**
```bash
python3.13 test_all_features.py
```

---

## 🚀 Quick Test Checklist

- [ ] Create offer → Check SLA deadline set
- [ ] Transition states → Verify validation works
- [ ] Accept offer → Check event emitted
- [ ] Mark milestones → Verify tracking
- [ ] Check KPIs → Verify calculations
- [ ] Trigger SLA check → Verify overdue detection
- [ ] Import Postman → Test all endpoints
- [ ] Run seed data → Verify test data created
- [ ] Check events table → Verify event storage
- [ ] Test invalid transitions → Verify errors

All features are testable! 🎯

