@echo off
REM ==============================================
REM Client Management Software - Start Script
REM Windows Version
REM ==============================================

echo ╔══════════════════════════════════════════════════════════╗
echo ║   Client Management Software - Starting Services        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM ============================================
REM Start Backend
REM ============================================
echo 🚀 [1/2] Starting Backend (port 8000)...
echo.

cd backend

REM Check if backend is already running
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ⚠️  Backend already running on port 8000
) else (
    echo Activating Python virtual environment...
    call venv\Scripts\activate.bat
    
    echo Starting FastAPI server...
    start "CRM Backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ✓ Backend started in new window
)

cd ..
echo.

REM ============================================
REM Start Frontend
REM ============================================
echo 🚀 [2/2] Starting Frontend (port 5173)...
echo.

cd frontend

REM Check if frontend is already running
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ⚠️  Frontend already running on port 5173
) else (
    echo Starting Vite dev server...
    start "CRM Frontend" cmd /k "npm run dev"
    echo ✓ Frontend started in new window
)

cd ..
echo.

REM ============================================
REM Complete
REM ============================================
echo ╔══════════════════════════════════════════════════════════╗
echo ║   ✅ SERVICES STARTED!                                   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📱 Application URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000/docs
echo.
echo Press Ctrl+C in the Backend/Frontend windows to stop services
echo Or run: stop.bat
echo.
pause

