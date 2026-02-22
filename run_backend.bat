@echo off
REM Run the Smart Personal Routine Reminder API
REM Need PostgreSQL running (or: docker compose up -d db)

cd /d "%~dp0"

if not exist "backend\.venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv backend\.venv
)
call backend\.venv\Scripts\activate.bat

pip install -q -r backend\requirements.txt

echo Running database migrations...
set POSTGRES_SERVER=localhost
set PYTHONPATH=%~dp0
alembic -c backend/alembic.ini upgrade head
if errorlevel 1 (
    echo Migration failed. Is PostgreSQL running? Start with: docker compose up -d db
    pause
    exit /b 1
)

echo.
echo Starting API at http://localhost:8000
echo Docs: http://localhost:8000/docs
echo.
set PYTHONPATH=%~dp0
uvicorn backend.app.main:app --reload --app-dir .
pause
