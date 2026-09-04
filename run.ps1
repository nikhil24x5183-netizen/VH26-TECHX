# Windows one-command startup script
$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Starting Factory Floor RAG Troubleshooting Assistant..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Virtual environment not found. Setting up..." -ForegroundColor Yellow
    python -m venv ".venv" --system-site-packages
}

# Check if manuals and index exist; if not, build them
$dbDir = Join-Path $scriptDir "data\chroma_db"
if (-not (Test-Path $dbDir)) {
    Write-Host "[1/3] Generating synthetic manuals and building knowledge base..." -ForegroundColor Green
    & $venvPython -m src.generator.create_manuals
    & $venvPython -m src.ingestion.build_index
}

Write-Host "[2/3] Starting FastAPI backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath $venvPython -ArgumentList "-m uvicorn src.api.app:app --host 127.0.0.1 --port 8000" -PassThru

Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Streamlit UI on http://localhost:8501..." -ForegroundColor Green
& $venvPython -m streamlit run ui/app.py --server.port 8501

Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
