# 🚀 Client Management Software - Quick Start Guide

> **AI-Powered Estate Agent CRM for Lettings & Sales**  
> Built for the University of Southampton AI Society Hackathon

---

## 📋 **Prerequisites**

Before you begin, ensure you have the following installed:

### **Required:**
- **Python 3.10+** → [Download](https://www.python.org/downloads/)
- **Node.js 18+** → [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### **API Keys Required:**
- **OpenAI API Key** → [Get yours](https://platform.openai.com/api-keys)
- **Data.Street API Key** → [Get yours](https://www.data.street/)

---

## 🛠️ **Installation (One-Time Setup)**

### **Step 1: Clone the Repository**

```bash
git clone <repository-url>
cd Client-Management-Software-UoS-AI-Soc
```

### **Step 2: Set Up Environment Variables**

Create a `.env` file in the **project root** with your API keys:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your actual keys:

```env
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
DATA_STREET_API_KEY=your-actual-datastreet-key-here
```

### **Step 3: Run the Setup Script**

This installs **all dependencies** (backend + frontend):

```bash
./setup.sh
```

**WARNING**
If you are using a unix based OS, setup.sh and start.sh may have incompatible line endings.
Meaning that you might want to use dos2unix on these files to fix that

to install:
```
#for ubuntu:
sudo apt install dos2unix
#install using whatever package manager you are using
```

**What this does:**
- ✅ Creates Python virtual environment
- ✅ Installs backend dependencies (FastAPI, SQLAlchemy, etc.)
- ✅ Installs frontend dependencies (React, Vite, Tailwind, etc.)
- ✅ Validates your Python and Node.js installations

**Expected output:**
```
📦 [1/2] Installing Backend Dependencies (Python)...
✓ Python found: Python 3.10.0
✓ Backend dependencies installed

📦 [2/2] Installing Frontend Dependencies (Node.js)...
✓ Node.js found: v18.0.0
✓ Frontend dependencies installed

✅ Setup Complete!
```

---

## 🎯 **Starting the Application**

### **Option 1: Start Both Servers at Once (Recommended)**

```bash
./start.sh
```

**This automatically starts:**
- 🐍 **Backend** → `http://localhost:8000`
- ⚛️ **Frontend** → `http://localhost:5173`
- 📚 **API Docs** → `http://localhost:8000/docs`

**Expected output:**
```
🚀 [1/2] Starting Backend (FastAPI on port 8000)...
✓ Backend started (PID: 12345)

🚀 [2/2] Starting Frontend (Vite on port 5173)...
✓ Frontend started (PID: 12346)

🎉 Servers Running!
```

**To stop the servers:**
```bash
# Press Ctrl+C in the terminal
# OR run:
./stop.sh
```

---

### **Option 2: Start Manually (For Development)**

#### **Start Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

#### **Start Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

---

## 🌐 **Accessing the Application**

Once started, open your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | [http://localhost:5173](http://localhost:5173) | Main CRM interface |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | REST API |
| **API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Server status |

---

## 📱 **Features Overview**

### **✅ Implemented (92% Lettings Front-End)**

#### **🏠 Properties Module**
- Full CRUD operations
- 54 comprehensive property fields
- AI-powered rent estimation (OpenAI + Data.Street)
- HM Land Registry integration
- Automatic valuation packs
- Property matching engine

#### **👤 Landlords Module**
- Landlord records with AML/KYC verification
- Banking details & compliance checks
- Document management
- Activity tracking

#### **🔍 Applicants Module**
- Applicant registration (60+ fields)
- Search criteria tracking
- AI-powered property matching
- Viewing booking system
- Automated match emails with personalization

#### **📊 KPI Dashboard**
- Real-time metrics
- Days on market
- Average rent per bedroom
- Property/applicant/landlord counts
- Status distribution

#### **🔄 Workflows (NEW!)**
- State machine for progression stages
- Available → Under Offer → Let Agreed → Tenanted
- Automated side effects on transitions
- Visual pipeline UI

---

## 🧪 **Testing the Application**

### **1. Create a Test Landlord**

Go to **Landlords** page → Click **"Add Landlord"**

### **2. Add a Property**

Go to **Properties** page → Click **"Quick Add"**

**Try this test address:**
```
Postcode: M98 7UN
Address: 3 Welch via, Manchester
```

This will:
- ✅ Lookup property data from Data.Street
- ✅ Generate AI-powered rent estimate
- ✅ Fetch HM Land Registry sales history
- ✅ Create valuation pack with comparables

### **3. Create an Applicant**

Go to **Applicants** page → Click **"Quick Add"**

Set search criteria:
- Bedrooms: 2
- Budget: £1,351 - £2,748
- Locations: Southampton, Manchester

### **4. Find Property Matches**

On the Applicants page → Click **"Find Matches"**

This will:
- ✅ Match applicant criteria to properties
- ✅ Show match scores (e.g., "80% Match")
- ✅ Generate AI-personalized messages
- ✅ Suggest viewing slots

---

## 🛠️ **Common Commands**

### **Setup & Installation:**
```bash
./setup.sh                    # Install all dependencies
```

### **Start/Stop Servers:**
```bash
./start.sh                    # Start both backend + frontend
./stop.sh                     # Stop all servers
```

### **Backend Commands:**
```bash
cd backend
source venv/bin/activate      # Activate Python environment
uvicorn app.main:app --reload # Start backend manually
python seed_data.py           # Seed test data
pytest                        # Run tests
```

### **Frontend Commands:**
```bash
cd frontend
npm run dev                   # Start development server
npm run build                 # Build for production
npm run lint                  # Check code quality
npm run format                # Format code with Prettier
```

---

## 🐛 **Troubleshooting**

### **Backend won't start:**

**Error: `Address already in use`**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Then restart
./start.sh
```

**Error: `ModuleNotFoundError`**
```bash
# Reinstall dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Error: `OPENAI_API_KEY not configured`**
```bash
# Check .env file exists in project root
cat .env

# Should contain:
OPENAI_API_KEY=sk-proj-your-key
DATA_STREET_API_KEY=your-key
```

---

### **Frontend won't start:**

**Error: `EADDRINUSE: Port 5173 already in use`**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
# Then restart
cd frontend && npm run dev
```

**Error: `Cannot find module`**
```bash
# Reinstall node_modules
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### **API Requests Failing:**

**Check backend logs:**
```bash
tail -f backend/backend.log
```

**Check frontend logs:**
```bash
tail -f frontend/frontend.log
```

**Test API directly:**
```bash
# Health check
curl http://localhost:8000/health

# Get properties
curl http://localhost:8000/api/v1/properties
```

---

## 📚 **Project Structure**

```
Client-Management-Software-UoS-AI-Soc/
├── setup.sh              # Install dependencies
├── start.sh              # Start servers
├── stop.sh               # Stop servers
├── .env                  # API keys (create this!)
├── .env.example          # Template for .env
│
├── backend/              # Python/FastAPI Backend
│   ├── app/
│   │   ├── api/v1/       # API endpoints (50+ routes)
│   │   ├── models/       # Database models (11 tables)
│   │   ├── schemas/      # Pydantic validation
│   │   ├── services/     # AI, Data.Street, Land Registry
│   │   └── main.py       # FastAPI app entry point
│   ├── requirements.txt  # Python dependencies
│   ├── pyproject.toml    # Modern Python config
│   └── venv/             # Virtual environment (created by setup.sh)
│
└── frontend/             # React/TypeScript Frontend
    ├── src/
    │   ├── pages/        # 8 main pages
    │   ├── components/   # 60+ UI components
    │   ├── hooks/        # React Query hooks
    │   └── types/        # TypeScript definitions
    ├── package.json      # npm dependencies
    └── node_modules/     # npm packages (created by setup.sh)
```

---

## 🎓 **Key Technologies**

### **Backend:**
- **FastAPI** - Modern Python API framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **OpenAI API** - AI rent estimation
- **Data.Street API** - Property data
- **HM Land Registry API** - Sales history

### **Frontend:**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **React Router** - Navigation

---

## 📊 **Codebase Stats**

- **Total Lines:** ~20,115
- **Backend:** 8,640 lines (Python)
- **Frontend:** 11,475 lines (TypeScript/React)
- **API Endpoints:** 50+
- **Database Tables:** 11
- **React Components:** 60+
- **Test Coverage:** 897 lines

---

## 🚀 **Next Steps**

### **Explore the Features:**
1. ✅ Create properties with AI valuation
2. ✅ Add landlords with KYC verification
3. ✅ Register applicants with search criteria
4. ✅ Use property matching engine
5. ✅ View KPI dashboard

### **Development:**
- Check out the API docs: `http://localhost:8000/docs`
- Explore the codebase in `backend/app/` and `frontend/src/`
- Read the full blueprint: `Project CRM Blueprint.md`

### **Production Deployment:**
- Set up PostgreSQL database
- Configure HTTPS
- Add authentication
- Deploy to cloud (AWS/GCP/Azure)

---

## 💡 **Need Help?**

- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Logs:** `backend/backend.log`
- **Frontend Logs:** `frontend/frontend.log`
- **Blueprint:** `Project CRM Blueprint.md`

---

## 🎉 **You're All Set!**

Run `./start.sh` and visit **http://localhost:5173** to start using your AI-powered estate agent CRM!

**Happy coding! 🚀**

