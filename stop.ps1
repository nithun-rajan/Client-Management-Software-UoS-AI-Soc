# =============================================================================
# Client Management Software - Stop Script (Windows PowerShell)
# =============================================================================
# This script stops all running backend and frontend servers
# =============================================================================

Write-Host "Stopping servers..." -ForegroundColor Yellow
Write-Host ""

# Stop processes by port (most reliable method)
$backendProcesses = @()
$frontendProcesses = @()

try {
    $backendConnections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($backendConnections) {
        $backendProcesses += $backendConnections | Select-Object -ExpandProperty OwningProcess -Unique
    }
} catch {}

try {
    $frontendConnections = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($frontendConnections) {
        $frontendProcesses += $frontendConnections | Select-Object -ExpandProperty OwningProcess -Unique
    }
} catch {}

# Kill backend processes (port 8000)
if ($backendProcesses.Count -gt 0) {
    foreach ($pid in $backendProcesses) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] Stopped backend process (PID: $pid)" -ForegroundColor Green
        } catch {
            Write-Host "[WARN] Could not stop backend process (PID: $pid)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[INFO] No backend process found on port 8000" -ForegroundColor Gray
}

# Kill frontend processes (port 5173)
if ($frontendProcesses.Count -gt 0) {
    foreach ($pid in $frontendProcesses) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] Stopped frontend process (PID: $pid)" -ForegroundColor Green
        } catch {
            Write-Host "[WARN] Could not stop frontend process (PID: $pid)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[INFO] No frontend process found on port 5173" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[OK] All servers stopped" -ForegroundColor Green

