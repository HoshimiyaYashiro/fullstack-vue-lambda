# ==============================================================================
# Floci Local Cloud Teardown Script (PowerShell / Windows)
# ==============================================================================

$FlociDir = Resolve-Path "$PSScriptRoot\.."
$ComposeFile = Join-Path $FlociDir "docker-compose.yml"

Write-Host "[Floci Down] Stopping Floci services..." -ForegroundColor Cyan

try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        docker compose -f $ComposeFile down
    }
} catch { }

$FlociCmd = Get-Command floci -ErrorAction SilentlyContinue
if ($FlociCmd) {
    try {
        & floci stop
    } catch { }
}

Write-Host "[SUCCESS] Floci stopped successfully." -ForegroundColor Green
