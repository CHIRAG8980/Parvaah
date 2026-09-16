# ==============================================================================
# Parvaah Windows Automated Project Setup (PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Parvaah - Automated Project Setup (PowerShell)" -ForegroundColor Green
Write-Host "  Root Directory: $RootDir" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Green

# 1. Environment Configuration
Write-Host "[SETUP] Step 1/5: Checking environment configuration (.env)..." -ForegroundColor Cyan
if (-not (Test-Path "$RootDir\.env")) {
    if (Test-Path "$RootDir\.env.example") {
        Copy-Item "$RootDir\.env.example" "$RootDir\.env"
        Write-Host "[SUCCESS] Created .env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "[WARN] .env.example not found." -ForegroundColor Yellow
    }
} else {
    Write-Host "[SETUP] .env file already exists."
}

# 2. Python Environment & Dependencies
Write-Host "[SETUP] Step 2/5: Setting up Python environment..." -ForegroundColor Cyan
$pythonCmd = "python"
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonCmd = "py"
    } else {
        Write-Host "[ERROR] Python 3 is required but not found in PATH." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path "$RootDir\.venv")) {
    Write-Host "[SETUP] Creating Python virtual environment (.venv)..."
    & $pythonCmd -m venv "$RootDir\.venv"
    Write-Host "[SUCCESS] Virtual environment created." -ForegroundColor Green
}

$venvPython = "$RootDir\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    $venvPython = $pythonCmd
}

Write-Host "[SETUP] Installing Python dependencies from requirements.txt..."
& $venvPython -m pip install --quiet --upgrade pip
& $venvPython -m pip install --quiet -r "$RootDir\requirements.txt"
Write-Host "[SUCCESS] Python dependencies installed." -ForegroundColor Green

# 3. Node.js & Monorepo Packages
Write-Host "[SETUP] Step 3/5: Setting up Node.js & monorepo workspace dependencies..." -ForegroundColor Cyan
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm install
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "[WARN] pnpm not found. Using npm..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[ERROR] Node.js package manager (pnpm/npm) not found in PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Node.js dependencies installed." -ForegroundColor Green

# 4. Build Shared Monorepo Packages
Write-Host "[SETUP] Step 4/5: Building shared TypeScript packages..." -ForegroundColor Cyan
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm -r --filter "./packages/**" run build
} else {
    npm run build --workspaces --if-present
}
Write-Host "[SUCCESS] Monorepo packages built successfully." -ForegroundColor Green

# 5. Database Initialization & Ingestion
Write-Host "[SETUP] Step 5/5: Initializing and seeding database..." -ForegroundColor Cyan
Push-Location "$RootDir\apps\backend"
$env:PYTHONPATH = "$RootDir\apps\backend"
& $venvPython -c "from app.database import SessionLocal, init_db; from app.ingest.real_data_loader import run_real_ingestion; init_db(); db = SessionLocal(); run_real_ingestion(db); db.close()"
Pop-Location
Write-Host "[SUCCESS] Database initialized and ingested with GSI zones, MoRTH roads, and telemetry." -ForegroundColor Green

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Parvaah setup completed successfully!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "To start the development servers:"
Write-Host "  .\cli.ps1 --dev   (or pnpm dev)"
Write-Host "To run all test suites:"
Write-Host "  .\cli.ps1 --test  (or pytest apps/backend/tests)"
Write-Host "================================================================" -ForegroundColor Green
