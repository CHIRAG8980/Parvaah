@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: Parvaah Windows Automated Project Setup (scripts\setup.bat)
:: ==============================================================================

set "ROOT_DIR=%~dp0.."
cd /d "%ROOT_DIR%"

echo ================================================================
echo   Parvaah - Automated Project Setup (Windows)
echo   Root Directory: %ROOT_DIR%
echo ================================================================

:: 1. Environment Configuration
echo [SETUP] Step 1/5: Checking environment configuration (.env)...
if not exist "%ROOT_DIR%\.env" (
    if exist "%ROOT_DIR%\.env.example" (
        copy "%ROOT_DIR%\.env.example" "%ROOT_DIR%\.env" >nul
        echo [SUCCESS] Created .env from .env.example
    ) else (
        echo [WARN] .env.example not found.
    )
) else (
    echo [SETUP] .env file already exists.
)

:: 2. Python Environment & Dependencies
echo [SETUP] Step 2/5: Setting up Python environment...
set "PY_CMD=python"
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python 3 is required but not found in PATH.
        exit /b 1
    ) else (
        set "PY_CMD=py -3.11"
    )
)

if not exist "%ROOT_DIR%\.venv" (
    echo [SETUP] Creating Python virtual environment (.venv)...
    %PY_CMD% -m venv "%ROOT_DIR%\.venv"
    echo [SUCCESS] Virtual environment created.
)

set "VENV_PYTHON=%ROOT_DIR%\.venv\Scripts\python.exe"
if not exist "%VENV_PYTHON%" (
    set "VENV_PYTHON=%PY_CMD%"
)

echo [SETUP] Installing Python dependencies from requirements.txt...
"%VENV_PYTHON%" -m pip install --quiet --upgrade pip
"%VENV_PYTHON%" -m pip install --quiet -r "%ROOT_DIR%\requirements.txt"
echo [SUCCESS] Python dependencies installed.

:: 3. Node.js & Monorepo Packages
echo [SETUP] Step 3/5: Setting up Node.js & monorepo workspace dependencies...
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    call pnpm install
) else (
    where npm >nul 2>nul
    if %errorlevel% equ 0 (
        echo [WARN] pnpm not found. Using npm...
        call npm install
    ) else (
        echo [ERROR] Node.js package manager (pnpm/npm) not found in PATH.
        exit /b 1
    )
)
echo [SUCCESS] Node.js dependencies installed.

:: 4. Build Shared Monorepo Packages
echo [SETUP] Step 4/5: Building shared TypeScript packages...
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    call pnpm -r --filter "./packages/**" run build
) else (
    call npm run build --workspaces --if-present
)
echo [SUCCESS] Monorepo packages built successfully.

:: 5. Database Initialization & Ingestion
echo [SETUP] Step 5/5: Initializing and seeding database...
pushd "%ROOT_DIR%\apps\backend"
set "PYTHONPATH=%ROOT_DIR%\apps\backend"
"%VENV_PYTHON%" -c "from app.database import SessionLocal, init_db; from app.ingest.real_data_loader import run_real_ingestion; init_db(); db = SessionLocal(); run_real_ingestion(db); db.close()"
popd
echo [SUCCESS] Database initialized and ingested with GSI zones, MoRTH roads, and telemetry.

echo.
echo ================================================================
echo   Parvaah setup completed successfully!
echo ================================================================
echo To start the development servers:
echo   cli.bat --dev   (or pnpm dev)
echo To run all test suites:
echo   cli.bat --test  (or pytest apps\backend\tests)
echo ================================================================
exit /b 0
