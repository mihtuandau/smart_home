$ErrorActionPreference = "Stop"

$python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "Python in .venv not found. Please create/activate .venv first."
}

& $python src\models\auto_retrain.py --config configs\config.yaml
