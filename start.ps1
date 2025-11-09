# =============================================================================
# Client Management Software - Start Script (Windows PowerShell)
# =============================================================================
# This script starts both backend and frontend servers in separate windows
# =============================================================================

# Check if .env exists, create from .env.example if needed
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env file from .env.example" -ForegroundColor Yellow
        Write-Host "WARNING: Please edit .env and add your API keys!" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "ERROR: .env file not found!" -ForegroundColor Red
        Write-Host "Please create a .env file with your API keys:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "OPENAI_API_KEY=your_openai_key"
        Write-Host "DATA_STREET_API_KEY=your_datastreet_key"
        Write-Host ""
        exit 1
    }
}

Write-Host "================================================================" -ForegroundColor Blue
Write-Host "   Client Management Software - Starting Servers...      " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# =============================================================================
# START BACKEND
# =============================================================================

Write-Host "[1/2] Starting Backend (FastAPI on port 8000)..." -ForegroundColor Blue

if (-not (Test-Path "backend\venv")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Run .\setup.ps1 first to install dependencies" -ForegroundColor Yellow
    exit 1
}

# Start backend in a new window
$backendPath = (Resolve-Path "backend").Path
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
) -WindowStyle Normal

Write-Host "[OK] Backend starting in new window..." -ForegroundColor Green
Write-Host "  -> API: http://localhost:8000" -ForegroundColor Blue
Write-Host "  -> Docs: http://localhost:8000/docs" -ForegroundColor Blue
Write-Host ""

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# =============================================================================
# START FRONTEND
# =============================================================================

Write-Host "[2/2] Starting Frontend (Vite on port 5173)..." -ForegroundColor Blue

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "ERROR: node_modules not found!" -ForegroundColor Red
    Write-Host "Run .\setup.ps1 first to install dependencies" -ForegroundColor Yellow
    exit 1
}

# Start frontend in a new window
$frontendPath = (Resolve-Path "frontend").Path
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; npm run dev"
) -WindowStyle Normal

Write-Host "[OK] Frontend starting in new window..." -ForegroundColor Green
Write-Host "  -> App: http://localhost:5173" -ForegroundColor Blue
Write-Host ""

# Wait a bit for frontend to start
Start-Sleep -Seconds 3

Write-Host "================================================================" -ForegroundColor Blue
Write-Host "                    Servers Running!                   " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "[OK] Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "[OK] Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "[OK] API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "INFO: Servers are running in separate windows" -ForegroundColor Yellow
Write-Host "INFO: Close those windows to stop the servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
