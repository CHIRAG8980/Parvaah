<#
.SYNOPSIS
    Parvaah Unified CLI (PowerShell)
.DESCRIPTION
    Cross-platform CLI runner for Windows PowerShell and pwsh.
.EXAMPLE
    .\cli.ps1 -Setup
    .\cli.ps1 --setup
    .\cli.ps1 --dev
    .\cli.ps1 --test
#>

[CmdletBinding()]
param (
    [Parameter(Position=0)]
    [string]$Action = "--help"
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

switch ($Action) {
    { $_ -in @("--setup", "-s", "setup", "-Setup") } {
        & "$RootDir\scripts\setup.ps1"
        break
    }
    { $_ -in @("--dev", "-d", "dev", "-Dev") } {
        if (Test-Path "$RootDir\scripts\dev.ps1") {
            & "$RootDir\scripts\dev.ps1"
        } else {
            npm run dev
        }
        break
    }
    { $_ -in @("--test", "-t", "test", "-Test") } {
        $pytestPath = "$RootDir\.venv\Scripts\pytest.exe"
        if (Test-Path $pytestPath) {
            & $pytestPath apps/backend/tests
        } else {
            pytest apps/backend/tests
        }
        break
    }
    { $_ -in @("--build", "-b", "build", "-Build") } {
        npm run build
        break
    }
    default {
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "  Parvaah Unified CLI (PowerShell)" -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Usage: .\cli.ps1 [command|flag]"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  --setup, -s    Bootstrap full fresh environment (venv, dependencies, database seeding)"
        Write-Host "  --dev, -d      Run FastAPI backend and Next.js frontend development servers"
        Write-Host "  --test, -t     Run automated backend pytest suite"
        Write-Host "  --build, -b    Build all workspace packages and Next.js web application"
        Write-Host "  --help, -h     Show this help menu"
        Write-Host ""
    }
}
