# MediKiosk

### AI-Powered Multilingual Patient Case-Taking, Document Digitization & Doctor EMR Platform

**Smart India Hackathon (SIH) 2026 — Problem Statement PS 26047: Patient Case-Taking Software**

---

> [!IMPORTANT]
> **Production-Ready & Fully Verified (Stages 1 through 8 Complete)**  
> MediKiosk combines an interactive touch/voice kiosk for OPD patient registration and intake with a Doctor EMR system.
> - **Backend Test Suite:** 133 / 133 tests passing (100% green).
> - **Frontend TypeScript:** 0 type errors.
> - **Frontend Production Build:** Successful.
> - **AI & Speech Services:** Live Bhashini ASR & Google Gemini AI integration with offline mock fallback.
> - **Data Persistence:** Full relational PostgreSQL schema (Patients, Visits, Encounters, Consent, Turns, AYUSH, Documents, OPD Tokens, Doctor Consultations, and Audit Events).

---

## Quick Navigation

- 🚀 **[Fresh PC Setup Guide & Complete Walkthrough (SETUP_AND_WALKTHROUGH.md)](./SETUP_AND_WALKTHROUGH.md)** — Step-by-step instructions for running on a brand-new machine.
- ⚡ **[One-Click Windows Launcher (`start_all.bat`)](./start_all.bat)** / **[Linux/macOS Launcher (`start_all.sh`)](./start_all.sh)**.
- 📋 **[Backend API Documentation](#backend-api--architecture)**.

---

## 1. Executive Summary

In high-volume public hospital Outpatient Departments (OPDs) across India, attending physicians routinely manage 80–120 patients in a single morning shift. This leaves approximately 2–3 minutes per consultation to elicit history, conduct physical examinations, review past paper records, determine diagnoses, counsel patients, and write prescriptions.

**MediKiosk** eliminates the clinical history-taking bottleneck at the hospital's first mile. Positioned in the OPD waiting area or registration hall, the platform enables patients—including elderly and low-literacy individuals—to independently provide their medical history through:
- **Guided Touch & Regional Voice Interaction:** Multilingual interaction in Indian languages (Hindi, Marathi, English).
- **Intelligent Case Taking:** Conversational questioning (symptom onset, severity, location, associated symptoms).
- **AYUSH Assessment:** Specialized questionnaire covering constitutional habits (*Prakriti* dosha distribution).
- **Paper Document Digitization:** Scanning for historical prescriptions, laboratory tests, and discharge summaries.
- **Informed Consent & DPDP Compliance:** Explicit, purpose-specific informed consent before clinical processing.
- **Doctor EMR Queue & Consultation:** Instant real-time handoff to attending physician with red-flag alerts and persistent consultation note recording.

---

## 2. System Architecture

```
  [ Patient Kiosk (React 19 + Vite) ]
          |  - Multilingual Touch / Voice Guidance (EN / HI / MR)
          |  - Informed Consent, ABHA ID & Demographics
          |  - Conversational Case-Taking & AYUSH Assessment
          v
  [ FastAPI Backend API Gateway (Port 8000) ]
          |  - Speech-to-Text: Bhashini Provider / Mock Fallback
          |  - Clinical Reasoning: Gemini Provider / Deterministic Rule Engine
          |  - Safety Engine: Authoritative Red-Flag Interceptor (Emergency Priority)
          |  - Token Sequence Generator: Atomic daily OPD tokens (e.g. A-001)
          |
          +---> [ PostgreSQL 16 (Port 5433) ] (Encounters, Consent, Turns, Notes, Audit)
          +---> [ MinIO Object Storage (Port 9000/9001) ] (Prescriptions, PDFs, Audio)
          |
          v
  [ Doctor EMR Portal (React 19) ]
          |  - Live Priority Queue (Emergency Red Flags ranked top)
          |  - Structured Case History & Conversation Audio/Transcripts
          |  - AYUSH Prakriti / Vikriti Clinical Analysis
          |  - Secure Presigned Document Viewer
          |  - Final Prescription, Clinical Notes & Finalization
```

---

## 3. Quick Start on a New Machine

For full details, prerequisites, and troubleshooting, see **[SETUP_AND_WALKTHROUGH.md](./SETUP_AND_WALKTHROUGH.md)**.

### Prerequisites:
- **Python 3.11.x**
- **Node.js v20.x or v22.x LTS**
- **Docker Desktop** (with Docker Compose)
- **Git**

### 1-Click Launch:

1. **Clone the repository**:
   ```bash
   git clone <repo-url> MediKiosk
   cd MediKiosk
   ```

2. **Configure environment files**:
   ```bash
   # Backend .env
   cd medikiosk-backend && cp .env.example .env && cd ..
   # Frontend .env
   cd medikiosk-frontend && cp .env.example .env && cd ..
   ```

3. **Run the 1-Click Launcher**:
   - **Windows**: Double-click `start_all.bat`
   - **Linux / macOS**: `chmod +x start_all.sh && ./start_all.sh`

---

## 4. Port & Portal Directory

| Service | Access URL | Default Credentials |
| :--- | :--- | :--- |
| **Patient Kiosk** | `http://localhost:5173/patient` | Public Touchscreen Access |
| **Doctor EMR** | `http://localhost:5173/doctor` | `dr.priya` / `DoctorPass123!` |
| **Backend Swagger Docs** | `http://localhost:8000/docs` | OpenAPI 3.0 Interactive Docs |
| **Backend ReDoc** | `http://localhost:8000/redoc` | Static Technical Specification |
| **MinIO Console** | `http://localhost:9001` | `minioadmin` / `minioadminpassword` |
| **PostgreSQL** | `localhost:5433` | `postgres` / `postgrespassword` (db: `medikiosk`) |

---

## 5. Technology Stack & Verified Versions

### Backend (`medikiosk-backend`)
- **FastAPI** (`0.115.6`) + **Uvicorn** (`0.32.1`)
- **SQLAlchemy** (`2.0.36`) + **asyncpg** (`0.30.0`) + **Alembic** (`1.14.0`)
- **Pydantic** (`2.10.4`) + **Pydantic-Settings** (`2.7.0`)
- **MinIO Python SDK** (`7.2.12`)
- **PyJWT** (`2.10.1`) + **Argon2-cffi** (`23.1.0`)
- **Pytest** (`8.3.4`) + **Pytest-Asyncio** (`0.24.0`)

### Frontend (`medikiosk-frontend`)
- **React 19** (`19.2.8`) + **React DOM** (`19.2.8`)
- **Vite** (`8.2.2`) + **TypeScript** (`6.0.2`)
- **Tailwind CSS v4** (`4.3.3`)
- **React Router v7** (`7.18.3`)
- **TanStack React Query v5** (`5.103.1`)
- **React Hook Form** (`7.87.0`) + **Zod** (`4.6.5`)
- **Lucide React Icons** (`1.41.0`)

---

## 6. Testing & Quality Assurance

```bash
# Run backend test suite (133 tests)
cd medikiosk-backend
pytest -v

# Run frontend typecheck
cd ../medikiosk-frontend
npx tsc --noEmit

# Run frontend build
npm run build
```

---

## 7. License & Hackathon Notice

Developed for **Smart India Hackathon (SIH) 2026** under Problem Statement **PS 26047: Patient Case-Taking Software**.
