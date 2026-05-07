param(
    [string]$TaskName = "AI_Power_AutoRetrain_7Days",
    [string]$StartTime = "02:00"
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path ".").Path
$runScript = Join-Path $projectRoot "scripts\run_auto_retrain.ps1"

if (-not (Test-Path $runScript)) {
    Write-Error "Script not found: $runScript"
}

$action = "powershell.exe -ExecutionPolicy Bypass -File ""$runScript"""

schtasks /Create /TN $TaskName /SC WEEKLY /MO 1 /D SUN /ST $StartTime /TR $action /F
if ($LASTEXITCODE -ne 0) {
    throw "Failed to register scheduled task (exit code: $LASTEXITCODE)."
}

Write-Host "Registered task: $TaskName"
Write-Host "Schedule: weekly every Sunday at $StartTime"
Write-Host "Run command: $action"
