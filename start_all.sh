#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================"
echo "Starting MediKiosk Platform (Frontend + Backend + QR Upload + Infra)"
echo "========================================================"

echo "[1/6] Starting PostgreSQL & MinIO via Docker Compose..."
cd "$SCRIPT_DIR/medikiosk-backend"
docker compose up -d

echo "[2/6] Running Database Migrations & Seeding..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
    alembic upgrade head
    python -m app.db.seed
else
    echo "Virtual environment .venv not found in medikiosk-backend. Please create one."
fi

echo "[3/6] Launching MediKiosk Backend API (Port 8000)..."
cd "$SCRIPT_DIR/medikiosk-backend"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[4/6] Launching QR Upload Microservice Backend (Port 8010)..."
cd "$SCRIPT_DIR/kiosk-upload-module/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload &
QR_BACKEND_PID=$!

echo "[5/6] Launching QR Mobile Upload Web Portal (Port 5174)..."
cd "$SCRIPT_DIR/kiosk-upload-module/frontend"
npm run dev -- --port 5174 --host &
QR_FRONTEND_PID=$!

echo "[6/6] Launching React Kiosk & Doctor EMR (Port 5173)..."
cd "$SCRIPT_DIR/medikiosk-frontend"
npm run dev

kill $BACKEND_PID $QR_BACKEND_PID $QR_FRONTEND_PID 2>/dev/null || true
