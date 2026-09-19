@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo Starting MediKiosk Platform (Frontend + Backend + QR Upload + Infra)
echo ========================================================

set SCRIPT_DIR=%~dp0

echo [1/6] Checking Docker Infrastructure...
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

echo [2/6] Running Database Migrations & Seeding...
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -m alembic upgrade head
    .venv\Scripts\python.exe -m app.db.seed
) else (
    echo Virtual environment not found in medikiosk-backend\.venv! Please create .venv first.
)

echo [3/6] Launching MediKiosk Backend API (Port 8000)...
start "MediKiosk Backend (Port 8000)" cmd /k "cd /d \"%SCRIPT_DIR%medikiosk-backend\" ^&^& .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [4/6] Launching QR Upload Microservice Backend (Port 8010)...
start "QR Upload Backend (Port 8010)" cmd /k "cd /d \"%SCRIPT_DIR%kiosk-upload-module\backend\" ^&^& ..\..\medikiosk-backend\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8010 --reload"

echo [5/6] Launching QR Mobile Upload Web Portal (Port 5174)...
start "QR Mobile Upload Frontend (Port 5174)" cmd /k "cd /d \"%SCRIPT_DIR%kiosk-upload-module\frontend\" ^&^& npm run dev -- --port 5174 --host"

echo [6/6] Launching React Kiosk & Doctor EMR (Port 5173)...
start "MediKiosk Frontend (Port 5173)" cmd /k "cd /d \"%SCRIPT_DIR%medikiosk-frontend\" ^&^& npm run dev"

echo.
echo ========================================================
echo MediKiosk Platform is Running!
echo.
echo Patient Kiosk Portal:    http://localhost:5173/patient
echo Doctor EMR Portal:       http://localhost:5173/doctor
echo QR Mobile Upload Portal: http://localhost:5174
echo Backend Swagger Docs:    http://localhost:8000/docs
echo QR Backend Swagger Docs: http://localhost:8010/docs
echo MinIO Web Console:       http://localhost:9001 (minioadmin / minioadminpassword)
echo.
echo Default Doctor Credentials:
echo   Username: dr.priya
echo   Password: DoctorPass123!
echo ========================================================
