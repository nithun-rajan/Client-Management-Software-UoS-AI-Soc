from flask import Flask, request, jsonify, abort, send_from_directory, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
import time
import secrets
import base64
import json
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # Secret key for session management

# Database setup
DB_FILE = 'crm_database.db'
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_db():
    """Initialize the database with user and property tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Properties table - Comprehensive property management schema
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            -- A. Core identity & location
            property_id TEXT UNIQUE,
            address_line1 TEXT,
            address_line2 TEXT,
            city TEXT,
            postcode TEXT,
            property_type TEXT,
            tenure_type TEXT,
            unit_identifier TEXT,
            latitude REAL,
            longitude REAL,
            -- B. Basic public/marketing info
            name TEXT NOT NULL,
            bedrooms INTEGER,
            bathrooms INTEGER,
            receptions INTEGER,
            furnishing_state TEXT,
            floorplan_link TEXT,
            images TEXT,
            short_description TEXT,
            epc_rating TEXT,
            epc_document TEXT,
            epc_expiry TEXT,
            epc_reference TEXT,
            -- C. Financial & rent settings
            asking_rent REAL,
            rent_agreed REAL,
            rent_frequency TEXT,
            rent_due_day INTEGER,
            deposit_amount REAL,
            deposit_protection_scheme TEXT,
            deposit_scheme_reference TEXT,
            deposit_protection_date TEXT,
            service_charge REAL,
            ground_rent REAL,
            service_charge_frequency TEXT,
            council_tax_band TEXT,
            council_tax_payer TEXT,
            bills_responsibility TEXT,
            rent_collection_method TEXT,
            rent_reconciliation_status TEXT,
            management_fee_percent REAL,
            management_fee_fixed REAL,
            -- D. Tenancy / occupancy status
            current_status TEXT DEFAULT 'Available',
            current_tenancy_id INTEGER,
            tenancy_start_date TEXT,
            tenancy_end_date TEXT,
            notice_flag INTEGER DEFAULT 0,
            break_clause_flag INTEGER DEFAULT 0,
            max_occupants INTEGER,
            permitted_uses TEXT,
            -- E. Compliance & safety certificates
            gas_safety_cert_date TEXT,
            gas_safety_cert_expiry TEXT,
            gas_safety_cert_upload TEXT,
            gas_safe_engineer TEXT,
            gas_cert_id TEXT,
            eicr_date TEXT,
            eicr_expiry TEXT,
            eicr_upload TEXT,
            smoke_alarm_check_date TEXT,
            smoke_alarm_locations TEXT,
            co_alarm_check_date TEXT,
            co_alarm_locations TEXT,
            legionella_notes TEXT,
            fire_risk_assessment_date TEXT,
            fire_risk_assessment_upload TEXT,
            hmo_license_number TEXT,
            hmo_license_expiry TEXT,
            hmo_issuing_council TEXT,
            hmo_license_notes TEXT,
            -- F. Legal / leasehold management
            freeholder_name TEXT,
            freeholder_contact TEXT,
            managing_agent_name TEXT,
            managing_agent_contact TEXT,
            management_co_portal_link TEXT,
            lease_start_date TEXT,
            lease_length INTEGER,
            ground_rent_amount REAL,
            service_charge_cycle TEXT,
            lease_covenants TEXT,
            management_pack_upload TEXT,
            management_pack_review_date TEXT,
            -- G. Documents & attachments (stored as JSON array)
            documents TEXT,
            -- H. Inventory & condition
            inventory_reference TEXT,
            inventory_upload TEXT,
            check_in_report TEXT,
            check_out_report TEXT,
            -- I. Viewing & access logistics
            viewing_slots TEXT,
            lockbox_location TEXT,
            key_register TEXT,
            access_notes TEXT,
            buzzer_codes TEXT,
            -- J. Maintenance & operations
            preferred_contractors TEXT,
            planned_works TEXT,
            capex_budget REAL,
            -- K. Analytics & performance
            date_listed TEXT,
            date_removed TEXT,
            days_on_market INTEGER DEFAULT 0,
            viewings_count INTEGER DEFAULT 0,
            offers_count INTEGER DEFAULT 0,
            offers_accepted_count INTEGER DEFAULT 0,
            listing_agent TEXT,
            marketing_channels TEXT,
            -- L. Stakeholders
            landlord_id INTEGER,
            landlord_contact TEXT,
            managing_agent_id INTEGER,
            head_tenant_contact TEXT,
            -- M. Risk & flags
            flags TEXT,
            gdpr_consent_flags TEXT,
            audit_log TEXT,
            -- Legacy fields (keeping for backward compatibility)
            address TEXT,
            price REAL NOT NULL,
            type TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Related tables for property management
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS property_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            document_type TEXT,
            document_name TEXT,
            document_path TEXT,
            uploaded_by INTEGER,
            uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expiry_date TEXT,
            tags TEXT,
            version INTEGER DEFAULT 1,
            FOREIGN KEY (property_id) REFERENCES properties(id),
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS property_inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            inspection_date TEXT,
            inspection_type TEXT,
            inspector_id INTEGER,
            notes TEXT,
            photos TEXT,
            FOREIGN KEY (property_id) REFERENCES properties(id),
            FOREIGN KEY (inspector_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS property_viewings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            viewing_date TEXT,
            viewing_time TEXT,
            prospect_name TEXT,
            prospect_contact TEXT,
            feedback TEXT,
            rating INTEGER,
            status TEXT,
            FOREIGN KEY (property_id) REFERENCES properties(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS property_maintenance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            ticket_number TEXT,
            issue_description TEXT,
            priority TEXT,
            status TEXT DEFAULT 'Open',
            contractor_id TEXT,
            reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_date TEXT,
            cost REAL,
            FOREIGN KEY (property_id) REFERENCES properties(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS landlords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            payout_instructions TEXT,
            kyc_documents TEXT,
            aml_documents TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Offers table with workflow states, milestones, and SLA tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            price REAL NOT NULL,
            terms TEXT,
            state TEXT DEFAULT 'New',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            acceptance_time TIMESTAMP,
            withdrawal_reason TEXT,
            parent_id INTEGER,
            -- Sales Pipeline States: New, Viewing, Offer, Exchange, Complete
            previous_state TEXT,
            state_changed_at TIMESTAMP,
            -- Progression Milestones
            searches_completed INTEGER DEFAULT 0,
            searches_completed_at TIMESTAMP,
            contracts_exchanged INTEGER DEFAULT 0,
            contracts_exchanged_at TIMESTAMP,
            funds_received INTEGER DEFAULT 0,
            funds_received_at TIMESTAMP,
            completion_date TIMESTAMP,
            -- SLA Tracking
            sla_deadline TIMESTAMP,
            sla_overdue INTEGER DEFAULT 0,
            sla_reminder_sent INTEGER DEFAULT 0,
            sla_reminder_last_sent TIMESTAMP,
            -- Metadata
            applicant_name TEXT,
            applicant_contact TEXT,
            notes TEXT,
            FOREIGN KEY (property_id) REFERENCES properties(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Offer events table for event tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offer_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            offer_id INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            event_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (offer_id) REFERENCES offers(id)
        )
    ''')
    
    # Sales pipeline workflow states configuration
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workflow_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workflow_type TEXT UNIQUE NOT NULL,
            states_config TEXT NOT NULL,
            transitions_config TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Initialize default workflow configuration if not exists
    default_workflow = {
        "states": ["New", "Viewing", "Offer", "Exchange", "Complete"],
        "transitions": [
            {"from": "New", "to": "Viewing", "action": "schedule_viewing"},
            {"from": "Viewing", "to": "Offer", "action": "create_offer"},
            {"from": "Offer", "to": "Exchange", "action": "accept_offer"},
            {"from": "Exchange", "to": "Complete", "action": "complete_sale"},
            {"from": "New", "to": "Offer", "action": "direct_offer"},
            {"from": "*", "to": "Withdrawn", "action": "withdraw"}
        ],
        "sla_days": {
            "New": 7,      # 7 days to move to Viewing
            "Viewing": 14, # 14 days to move to Offer
            "Offer": 10,   # 10 days to Exchange
            "Exchange": 28 # 28 days to Complete
        }
    }
    
    existing = cursor.execute('SELECT id FROM workflow_config WHERE workflow_type = ?', ('sales_pipeline',)).fetchone()
    if not existing:
        cursor.execute('''
            INSERT INTO workflow_config (workflow_type, states_config, transitions_config)
            VALUES (?, ?, ?)
        ''', ('sales_pipeline', json.dumps(default_workflow["states"]), json.dumps(default_workflow)))
    
    conn.commit()
    conn.close()

# --- WORKFLOW ENGINE & EVENTS SYSTEM ---

def get_workflow_config(workflow_type='sales_pipeline'):
    """Get workflow configuration"""
    conn = get_db_connection()
    config = conn.execute(
        'SELECT transitions_config FROM workflow_config WHERE workflow_type = ?',
        (workflow_type,)
    ).fetchone()
    conn.close()
    
    if config:
        return json.loads(config['transitions_config'])
    return None

def validate_transition(current_state, new_state, workflow_type='sales_pipeline'):
    """Validate if a state transition is allowed"""
    workflow = get_workflow_config(workflow_type)
    if not workflow:
        return True  # Allow all if no config
    
    transitions = workflow.get('transitions', [])
    for trans in transitions:
        if trans['from'] == current_state or trans['from'] == '*':
            if trans['to'] == new_state:
                return True
    return False

def calculate_sla_deadline(state, workflow_type='sales_pipeline'):
    """Calculate SLA deadline based on current state"""
    workflow = get_workflow_config(workflow_type)
    if not workflow:
        return None
    
    sla_days = workflow.get('sla_days', {})
    days = sla_days.get(state, 30)  # Default 30 days
    deadline = datetime.now() + timedelta(days=days)
    return deadline.isoformat()

def emit_event(event_type, event_data):
    """Emit events for downstream AI/Comms triggers"""
    try:
        offer_id = event_data.get('id')
        if not offer_id:
            return
        
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO offer_events (offer_id, event_type, event_data)
            VALUES (?, ?, ?)
        ''', (offer_id, event_type, json.dumps(event_data)))
        conn.commit()
        conn.close()
        
        # Log event (in production, you'd send to event bus/webhook)
        print(f"[EVENT] {event_type}: Offer #{offer_id}")
    except Exception as e:
        print(f"Error emitting event: {e}")

def update_offer_state(offer_id, new_state, user_id, notes=None):
    """Update offer state with validation and SLA tracking"""
    conn = get_db_connection()
    offer = conn.execute(
        'SELECT * FROM offers WHERE id = ? AND user_id = ?',
        (offer_id, user_id)
    ).fetchone()
    
    if not offer:
        conn.close()
        return None
    
    current_state = offer['state']
    
    # Validate transition
    if not validate_transition(current_state, new_state):
        conn.close()
        raise ValueError(f"Invalid transition from {current_state} to {new_state}")
    
    # Calculate new SLA deadline
    sla_deadline = calculate_sla_deadline(new_state)
    
    # Update offer
    conn.execute('''
        UPDATE offers 
        SET state = ?, previous_state = ?, state_changed_at = CURRENT_TIMESTAMP,
            sla_deadline = ?, updated_at = CURRENT_TIMESTAMP,
            notes = COALESCE(?, notes)
        WHERE id = ?
    ''', (new_state, current_state, sla_deadline, notes, offer_id))
    conn.commit()
    
    updated_offer = conn.execute('SELECT * FROM offers WHERE id = ?', (offer_id,)).fetchone()
    conn.close()
    
    # Emit state change event
    emit_event(f"offer.{new_state.lower()}", dict(updated_offer))
    
    return dict(updated_offer)

def check_sla_overdue():
    """Check for overdue offers and update flags"""
    conn = get_db_connection()
    now = datetime.now().isoformat()
    
    # Find offers with expired SLA
    overdue = conn.execute('''
        SELECT id, state, sla_deadline 
        FROM offers 
        WHERE sla_deadline < ? 
        AND sla_overdue = 0
        AND state NOT IN ('Complete', 'Withdrawn')
    ''', (now,)).fetchall()
    
    for offer in overdue:
        conn.execute('''
            UPDATE offers 
            SET sla_overdue = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (offer['id'],))
        emit_event("offer.sla_overdue", dict(offer))
    
    conn.commit()
    conn.close()
    return len(overdue)

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def get_current_user():
    """Get current logged-in user from session"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    
    conn = get_db_connection()
    user = conn.execute('SELECT id, name, email FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if user:
        return {
            'id': user['id'],
            'name': user['name'],
            'email': user['email']
        }
    return None

def require_auth():
    """Decorator to require authentication"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            if not get_current_user():
                return jsonify({"error": "Authentication required"}), 401
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Initialize database on startup
init_db()

# --- KPI Data (calculated from actual database) ---
def get_kpi_data():
    """Calculate KPI data from actual database"""
    user = get_current_user()
    if not user:
        return get_empty_kpi_data()
    
    conn = get_db_connection()
    
    # Get user's properties
    properties = conn.execute(
        'SELECT price, bedrooms, type, created_at FROM properties WHERE user_id = ?',
        (user['id'],)
    ).fetchall()
    
    # Get user's offers with property data
    offers_data = conn.execute('''
        SELECT o.price as offer_price, o.state, o.created_at, 
               p.price as asking_price, p.bedrooms, p.type
        FROM offers o 
        JOIN properties p ON o.property_id = p.id
        WHERE o.user_id = ?
    ''', (user['id'],)).fetchall()
    
    conn.close()
    
    # Calculate sales price by bedrooms (from completed offers)
    sales_by_bed = {"1": [], "2": [], "3": [], "4+": []}
    
    # Also track asking prices by bedrooms (from properties)
    asking_by_bed = {"1": [], "2": [], "3": [], "4+": []}
    
    # Add property asking prices
    for prop in properties:
        bedrooms = prop['bedrooms'] or 0
        if bedrooms == 1:
            asking_by_bed["1"].append(prop['price'])
        elif bedrooms == 2:
            asking_by_bed["2"].append(prop['price'])
        elif bedrooms == 3:
            asking_by_bed["3"].append(prop['price'])
        elif bedrooms >= 4:
            asking_by_bed["4+"].append(prop['price'])
    
    # Add completed offer prices
    for offer in offers_data:
        if offer['state'] == 'Exchange' or offer['state'] == 'Complete':
            bedrooms = offer['bedrooms'] or 0
            if bedrooms == 1:
                sales_by_bed["1"].append(offer['offer_price'])
            elif bedrooms == 2:
                sales_by_bed["2"].append(offer['offer_price'])
            elif bedrooms == 3:
                sales_by_bed["3"].append(offer['offer_price'])
            elif bedrooms >= 4:
                sales_by_bed["4+"].append(offer['offer_price'])
    
    # Calculate averages - use asking prices if no sales yet
    sales_avg = [
        sum(sales_by_bed["1"]) / len(sales_by_bed["1"]) if sales_by_bed["1"] else (sum(asking_by_bed["1"]) / len(asking_by_bed["1"]) if asking_by_bed["1"] else 0),
        sum(sales_by_bed["2"]) / len(sales_by_bed["2"]) if sales_by_bed["2"] else (sum(asking_by_bed["2"]) / len(asking_by_bed["2"]) if asking_by_bed["2"] else 0),
        sum(sales_by_bed["3"]) / len(sales_by_bed["3"]) if sales_by_bed["3"] else (sum(asking_by_bed["3"]) / len(asking_by_bed["3"]) if asking_by_bed["3"] else 0),
        sum(sales_by_bed["4+"]) / len(sales_by_bed["4+"]) if sales_by_bed["4+"] else (sum(asking_by_bed["4+"]) / len(asking_by_bed["4+"]) if asking_by_bed["4+"] else 0)
    ]
    
    # Calculate asking price percentage
    asking_achieved = []
    for offer in offers_data:
        if offer['asking_price'] and offer['offer_price']:
            asking_achieved.append((offer['offer_price'] / offer['asking_price']) * 100)
    asking_percent = sum(asking_achieved) / len(asking_achieved) if asking_achieved else 0
    
    # Calculate listing ratio
    total_offers = len(offers_data)
    converted = len([o for o in offers_data if o['state'] == 'Exchange' or o['state'] == 'Complete'])
    lost = len([o for o in offers_data if o['state'] == 'Lost'])
    switched = len([o for o in offers_data if o['state'] == 'Switched'])
    withdrawn = len([o for o in offers_data if o['state'] == 'Withdrawn'])
    
    # Calculate days on market (simplified - last 6 months)
    current_time = time.time()
    days_data = []
    for prop in properties:
        if prop['created_at']:
            try:
                created = time.mktime(time.strptime(prop['created_at'], '%Y-%m-%d %H:%M:%S'))
                days = (current_time - created) / 86400
                days_data.append(days)
            except:
                pass
    
    avg_days = sum(days_data) / len(days_data) if days_data else 0
    
    # Calculate fees (simplified: 1% of sale price)
    fees_total = sum([o['offer_price'] * 0.01 for o in offers_data if o['state'] == 'Exchange' or o['state'] == 'Complete'])
    fees_sales = fees_total * 0.55  # 55% sales
    fees_lettings = fees_total * 0.45  # 45% lettings
    
    # If no properties at all, return empty
    if len(properties) == 0:
        return get_empty_kpi_data()
    
    # If we have properties but no offers, show property prices
    # Calculate asking price percentage - use 100% as default if no offers yet
    if len(offers_data) == 0:
        asking_percent = 100  # No offers yet, so use 100% as placeholder
    
    return {
        "salesPrice": {
            "labels": ["1 bed", "2 bed", "3 bed", "4+ bed"],
            "data": [int(s) for s in sales_avg],
            "askingPricePercent": int(asking_percent) if asking_percent > 0 else 100
        },
        "letPrice": {
            "labels": ["1 bed", "2 bed", "3 bed", "4+ bed"],
            "data": [int(s) for s in sales_avg]
        },
        "listingRatio": {
            "total": len(properties) if total_offers == 0 else total_offers,  # Show property count if no offers
            "converted": converted,
            "lost": lost,
            "switched": switched,
            "withdrawn": withdrawn
        },
        "daysOnMarket": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "data": [int(avg_days)] * 6,
            "average": int(avg_days)
        },
        "feesGenerated": {
            "total": int(fees_total),
            "sales": int(fees_sales),
            "lettings": int(fees_lettings)
        },
        "customerSatisfaction": {
            "score": 4.2,
            "max": 5
        }
    }

def get_empty_kpi_data():
    """Return empty KPI data structure"""
    return {
        "salesPrice": {
            "labels": ["1 bed", "2 bed", "3 bed", "4+ bed"],
            "data": [0, 0, 0, 0],
            "askingPricePercent": 0
        },
        "letPrice": {
            "labels": ["1 bed", "2 bed", "3 bed", "4+ bed"],
            "data": [0, 0, 0, 0]
        },
        "listingRatio": {
            "total": 0,
            "converted": 0,
            "lost": 0,
            "switched": 0,
            "withdrawn": 0
        },
        "daysOnMarket": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "data": [0, 0, 0, 0, 0, 0],
            "average": 0
        },
        "feesGenerated": {
            "total": 0,
            "sales": 0,
            "lettings": 0
        },
        "customerSatisfaction": {
            "score": 0,
            "max": 5
        }
    }

# Pipeline states
PIPELINE = ["New", "Viewing", "Offer", "Exchange", "Complete"]

def emit_event(event_type, offer, extra=None):
    event = {
        "event": event_type,
        "offer_id": offer["id"],
        "state": offer["state"],
        "timestamp": time.time()
    }
    if extra:
        event.update(extra)
    print(f"EVENT: {event}")

def advance_state(offer, new_state):
    if offer["state"] not in PIPELINE or new_state not in PIPELINE:
        return False, "Invalid state transition"
    if PIPELINE.index(new_state) >= PIPELINE.index(offer["state"]):
        offer["state"] = new_state
        return True, None
    return False, "Cannot move backwards in pipeline"

# --- PROPERTY API ROUTES ---

@app.route("/api/properties", methods=["GET"])
def list_properties():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    properties = conn.execute(
        'SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC',
        (user['id'],)
    ).fetchall()
    conn.close()
    
    return jsonify([dict(prop) for prop in properties]), 200

@app.route("/api/properties", methods=["POST"])
def create_property():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    price = data.get("price") or data.get("asking_rent")
    
    if not name:
        return jsonify({"error": "Property name is required"}), 400
    if not price:
        return jsonify({"error": "Price or asking rent is required"}), 400
    try:
        price = float(price)
    except (ValueError, TypeError):
        return jsonify({"error": "Valid price is required"}), 400
    
    # Handle image uploads
    saved_images = []
    images_data = data.get("images", [])
    if isinstance(images_data, list):
        for idx, img_data in enumerate(images_data):
            if isinstance(img_data, str) and img_data.startswith('data:image'):
                try:
                    header, encoded = img_data.split(',', 1)
                    ext = header.split('/')[1].split(';')[0]
                    if ext in ALLOWED_EXTENSIONS or ext == 'jpeg':
                        filename = f"prop_{user['id']}_{int(time.time())}_{idx}.{ext if ext != 'jpeg' else 'jpg'}"
                        filepath = os.path.join(UPLOAD_FOLDER, filename)
                        with open(filepath, 'wb') as f:
                            f.write(base64.b64decode(encoded))
                        saved_images.append(f"/uploads/{filename}")
                except Exception as e:
                    print(f"Error saving image: {e}")
    
    images_str = ",".join(saved_images) if saved_images else ""
    
    # Generate property ID if not provided
    property_id_str = data.get("property_id") or f"PROP-{int(time.time())}-{user['id']}"
    
    # Get date listed
    date_listed = data.get("date_listed") or time.strftime('%Y-%m-%d')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Prepare all field values (comprehensive insert)
    cursor.execute('''
        INSERT INTO properties (
            user_id, property_id, name, address_line1, address_line2, city, postcode,
            property_type, tenure_type, unit_identifier, latitude, longitude,
            bedrooms, bathrooms, receptions, furnishing_state, floorplan_link,
            images, short_description, epc_rating, epc_document, epc_expiry, epc_reference,
            asking_rent, rent_agreed, rent_frequency, rent_due_day, deposit_amount,
            deposit_protection_scheme, deposit_scheme_reference, deposit_protection_date,
            service_charge, ground_rent, service_charge_frequency, council_tax_band,
            council_tax_payer, bills_responsibility, rent_collection_method,
            rent_reconciliation_status, management_fee_percent, management_fee_fixed,
            current_status, current_tenancy_id, tenancy_start_date, tenancy_end_date,
            notice_flag, break_clause_flag, max_occupants, permitted_uses,
            gas_safety_cert_date, gas_safety_cert_expiry, gas_safety_cert_upload,
            gas_safe_engineer, gas_cert_id, eicr_date, eicr_expiry, eicr_upload,
            smoke_alarm_check_date, smoke_alarm_locations, co_alarm_check_date,
            co_alarm_locations, legionella_notes, fire_risk_assessment_date,
            fire_risk_assessment_upload, hmo_license_number, hmo_license_expiry,
            hmo_issuing_council, hmo_license_notes, freeholder_name, freeholder_contact,
            managing_agent_name, managing_agent_contact, management_co_portal_link,
            lease_start_date, lease_length, ground_rent_amount, service_charge_cycle,
            lease_covenants, management_pack_upload, management_pack_review_date,
            documents, inventory_reference, inventory_upload, check_in_report,
            check_out_report, viewing_slots, lockbox_location, key_register,
            access_notes, buzzer_codes, preferred_contractors, planned_works,
            capex_budget, date_listed, listing_agent, marketing_channels,
            landlord_id, landlord_contact, managing_agent_id, head_tenant_contact,
            flags, gdpr_consent_flags, address, price, type, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user['id'], property_id_str, name,
        data.get("address_line1", ""), data.get("address_line2", ""),
        data.get("city", ""), data.get("postcode", ""),
        data.get("property_type", ""), data.get("tenure_type", ""),
        data.get("unit_identifier", ""), data.get("latitude"), data.get("longitude"),
        data.get("bedrooms"), data.get("bathrooms"), data.get("receptions"),
        data.get("furnishing_state", ""), data.get("floorplan_link", ""),
        images_str, data.get("short_description", ""), data.get("epc_rating", ""),
        data.get("epc_document", ""), data.get("epc_expiry", ""), data.get("epc_reference", ""),
        data.get("asking_rent", price), data.get("rent_agreed"), data.get("rent_frequency", "monthly"),
        data.get("rent_due_day"), data.get("deposit_amount"), data.get("deposit_protection_scheme", ""),
        data.get("deposit_scheme_reference", ""), data.get("deposit_protection_date", ""),
        data.get("service_charge"), data.get("ground_rent"), data.get("service_charge_frequency", ""),
        data.get("council_tax_band", ""), data.get("council_tax_payer", ""),
        data.get("bills_responsibility", ""), data.get("rent_collection_method", ""),
        data.get("rent_reconciliation_status", ""), data.get("management_fee_percent"),
        data.get("management_fee_fixed"), data.get("current_status", "Available"),
        data.get("current_tenancy_id"), data.get("tenancy_start_date", ""),
        data.get("tenancy_end_date", ""), 1 if data.get("notice_flag") else 0,
        1 if data.get("break_clause_flag") else 0, data.get("max_occupants"),
        data.get("permitted_uses", ""), data.get("gas_safety_cert_date", ""),
        data.get("gas_safety_cert_expiry", ""), data.get("gas_safety_cert_upload", ""),
        data.get("gas_safe_engineer", ""), data.get("gas_cert_id", ""),
        data.get("eicr_date", ""), data.get("eicr_expiry", ""), data.get("eicr_upload", ""),
        data.get("smoke_alarm_check_date", ""), data.get("smoke_alarm_locations", ""),
        data.get("co_alarm_check_date", ""), data.get("co_alarm_locations", ""),
        data.get("legionella_notes", ""), data.get("fire_risk_assessment_date", ""),
        data.get("fire_risk_assessment_upload", ""), data.get("hmo_license_number", ""),
        data.get("hmo_license_expiry", ""), data.get("hmo_issuing_council", ""),
        data.get("hmo_license_notes", ""), data.get("freeholder_name", ""),
        data.get("freeholder_contact", ""), data.get("managing_agent_name", ""),
        data.get("managing_agent_contact", ""), data.get("management_co_portal_link", ""),
        data.get("lease_start_date", ""), data.get("lease_length"), data.get("ground_rent_amount"),
        data.get("service_charge_cycle", ""), data.get("lease_covenants", ""),
        data.get("management_pack_upload", ""), data.get("management_pack_review_date", ""),
        data.get("documents", ""), data.get("inventory_reference", ""),
        data.get("inventory_upload", ""), data.get("check_in_report", ""),
        data.get("check_out_report", ""), data.get("viewing_slots", ""),
        data.get("lockbox_location", ""), data.get("key_register", ""),
        data.get("access_notes", ""), data.get("buzzer_codes", ""),
        data.get("preferred_contractors", ""), data.get("planned_works", ""),
        data.get("capex_budget"), date_listed, data.get("listing_agent", ""),
        data.get("marketing_channels", ""), data.get("landlord_id"),
        data.get("landlord_contact", ""), data.get("managing_agent_id"),
        data.get("head_tenant_contact", ""), data.get("flags", ""),
        data.get("gdpr_consent_flags", ""),
        # Legacy fields
        data.get("address", ""), price, data.get("type", ""), data.get("description", "")
    ))
    
    prop_id = cursor.lastrowid
    conn.commit()
    property = conn.execute('SELECT * FROM properties WHERE id = ?', (prop_id,)).fetchone()
    conn.close()
    
    return jsonify(dict(property)), 201

@app.route("/api/properties/<int:prop_id>", methods=["GET"])
def get_property(prop_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    property = conn.execute(
        'SELECT * FROM properties WHERE id = ? AND user_id = ?',
        (prop_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    # Get related data
    documents = conn.execute(
        'SELECT * FROM property_documents WHERE property_id = ? ORDER BY uploaded_date DESC',
        (prop_id,)
    ).fetchall()
    
    inspections = conn.execute(
        'SELECT * FROM property_inspections WHERE property_id = ? ORDER BY inspection_date DESC',
        (prop_id,)
    ).fetchall()
    
    viewings = conn.execute(
        'SELECT * FROM property_viewings WHERE property_id = ? ORDER BY viewing_date DESC',
        (prop_id,)
    ).fetchall()
    
    maintenance = conn.execute(
        'SELECT * FROM property_maintenance WHERE property_id = ? ORDER BY reported_date DESC',
        (prop_id,)
    ).fetchall()
    
    conn.close()
    
    result = dict(property)
    result['documents'] = [dict(doc) for doc in documents]
    result['inspections'] = [dict(ins) for ins in inspections]
    result['viewings'] = [dict(v) for v in viewings]
    result['maintenance'] = [dict(m) for m in maintenance]
    
    return jsonify(result), 200

@app.route("/api/properties/<int:prop_id>", methods=["PUT"])
def update_property(prop_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    property = conn.execute(
        'SELECT id FROM properties WHERE id = ? AND user_id = ?',
        (prop_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    data = request.get_json() or {}
    
    # Build update query dynamically based on provided fields
    updates = []
    values = []
    
    # List of all updateable fields
    updateable_fields = [
        'name', 'address_line1', 'address_line2', 'city', 'postcode', 'property_type',
        'tenure_type', 'unit_identifier', 'latitude', 'longitude', 'bedrooms', 'bathrooms',
        'receptions', 'furnishing_state', 'floorplan_link', 'short_description',
        'epc_rating', 'epc_document', 'epc_expiry', 'epc_reference', 'asking_rent',
        'rent_agreed', 'rent_frequency', 'rent_due_day', 'deposit_amount',
        'deposit_protection_scheme', 'deposit_scheme_reference', 'deposit_protection_date',
        'service_charge', 'ground_rent', 'service_charge_frequency', 'council_tax_band',
        'council_tax_payer', 'bills_responsibility', 'rent_collection_method',
        'rent_reconciliation_status', 'management_fee_percent', 'management_fee_fixed',
        'current_status', 'tenancy_start_date', 'tenancy_end_date', 'max_occupants',
        'permitted_uses', 'gas_safety_cert_date', 'gas_safety_cert_expiry',
        'gas_safe_engineer', 'gas_cert_id', 'eicr_date', 'eicr_expiry',
        'smoke_alarm_check_date', 'smoke_alarm_locations', 'co_alarm_check_date',
        'co_alarm_locations', 'legionella_notes', 'fire_risk_assessment_date',
        'hmo_license_number', 'hmo_license_expiry', 'hmo_issuing_council',
        'hmo_license_notes', 'freeholder_name', 'freeholder_contact',
        'managing_agent_name', 'managing_agent_contact', 'management_co_portal_link',
        'lease_start_date', 'lease_length', 'ground_rent_amount', 'service_charge_cycle',
        'lease_covenants', 'management_pack_review_date', 'lockbox_location',
        'key_register', 'access_notes', 'buzzer_codes', 'preferred_contractors',
        'planned_works', 'capex_budget', 'listing_agent', 'marketing_channels',
        'landlord_contact', 'head_tenant_contact', 'flags', 'address', 'type', 'description'
    ]
    
    for field in updateable_fields:
        if field in data:
            updates.append(f"{field} = ?")
            if field in ['notice_flag', 'break_clause_flag']:
                values.append(1 if data[field] else 0)
            else:
                values.append(data[field])
    
    # Handle images separately
    if 'images' in data and isinstance(data['images'], list):
        saved_images = []
        for idx, img_data in enumerate(data['images']):
            if isinstance(img_data, str) and img_data.startswith('data:image'):
                try:
                    header, encoded = img_data.split(',', 1)
                    ext = header.split('/')[1].split(';')[0]
                    if ext in ALLOWED_EXTENSIONS or ext == 'jpeg':
                        filename = f"prop_{user['id']}_{int(time.time())}_{idx}.{ext if ext != 'jpeg' else 'jpg'}"
                        filepath = os.path.join(UPLOAD_FOLDER, filename)
                        with open(filepath, 'wb') as f:
                            f.write(base64.b64decode(encoded))
                        saved_images.append(f"/uploads/{filename}")
                except Exception as e:
                    print(f"Error saving image: {e}")
        if saved_images:
            images_str = ",".join(saved_images)
            updates.append("images = ?")
            values.append(images_str)
    
    if not updates:
        conn.close()
        return jsonify({"error": "No fields to update"}), 400
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    values.append(prop_id)
    
    query = f"UPDATE properties SET {', '.join(updates)} WHERE id = ?"
    conn.execute(query, values)
    conn.commit()
    
    updated_property = conn.execute('SELECT * FROM properties WHERE id = ?', (prop_id,)).fetchone()
    conn.close()
    
    return jsonify(dict(updated_property)), 200

@app.route("/api/properties/<int:prop_id>/documents", methods=["POST"])
def add_property_document(prop_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    property = conn.execute(
        'SELECT id FROM properties WHERE id = ? AND user_id = ?',
        (prop_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    data = request.get_json() or {}
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO property_documents (property_id, document_type, document_name, document_path, uploaded_by, expiry_date, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        prop_id,
        data.get("document_type", ""),
        data.get("document_name", ""),
        data.get("document_path", ""),
        user['id'],
        data.get("expiry_date", ""),
        data.get("tags", "")
    ))
    doc_id = cursor.lastrowid
    conn.commit()
    document = conn.execute('SELECT * FROM property_documents WHERE id = ?', (doc_id,)).fetchone()
    conn.close()
    return jsonify(dict(document)), 201

@app.route("/api/properties/<int:prop_id>/inspections", methods=["POST"])
def add_property_inspection(prop_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    property = conn.execute(
        'SELECT id FROM properties WHERE id = ? AND user_id = ?',
        (prop_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    data = request.get_json() or {}
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO property_inspections (property_id, inspection_date, inspection_type, inspector_id, notes, photos)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        prop_id,
        data.get("inspection_date", ""),
        data.get("inspection_type", ""),
        user['id'],
        data.get("notes", ""),
        data.get("photos", "")
    ))
    ins_id = cursor.lastrowid
    conn.commit()
    inspection = conn.execute('SELECT * FROM property_inspections WHERE id = ?', (ins_id,)).fetchone()
    conn.close()
    return jsonify(dict(inspection)), 201

@app.route("/api/properties/<int:prop_id>/viewings", methods=["POST"])
def add_property_viewing(prop_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    property = conn.execute(
        'SELECT id FROM properties WHERE id = ? AND user_id = ?',
        (prop_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    data = request.get_json() or {}
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO property_viewings (property_id, viewing_date, viewing_time, prospect_name, prospect_contact, feedback, rating, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        prop_id,
        data.get("viewing_date", ""),
        data.get("viewing_time", ""),
        data.get("prospect_name", ""),
        data.get("prospect_contact", ""),
        data.get("feedback", ""),
        data.get("rating"),
        data.get("status", "Scheduled")
    ))
    viewing_id = cursor.lastrowid
    conn.commit()
    conn.execute('UPDATE properties SET viewings_count = viewings_count + 1 WHERE id = ?', (prop_id,))
    conn.commit()
    viewing = conn.execute('SELECT * FROM property_viewings WHERE id = ?', (viewing_id,)).fetchone()
    conn.close()
    return jsonify(dict(viewing)), 201

@app.route("/api/properties/<int:prop_id>/maintenance", methods=["POST"])
def add_property_maintenance(prop_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    property = conn.execute(
        'SELECT id FROM properties WHERE id = ? AND user_id = ?',
        (prop_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    data = request.get_json() or {}
    ticket_number = data.get("ticket_number") or f"TKT-{int(time.time())}-{prop_id}"
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO property_maintenance (property_id, ticket_number, issue_description, priority, status, contractor_id, cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        prop_id,
        ticket_number,
        data.get("issue_description", ""),
        data.get("priority", "Medium"),
        data.get("status", "Open"),
        data.get("contractor_id", ""),
        data.get("cost")
    ))
    maint_id = cursor.lastrowid
    conn.commit()
    maintenance = conn.execute('SELECT * FROM property_maintenance WHERE id = ?', (maint_id,)).fetchone()
    conn.close()
    return jsonify(dict(maintenance)), 201

# --- OFFER API ROUTES (UPDATED TO USE DATABASE) ---

@app.route("/api/offers", methods=["POST"])
def create_offer():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    property_id = data.get("property_id")
    price = data.get("price")
    terms = data.get("terms", "")
    
    if not property_id:
        return jsonify({"error": "Property is required. Please create a property first."}), 400
    try:
        price = float(price)
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Missing or invalid price"}), 400
    
    # Verify property exists and belongs to user
    conn = get_db_connection()
    property = conn.execute(
        'SELECT id FROM properties WHERE id = ? AND user_id = ?',
        (property_id, user['id'])
    ).fetchone()
    
    if not property:
        conn.close()
        return jsonify({"error": "Property not found"}), 404
    
    # Get initial state (default: "New" for new leads, or "Offer" for direct offers)
    initial_state = data.get("state", "New")
    if initial_state not in ["New", "Viewing", "Offer"]:
        initial_state = "New"
    
    # Calculate SLA deadline
    sla_deadline = calculate_sla_deadline(initial_state)
    
    # Create offer with workflow state tracking
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO offers (property_id, user_id, price, terms, state, sla_deadline,
                          applicant_name, applicant_contact, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        property_id, user['id'], price, terms, initial_state, sla_deadline,
        data.get("applicant_name", ""),
        data.get("applicant_contact", ""),
        data.get("notes", "")
    ))
    offer_id = cursor.lastrowid
    
    # Update property offers count
    conn.execute('UPDATE properties SET offers_count = offers_count + 1 WHERE id = ?', (property_id,))
    conn.commit()
    
    offer = conn.execute('''
        SELECT o.*, p.name as property_name, p.price as asking_price
        FROM offers o
        JOIN properties p ON o.property_id = p.id
        WHERE o.id = ?
    ''', (offer_id,)).fetchone()
    conn.close()
    
    offer_dict = dict(offer)
    emit_event("offer.created", offer_dict)
    return jsonify(offer_dict), 201

@app.route("/api/offers/<int:oid>/counter", methods=["POST"])
def counter_offer(oid):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute(
        'SELECT * FROM offers WHERE id = ? AND user_id = ?',
        (oid, user['id'])
    ).fetchone()
    
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    data = request.get_json() or {}
    new_price = data.get("price", offer['price'])
    try:
        new_price = float(new_price)
    except (ValueError, TypeError):
        new_price = offer['price']
    
    # Create counter offer (new offer linked to parent)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO offers (property_id, user_id, price, terms, state, parent_id, sla_deadline,
                          applicant_name, applicant_contact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        offer['property_id'], user['id'], new_price, 
        data.get("terms", offer['terms']), "Offer", oid,
        calculate_sla_deadline("Offer"),
        offer.get('applicant_name', ''),
        offer.get('applicant_contact', '')
    ))
    counter_id = cursor.lastrowid
    conn.commit()
    
    updated_offer = conn.execute('''
        SELECT o.*, p.name as property_name, p.price as asking_price
        FROM offers o
        JOIN properties p ON o.property_id = p.id
        WHERE o.id = ?
    ''', (counter_id,)).fetchone()
    conn.close()
    
    offer_dict = dict(updated_offer)
    emit_event("offer.countered", offer_dict)
    return jsonify(offer_dict), 201

@app.route("/api/offers/<int:oid>/accept", methods=["POST"])
def accept_offer(oid):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute(
        'SELECT * FROM offers WHERE id = ? AND user_id = ?',
        (oid, user['id'])
    ).fetchone()
    
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    if offer['state'] not in ["Offer", "New"]:
        conn.close()
        return jsonify({"error": f"Can only accept offers in Offer or New state (currently: {offer['state']})"}), 400
    
    conn.close()
    
    # Use workflow engine to transition to Exchange
    try:
        updated = update_offer_state(oid, "Exchange", user['id'])
        if not updated:
            return jsonify({"error": "Failed to update offer state"}), 400
        
        # Set acceptance time
        conn = get_db_connection()
        conn.execute('UPDATE offers SET acceptance_time = CURRENT_TIMESTAMP WHERE id = ?', (oid,))
        conn.commit()
        
        # Update property - mark offer as accepted
        conn.execute('UPDATE properties SET offers_accepted_count = offers_accepted_count + 1 WHERE id = ?', (offer['property_id'],))
        conn.commit()
        
        updated_offer = conn.execute('''
            SELECT o.*, p.name as property_name, p.price as asking_price
            FROM offers o
            JOIN properties p ON o.property_id = p.id
            WHERE o.id = ?
        ''', (oid,)).fetchone()
        conn.close()
        
        offer_dict = dict(updated_offer)
        emit_event("offer.accepted", offer_dict)
        return jsonify(offer_dict), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/offers/<int:oid>/withdraw", methods=["POST"])
def withdraw_offer(oid):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute(
        'SELECT * FROM offers WHERE id = ? AND user_id = ?',
        (oid, user['id'])
    ).fetchone()
    
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    if offer['state'] == "Withdrawn":
        conn.close()
        return jsonify({"error": "Offer already withdrawn"}), 400
    
    reason = request.get_json().get("reason") if request.is_json else None
    conn.close()
    
    # Use workflow engine to transition to Withdrawn
    try:
        updated = update_offer_state(oid, "Withdrawn", user['id'], notes=reason)
        if not updated:
            return jsonify({"error": "Failed to update offer state"}), 400
        
        # Set withdrawal reason
        conn = get_db_connection()
        conn.execute('UPDATE offers SET withdrawal_reason = ? WHERE id = ?', (reason, oid))
        conn.commit()
        
        updated_offer = conn.execute('''
            SELECT o.*, p.name as property_name, p.price as asking_price
            FROM offers o
            JOIN properties p ON o.property_id = p.id
            WHERE o.id = ?
        ''', (oid,)).fetchone()
        conn.close()
        
        offer_dict = dict(updated_offer)
        emit_event("offer.withdrawn", offer_dict)
        return jsonify(offer_dict), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/offers", methods=["GET"])
def list_offers():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offers = conn.execute('''
        SELECT o.*, p.name as property_name, p.price as asking_price, p.images as property_images
        FROM offers o
        JOIN properties p ON o.property_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    ''', (user['id'],)).fetchall()
    conn.close()
    
    return jsonify([dict(offer) for offer in offers]), 200

# --- MILESTONE ENDPOINTS ---

@app.route("/api/offers/<int:oid>/milestones/searches", methods=["POST"])
def update_searches_milestone(oid):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute('SELECT id FROM offers WHERE id = ? AND user_id = ?', (oid, user['id'])).fetchone()
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    conn.execute('''
        UPDATE offers 
        SET searches_completed = 1, searches_completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (oid,))
    conn.commit()
    
    updated = conn.execute('SELECT * FROM offers WHERE id = ?', (oid,)).fetchone()
    conn.close()
    
    emit_event("offer.milestone.searches_completed", dict(updated))
    return jsonify(dict(updated)), 200

@app.route("/api/offers/<int:oid>/milestones/contracts", methods=["POST"])
def update_contracts_milestone(oid):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute('SELECT id FROM offers WHERE id = ? AND user_id = ?', (oid, user['id'])).fetchone()
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    conn.execute('''
        UPDATE offers 
        SET contracts_exchanged = 1, contracts_exchanged_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (oid,))
    conn.commit()
    
    updated = conn.execute('SELECT * FROM offers WHERE id = ?', (oid,)).fetchone()
    conn.close()
    
    emit_event("offer.milestone.contracts_exchanged", dict(updated))
    return jsonify(dict(updated)), 200

@app.route("/api/offers/<int:oid>/milestones/funds", methods=["POST"])
def update_funds_milestone(oid):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute('SELECT id FROM offers WHERE id = ? AND user_id = ?', (oid, user['id'])).fetchone()
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    conn.execute('''
        UPDATE offers 
        SET funds_received = 1, funds_received_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (oid,))
    conn.commit()
    
    updated = conn.execute('SELECT * FROM offers WHERE id = ?', (oid,)).fetchone()
    conn.close()
    
    emit_event("offer.milestone.funds_received", dict(updated))
    return jsonify(dict(updated)), 200

@app.route("/api/offers/<int:oid>/milestones/complete", methods=["POST"])
def complete_offer(oid):
    """Mark offer as Complete and set completion date"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    offer = conn.execute('SELECT id FROM offers WHERE id = ? AND user_id = ?', (oid, user['id'])).fetchone()
    if not offer:
        conn.close()
        return jsonify({"error": "Offer not found"}), 404
    
    conn.close()
    
    try:
        updated = update_offer_state(oid, "Complete", user['id'])
        if not updated:
            return jsonify({"error": "Failed to update offer state"}), 400
        
        conn = get_db_connection()
        conn.execute('UPDATE offers SET completion_date = CURRENT_TIMESTAMP WHERE id = ?', (oid,))
        conn.commit()
        
        updated_offer = conn.execute('SELECT * FROM offers WHERE id = ?', (oid,)).fetchone()
        conn.close()
        
        offer_dict = dict(updated_offer)
        emit_event("offer.completed", offer_dict)
        return jsonify(offer_dict), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

# --- STATE TRANSITION & SLA ENDPOINTS ---

@app.route("/api/offers/<int:oid>/transition", methods=["POST"])
def transition_offer(oid):
    """Transition offer to a new state via workflow engine"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    new_state = data.get("state")
    
    if not new_state:
        return jsonify({"error": "New state is required"}), 400
    
    try:
        updated = update_offer_state(oid, new_state, user['id'], notes=data.get("notes"))
        if not updated:
            return jsonify({"error": "Offer not found or transition failed"}), 404
        
        conn = get_db_connection()
        updated_offer = conn.execute('''
            SELECT o.*, p.name as property_name, p.price as asking_price
            FROM offers o
            JOIN properties p ON o.property_id = p.id
            WHERE o.id = ?
        ''', (oid,)).fetchone()
        conn.close()
        
        return jsonify(dict(updated_offer)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/offers/check-sla", methods=["POST"])
def check_sla_endpoint():
    """Manually trigger SLA overdue check"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    overdue_count = check_sla_overdue()
    return jsonify({"overdue_count": overdue_count, "message": f"Checked SLA: {overdue_count} offers overdue"}), 200

@app.route("/api/workflow/config", methods=["GET"])
def get_workflow_config_endpoint():
    """Get workflow configuration"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    workflow_type = request.args.get('type', 'sales_pipeline')
    config = get_workflow_config(workflow_type)
    
    if not config:
        return jsonify({"error": "Workflow config not found"}), 404
    
    return jsonify(config), 200

# --- SALES KPI ENDPOINTS ---

@app.route("/api/kpi/sales", methods=["GET"])
def get_sales_kpis():
    """Get sales KPIs: conversion rate, median days to exchange, etc."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db_connection()
    
    # Get all offers
    offers = conn.execute(
        'SELECT * FROM offers WHERE user_id = ?',
        (user['id'],)
    ).fetchall()
    
    if not offers:
        conn.close()
        return jsonify({
            "conversion_rate": 0,
            "median_days_to_exchange": 0,
            "median_days_to_complete": 0,
            "total_offers": 0,
            "active_offers": 0,
            "exchanged_offers": 0,
            "completed_offers": 0,
            "withdrawn_offers": 0,
            "overdue_count": 0,
            "state_distribution": {}
        }), 200
    
    # Calculate conversion rate (Exchange + Complete / Total)
    total = len(offers)
    exchanged = len([o for o in offers if o['state'] in ['Exchange', 'Complete']])
    completed = len([o for o in offers if o['state'] == 'Complete'])
    withdrawn = len([o for o in offers if o['state'] == 'Withdrawn'])
    active = len([o for o in offers if o['state'] not in ['Complete', 'Withdrawn']])
    overdue = len([o for o in offers if o.get('sla_overdue', 0) == 1])
    
    conversion_rate = (exchanged / total * 100) if total > 0 else 0
    
    # Calculate median days to exchange
    exchange_days = []
    for offer in offers:
        if offer['acceptance_time']:
            try:
                created = datetime.fromisoformat(offer['created_at'].replace(' ', 'T'))
                accepted = datetime.fromisoformat(offer['acceptance_time'].replace(' ', 'T'))
                days = (accepted - created).days
                if days >= 0:
                    exchange_days.append(days)
            except:
                pass
    
    median_days_to_exchange = sorted(exchange_days)[len(exchange_days)//2] if exchange_days else 0
    
    # Calculate median days to complete
    complete_days = []
    for offer in offers:
        if offer['completion_date']:
            try:
                created = datetime.fromisoformat(offer['created_at'].replace(' ', 'T'))
                completed = datetime.fromisoformat(offer['completion_date'].replace(' ', 'T'))
                days = (completed - created).days
                if days >= 0:
                    complete_days.append(days)
            except:
                pass
    
    median_days_to_complete = sorted(complete_days)[len(complete_days)//2] if complete_days else 0
    
    # State distribution
    state_dist = {}
    for offer in offers:
        state = offer['state']
        state_dist[state] = state_dist.get(state, 0) + 1
    
    conn.close()
    
    return jsonify({
        "conversion_rate": round(conversion_rate, 2),
        "median_days_to_exchange": median_days_to_exchange,
        "median_days_to_complete": median_days_to_complete,
        "total_offers": total,
        "active_offers": active,
        "exchanged_offers": exchanged,
        "completed_offers": completed,
        "withdrawn_offers": withdrawn,
        "overdue_count": overdue,
        "state_distribution": state_dist
    }), 200

@app.route("/api/kpi/summary", methods=["GET"])
def get_kpi_summary():
    kpi_data = get_kpi_data()
    
    # Add property summary
    user = get_current_user()
    if user:
        conn = get_db_connection()
        property_count = conn.execute(
            'SELECT COUNT(*) as count FROM properties WHERE user_id = ?',
            (user['id'],)
        ).fetchone()
        conn.close()
        kpi_data['propertyCount'] = property_count['count'] if property_count else 0
    
    return jsonify(kpi_data)

# --- AUTHENTICATION ROUTES ---

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Validation
    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 400

    conn = get_db_connection()
    
    # Check if user already exists
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email already registered"}), 400
    
    # Create new user
    password_hash = generate_password_hash(password)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        (name, email, password_hash)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Create session
    session['user_id'] = user_id
    
    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    user = conn.execute(
        'SELECT id, name, email, password_hash FROM users WHERE email = ?',
        (email,)
    ).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Create session
    session['user_id'] = user['id']

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        }
    }), 200

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

@app.route("/api/auth/me", methods=["GET"])
def get_current_user_info():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user), 200

# --- PAGE SERVING ROUTES ---
# Specific routes must be defined before catch-all routes

@app.route('/login')
def serve_login():
    return send_from_directory('.', 'login.html')

@app.route('/dashboard')
def serve_dashboard():
    return send_from_directory('.', 'dashboard.html')

@app.route('/properties')
def serve_properties():
    return send_from_directory('.', 'properties.html')

@app.route('/property-form')
def serve_property_form():
    return send_from_directory('.', 'property-form.html')

@app.route('/applicants')
def serve_applicants():
    return send_from_directory('.', 'applicants.html')

@app.route('/appraisals')
def serve_appraisals():
    return send_from_directory('.', 'appraisals.html')

@app.route('/messages')
def serve_messages():
    return send_from_directory('.', 'messages.html')

@app.route('/reports')
def serve_reports():
    return send_from_directory('.', 'reports.html')

@app.route('/')
def serve_root():
    return send_from_directory('.', 'offers.html')

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Static file serving - must come after specific routes
@app.route('/<path:filename>')
def serve_static(filename):
    # This route serves style.css, offers.js, dashboard.js, etc.
    return send_from_directory('.', filename)
# -----------------

if __name__ == "__main__":
    import sys
    # Allow port to be specified via command line argument or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    try:
        app.run(debug=True, port=port, host='127.0.0.1')
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n❌ Error: Port {port} is already in use.")
            print(f"\nOptions:")
            print(f"  1. Kill the process using port {port}:")
            print(f"     lsof -ti:{port} | xargs kill -9")
            print(f"  2. Run with a different port:")
            print(f"     python3.13 api.py 5501")
        else:
            raise