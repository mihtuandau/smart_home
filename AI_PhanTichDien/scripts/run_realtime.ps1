$ErrorActionPreference = "Stop"

$python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "Python in .venv not found. Please create/activate .venv first."
}

Write-Host "Run in terminal 1 (consumer):"
Write-Host "$python src\realtime\mqtt_consumer.py --config configs\config.yaml"
Write-Host ""
Write-Host "Run in terminal 2 (alert subscriber):"
Write-Host "$python src\realtime\alert_subscriber.py --config configs\config.yaml --output_csv logs\alerts_history.csv"
Write-Host ""
Write-Host "Run in terminal 3 (simulator publisher):"
Write-Host "$python src\realtime\mqtt_publisher_simulator.py --config configs\config.yaml --input_csv data\processed\smart_home_processed.csv --limit 20 --interval_sec 1"
