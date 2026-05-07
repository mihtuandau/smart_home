$ErrorActionPreference = "Stop"

$python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "Python in .venv not found. Please create/activate .venv first."
}

& $python -m streamlit run dashboard\streamlit_app.py
