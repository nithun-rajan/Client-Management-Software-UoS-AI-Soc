#!/bin/bash

# =============================================================================
# Client Management Software - Start Script
# =============================================================================
# This script starts both backend and frontend servers concurrently
# =============================================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
cp .env.example .env

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Client Management Software - Starting Servers...      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with your API keys:${NC}"
    echo ""
    echo "OPENAI_API_KEY=your_openai_key"
    echo "DATA_STREET_API_KEY=your_datastreet_key"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"
echo ""

# Function to kill processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

trap cleanup INT TERM

# =============================================================================
# START BACKEND
# =============================================================================

echo -e "${BLUE}🚀 [1/2] Starting Backend (FastAPI on port 8000)...${NC}"

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ ERROR: Virtual environment not found!${NC}"
    echo -e "${YELLOW}Run ./setup.sh first to install dependencies${NC}"
    exit 1
fi

# Start backend in background
source venv/bin/activate
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
deactivate

# Wait for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    echo -e "  ${BLUE}→ API: http://localhost:8000${NC}"
    echo -e "  ${BLUE}→ Docs: http://localhost:8000/docs${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check backend/backend.log${NC}"
    exit 1
fi

cd ..

echo ""

# =============================================================================
# START FRONTEND
# =============================================================================

echo -e "${BLUE}🚀 [2/2] Starting Frontend (Vite on port 5173)...${NC}"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ ERROR: node_modules not found!${NC}"
    echo -e "${YELLOW}Run ./setup.sh first to install dependencies${NC}"
    exit 1
fi

# Start frontend in background
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo -e "  ${BLUE}→ App: http://localhost:8080${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check frontend/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🎉 Servers Running!                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Backend:${NC}  http://localhost:8000"
echo -e "${GREEN}✓ Frontend:${NC} http://localhost:5173"
echo -e "${GREEN}✓ API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}💡 Logs:${NC}"
echo -e "   Backend:  backend/backend.log"
echo -e "   Frontend: frontend/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running
wait

