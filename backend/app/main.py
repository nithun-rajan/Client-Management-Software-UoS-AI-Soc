from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os

import threading
import time
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

from app.core.database import Base, engine, get_db, SessionLocal
import app.models  # ensure all models are registered before table creation
from app.models import Property, User, Landlord, Applicant
from app.api.v1 import properties, landlords, applicants, agents, search, kpis, events, property_matching, land_registry, messaging, tickets, tenancy, tasks, vendors, viewings, offers, workflows, notifications, sales, auth, documents, maintenance, valuations, calendar



# Thread ControLl
SHOULD_RUN_TASKS = True 
CHECK_INTERVAL_SECONDS = 60 * 60 * 24
EXPIRY_THRESHOLD = 30 

def notify(
    db: Session,
    user_id: Optional[int],
    title: str,
    body: str,
    type: str,
    priority: str
):

    timestamp = datetime.now(timezone.utc).isoformat()
    print(f"📢 [NOTIFICATION LOG] @ {timestamp}")
    print(f"TO USER ID: {user_id or 'N/A'}")
    print(f"PRIORITY: {priority.upper()} | TYPE: {type}")
    print(f"TITLE: {title}")
    print(f"BODY: {body}")


def run_daily_compliance_check():
    """Background job: checks all property compliance documents for expiry."""
    print(f"--- Running daily compliance check @ {datetime.utcnow()} ---")
    
    db: Session = SessionLocal()
    
    try:
        properties: List[Property] = db.query(Property).all()
        
        
        for property in properties:
            expiring_docs = property.expiring_documents 
            
            if expiring_docs:
                doc_list = ", ".join([doc['type'] for doc in expiring_docs])
                
            
                print(f"📢 [COMPLIANCE ALERT] Property: {property.address} - Documents expiring: {doc_list}")
        
        
        print(f"--- Compliance check complete. {len(properties)} properties checked. ---")
        
    except Exception as e:
        print(f"❌ ERROR running compliance check task: {e}")
    finally:
        db.close()
        

def run_schedule():
    """Thread target loop: continuously runs the compliance check."""
    global SHOULD_RUN_TASKS
    print(f"Background scheduler initialized. Check interval: {CHECK_INTERVAL_SECONDS}s")
    
    # Run once immediately on startup
    run_daily_compliance_check()

    while SHOULD_RUN_TASKS:
        time.sleep(CHECK_INTERVAL_SECONDS)
        run_daily_compliance_check()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global SHOULD_RUN_TASKS
    
    # STARTUP LOGIC
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database ready")
    
    # Start the background compliance checker thread
    thread = threading.Thread(target=run_schedule, daemon=True)
    thread.start()
    print("✅ Background compliance checker thread started.")
    
    yield
    
    # SHUTDOWN 
    print("Shutting down background tasks...")
    SHOULD_RUN_TASKS = False 
    print("Shutting down Uvicorn...")


app = FastAPI(
    title="🏢 UoS Scouting Challenge",
    description="""
    ## 🚀 UoS Scouting Challenge API
    
    Built by **Team 67** for the University of Southampton AI Society hackathon.
    
    ### Features:
    * 🏠 **Properties** - Complete property management
    * 👔 **Landlords** - Landlord records with AML compliance
    * 👥 **Applicants** - Tenant applicant tracking
    * 🔍 **Search** - Advanced property search with filters
    * 📊 **KPIs** - Real-time business metrics dashboard
    * 📝 **Events** - Event logging and tracking
    
    ### Endpoints by Category:
    
    #### 🏠 Properties
    - `POST /api/v1/properties` - Create new property
    - `GET /api/v1/properties` - List all properties
    - `GET /api/v1/properties/{id}` - Get property details
    - `PUT /api/v1/properties/{id}` - Update property
    - `DELETE /api/v1/properties/{id}` - Delete property
    
    #### 👔 Landlords
    - Complete CRUD operations for landlord management
    - AML verification tracking
    - Banking details (secure)
    
    #### 👥 Applicants
    - Tenant applicant registration
    - Search criteria tracking
    - Reference & right-to-rent checks
    
    #### 🔍 Search
    - Multi-filter property search
    - Filter by: bedrooms, rent, type, postcode, status
    - Result count endpoint for pagination
    
    #### 📊 KPIs
    - Real-time dashboard metrics
    - Property, landlord, and applicant analytics
    
    #### 📝 Events
    - Event logging system
    - Activity tracking
    
    ---
    **Team 67** | Hackathon 2025
    """,
    version="1.0.0",
    contact={
        "name": "Team 67",
        "email": "ali.marzooq13@outlook.com"
    },
    license_info={
        "name": "MIT"
    },
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy import function for models
def get_model_counts(db: Session):
    """Lazy import models to avoid circular imports"""
    try:
        # Import models inside the function (lazy loading)
        """from .models.property import Property
        from .models.landlord import Landlord
        from .models.applicant import Applicant"""
        from .models import Property, Landlord, Applicant
        
        property_count = db.query(Property).count()
        landlord_count = db.query(Landlord).count()
        applicant_count = db.query(Applicant).count()
        
        return property_count, landlord_count, applicant_count
    except Exception as e:
        print(f"Model count error (tables might not exist yet): {e}")
        return 0, 0, 0  # Return zeros if tables don't exist yet

@app.get("/", response_class=HTMLResponse)
def root(db: Session = Depends(get_db)):
    """Landing page with dynamic stats"""
    
    # Use lazy import function
    property_count, landlord_count, applicant_count = get_model_counts(db)
    
    endpoint_count = len([r for r in app.routes if hasattr(r, "methods")])
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>UoS Scouting Challenge API</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .container {{
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }}
            h1 {{
                font-size: 3em;
                margin: 0;
                text-align: center;
            }}
            .emoji {{
                font-size: 4em;
                text-align: center;
                margin: 20px 0;
            }}
            .subtitle {{
                text-align: center;
                font-size: 1.3em;
                opacity: 0.9;
                margin-bottom: 30px;
            }}
            .stats {{
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                flex-wrap: wrap;
                gap: 20px;
            }}
            .stat {{
                text-align: center;
                min-width: 120px;
            }}
            .stat-number {{
                font-size: 2.5em;
                font-weight: bold;
            }}
            .stat-label {{
                opacity: 0.8;
                font-size: 0.9em;
            }}
            .buttons {{
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }}
            .button {{
                background: white;
                color: #667eea;
                padding: 15px 30px;
                border-radius: 10px;
                text-decoration: none;
                font-weight: bold;
                transition: transform 0.2s;
            }}
            .button:hover {{
                transform: translateY(-2px);
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                opacity: 0.7;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="emoji">🏢</div>
            <h1>UoS Scouting Challenge</h1>
            <div class="subtitle">API by Team 67</div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">{endpoint_count}</div>
                    <div class="stat-label">API Endpoints</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{property_count}</div>
                    <div class="stat-label">Properties</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{landlord_count}</div>
                    <div class="stat-label">Landlords</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{applicant_count}</div>
                    <div class="stat-label">Applicants</div>
                </div>
            </div>
            
            <div class="buttons">
                <a href="/docs" class="button">📖 API Documentation</a>
                <a href="/api/v1/kpis/" class="button">📊 KPI Dashboard</a>
                <a href="/health" class="button">💚 Health Check</a>
            </div>
            
            <div class="footer">
                Built with FastAPI • Python • SQLAlchemy<br>
                Hackathon 2025
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "UoS Scouting Challenge API",
        "version": "1.0.0",
        "team": "Team 67",
        "organization": "University of Southampton AI Society"
    }


# Register all routers
app.include_router(properties.router, prefix="/api/v1")
app.include_router(landlords.router, prefix="/api/v1")
app.include_router(applicants.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")  # 👥 Agents Management
app.include_router(search.router, prefix="/api/v1")
app.include_router(kpis.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(property_matching.router, prefix="/api/v1")  # 🤖 AI Property Matching
app.include_router(land_registry.router, prefix="/api/v1")  # 🏡 HM Land Registry Integration (FREE!)
app.include_router(messaging.router, prefix="/api/v1")  # 💬 Communication Log / Activity Feed
app.include_router(tenancy.router, prefix="/api/v1")  # 🏠 Tenancy Management (by Abdullah)
app.include_router(tasks.router, prefix="/api/v1")  # ✅ Task Management
app.include_router(tickets.router, prefix="/api/v1")  # 🎫 Tickets / Maintenance
app.include_router(vendors.router, prefix="/api/v1")  # 🏪 Vendor Management
app.include_router(viewings.router, prefix="/api/v1")  # 📅 Viewing Management
app.include_router(offers.router, prefix="/api/v1")  # 💰 Offer Management
app.include_router(sales.router, prefix="/api/v1")  # 🏠 Sales Progression Management
app.include_router(workflows.router, prefix="/api/v1")  # 🔄 Workflow State Machine
app.include_router(notifications.router, prefix="/api/v1")  # 🔔 Notifications
app.include_router(auth.router, prefix="/api/v1")  # 🔐 Authentication (by Anthony)
app.include_router(documents.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")  # 🔧 Maintenance Management
app.include_router(valuations.router, prefix="/api/v1")  # 💰 Valuation Management
app.include_router(calendar.router, prefix="/api/v1")  # 📅 Calendar & Viewing Scheduler

# Mount static files directory for uploaded files
# Get the backend directory (parent of app directory)
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
uploads_dir = os.path.join(backend_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
