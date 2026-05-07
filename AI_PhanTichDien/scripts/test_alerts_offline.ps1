param(
    [int]$Limit = 30,
    [string]$InputCsv = "data/processed/smart_home_processed.csv",
    [string]$ConfigPath = "configs/config.yaml"
)

$ErrorActionPreference = "Stop"

$python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "Python in .venv not found. Please create/activate .venv first."
}
if (-not (Test-Path $InputCsv)) {
    Write-Error "Input CSV not found: $InputCsv"
}
if (-not (Test-Path $ConfigPath)) {
    Write-Error "Config file not found: $ConfigPath"
}

$env:PYTHONIOENCODING = "utf-8"
$env:APP_CONFIG_PATH = $ConfigPath
$env:APP_INPUT_CSV = $InputCsv
$env:APP_LIMIT = "$Limit"
$env:APP_PROJECT_ROOT = (Get-Location).Path

$tempPy = Join-Path $env:TEMP "test_alerts_offline_tmp.py"

@'
import os
import sys
import pandas as pd
import yaml

project_root = os.environ["APP_PROJECT_ROOT"]
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.models.predict import PowerInferenceService
from src.rules.advice_engine import generate_advice

config_path = os.environ["APP_CONFIG_PATH"]
input_csv = os.environ["APP_INPUT_CSV"]
limit = int(os.environ["APP_LIMIT"])

with open(config_path, "r", encoding="utf-8") as f:
    cfg = yaml.safe_load(f)

service = PowerInferenceService(config_path)
df = pd.read_csv(input_csv).head(limit)

alert_count = 0
anomaly_count = 0

for i, row in df.iterrows():
    payload = row.to_dict()
    result = service.predict_one(payload)
    result["is_hourly_baseline_anomaly"] = False
    result["hourly_baseline_mean_mw"] = None

    advice = generate_advice(payload, result, cfg["rules"])
    has_alert = bool(advice["alerts"])
    is_anomaly = bool(result["is_anomaly"])

    if has_alert or is_anomaly:
        if has_alert:
            alert_count += 1
        if is_anomaly:
            anomaly_count += 1
        print(f"--- Row {i} ---")
        print(f"Anomaly: {is_anomaly} | Score: {result['anomaly_score']:.6f} | Cluster: {result['cluster_id']}")
        if advice["alerts"]:
            print("Alerts:")
            for a in advice["alerts"]:
                print(f"  - {a}")
        if advice["recommendations"]:
            print("Recommendations:")
            for r in advice["recommendations"]:
                print(f"  - {r}")
        print("")

print("========== Summary ==========")
print(f"Checked rows: {len(df)}")
print(f"Rows with alerts: {alert_count}")
print(f"Rows flagged anomaly: {anomaly_count}")
'@ | Set-Content -Path $tempPy -Encoding UTF8

try {
    & $python $tempPy
}
finally {
    if (Test-Path $tempPy) {
        Remove-Item -LiteralPath $tempPy -Force
    }
}
