@echo off
REM ==============================================
REM Client Management Software - Setup Script
REM Windows Version
REM ==============================================

echo ╔══════════════════════════════════════════════════════════╗
echo ║   Client Management Software - Dependency Setup         ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM ============================================
REM Backend Setup
REM ============================================
echo 📦 [1/2] Installing Backend Dependencies (Python)...
echo.

cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        echo Please install Python: https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python packages...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

echo ✅ Backend setup complete!
echo.

deactivate
cd ..

REM ============================================
REM Frontend Setup
REM ============================================
echo 📦 [2/2] Installing Frontend Dependencies (Node.js)...
echo.

cd frontend

echo Installing npm packages...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install npm dependencies
    echo Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Frontend setup complete!
echo.

cd ..

REM ============================================
REM Complete
REM ============================================
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   ✅ SETUP COMPLETE!                                     ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo   1. Make sure you have a .env file in the root directory
echo   2. Run: start.bat (to start the application)
echo.
pause

