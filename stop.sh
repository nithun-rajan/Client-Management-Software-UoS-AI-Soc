#!/bin/bash

# =============================================================================
# Client Management Software - Stop Script
# =============================================================================
# This script stops both backend and frontend servers
# =============================================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Client Management Software - Stopping Servers...      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

STOPPED=0

# =============================================================================
# STOP BACKEND
# =============================================================================

if [ -f "backend/backend.pid" ]; then
    BACKEND_PID=$(cat backend/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}🛑 Stopping Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        rm backend/backend.pid
        echo -e "${GREEN}✓ Backend stopped${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "${YELLOW}⚠️  Backend PID file exists but process not running${NC}"
        rm backend/backend.pid
    fi
else
    echo -e "${YELLOW}⚠️  Backend is not running (no PID file)${NC}"
fi

# Also kill any stray uvicorn processes on port 8000
STRAY=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$STRAY" ]; then
    echo -e "${YELLOW}⚠️  Found process on port 8000, killing...${NC}"
    kill -9 $STRAY 2>/dev/null
    echo -e "${GREEN}✓ Port 8000 cleared${NC}"
    STOPPED=$((STOPPED + 1))
fi

echo ""

# =============================================================================
# STOP FRONTEND
# =============================================================================

if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}🛑 Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        rm frontend/frontend.pid
        echo -e "${GREEN}✓ Frontend stopped${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "${YELLOW}⚠️  Frontend PID file exists but process not running${NC}"
        rm frontend/frontend.pid
    fi
else
    echo -e "${YELLOW}⚠️  Frontend is not running (no PID file)${NC}"
fi

# Also kill any stray vite processes on port 5173
STRAY=$(lsof -ti:5173 2>/dev/null)
if [ ! -z "$STRAY" ]; then
    echo -e "${YELLOW}⚠️  Found process on port 5173, killing...${NC}"
    kill -9 $STRAY 2>/dev/null
    echo -e "${GREEN}✓ Port 5173 cleared${NC}"
    STOPPED=$((STOPPED + 1))
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================

if [ $STOPPED -gt 0 ]; then
    echo -e "${GREEN}✅ All servers stopped successfully!${NC}"
else
    echo -e "${YELLOW}ℹ️  No servers were running${NC}"
fi

echo ""

