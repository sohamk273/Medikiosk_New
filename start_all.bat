@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo Starting MediKiosk Platform (Frontend + Backend + Infra)
echo ========================================================

set SCRIPT_DIR=%~dp0

echo [1/4] Checking Docker Infrastructure...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set PATH=C:\Program Files\Docker\Docker\resources\bin;!PATH!
    ) else if exist "%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe" (
        set PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;!PATH!
    )
)

cd /d "%SCRIPT_DIR%medikiosk-backend"
echo Starting PostgreSQL & MinIO via Docker Compose...
docker compose up -d

echo [2/4] Running Database Migrations & Seeding...
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -m alembic upgrade head
    .venv\Scripts\python.exe -m app.db.seed
) else (
    echo Virtual environment not found in medikiosk-backend\.venv! Please create .venv first.
)

echo [3/4] Launching FastAPI Backend Server (Port 8000)...
start "MediKiosk Backend (Port 8000)" cmd /k "cd /d \"%SCRIPT_DIR%medikiosk-backend\" ^&^& .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [4/4] Launching React Kiosk & EMR (Port 5173)...
start "MediKiosk Frontend (Port 5173)" cmd /k "cd /d \"%SCRIPT_DIR%medikiosk-frontend\" ^&^& npm run dev"

echo.
echo ========================================================
echo MediKiosk Platform is Running!
echo.
echo Patient Kiosk Portal: http://localhost:5173/patient
echo Doctor EMR Portal:    http://localhost:5173/doctor
echo Backend Swagger Docs: http://localhost:8000/docs
echo MinIO Web Console:    http://localhost:9001 (minioadmin / minioadminpassword)
echo.
echo Default Doctor Credentials:
echo   Username: dr.priya
echo   Password: DoctorPass123!
echo ========================================================
