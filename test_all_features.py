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
    print("🧪 Starting Complete Feature Tests...\n")
    session = requests.Session()
    
    # Login
    print("🔐 1. Testing Authentication...")
    try:
        login = session.post(f'{BASE_URL}/api/auth/login', json={
            'email': EMAIL,
            'password': PASSWORD
        })
        assert login.status_code == 200, "Login failed"
        print("   ✅ Login successful")
    except Exception as e:
        print(f"   ❌ Login failed: {e}")
        return
    
    # Test 1: Create Offer
    print("\n📝 2. Testing Offer Creation...")
    try:
        offer = session.post(f'{BASE_URL}/api/offers', json={
            'property_id': 1,
            'price': 275000,
            'state': 'New',
            'terms': 'Test offer'
        }).json()
        offer_id = offer['id']
        print(f"   ✅ Created offer #{offer_id}")
        print(f"   ✅ SLA Deadline: {offer.get('sla_deadline', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Offer creation failed: {e}")
        return
    
    # Test 2: Workflow Transitions
    print("\n🔄 3. Testing Workflow Transitions...")
    transitions = ['Viewing', 'Offer', 'Exchange']
    for state in transitions:
        try:
            resp = session.post(f'{BASE_URL}/api/offers/{offer_id}/transition', 
                json={'state': state})
            assert resp.status_code == 200, f"Transition to {state} failed"
            print(f"   ✅ Transitioned to {state}")
        except Exception as e:
            print(f"   ❌ Transition to {state} failed: {e}")
    
    # Test 3: Milestones
    print("\n🎯 4. Testing Milestones...")
    milestones = ['searches', 'contracts', 'funds']
    for milestone in milestones:
        try:
            resp = session.post(f'{BASE_URL}/api/offers/{offer_id}/milestones/{milestone}')
            assert resp.status_code == 200, f"Milestone {milestone} failed"
            print(f"   ✅ Marked {milestone} completed")
        except Exception as e:
            print(f"   ❌ Milestone {milestone} failed: {e}")
    
    # Test 4: Complete
    print("\n✅ 5. Testing Completion...")
    try:
        resp = session.post(f'{BASE_URL}/api/offers/{offer_id}/milestones/complete')
        assert resp.status_code == 200, "Completion failed"
        print("   ✅ Offer completed")
    except Exception as e:
        print(f"   ❌ Completion failed: {e}")
    
    # Test 5: KPIs
    print("\n📊 6. Testing Sales KPIs...")
    try:
        kpis = session.get(f'{BASE_URL}/api/kpi/sales').json()
        print(f"   ✅ Conversion Rate: {kpis['conversion_rate']}%")
        print(f"   ✅ Median Days to Exchange: {kpis['median_days_to_exchange']}")
        print(f"   ✅ Total Offers: {kpis['total_offers']}")
        print(f"   ✅ Active Offers: {kpis['active_offers']}")
    except Exception as e:
        print(f"   ❌ KPIs failed: {e}")
    
    # Test 6: SLA Check
    print("\n⏰ 7. Testing SLA Check...")
    try:
        sla_resp = session.post(f'{BASE_URL}/api/offers/check-sla')
        assert sla_resp.status_code == 200, "SLA check failed"
        result = sla_resp.json()
        print(f"   ✅ Overdue count: {result['overdue_count']}")
        print(f"   ✅ Message: {result['message']}")
    except Exception as e:
        print(f"   ❌ SLA check failed: {e}")
    
    # Test 7: Events
    print("\n📡 8. Testing Events...")
    try:
        conn = sqlite3.connect('crm_database.db')
        conn.row_factory = sqlite3.Row
        events = conn.execute('''
            SELECT event_type FROM offer_events 
            WHERE offer_id = ? 
            ORDER BY created_at
        ''', (offer_id,)).fetchall()
        event_types = [e[0] for e in events]
        print(f"   ✅ Events emitted: {len(events)}")
        for et in event_types[:5]:  # Show first 5
            print(f"      - {et}")
        if len(events) > 5:
            print(f"      ... and {len(events) - 5} more")
        conn.close()
    except Exception as e:
        print(f"   ❌ Events check failed: {e}")
    
    # Test 8: Workflow Config
    print("\n⚙️  9. Testing Workflow Config...")
    try:
        config = session.get(f'{BASE_URL}/api/workflow/config').json()
        print(f"   ✅ States: {config['states']}")
        print(f"   ✅ Transitions: {len(config['transitions'])} rules")
        print(f"   ✅ SLA Days: {config['sla_days']}")
    except Exception as e:
        print(f"   ❌ Workflow config failed: {e}")
    
    # Test 9: Invalid Transition (should fail)
    print("\n🚫 10. Testing Validation (Invalid Transition)...")
    try:
        # Create new offer and try invalid transition
        new_offer = session.post(f'{BASE_URL}/api/offers', json={
            'property_id': 1,
            'price': 280000,
            'state': 'New'
        }).json()
        
        # Try to jump directly to Complete (should fail)
        resp = session.post(f'{BASE_URL}/api/offers/{new_offer["id"]}/transition', 
            json={'state': 'Complete'})
        if resp.status_code == 400:
            print("   ✅ Validation working: Invalid transition rejected")
        else:
            print(f"   ⚠️  Expected 400, got {resp.status_code}")
    except Exception as e:
        print(f"   ❌ Validation test failed: {e}")
    
    print("\n" + "="*50)
    print("🎉 All feature tests completed!")
    print("="*50)

if __name__ == '__main__':
    test_all()

