# Run the Smart Personal Routine Reminder API (Windows PowerShell)
# Requires: PostgreSQL running on localhost with DB smart_routines and user app_user/app_password
# Optional: Start DB with Docker: docker compose up -d db

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

# Use venv in backend
$venvScript = Join-Path $ProjectRoot "backend\.venv\Scripts\Activate.ps1"
if (-not (Test-Path $venvScript)) {
    Write-Host "Creating virtual environment..."
    python -m venv backend\.venv
}
& $venvScript

# Install deps if needed
pip install -q -r backend\requirements.txt

# Run migrations (PostgreSQL must be running)
Write-Host "Running database migrations..."
$env:POSTGRES_SERVER = "localhost"
$env:PYTHONPATH = $ProjectRoot
alembic -c backend/alembic.ini upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed. Is PostgreSQL running? Start it with: docker compose up -d db" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting API at http://localhost:8000"
Write-Host "Docs: http://localhost:8000/docs"
$env:PYTHONPATH = $ProjectRoot
uvicorn backend.app.main:app --reload --app-dir .
