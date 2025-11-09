# =============================================================================
# Client Management Software - Setup Script (Windows PowerShell)
# =============================================================================
# This script installs all dependencies for both backend and frontend
# =============================================================================

Write-Host "================================================================" -ForegroundColor Blue
Write-Host "   Client Management Software - Dependency Setup         " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# =============================================================================
# BACKEND SETUP (Python)
# =============================================================================

Write-Host "[1/2] Installing Backend Dependencies (Python)..." -ForegroundColor Blue
Write-Host ""

Push-Location backend

# Check if Python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "ERROR: Python 3 is not installed!" -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

try {
    $pythonVersion = python --version 2>&1 | Out-String
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python 3 is not installed!" -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "Virtual environment exists" -ForegroundColor Green
}

# Activate virtual environment and install dependencies
Write-Host "Installing Python packages..." -ForegroundColor Blue
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip first
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to upgrade pip, continuing anyway..." -ForegroundColor Yellow
}

# Install dependencies
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "Backend dependencies installed from requirements.txt" -ForegroundColor Green
} else {
    Write-Host "ERROR: requirements.txt not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Deactivate virtual environment
deactivate

Pop-Location

Write-Host ""
Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""

# =============================================================================
# FRONTEND SETUP (Node.js/npm)
# =============================================================================

Write-Host "[2/2] Installing Frontend Dependencies (Node.js)..." -ForegroundColor Blue
Write-Host ""

Push-Location frontend

# Check if Node.js is available
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

try {
    $nodeVersion = node --version 2>&1 | Out-String
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Check if npm is available
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Write-Host "npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Yellow
    Pop-Location
    exit 1
}

try {
    $npmVersion = npm --version 2>&1 | Out-String
    Write-Host "npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Write-Host "npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Install npm dependencies
if (Test-Path "package.json") {
    Write-Host "Installing npm packages..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install npm packages!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "Frontend setup complete!" -ForegroundColor Green
Write-Host ""

# =============================================================================
# SUMMARY
# =============================================================================

Write-Host "================================================================" -ForegroundColor Blue
Write-Host "                    Setup Complete!                    " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Backend dependencies installed (Python packages)" -ForegroundColor Green
Write-Host "Frontend dependencies installed (npm packages)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Run .\start.ps1 to start both servers" -ForegroundColor Blue
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
Write-Host ""
