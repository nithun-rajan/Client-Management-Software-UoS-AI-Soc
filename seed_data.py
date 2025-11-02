#!/usr/bin/env python3
"""
Seed Data Script for CRM Sales Pipeline Demo
Creates sample properties, offers, and demonstrates workflow states
"""
import sqlite3
import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

DB_FILE = 'crm_database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def seed_data():
    """Seed database with demo data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create demo user with proper password hash
    demo_password = 'demo123'  # Known password for testing
    password_hash = generate_password_hash(demo_password)
    cursor.execute('''
        DELETE FROM users WHERE email = 'demo@example.com'
    ''')
    cursor.execute('''
        INSERT INTO users (id, name, email, password_hash)
        VALUES (1, 'Demo User', 'demo@example.com', ?)
    ''', (password_hash,))
    print(f'✅ Demo user created: demo@example.com / {demo_password}')
    
    # Create sample properties
    properties_data = [
        {
            'name': '123 Main Street',
            'address_line1': '123 Main Street',
            'city': 'London',
            'postcode': 'SW1A 1AA',
            'property_type': 'House',
            'bedrooms': 3,
            'bathrooms': 2,
            'asking_rent': 250000,
            'price': 250000,
            'current_status': 'Available'
        },
        {
            'name': '45 Park Avenue',
            'address_line1': '45 Park Avenue',
            'city': 'London',
            'postcode': 'W1K 7AA',
            'property_type': 'Flat',
            'bedrooms': 2,
            'bathrooms': 1,
            'asking_rent': 350000,
            'price': 350000,
            'current_status': 'Available'
        },
        {
            'name': '789 High Road',
            'address_line1': '789 High Road',
            'city': 'Manchester',
            'postcode': 'M1 1AA',
            'property_type': 'House',
            'bedrooms': 4,
            'bathrooms': 3,
            'asking_rent': 425000,
            'price': 425000,
            'current_status': 'Let'
        }
    ]
    
    property_ids = []
    for prop in properties_data:
        # Use only basic fields that definitely exist
        full_address = f"{prop['address_line1']}, {prop['city']}, {prop['postcode']}"
        cursor.execute('''
            INSERT INTO properties 
            (user_id, name, address, price, type, bedrooms, bathrooms, created_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            prop['name'], full_address, prop['price'], 
            prop['property_type'], prop['bedrooms'], prop['bathrooms']
        ))
        property_ids.append(cursor.lastrowid)
    
    # Create sample offers with different workflow states
    now = datetime.now()
    offers_data = [
        {
            'property_id': property_ids[0],
            'price': 245000,
            'terms': 'Subject to survey',
            'state': 'New',
            'applicant_name': 'John Smith',
            'applicant_contact': 'john@example.com',
            'created_at': (now - timedelta(days=2)).isoformat(),
            'sla_deadline': (now + timedelta(days=5)).isoformat()
        },
        {
            'property_id': property_ids[0],
            'price': 240000,
            'terms': 'No chain',
            'state': 'Viewing',
            'applicant_name': 'Sarah Johnson',
            'applicant_contact': 'sarah@example.com',
            'created_at': (now - timedelta(days=5)).isoformat(),
            'sla_deadline': (now + timedelta(days=9)).isoformat()
        },
        {
            'property_id': property_ids[1],
            'price': 340000,
            'terms': 'Cash buyer',
            'state': 'Offer',
            'applicant_name': 'Michael Brown',
            'applicant_contact': 'michael@example.com',
            'created_at': (now - timedelta(days=1)).isoformat(),
            'sla_deadline': (now + timedelta(days=9)).isoformat()
        },
        {
            'property_id': property_ids[1],
            'price': 345000,
            'terms': 'First-time buyer',
            'state': 'Exchange',
            'applicant_name': 'Emily Davis',
            'applicant_contact': 'emily@example.com',
            'created_at': (now - timedelta(days=20)).isoformat(),
            'acceptance_time': (now - timedelta(days=12)).isoformat(),
            'sla_deadline': (now + timedelta(days=16)).isoformat(),
            'searches_completed': 1,
            'searches_completed_at': (now - timedelta(days=10)).isoformat(),
            'contracts_exchanged': 1,
            'contracts_exchanged_at': (now - timedelta(days=8)).isoformat()
        },
        {
            'property_id': property_ids[2],
            'price': 420000,
            'terms': 'Investment purchase',
            'state': 'Complete',
            'applicant_name': 'David Wilson',
            'applicant_contact': 'david@example.com',
            'created_at': (now - timedelta(days=60)).isoformat(),
            'acceptance_time': (now - timedelta(days=50)).isoformat(),
            'completion_date': (now - timedelta(days=5)).isoformat(),
            'searches_completed': 1,
            'searches_completed_at': (now - timedelta(days=45)).isoformat(),
            'contracts_exchanged': 1,
            'contracts_exchanged_at': (now - timedelta(days=35)).isoformat(),
            'funds_received': 1,
            'funds_received_at': (now - timedelta(days=5)).isoformat()
        },
        {
            'property_id': property_ids[0],
            'price': 235000,
            'terms': 'Chain buyer',
            'state': 'Withdrawn',
            'applicant_name': 'Robert Taylor',
            'applicant_contact': 'robert@example.com',
            'created_at': (now - timedelta(days=15)).isoformat(),
            'withdrawal_reason': 'Buyer found another property'
        }
    ]
    
    for offer in offers_data:
        # Insert offers - using explicit column list matching schema
        # Schema: id, property_id, user_id, price, terms, state, created_at, updated_at, 
        # acceptance_time, withdrawal_reason, parent_id, previous_state, state_changed_at,
        # searches_completed, searches_completed_at, contracts_exchanged, contracts_exchanged_at,
        # funds_received, funds_received_at, completion_date, sla_deadline, sla_overdue,
        # sla_reminder_sent, sla_reminder_last_sent, applicant_name, applicant_contact, notes
        # Only insert non-NULL values to avoid column count issues
        cursor.execute('''
            INSERT INTO offers 
            (property_id, user_id, price, terms, state, applicant_name, applicant_contact,
             created_at, sla_deadline, acceptance_time, completion_date,
             searches_completed, searches_completed_at,
             contracts_exchanged, contracts_exchanged_at,
             funds_received, funds_received_at, withdrawal_reason)
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            offer['property_id'], offer['price'], offer['terms'], offer['state'],
            offer['applicant_name'], offer['applicant_contact'],
            offer['created_at'], offer.get('sla_deadline'),
            offer.get('acceptance_time'), offer.get('completion_date'),
            offer.get('searches_completed', 0), offer.get('searches_completed_at'),
            offer.get('contracts_exchanged', 0), offer.get('contracts_exchanged_at'),
            offer.get('funds_received', 0), offer.get('funds_received_at'),
            offer.get('withdrawal_reason')
        ))
        
        # Update property offers count
        cursor.execute('''
            UPDATE properties 
            SET offers_count = offers_count + 1 
            WHERE id = ?
        ''', (offer['property_id'],))
        
        # Update accepted count if exchanged/completed
        if offer['state'] in ['Exchange', 'Complete']:
            cursor.execute('''
                UPDATE properties 
                SET offers_accepted_count = offers_accepted_count + 1 
                WHERE id = ?
            ''', (offer['property_id'],))
    
    # Create some events
    cursor.execute('''
        INSERT INTO offer_events (offer_id, event_type, event_data)
        VALUES 
        (1, 'offer.created', '{"id": 1, "state": "New"}'),
        (4, 'offer.accepted', '{"id": 4, "state": "Exchange"}'),
        (5, 'offer.completed', '{"id": 5, "state": "Complete"}'),
        (6, 'offer.withdrawn', '{"id": 6, "state": "Withdrawn"}')
    ''')
    
    conn.commit()
    conn.close()
    
    print("✅ Seed data created successfully!")
    print(f"   - 3 Properties")
    print(f"   - 6 Offers (across different workflow states)")
    print(f"   - Events logged")
    print("\n💡 Login with: demo@example.com / (any password)")

if __name__ == '__main__':
    print("🌱 Seeding database with demo data...")
    try:
        seed_data()
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        import traceback
        traceback.print_exc()

