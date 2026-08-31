# start-local.ps1
# Starts Proofsy in local-only MVP mode (No Docker, Mongo, or Redis installation required)

Clear-Host
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "                 Proofsy Local Launcher                          " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " This script starts Proofsy locally on your Windows host.        "
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed! Please download and install Node.js from https://nodejs.org/" -ForegroundColor Red
    Exit 1
}

# 1. Start Backend
Write-Host "[1/2] Setting up and starting Backend..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "backend"
if (!(Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host "Installing backend dependencies (this may take a minute)..." -ForegroundColor Yellow
    Push-Location $backendPath
    npm install
    Pop-Location
}

# Launch Backend in a new window
$backendCmd = "`$Host.UI.RawUI.WindowTitle = 'Proofsy Backend Server'; `$Env:NODE_ENV='development'; `$Env:PORT='8001'; npm run dev"
Start-Process powershell.exe -WorkingDirectory $backendPath -ArgumentList @("-NoExit", "-Command", $backendCmd)

# 2. Start Frontend
Write-Host "[2/2] Setting up and starting Frontend..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "frontend"
if (!(Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "Installing frontend dependencies (this may take a minute)..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
}

# Launch Frontend in a new window
$frontendCmd = "`$Host.UI.RawUI.WindowTitle = 'Proofsy Frontend Server'; `$Env:PORT='3001'; `$Env:BACKEND_URL='http://localhost:8001'; npm run dev"
Start-Process powershell.exe -WorkingDirectory $frontendPath -ArgumentList @("-NoExit", "-Command", $frontendCmd)

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " All services are booting up in separate windows!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3001" -ForegroundColor Green
Write-Host "  - Backend:  http://localhost:8001" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
