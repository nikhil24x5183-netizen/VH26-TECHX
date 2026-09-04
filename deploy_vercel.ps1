# Vercel Deployment Helper Script
param(
    [string]$Token = $env:VERCEL_TOKEN
)

$ErrorActionPreference = "Stop"

$nodeDir = "C:\Users\ajnky\.local\node\node-v20.18.0-win-x64"
$env:Path = "$nodeDir;" + $env:Path

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Deploying Troubleshooting Assistant to Vercel..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Ensure precomputed knowledge base is fresh
Write-Host "[1/2] Verifying precomputed knowledge base..." -ForegroundColor Green
& ".\.venv\Scripts\python.exe" -m src.ingestion.export_vercel_data

# 2. Deploy via Vercel CLI
Write-Host "[2/2] Running Vercel deployment..." -ForegroundColor Green
if ($Token) {
    & "$nodeDir\npx.cmd" --yes vercel --prod --token $Token --yes
} else {
    Write-Host "Note: No VERCEL_TOKEN supplied. Running interactive vercel login..." -ForegroundColor Yellow
    & "$nodeDir\npx.cmd" --yes vercel --prod
}
