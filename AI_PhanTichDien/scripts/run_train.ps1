$ErrorActionPreference = "Stop"

$python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "Python in .venv not found. Please create/activate .venv first."
}

function Invoke-Step([string]$Cmd, [string[]]$Args) {
    & $Cmd @Args
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $Cmd $($Args -join ' ')"
    }
}

Invoke-Step -Cmd $python -Args @("src\data\preprocess.py", "--config", "configs\config.yaml")
Invoke-Step -Cmd $python -Args @("src\models\train_kmeans.py", "--config", "configs\config.yaml")
Invoke-Step -Cmd $python -Args @("src\models\train_isolation_forest.py", "--config", "configs\config.yaml")
Invoke-Step -Cmd $python -Args @("src\models\build_training_history_plot.py", "--config", "configs\config.yaml")

Write-Host "Train pipeline completed."
