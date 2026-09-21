# MediKiosk

### Multilingual Patient Self-Registration, Case-Taking, Document Digitization & Hospital EMR Platform

**Smart India Hackathon (SIH) 2026 — Problem Statement PS 26047: Patient Case-Taking Software**

---

## 1. Overview

In high-volume public hospital Outpatient Departments (OPDs), attending physicians often consult 80–120 patients in a single morning shift, leaving just 2–3 minutes per consultation to elicit history, review physical symptoms, examine past paper records, determine diagnoses, and formulate treatment plans.

**MediKiosk** addresses this history-taking bottleneck at the hospital's first mile. Positioned in the hospital registration or OPD waiting area, the platform allows patients to independently self-register, provide structured symptom histories through regional voice and touch interfaces, complete constitutional AYUSH assessments, and digitize past paper medical documents before meeting the doctor.

The system connects the patient kiosk to three role-based portals:
- **Doctor EMR Portal:** Live triaged OPD queue, 30-second clinical briefings, red-flag emergency prioritization, and digital consultation recording.
- **Staff Operations Portal:** Patient check-in, token movement tracking, appointment coordination, and billing verification.
- **Admin Governance Portal:** OPD volume analytics, doctor efficiency metrics, disease trends, role management, and immutable audit logging.

---

## 2. Key Highlights

- **Patient Self-Registration & Identification:** Flexible entry via ABHA ID QR scan, new patient demographic entry, or existing hospital OPD slip barcode.
- **Sahayak Assist (Guided Accessibility Mode):** Clinical step-by-step guidance system with an animated visual hand pointer, targeted focus highlights, audio instructions, and non-destructive pause/resume for elderly or low-digital-literacy patients.
- **Multilingual Touch & Voice Intake:** Interactive conversational history taking in English, Hindi, and Marathi with live audio readouts and speech transcription.
- **AYUSH Constitutional Assessment:** Standardized constitutional evaluation (*Prakriti* dosha distribution: Vata, Pitta, Kapha) integrated alongside modern clinical history.
- **QR Document Digitization:** Mobile QR scan integration allowing patients to upload physical prescriptions, lab reports, and discharge summaries directly from their smartphone cameras into MinIO object storage.
- **Emergency Red-Flag Interceptor:** Deterministic clinical safety rule engine that flags life-threatening symptoms (e.g., chest pain, acute dyspnea, severe head trauma) and escalates them to the top of the doctor's queue.
- **Doctor EMR Workspace:** Live queue management, clinical discrepancy detection, evidence-linked summaries, structured physical vitals, prescription builder, and one-click finalization.
- **Staff Operations Management:** Real-time patient queue movement between consultation rooms, counter check-ins, token issuance, and operational alert dispatch.
- **Admin Analytics & Auditing:** Comprehensive OPD workload distribution, waiting time analytics, diagnostic trend tracking, and user access control.
- **Clinician-in-the-Loop Safeguards:** All automated clinical notes and synthesized findings require explicit physician verification and sign-off before being committed to the official medical record.

---

## 3. Core Patient Journey

```mermaid
flowchart LR
    A[Patient Arrival] --> B[Language & Mode]
    B --> C[Identification\nABHA / New / OPD]
    C --> D[DPDP Consent]
    D --> E[Chief Complaint &\nVoice Intake]
    E --> F[AYUSH Assessment\nPrakriti Profiling]
    F --> G[Document Scan\nQR Upload]
    G --> H[Patient Review]
    H --> I[Token Slip Issued\nOPD Queue]
    I --> J[Doctor Consultation\n& Prescription]
```

1. **Language & Mode Selection:** Patient selects their preferred language (English, Hindi, Marathi) and can activate **Sahayak Assist** for guided accessibility.
2. **Identification & Demographics:** Patient identifies via ABHA QR code scan, new registration with mobile verification, or existing OPD token slip.
3. **Informed Consent:** Explicit, purpose-specific consent capture adhering to the Digital Personal Data Protection (DPDP) Act.
4. **Chief Complaint & Voice Intake:** Patient describes symptoms via touch cards or conversational regional voice input (duration, onset, severity, location).
5. **AYUSH History Taking:** Optional constitutional profiling evaluating physical traits, appetite, sleep patterns, and thermal sensitivity.
6. **Past Records & Document Scanning:** Direct camera scan or mobile QR handoff to upload previous prescriptions, laboratory results, or discharge summaries.
7. **Review & Appointment Confirmation:** Patient verifies entered details and selects an available OPD consultation slot.
8. **Token Slip Generation:** Daily OPD token generated (e.g., `A-001`, `B-014`) with department routing, estimated wait time, and room assignment.
9. **Doctor Consultation:** Attending physician reviews the pre-consultation summary, examines physical vitals, resolves discrepancies, issues digital prescriptions, and finalizes the visit.

---

## 4. Sahayak Assist (Guided Accessibility Layer)

**Sahayak Assist** is a hospital-grade accessibility system designed to assist elderly patients, individuals with low digital literacy, or users unfamiliar with touchscreen kiosks.

```
+-------------------------------------------------------------------------+
|  SAHAYAK ASSIST   Step 2 of 8                                          |
|  "Tap here to enter your 10-digit mobile number."                       |
|                                                                         |
|  [ Repeat Audio ]                                        [ Exit Assist ]|
+-------------------------------------------------------------------------+
```

- **Visual Hand Pointer (`<SahayakPointer />`):** Clinical pointer that dynamically calculates target element bounding boxes, performs a gentle 2-tap prompt, and rests without distracting continuous bouncing.
- **Target Focus Highlighting (`<SahayakTargetHighlight />`):** Highlights active fields and buttons without dimming or obstructing the rest of the interface.
- **Synchronized Audio & Voice:** Speaks localized instructions and provides a one-tap `[ Repeat Audio ]` button.
- **Non-Destructive Pause & Resume:** Patients can exit guided mode at any moment without losing entered form data, and resume from their exact step upon re-entry.
- **Hospital Attendant Alert:** Includes a "Call Sahayak" option that dispatches on-ground hospital assistance to the specific kiosk within 2 minutes.

---

## 5. Portal Overviews

### Doctor EMR Portal (`/doctor`)
- **Live OPD Queue:** Real-time patient list categorized by status (*Waiting*, *In Consultation*, *Completed*) with emergency red-flag badges pinned to the top.
- **30-Second Clinical Briefing:** High-density synthesis of patient history, primary complaints, key vitals, and timeline progression for rapid review.
- **Discrepancy & Consistency Engine:** Cross-references patient-stated symptoms against historical records and uploaded documents to highlight potential clinical discrepancies.
- **AYUSH Analysis View:** Visual breakdown of Vata, Pitta, and Kapha constitutional dosha balances.
- **Document & OCR Viewer:** Secure viewer for patient-uploaded paper records, prescriptions, and lab reports.
- **Consultation Recording & Finalization:** Structured clinical note formulation, ICD-10 coding, prescription entry, and digital sign-off.

### Staff Operations Portal (`/staff`)
- **Patient Registration & Check-In:** Rapid walk-in registration, ABHA lookups, and identity verification.
- **Queue & Movement Tracking:** Real-time monitoring of patient transitions across triage, consultation rooms, and diagnostic labs.
- **Appointment Scheduling:** Department-level slot management, doctor availability tracking, and emergency priority insertions.
- **Document Counter Verification:** Physical document verification and manual scanning assist for kiosk uploads.
- **Billing & Token Dispatch:** Token printing, receipt generation, and fee collection reconciliation.
- **Staff Alerts:** Operational notifications, Sahayak attendant calls, and room status updates.

### Admin Governance Portal (`/admin`)
- **Executive Analytics Dashboard:** High-level metrics for total registrations, active consultations, average wait times, and bed/room utilization.
- **OPD & Queue Analytics:** Hourly traffic distribution, peak bottleneck analysis, and department-wise patient throughput.
- **Doctor Performance & Workload:** Consultation duration distribution, case completion rates, and queue clearance metrics.
- **Clinical & Diagnostic Trends:** Epidemiological tracking of frequent complaints, seasonal symptom clusters, and AYUSH constitutional distributions.
- **Role-Based Access Control (RBAC):** Management of doctor, staff, and kiosk user accounts with role permissions.
- **Audit Logging & Security:** Immutable audit trail recording user logins, record access, consent approvals, and data modifications.

---

## 6. Technology Stack

### Frontend (`medikiosk-frontend`)
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `19.2.8` | Component-driven user interface |
| **Build Tool** | Vite | `8.2.2` | Fast HMR development and bundling |
| **Language** | TypeScript | `6.0.2` | End-to-end static type safety |
| **Styling** | Tailwind CSS | `4.3.3` | Utility-first responsive design tokens |
| **Routing** | React Router | `7.18.3` | Client-side routing across 4 distinct portals |
| **Server State** | TanStack Query | `5.103.1` | Asynchronous caching, refetching, and mutations |
| **Form Handling** | React Hook Form + Zod | `7.87.0` / `4.6.5` | Strict schema validation and performance |
| **Icons** | Lucide React | `1.41.0` | Accessible clinical iconography |

### Backend (`medikiosk-backend`)
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **API Framework** | FastAPI | `0.115.6` | High-performance asynchronous REST API gateway |
| **ASGI Server** | Uvicorn | `0.32.1` | Production ASGI web server |
| **ORM & Database** | SQLAlchemy + asyncpg | `2.0.36` / `0.30.0` | Asynchronous relational data modeling |
| **Migrations** | Alembic | `1.14.0` | Relational database schema migrations |
| **Validation** | Pydantic v2 | `2.10.4` | Request/response data contract enforcement |
| **Object Storage** | MinIO Python SDK | `7.2.12` | S3-compatible medical document & audio storage |
| **Auth & Security** | PyJWT + Argon2-cffi | `2.10.1` / `23.1.0` | Secure doctor/staff token authentication |
| **Testing** | Pytest + Pytest-Asyncio | `8.3.4` / `0.24.0` | Asynchronous test suite |

### AI & Speech Integrations
- **Speech-to-Text (ASR):** Bhashini ASR Pipeline integration for regional Indian languages with offline mock speech provider fallback.
- **Clinical Intelligence Engine:** Google Gemini AI provider (`gemini-1.5-flash`) for multi-turn conversational reasoning, with a deterministic rule-based clinical engine fallback for offline deployments.

---

## 7. System Architecture

```
                                  +---------------------------------------+
                                  |         PATIENT TOUCHSCREEN KIOSK     |
                                  |  - Sahayak Assist Guided Mode         |
                                  |  - Multilingual Touch / Voice Intake  |
                                  |  - ABHA / OPD Registration & Consent  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
+------------------------+        +-------------------+-------------------+        +------------------------+
|    STAFF PORTAL        |        |          FASTAPI API GATEWAY          |        |    DOCTOR EMR PORTAL   |
|  - Check-in & Queue    |------->|               (Port 8000)             |<-------|  - Live OPD Queue      |
|  - Token & Movement    |        |  - Auth & Role-Based Access           |        |  - 30-Sec Clinical View|
|  - Room Coordination   |        |  - Clinical Reasoning & Safety Engine |        |  - AYUSH & Vitals View |
+------------------------+        |  - Speech Pipeline & Token Sequencer  |        +------------------------+
                                  +---------+-------------------+---------+
                                            |                   |
                                            v                   v
                                  +---------+---------+  +------+-----------------+
                                  |   PostgreSQL 16   |  |   MinIO Object Storage |
                                  |    (Port 5433)    |  |     (Port 9000/9001)   |
                                  | - Patients & Visits|  | - Uploaded Documents   |
                                  | - Clinical Encounters| - Scanned Prescriptions|
                                  | - Consent & Turns |  | - Consultation Records |
                                  | - Audit Trail Logs|  +------------------------+
                                  +-------------------+
```

---

## 8. Project Structure

```
MediKiosk/
├── medikiosk-frontend/               # React 19 + Vite Kiosk & EMR Frontend
│   ├── src/
│   │   ├── app/                      # Application router and global configuration
│   │   ├── components/
│   │   │   ├── kiosk/                # Patient kiosk cards, numpads, guidance banners
│   │   │   ├── layout/               # Kiosk, Doctor EMR, Staff, and Admin layouts
│   │   │   ├── sahayak/              # Sahayak Assist pointer, highlight, guidance bar, modals
│   │   │   └── ui/                   # Reusable glass cards, badges, and progress indicators
│   │   ├── demo/                     # 30-second briefing engine, timeline, and discrepancy analysis
│   │   ├── features/
│   │   │   ├── patient/              # Patient session context & state
│   │   │   └── sahayak/              # Sahayak Assist state machine and step coordination
│   │   ├── i18n/translations/        # Multilingual strings (English, Hindi, Marathi)
│   │   ├── pages/
│   │   │   ├── admin/                # Admin analytics, trends, doctor stats, audit logs
│   │   │   ├── doctor/               # Doctor queue, case detail, AYUSH, consultation, OCR
│   │   │   ├── patient/              # Kiosk flow (Identify, Register, Consent, Voice, Complete)
│   │   │   └── staff/                # Staff check-in, movement, billing, appointments, alerts
│   │   └── services/                 # API clients, auth providers, and mock data stores
│   └── package.json
│
├── medikiosk-backend/                # FastAPI Asynchronous Backend
│   ├── app/
│   │   ├── api/v1/                   # REST endpoints (auth, patients, clinical, queue, speech, health)
│   │   ├── core/                     # Configuration settings, security, and logging
│   │   ├── db/                       # SQLAlchemy models, async session factory, seed data
│   │   ├── models/                   # Relational database models (Patient, Encounter, Consent, Turn)
│   │   ├── providers/                # AI and Speech providers (Gemini, Bhashini, Mock)
│   │   ├── schemas/                  # Pydantic request and response schemas
│   │   └── services/                 # Clinical reasoning, safety rules, token sequencing
│   ├── tests/                        # Backend test suite (133 tests)
│   ├── alembic/                      # Database migration scripts
│   ├── Dockerfile
│   ├── docker-compose.yml            # PostgreSQL 16 & MinIO service definition
│   └── requirements.txt
│
├── kiosk-upload-module/              # Standalone Mobile QR Document Upload Service
│   ├── backend/                      # FastAPI upload handler and session manager (Port 8010)
│   └── frontend/                     # Lightweight mobile browser upload interface (Port 5174)
│
├── start_all.bat                     # Windows 1-click startup script
├── start_all.sh                      # Linux/macOS 1-click startup script
└── README.md
```

---

## 9. Installation & Setup

### Prerequisites
- **Python:** `3.11.x`
- **Node.js:** `v20.x` or `v22.x LTS`
- **Docker Desktop:** With Docker Compose enabled
- **Git**

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/sohamk273/Medikiosk_New.git
cd Medikiosk_New
```

#### 2. Configure Environment Files
```bash
# Backend Environment
cd medikiosk-backend
cp .env.example .env

# Frontend Environment
cd ../medikiosk-frontend
cp .env.example .env

# QR Upload Module Environments
cd ../kiosk-upload-module/backend
cp .env.example .env
cd ../frontend
cp .env.example .env

cd ../..
```

#### 3. Start Database & Storage Infrastructure
```bash
cd medikiosk-backend
docker compose up -d
```
*This starts PostgreSQL 16 on port `5433` and MinIO on ports `9000` (API) and `9001` (Web Console).*

#### 4. Setup Backend Virtual Environment & Migrations
```bash
cd medikiosk-backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Run database migrations and seed initial data
alembic upgrade head
python -m app.db.seed
```

#### 5. Install Frontend Dependencies
```bash
cd ../medikiosk-frontend
npm install
```

---

## 10. Running the Application

### Option A: 1-Click Startup Script (Recommended)
- **Windows:** Double-click `start_all.bat` (or run `./start_all.bat` in PowerShell / CMD).
- **Linux / macOS:** Run `chmod +x start_all.sh && ./start_all.sh`.

### Option B: Manual Multi-Terminal Startup

```bash
# Terminal 1: Backend API (Port 8000)
cd medikiosk-backend
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: QR Upload Backend (Port 8010)
cd kiosk-upload-module/backend
..\..\medikiosk-backend\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload

# Terminal 3: QR Upload Mobile Frontend (Port 5174)
cd kiosk-upload-module/frontend
npm run dev -- --port 5174

# Terminal 4: MediKiosk Web Application (Port 5173)
cd medikiosk-frontend
npm run dev
```

---

## 11. Access Directory & Default Credentials

| Portal / Service | URL | Default Credentials | Description |
| :--- | :--- | :--- | :--- |
| **Patient Kiosk** | `http://localhost:5173/patient` | Public Access | Touchscreen self-registration & Sahayak Assist |
| **Doctor EMR** | `http://localhost:5173/doctor` | `dr.priya` / `DoctorPass123!` | Triaged OPD queue & clinical consultation |
| **Staff Operations** | `http://localhost:5173/staff` | Staff Access | Patient check-in, movement, & token management |
| **Admin Governance** | `http://localhost:5173/admin` | Admin Access | Hospital analytics, trends, & audit trail |
| **QR Mobile Upload** | `http://localhost:5174` | Session Pin / QR | Mobile prescription & document camera upload |
| **Backend API Docs** | `http://localhost:8000/docs` | Public | Interactive OpenAPI (Swagger) documentation |
| **MinIO Web Console** | `http://localhost:9001` | `minioadmin` / `minioadminpassword` | Object storage bucket & file browser |
| **PostgreSQL Database** | `localhost:5433` | `postgres` / `postgrespassword` | Database: `medikiosk` |

---

## 12. Environment Variables Reference

### Backend (`medikiosk-backend/.env`)
```ini
APP_NAME="MediKiosk Core API"
APP_ENV=development
DEBUG=true
API_V1_PREFIX=/api/v1

# Database Configuration (PostgreSQL 16)
POSTGRES_PORT=5433
DATABASE_URL=postgresql+asyncpg://postgres:postgrespassword@localhost:5433/medikiosk
DATABASE_URL_SYNC=postgresql+psycopg://postgres:postgrespassword@localhost:5433/medikiosk

# Security & Tokens
JWT_SECRET_KEY=your-secure-random-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=720

# MinIO Object Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadminpassword
MINIO_BUCKET=medikiosk-documents
MINIO_SECURE=false

# Provider Selection (set to "mock" for local offline testing, or "bhashini" / "gemini" for live external APIs)
SPEECH_PROVIDER=mock
AI_PROVIDER=mock

# Live Credentials (Optional - required when live providers selected)
GEMINI_API_KEY=your-gemini-api-key
BHASHINI_USER_ID=your-bhashini-user-id
BHASHINI_API_KEY=your-bhashini-api-key
BHASHINI_PIPELINE_ID=your-bhashini-pipeline-id
```

### Frontend (`medikiosk-frontend/.env`)
```ini
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 13. Offline Demo & Testing Mode

MediKiosk includes built-in offline mock providers for all core services:
- **Speech & Audio Intake:** Simulates realistic regional transcriptions and TTS voice readouts without requiring external Bhashini credentials.
- **Clinical Reasoning:** Generates structured multi-turn questions, symptom evaluations, and constitutional summaries using a deterministic rule engine when external LLM services are offline.
- **Document OCR:** Generates structured extraction data from scanned prescriptions and lab reports for demonstration purposes.

Switching between offline mock mode and live cloud APIs requires changing only `SPEECH_PROVIDER` and `AI_PROVIDER` in `medikiosk-backend/.env`.

---

## 14. Safety & Clinical Verification

MediKiosk follows a strict **clinician-in-the-loop** architecture:
- **Assistive Synthesis, Not Autonomous Diagnosis:** AI models and deterministic rules are strictly limited to collecting, summarizing, and structuring patient history. They do not generate autonomous prescription orders.
- **Mandatory Physician Sign-Off:** All clinical summaries, allergy alerts, and prescription drafts presented in the Doctor EMR require explicit physician verification before saving.
- **Red-Flag Escalation:** High-risk indicators (e.g., suspected myocardial infarction, acute respiratory distress, acute trauma) bypass normal queue ordering and trigger immediate visual priority alerts for triage staff and doctors.
- **DPDP Act Compliance:** Purpose-specific informed consent is obtained from the patient at the start of the kiosk flow prior to any data capture or processing.

---

## 15. Testing & Quality Assurance

### Run Backend Unit & Integration Tests (133 Tests)
```bash
cd medikiosk-backend
pytest -v
```

### Run Frontend TypeScript Check & Production Build
```bash
cd medikiosk-frontend

# Typecheck
npx tsc --noEmit

# Production Bundle Build
npm run build
```

---

## 16. Future Scope

The following items are identified for future platform scaling:
- **ABDM Milestone 2 & 3 Compliance:** Full integration with the ABDM Health Information Exchange & Consent Manager (HIE-CM) for pulling historical longitudinal health records.
- **Hospital Information System (HIS) / NIC e-Hospital Connectors:** Standardized HL7 FHIR connectors for bi-directional synchronization with existing government hospital EMR infrastructure.
- **Edge-Deployed Regional Speech Models:** On-premise quantized ASR models deployed directly on kiosk hardware for zero-latency offline speech capture in low-connectivity rural health centers.
- **Biometric ABHA Authentication:** Hardware fingerprint and iris scanner integration for direct ABHA authentication at the kiosk.

---

## 17. License & Acknowledgements

Developed for the **Smart India Hackathon (SIH) 2026** under Problem Statement **PS 26047: Patient Case-Taking Software**.
