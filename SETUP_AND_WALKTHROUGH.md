# MediKiosk — New PC Setup Guide & Complete System Walkthrough

> **Smart India Hackathon (SIH) 2026 — Problem Statement PS 26047: Patient Case-Taking Software**  
> AI-Powered Multilingual Hospital Patient Intake Kiosk + Doctor EMR Platform

---

## 1. Overview & Architecture

**MediKiosk** is an intelligent, bilingual clinical history-taking kiosk and Doctor Electronic Medical Record (EMR) platform designed for high-volume Outpatient Departments (OPDs) in Indian public hospitals.

```
       +-------------------------------------------------------------+
       |               PATIENT INTAKE KIOSK (React 19)               |
       |  - Bilingual (EN, HI, MR)       - ABHA / Manual Identity    |
       |  - Voice Intake (Bhashini/Mock) - Clinical Case Taking      |
       |  - AYUSH Prakriti Assessment    - Document Scan / Upload    |
       +------------------------------+------------------------------+
                                      |
                         HTTP / REST  | (JSON + Multipart)
                                      v
       +-------------------------------------------------------------+
       |               BACKEND API GATEWAY (FastAPI)                 |
       |  - Multilingual Clinical Engine - Deterministic Red-Flags   |
       |  - Live Gemini / Mock Provider  - Bhashini STT Provider     |
       |  - Daily Token Allocator        - Doctor JWT Authentication |
       |  - Full Encounter Lifecycle     - Audit Event Trail         |
       +-----------------+----------------------------+--------------+
                         |                            |
            SQLAlchemy 2.0 / asyncpg             MinIO Python SDK
                         v                            v
       +---------------------------------+  +------------------------+
       |      PostgreSQL 16 Database     |  | MinIO Object Storage   |
       | (Patients, Visits, Encounters,  |  | (Scanned Prescriptions,|
       |  Consent, Turns, AYUSH, Notes)  |  |  Lab Reports, Audio)   |
       +---------------------------------+  +------------------------+
                                      ^
                                      | Authenticated REST / JWT
       +------------------------------+------------------------------+
       |               DOCTOR EMR PORTAL (React 19)                  |
       |  - Real-Time OPD Queue          - Structured Case History   |
       |  - Red-Flag Safety Alerts       - AYUSH Clinical Assessment |
       |  - Document Viewer (Presigned)  - Rx & Final Consultation   |
       +-------------------------------------------------------------+
```

---

## 2. Tools & Dependency Matrix (Exact Versions)

The table below lists every tool, library, and runtime verified on this project.

### 2.1 System Runtimes & Infrastructure

| Tool / Runtime | Required / Tested Version | Purpose |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11, macOS 13+, Ubuntu 22.04+ | Host operating system |
| **Git** | `2.40.0+` | Source code version control |
| **Python** | `3.11.x` (Tested with `3.11.9`) | Backend runtime (`3.11+` recommended) |
| **Node.js** | `20.x` or `22.x` LTS (Tested `v20.18+` / `v22+`) | Frontend JavaScript runtime |
| **npm** | `10.x+` | Frontend package manager |
| **Docker & Docker Compose** | Docker Desktop `4.25+` / Compose `v2.x` | Orchestrates PostgreSQL & MinIO |
| **PostgreSQL** | `16-alpine` (via Docker image) | Relational database |
| **MinIO** | `latest` (quay.io/minio/minio) | S3-compatible medical document storage |

---

### 2.2 Backend Python Dependencies (`requirements.txt`)

| Package | Version Specifier | Exact Tested | Purpose |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.115.0, <1.0.0` | `0.115.6` | Asynchronous REST API framework |
| `uvicorn[standard]` | `>=0.32.0, <1.0.0` | `0.32.1` | High-performance ASGI web server |
| `pydantic` | `>=2.10.0, <3.0.0` | `2.10.4` | Data validation and serialization |
| `pydantic-settings` | `>=2.6.0, <3.0.0` | `2.7.0` | Type-safe environment variable management |
| `sqlalchemy` | `>=2.0.36, <3.0.0` | `2.0.36` | Async ORM & query builder |
| `alembic` | `>=1.14.0, <2.0.0` | `1.14.0` | Relational database schema migrations |
| `asyncpg` | `>=0.30.0, <1.0.0` | `0.30.0` | High-speed async PostgreSQL driver |
| `psycopg[binary]` | `>=3.2.0, <4.0.0` | `3.2.3` | Sync PostgreSQL driver for Alembic |
| `minio` | `>=7.2.10, <8.0.0` | `7.2.12` | Object storage client for document PDFs/images |
| `python-multipart` | `>=0.0.18` | `0.0.20` | Multipart form-data parser for file uploads |
| `httpx` | `>=0.28.0, <1.0.0` | `0.28.1` | Async HTTP client for Bhashini & Gemini APIs |
| `PyJWT` | `>=2.8.0, <3.0.0` | `2.10.1` | JSON Web Token encoding and verification |
| `argon2-cffi` | `>=23.1.0, <26.0.0` | `23.1.0` | Password hashing for doctor authentication |
| `pytest` | `>=8.3.0, <9.0.0` | `8.3.4` | Automated testing framework |
| `pytest-asyncio` | `>=0.24.0, <1.0.0` | `0.24.0` | Async testing fixture support |
| `aiosqlite` | `>=0.20.0, <1.0.0` | `0.20.0` | In-memory SQLite async driver for unit tests |

---

### 2.3 Frontend Dependencies (`package.json`)

| Package | Version Specifier | Purpose |
| :--- | :--- | :--- |
| `react` | `^19.2.8` | UI view library |
| `react-dom` | `^19.2.8` | DOM renderer for React 19 |
| `react-router-dom` | `^7.18.3` | Client-side routing (Kiosk & Doctor EMR) |
| `@tanstack/react-query` | `^5.103.1` | Server state management and queue polling |
| `tailwindcss` | `^4.3.3` | Utility-first CSS framework (v4 engine) |
| `@tailwindcss/vite` | `^4.3.3` | Tailwind CSS Vite plugin |
| `lucide-react` | `^1.41.0` | Modern medical & UI iconography |
| `react-hook-form` | `^7.87.0` | Touchscreen form management |
| `@hookform/resolvers` | `^5.9.1` | Form schema validation resolver |
| `zod` | `^4.6.5` | TypeScript-first schema validation |
| `nanoid` | `^6.0.1` | Client-side unique ID generation |
| `vite` | `^8.2.2` | Ultra-fast frontend build tool and dev server |
| `typescript` | `~6.0.2` | Static type checking |

---

## 3. Step-by-Step Installation on a Fresh PC

Follow these instructions in order to get the entire project up and running from a fresh machine.

### Step 1: Install System Prerequisites

1. **Git**: Download and install from [git-scm.com](https://git-scm.com/).
2. **Python 3.11**:
   - Download Python 3.11.x (e.g. 3.11.9) from [python.org](https://www.python.org/downloads/).
   - **IMPORTANT (Windows):** Check the box **"Add python.exe to PATH"** during installation.
3. **Node.js (LTS)**:
   - Download Node.js v20 or v22 LTS from [nodejs.org](https://nodejs.org/).
   - Ensure `node` and `npm` are accessible in your terminal (`node -v`, `npm -v`).
4. **Docker Desktop**:
   - Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).
   - Install and launch Docker Desktop.
   - Ensure the Docker daemon is running (whale icon in system tray).

---

### Step 2: Clone or Copy the Repository

Open a terminal (PowerShell, Command Prompt, or Bash) and navigate to your desired workspace directory:

```bash
# Clone the repository
git clone <your-repo-url> MediKiosk
cd MediKiosk
```

---

### Step 3: Configure Environment Variables (`.env`)

#### 3.1 Backend `.env` Setup
Navigate into `medikiosk-backend` and copy the example configuration:

```bash
cd medikiosk-backend
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux / macOS / Git Bash:
cp .env.example .env
```

Review your `medikiosk-backend/.env`. The defaults are preconfigured for local Docker infrastructure:

```ini
# ========================================================
# MediKiosk Backend Configuration (.env)
# ========================================================
APP_NAME="MediKiosk Core API"
APP_ENV=development
DEBUG=true
API_V1_PREFIX=/api/v1

# Database Configuration (matches docker-compose.yml)
POSTGRES_PORT=5433
DATABASE_URL=postgresql+asyncpg://postgres:postgrespassword@localhost:5433/medikiosk
DATABASE_URL_SYNC=postgresql+psycopg://postgres:postgrespassword@localhost:5433/medikiosk

# Security & JWT Token Signing
JWT_SECRET_KEY=medikiosk-development-super-secret-key-for-jwt-signing-2026-sih
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=720

# MinIO Object Storage (matches docker-compose.yml)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadminpassword
MINIO_BUCKET=medikiosk-documents
MINIO_SECURE=false

# --------------------------------------------------------
# Provider Toggles: "mock" (Offline) vs "bhashini" / "gemini" (Live)
# --------------------------------------------------------
SPEECH_PROVIDER=mock
AI_PROVIDER=mock

# Live Bhashini ASR (Optional - only needed if SPEECH_PROVIDER=bhashini)
BHASHINI_USER_ID=
BHASHINI_API_KEY=
BHASHINI_PIPELINE_ID=
BHASHINI_INFERENCE_URL=https://dhruva-api.bhashini.gov.in/services/inference/pipeline
BHASHINI_ASR_TIMEOUT_SECONDS=15.0

# Live Google Gemini AI (Optional - only needed if AI_PROVIDER=gemini)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TIMEOUT_SECONDS=20.0

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173","http://127.0.0.1:3000"]
```

> [!NOTE]
> **Zero API Keys Required for Full Functionality:**
> When `SPEECH_PROVIDER=mock` and `AI_PROVIDER=mock`, the system runs 100% offline with built-in realistic mock speech recognition and deterministic clinical entity extraction. You do not need any external paid credentials to run, test, or demo MediKiosk.

#### 3.2 Frontend `.env` Setup
Navigate into `medikiosk-frontend` and create `.env`:

```bash
cd ../medikiosk-frontend
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux / macOS / Git Bash:
cp .env.example .env
```

Contents of `medikiosk-frontend/.env`:
```ini
VITE_API_URL=http://localhost:8000/api/v1
```

---

### Step 4: Start Infrastructure Services (PostgreSQL & MinIO)

In `medikiosk-backend`:

```bash
docker compose up -d
```

Verify containers are healthy:
```bash
docker ps
```
You should see:
- `medikiosk_postgres` running on port `5433->5432`
- `medikiosk_minio` running on ports `9000` (API) and `9001` (Web Console)

---

### Step 5: Backend Setup & Database Migration

1. **Create Python Virtual Environment**:
   ```bash
   cd medikiosk-backend
   python -m venv .venv
   ```

2. **Activate the Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
     *(If script execution is disabled, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
   - **Windows (Command Prompt)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Apply Database Migrations (Alembic)**:
   ```bash
   alembic upgrade head
   ```
   This creates all PostgreSQL tables (`patients`, `patient_identities`, `encounters`, `consent_records`, `clinical_cases`, `clinical_turns`, `ayush_assessments`, `documents`, `queue_entries`, `consultations`, `audit_events`, `hospital_settings`, `users`).

5. **Seed Default Doctor & Hospital Settings**:
   ```bash
   python -m app.db.seed
   ```
   Output will display:
   ```
   ========================================================
   MEDIKIOSK DEVELOPMENT SEED COMPLETE
   Doctor Username: dr.priya
   Doctor Password: DoctorPass123!
   Role:            DOCTOR
   ========================================================
   ```

---

### Step 6: Frontend Setup

Open a new terminal in the `medikiosk-frontend` folder:

```bash
cd medikiosk-frontend
npm install
```

---

## 4. Running the Complete Platform

You have two convenient ways to start MediKiosk:

### Option A: One-Click Startup Script (Recommended)

From the project root directory (`MediKiosk/`):

- **On Windows**:
  Double-click `start_all.bat` or run:
  ```cmd
  start_all.bat
  ```
- **On Linux / macOS**:
  ```bash
  chmod +x start_all.sh
  ./start_all.sh
  ```

This script will automatically:
1. Start PostgreSQL and MinIO in Docker.
2. Run database migrations (`alembic upgrade head`).
3. Seed the default doctor account (`python -m app.db.seed`).
4. Launch the FastAPI backend on `http://localhost:8000`.
5. Launch the Vite React frontend on `http://localhost:5173`.

---

### Option B: Manual Multi-Terminal Startup

If you prefer starting each service manually:

#### Terminal 1 — Infrastructure (Docker)
```bash
cd medikiosk-backend
docker compose up -d
```

#### Terminal 2 — Backend API (FastAPI)
```bash
cd medikiosk-backend
# Windows:
.\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Linux/macOS:
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 3 — Frontend Kiosk & EMR (Vite)
```bash
cd medikiosk-frontend
npm run dev
```

---

## 5. Port & Access Directory

| Application / Service | URL / Port | Credentials / Notes |
| :--- | :--- | :--- |
| **Patient Kiosk Portal** | [http://localhost:5173/patient](http://localhost:5173/patient) | Touchscreen patient intake workflow |
| **Doctor EMR Portal** | [http://localhost:5173/doctor](http://localhost:5173/doctor) | Login: `dr.priya` / `DoctorPass123!` |
| **Backend Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API exploration & test console |
| **Backend ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean API reference documentation |
| **Backend Health Check** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | Returns API and environment health |
| **MinIO Web Console** | [http://localhost:9001](http://localhost:9001) | User: `minioadmin` / Pass: `minioadminpassword` |
| **PostgreSQL Database** | `localhost:5433` | User: `postgres` / Pass: `postgrespassword` / DB: `medikiosk` |

---

## 6. Verification & Automated Testing

To ensure 100% correctness on your new PC, run the verification suites:

### 6.1 Backend Pytest Suite (133 Tests)
In `medikiosk-backend`:

```bash
# Run all tests
pytest -v

# Run Stage 8 persistence lifecycle tests specifically
pytest tests/test_stage8_persistence_lifecycle.py -v
```

Expected output:
```
====================== 133 passed in 12.87s =======================
```

### 6.2 Frontend TypeScript Check
In `medikiosk-frontend`:

```bash
npx tsc --noEmit
```
Expected output: 0 errors (clean exit).

### 6.3 Frontend Production Build
In `medikiosk-frontend`:

```bash
npm run build
```
Expected output: Production bundle built in `dist/` successfully.

---

## 7. Complete Patient-to-Doctor Clinical Journey Walkthrough

Here is how the end-to-end clinical intake and doctor consultation works:

### Patient Kiosk Flow:
1. **Language Selection**: Choose **English**, **Hindi (हिन्दी)**, or **Marathi (मराठी)**.
2. **Identification**:
   - Option A: Enter ABHA ID / Phone number for quick lookup.
   - Option B: Register as new patient (Name, Age, Gender, Phone) using on-screen numpad.
3. **Informed Consent**: Read DPDP / ABDM consent terms (Voice data, symptom review, physician sharing) and tap **"I Consent / Agree"**.
4. **Chief Complaint & Voice Intake**:
   - Speak into microphone or tap preset complaints (e.g. Fever, Abdominal Pain, Cough).
   - Conversational AI asks dynamic clarifying clinical questions (Duration, Severity, Location, Associated Symptoms).
5. **AYUSH Assessment**:
   - Complete Prakriti constitutional questionnaire (Body frame, skin texture, digestion, sleep).
   - System deterministically calculates *Vata / Pitta / Kapha* score profile.
6. **Medical Documents**:
   - Scan or upload previous paper prescriptions / lab reports (or tap Skip).
7. **Summary Review & Submission**:
   - Patient reviews extracted summary.
   - Tap **"Submit & Generate OPD Slip"**.
   - Backend atomically allocates a sequential daily token (e.g., `A-001`) and records the complete encounter lifecycle.

---

### Doctor EMR Flow:
1. **Doctor Login**:
   - Open `http://localhost:5173/doctor`.
   - Log in with `dr.priya` / `DoctorPass123!`.
2. **Live OPD Queue**:
   - Real-time queue displays waiting patients sorted by priority (Emergency red flags ranked top with Red badge, followed by standard tokens).
   - Click **"Call Patient"** or **"Open Consultation"**.
3. **Consultation Record Review**:
   - **Chief Complaint & Clinical History**: Patient-stated complaint, duration, severity, location.
   - **Conversation Turns**: Verbatim transcript of voice intake in regional language + English translation.
   - **AYUSH Analysis**: Patient's Prakriti distribution (*Vata/Pitta/Kapha*) and doctor inputs for *Vikriti, Agni, Koshtha*.
   - **Uploaded Documents**: View attached historical prescriptions with secure, temporary presigned download URLs.
   - **Deterministic Safety Alerts**: Red-flag indicators highlighted clearly.
4. **Doctor Findings & Prescription**:
   - Enter clinical notes, final diagnosis, and prescription medications.
   - Tap **"Save Draft"** or **"Finalize Consultation"**.
5. **Persistence Verification**:
   - Reload the page: All notes, prescription, and COMPLETED status remain persistently retrieved from PostgreSQL.
   - An immutable audit trail is recorded for every stage.

---

## 8. Troubleshooting & FAQ

### Q1: `docker: command not found` or `Cannot connect to the Docker daemon`
**Fix**: Ensure Docker Desktop is installed and started. Check that Docker Desktop settings have **"Use the WSL 2 based engine"** enabled on Windows.

### Q2: Port 5433 is already in use
**Fix**: If you already have a local PostgreSQL running on port 5433, change `POSTGRES_PORT` in both `medikiosk-backend/.env` and `medikiosk-backend/docker-compose.yml` to another port (e.g., `5434`), then update `DATABASE_URL` in `.env` accordingly.

### Q3: Python `scripts execution is disabled on this system` in PowerShell
**Fix**: Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Or simply run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Q4: How do I switch to Live Gemini AI or Live Bhashini Speech?
**Fix**: In `medikiosk-backend/.env`:
1. Change `AI_PROVIDER=gemini` and set `GEMINI_API_KEY=AIzaSy...`
2. Change `SPEECH_PROVIDER=bhashini` and set `BHASHINI_USER_ID`, `BHASHINI_API_KEY`, and `BHASHINI_PIPELINE_ID`.
3. Restart the backend server.
*(If keys are missing or invalid, MediKiosk automatically falls back to offline mock mode with zero downtime).*

### Q5: How do I reset the database to a clean state?
**Fix**:
```bash
cd medikiosk-backend
docker compose down -v
docker compose up -d
alembic upgrade head
python -m app.db.seed
```
