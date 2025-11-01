# Team 67 - Estate Agency CRM Backend API

**Team Members:**
- Ali - Backend API 


---

## 🚀 Quick Start

### Setup (5 minutes)
```bash
cd Team67

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Seed database with test data
python seed_data.py

# Run API
python -m uvicorn app.main:app --reload --port 8000
```

### Access Points

- **API Documentation:** http://localhost:8000/docs
- **Landing Page:** http://localhost:8000
- **Mock Server:** `python -m uvicorn mock_server.mock_api:app --reload --port 8001`

---

## Features Completed

### Core CRUD APIs
- ✅ **Properties** - Full CRUD with status tracking
- ✅ **Landlords** - With AML compliance fields
- ✅ **Applicants** - With reference tracking

### Advanced Features
- ✅ **Multi-filter Search** - Search by bedrooms, rent, type, postcode
- ✅ **Mock API Server** - Faker-powered fake data for frontend team
- ✅ **Seed Data Script** - Populate DB with 45 realistic records
- ✅ **Auto-generated Docs** - Interactive Swagger UI

---

## 📁 Project Structure
```
Team67/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Config & database
│   ├── models/          # SQLAlchemy models
│   └── schemas/         # Pydantic schemas
├── mock_server/         # Mock API with Faker
├── requirements.txt
├── seed_data.py
└── README.md
```

---

## 🎯 API Endpoints

### Properties
- `GET /api/v1/properties` - List all
- `POST /api/v1/properties` - Create
- `GET /api/v1/properties/{id}` - Get one
- `PUT /api/v1/properties/{id}` - Update
- `DELETE /api/v1/properties/{id}` - Delete

### Landlords
- Full CRUD operations
- AML verification tracking

### Applicants  
- Full CRUD operations
- Reference status tracking

### Search
- `GET /api/v1/search/properties?bedrooms=2&rent_max=2000&postcode=SO15`
- `GET /api/v1/search/properties/count` - Get result count

---

## 🛠️ Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with SQLite
- **Pydantic** - Data validation
- **Faker** - Realistic test data generation

---

## 📊 Demo Data

Run `python seed_data.py` to populate:
- 20 properties (mixed flats/houses across UK cities)
- 10 landlords (with AML status)
- 15 applicants (with search criteria)

---

## Team 67 | girlscouts 2025