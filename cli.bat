@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: Parvaah Windows CLI Entrypoint (cli.bat)
:: ==============================================================================

set "ROOT_DIR=%~dp0"
set "ACTION=%~1"

if "%ACTION%"=="" goto help
if "%ACTION%"=="--help" goto help
if "%ACTION%"=="-h" goto help
if "%ACTION%"=="help" goto help

if "%ACTION%"=="--setup" goto setup
if "%ACTION%"=="-s" goto setup
if "%ACTION%"=="setup" goto setup

if "%ACTION%"=="--dev" goto dev
if "%ACTION%"=="-d" goto dev
if "%ACTION%"=="dev" goto dev

if "%ACTION%"=="--test" goto test
if "%ACTION%"=="-t" goto test
if "%ACTION%"=="test" goto test

if "%ACTION%"=="--build" goto build
if "%ACTION%"=="-b" goto build
if "%ACTION%"=="build" goto build

echo Unknown option: %ACTION%
echo Run 'cli.bat --help' for usage.
exit /b 1

:setup
call "%ROOT_DIR%scripts\setup.bat"
exit /b %errorlevel%

:dev
echo Starting development servers...
if exist "%ROOT_DIR%scripts\dev.bat" (
    call "%ROOT_DIR%scripts\dev.bat"
) else (
    call npm run dev
)
exit /b %errorlevel%

:test
if exist "%ROOT_DIR%.venv\Scripts\pytest.exe" (
    "%ROOT_DIR%.venv\Scripts\pytest.exe" apps\backend\tests %2 %3 %4 %5
) else (
    pytest apps\backend\tests %2 %3 %4 %5
)
exit /b %errorlevel%

:build
call npm run build
exit /b %errorlevel%

:help
echo ================================================================
echo   Parvaah Unified CLI (Windows)
echo ================================================================
echo.
echo Usage: cli.bat [command^|flag]
echo.
echo Options:
echo   --setup, -s    Bootstrap full fresh environment (venv, dependencies, database seeding)
echo   --dev, -d      Run FastAPI backend and Next.js frontend development servers
echo   --test, -t     Run automated backend pytest suite
echo   --build, -b    Build all workspace packages and Next.js web application
echo   --help, -h     Show this help menu
echo.
exit /b 0
