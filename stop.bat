@echo off
REM ==============================================
REM Client Management Software - Stop Script
REM Windows Version
REM ==============================================

echo ╔══════════════════════════════════════════════════════════╗
echo ║   Client Management Software - Stopping Services        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM ============================================
REM Stop Backend (Port 8000)
REM ============================================
echo 🛑 Stopping Backend (port 8000)...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo   ⚠️  No backend process found on port 8000
    ) else (
        echo   ✓ Backend stopped
    )
)

echo.

REM ============================================
REM Stop Frontend (Port 5173)
REM ============================================
echo 🛑 Stopping Frontend (port 5173)...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo   ⚠️  No frontend process found on port 5173
    ) else (
        echo   ✓ Frontend stopped
    )
)

echo.

REM ============================================
REM Complete
REM ============================================
echo ╔══════════════════════════════════════════════════════════╗
echo ║   ✅ ALL SERVICES STOPPED                                ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause

