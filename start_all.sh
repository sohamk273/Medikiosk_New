#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================"
echo "Starting MediKiosk Platform (Frontend + Backend + Infra)"
echo "========================================================"

echo "[1/4] Starting PostgreSQL & MinIO via Docker Compose..."
cd "$SCRIPT_DIR/medikiosk-backend"
docker compose up -d

echo "[2/4] Running Database Migrations & Seeding..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
    alembic upgrade head
    python -m app.db.seed
else
    echo "Virtual environment .venv not found in medikiosk-backend. Please create one."
fi

echo "[3/4] Launching Backend Server in background (Port 8000)..."
cd "$SCRIPT_DIR/medikiosk-backend"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[4/4] Launching Frontend Development Server (Port 5173)..."
cd "$SCRIPT_DIR/medikiosk-frontend"
npm run dev

kill $BACKEND_PID 2>/dev/null || true
