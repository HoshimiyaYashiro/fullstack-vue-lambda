# ==============================================================================
# Floci Local Cloud Boot Script (PowerShell / Windows)
# ==============================================================================

$FlociDir = Resolve-Path "$PSScriptRoot\.."
$ComposeFile = Join-Path $FlociDir "docker-compose.yml"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       Floci Local Cloud Orchestrator (Windows / Dual-Mode)    " -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan

# 1. Check if Docker is available and running
$DockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) { $DockerRunning = $true }
} catch {
    $DockerRunning = $false
}

if ($DockerRunning) {
    Write-Host "[Mode: Docker Compose] Active Docker daemon detected." -ForegroundColor Green
    Write-Host "[Mode: Docker Compose] Starting Floci container with full 11-service parity..." -ForegroundColor Green

    docker compose -f $ComposeFile up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start Floci with Docker Compose."
        exit 1
    }

    Write-Host "`n[Floci Health] Probing gateway at http://localhost:4566..." -ForegroundColor Yellow
    $Healthy = $false
    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Seconds 1
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:4566" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
                $Healthy = $true
                break
            }
        } catch { }
    }

    if ($Healthy) {
        Write-Host "`n[SUCCESS] Floci is UP and running on port 4566!" -ForegroundColor Green
        Write-Host "  - AWS Endpoint:       http://localhost:4566"
        Write-Host "  - Aurora PostgreSQL:  localhost:5432 (enterprise_db)"
        Write-Host "  - Manual init:        Run 'pnpm floci:seed' when ready`n"
    } else {
        Write-Warning "Floci did not respond within 25 seconds. Run 'pnpm floci:logs' to inspect logs."
    }
} else {
    Write-Warning "[Notice] Docker daemon is NOT running."

    $FlociCmd = Get-Command floci -ErrorAction SilentlyContinue
    if ($FlociCmd) {
        Write-Host "[Mode: Native Floci CLI] Found 'floci' binary in PATH." -ForegroundColor Yellow
        Write-Host "[Mode: Native Floci CLI] Launching in-process services (S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS)..." -ForegroundColor Yellow
        Write-Host "[Notice] For Lambda: use 'pnpm dev:lambda' for direct Node.js execution." -ForegroundColor Yellow
        Write-Host "[Notice] For Aurora: ensure local PostgreSQL is running on port 5432.`n" -ForegroundColor Yellow

        Start-Process -FilePath "floci" -ArgumentList "start" -NoNewWindow
        Start-Sleep -Seconds 3
        Write-Host "[SUCCESS] Floci CLI started on http://localhost:4566." -ForegroundColor Green
    } else {
        Write-Host "`n[ERROR] Neither Docker nor the Floci CLI was found on this system.`n" -ForegroundColor Red
        Write-Host "To install Docker / Podman Desktop (Full 11-service parity):" -ForegroundColor Cyan
        Write-Host "   https://podman-desktop.io/ or https://www.docker.com/products/docker-desktop/`n"
        Write-Host "To install Floci CLI (Lightweight, No-Docker mode):" -ForegroundColor Cyan
        Write-Host "   Run: iwr https://floci.io/install.ps1 | iex`n"
        exit 1
    }
}
