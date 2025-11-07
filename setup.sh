#!/bin/bash

# =============================================================================
# Client Management Software - Setup Script
# =============================================================================
# This script installs all dependencies for both backend and frontend
# =============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Client Management Software - Dependency Setup         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# BACKEND SETUP (Python)
# =============================================================================

echo -e "${BLUE}📦 [1/2] Installing Backend Dependencies (Python)...${NC}"
echo ""

cd backend

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ ERROR: Python 3 is not installed!${NC}"
    echo "Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi

echo -e "${GREEN}✓ Python found: $(python3 --version)${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
fi

# Activate virtual environment and install dependencies
echo -e "${BLUE}Installing Python packages...${NC}"
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip --quiet

# Install dependencies
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
    echo -e "${GREEN}✓ Backend dependencies installed from requirements.txt${NC}"
else
    echo -e "${RED}❌ ERROR: requirements.txt not found!${NC}"
    exit 1
fi

# Deactivate virtual environment
deactivate

cd ..

echo ""
echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo ""

# =============================================================================
# FRONTEND SETUP (Node.js/npm)
# =============================================================================

echo -e "${BLUE}📦 [2/2] Installing Frontend Dependencies (Node.js)...${NC}"
echo ""

cd frontend

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ERROR: Node.js is not installed!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ ERROR: npm is not installed!${NC}"
    echo "npm should come with Node.js. Please reinstall Node.js."
    exit 1
fi

echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Install npm dependencies
if [ -f "package.json" ]; then
    echo -e "${BLUE}Installing npm packages...${NC}"
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ ERROR: package.json not found!${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}✅ Frontend setup complete!${NC}"
echo ""

# =============================================================================
# SUMMARY
# =============================================================================

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🎉 Setup Complete!                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Backend dependencies installed${NC} (Python packages)"
echo -e "${GREEN}✓ Frontend dependencies installed${NC} (npm packages)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "  ${BLUE}1. Start Backend:${NC}"
echo -e "     cd backend"
echo -e "     source venv/bin/activate"
echo -e "     uvicorn app.main:app --reload --port 8000"
echo ""
echo -e "  ${BLUE}2. Start Frontend (in a new terminal):${NC}"
echo -e "     cd frontend"
echo -e "     npm run dev"
echo ""
echo -e "${GREEN}🚀 Happy coding!${NC}"
echo ""

