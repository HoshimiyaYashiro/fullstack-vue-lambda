# ==============================================================================
# Floci Local Cloud Manual Re-Seed Script (PowerShell / Windows)
# ==============================================================================

$FlociDir = Resolve-Path "$PSScriptRoot\.."
$InitDir = Join-Path $FlociDir "init"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       Floci Local Cloud Seeder (Windows / PowerShell)        " -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan

# Check if Floci container is running to execute via docker exec
$ContainerRunning = $false
try {
    $Inspect = docker inspect -f '{{.State.Running}}' enterprise-floci 2>&1
    if ($Inspect -eq "true") { $ContainerRunning = $true }
} catch { }

if ($ContainerRunning) {
    Write-Host "[Mode: Container Exec] Re-running initialization hooks inside enterprise-floci..." -ForegroundColor Green
    $Files = Get-ChildItem -Path $InitDir -Filter "*.sh" | Sort-Object Name
    foreach ($File in $Files) {
        Write-Host "  -> Running $($File.Name)..." -ForegroundColor Yellow
        docker exec enterprise-floci /bin/bash "/opt/floci/manual-init/$($File.Name)"
    }
    Write-Host "`n[SUCCESS] All init scripts executed successfully." -ForegroundColor Green
} else {
    Write-Host "[Mode: Universal Node.js] Executing seed.mjs directly via Node.js..." -ForegroundColor Yellow
    node "$PSScriptRoot\seed.mjs"
}
