# MediKiosk Backend — Stage 1 Foundation

**SIH 2026 — Problem Statement 26047**  
Smart Multilingual Health Kiosk & Doctor EMR System

---

## 1. Architectural Boundaries

- **PostgreSQL:** The authoritative source of truth for all structured application and clinical records (Users, Patients, Identies, Encounters, Queue Entries, Consents, Hospital Settings).
- **MinIO:** The authoritative object storage for raw binary artifacts (medical documents, scanned prescriptions, lab PDFs, audio recordings, and generated clinical reports). PostgreSQL stores only metadata and object keys.
- **Redis:** Intentionally **not** included. Queue management and patient states are stored and indexed directly in PostgreSQL. Initial realtime synchronization relies on standard HTTP polling.
- **External AI & Integration Providers:** Bhashini (voice), Gemini (clinical AI), PaddleOCR (document extraction), and ABDM/FHIR are future external adapters isolated behind pluggable provider interfaces.

---

## 2. Prerequisites & Technology Stack

- **Python:** 3.11+
- **Framework:** FastAPI 0.115+
- **ASGI Server:** Uvicorn
- **ORM:** SQLAlchemy 2.0+ (asyncpg for runtime, psycopg for Alembic)
- **Migrations:** Alembic 1.14+
- **Object Storage:** MinIO Python SDK 7.2+
- **Settings & Validation:** Pydantic v2 & Pydantic Settings
- **Test Suite:** pytest, pytest-asyncio, aiosqlite, httpx

---

## 3. Local Infrastructure Setup (Docker Compose)

To start PostgreSQL 16 and MinIO locally:

```bash
cd medikiosk-backend
docker-compose up -d
```

Services exposed:
- **PostgreSQL 16:** `localhost:5432` (User: `postgres`, Password: `postgrespassword`, DB: `medikiosk`)
- **MinIO API:** `localhost:9000`
- **MinIO Console:** `http://localhost:9001` (User: `minioadmin`, Password: `minioadminpassword`)

---

## 4. Local Python Environment Setup

```bash
cd medikiosk-backend

# 1. Create and activate a Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
```

---

## 5. Database Migrations

Apply Alembic migrations to create the initial database schema:

```bash
# Apply migrations to latest revision
alembic upgrade head

# Revert last migration (if needed)
alembic downgrade -1
```

---

## 6. Running the FastAPI Application

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 7. Health Endpoints

- **`GET /health`**: Liveness probe returning process status and environment:
  ```json
  {
    "status": "ok",
    "app": "MediKiosk Core API",
    "version": "0.1.0",
    "environment": "development"
  }
  ```
- **`GET /health/ready`**: Deep readiness probe verifying database connectivity and MinIO object storage reachability:
  ```json
  {
    "status": "ready",
    "components": {
      "database": {
        "status": "healthy",
        "latency_ms": 1.42,
        "details": { "type": "PostgreSQL" }
      },
      "storage": {
        "status": "healthy",
        "latency_ms": 5.18,
        "details": { "provider": "MinIO", "bucket": "medikiosk-documents" }
      }
    }
  }
  ```

---

## 8. Running Automated Tests

All tests run in-memory using `aiosqlite` and mock storage providers, requiring no running background services:

```bash
pytest tests/ -v
```

---

## 9. Development Seeding (Development Only)

> [!NOTE]
> Synthetic demo patient data (e.g. Rameshwar Patil) is intentionally not auto-seeded into production startups. Development test records can be populated through automated tests or an explicit staging seed command.
