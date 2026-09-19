# QR Kiosk Upload Module — Transfer Manifest

## 1. Feature Overview
This feature introduces an asynchronous, mobile-first QR code upload mechanism that replaces the legacy local-machine file picker on the Medikiosk patient terminal.

### The Complete Flow
1. **Patient at Kiosk**: Selects a document category (`Prescription`, `Lab Report`, `Discharge Summary`, `OPD Slip`, `Other Document`).
2. **Kiosk Session & QR Generation**: Kiosk initiates an upload session on the standalone Kiosk Upload Module backend (`POST /api/v1/sessions`) with an integration reference (`parent_reference: <encounter_id>`) and renders an on-screen QR code pointing to `http://<LAN_IP>:5174/upload/<token>`.
3. **SSE Real-time Stream**: The Kiosk connects to an SSE event stream (`GET /api/v1/sessions/{id}/events`).
4. **Mobile Web Upload**: Patient scans the QR code with their mobile phone (connected to hospital Wi-Fi/hotspot), opening the mobile web application. The patient snaps a photo with their camera or chooses a file, then taps upload.
5. **MinIO Ingestion**: The standalone module validates file constraints (MIME type, size limit $\le$ 15MB, magic bytes) and streams the file into MinIO object storage (`kiosk-uploads` bucket).
6. **SSE Notification & Atomic Consume**: The mobile upload triggers an `UPLOADED` SSE event to the kiosk. The kiosk idempotently calls `POST /api/v1/sessions/{id}/consume` to finalize the session and receive the authoritative storage reference (`bucket: kiosk-uploads`, `storage_key: uploads/...`).
7. **PostgreSQL Metadata Attach**: The kiosk immediately calls Medikiosk Core API `POST /api/v1/encounters/{id}/documents/attach`. A `Document` row is persisted in PostgreSQL linking the storage key to the encounter and patient.
8. **Doctor Consultation Retrieval**: When a doctor opens `/doctor/consultation/:encounterId`, `GET /api/v1/encounters/{id}/documents` lists the attached documents. Clicking "View" requests a presigned MinIO URL (`GET /api/v1/documents/{id}/url`), allowing the doctor to view the binary document.

---

## 2. Standalone Module Files (`kiosk-upload-module/`)
The standalone module is completely self-contained in `kiosk-upload-module/`:

### Root & Configuration
- `kiosk-upload-module/README.md`: Architectural documentation, quick-start guide, and API specifications.
- `kiosk-upload-module/docker-compose.yml`: Multi-container Docker setup for standalone deployment (MinIO + Backend + Frontend).
- `kiosk-upload-module/.gitignore`: Ignores `node_modules`, `dist`, `.venv`, `.env`, and `kiosk_upload.db`.

### Backend (`kiosk-upload-module/backend/`)
- `backend/Dockerfile`: Container build definition.
- `backend/requirements.txt`: Python package requirements (`fastapi`, `uvicorn`, `sqlalchemy`, `aiosqlite`, `minio`, `pydantic-settings`, etc.).
- `backend/pytest.ini`: Pytest configuration.
- `backend/.env.example`: Template for backend configuration (LAN IP, MinIO credentials, ports).
- `backend/scratch_e2e.py`: Self-contained end-to-end verification script for the standalone module.
- `backend/app/__init__.py`: Package init.
- `backend/app/main.py`: FastAPI application entrypoint with CORS, lifecycle events, and router registration.
- `backend/app/config.py`: Environment configuration via `pydantic-settings` (computes dynamic LAN URLs for QR codes).
- `backend/app/database.py`: Async SQLite session and engine management.
- `backend/app/api/__init__.py`: API package.
- `backend/app/api/router.py`: Central router aggregating health, kiosk, and mobile routes.
- `backend/app/api/health.py`: Healthcheck endpoint (`/api/v1/health`).
- `backend/app/api/kiosk.py`: Kiosk endpoints: session creation (`POST /sessions`), session query (`GET /sessions/{id}`), event streaming (`GET /sessions/{id}/events`), session consume (`POST /sessions/{id}/consume`), and session cancel (`POST /sessions/{id}/cancel`).
- `backend/app/api/mobile.py`: Mobile endpoints: session verification (`GET /mobile/session/{token}`), document upload (`POST /mobile/upload/{token}`).
- `backend/app/models/__init__.py`: Models export.
- `backend/app/models/session.py`: `UploadSession` SQLAlchemy model with states (`WAITING`, `CONNECTED`, `UPLOADED`, `CONSUMED`, `EXPIRED`, `FAILED`).
- `backend/app/schemas/__init__.py`: Schemas export.
- `backend/app/schemas/session.py`: Request/response schemas for upload sessions, metadata, and consume payloads.
- `backend/app/schemas/upload.py`: Mobile upload schemas and event payloads.
- `backend/app/services/__init__.py`: Services export.
- `backend/app/services/session_service.py`: Business logic for session lifecycle transitions and expiry enforcement.
- `backend/app/services/upload_service.py`: Upload validation (MIME types, magic byte sniffing, size) and storage upload.
- `backend/app/services/event_service.py`: In-memory async SSE publisher/subscriber event broker.
- `backend/app/storage/__init__.py`: Storage provider export.
- `backend/app/storage/base.py`: Abstract `StorageProvider` interface.
- `backend/app/storage/minio_provider.py`: MinIO client implementation for upload, presigned URLs, and bucket management.
- `backend/tests/conftest.py`: Test fixtures (in-memory SQLite, mock storage).
- `backend/tests/test_session_lifecycle.py`: Tests covering session creation, expiry, cancellation, and consume idempotency.
- `backend/tests/test_upload_validation.py`: Tests covering MIME type validation, file size limits, and malicious payload rejection.
- `backend/tests/test_storage_provider.py`: Tests for MinIO storage operations.
- `backend/tests/test_security.py`: Tests for upload token hashing and rate limiting.

### Frontend (`kiosk-upload-module/frontend/`)
- `frontend/index.html`: Vite HTML template.
- `frontend/package.json`: Dependencies (`react`, `react-dom`, `lucide-react`, `tailwindcss`).
- `frontend/package-lock.json`: Dependency lockfile.
- `frontend/tsconfig.json`: TypeScript configuration.
- `frontend/vite.config.ts`: Vite dev server configuration (hosts on `0.0.0.0:5174`).
- `frontend/.env.example`: Template for frontend API URL configuration.
- `frontend/src/main.tsx`: React entrypoint.
- `frontend/src/App.tsx`: Routing between Kiosk demo view (`/`) and Mobile Upload view (`/upload/:token`).
- `frontend/src/index.css`: Tailwind styling.
- `frontend/src/vite-env.d.ts`: Vite environment type definitions.
- `frontend/src/pages/KioskView.tsx`: Standalone kiosk demo page with dynamic QR display and SSE listener.
- `frontend/src/pages/MobileUploadView.tsx`: Clean, accessible mobile upload screen (camera snapshot / file selector, progress bar, success banner).
- `frontend/src/components/QRCodeDisplay.tsx`: Reusable QR code rendering component.
- `frontend/src/services/api.ts`: API client connecting mobile frontend to backend.

### Sample Assets
- `sample_assets/medical_report.jpg`: Test image for upload verification.
- `sample_assets/sample_document.pdf`: Test PDF document for upload verification.

---

## 3. Medikiosk Frontend Changes (`medikiosk-frontend/`)

### 1. `medikiosk-frontend/src/services/api/kioskUploadClient.ts` [NEW FILE]
- **Purpose**: Bridge client between Medikiosk kiosk terminal and the standalone Kiosk Upload Module backend on port 8010.
- **Key Functions**:
  - `createUploadSession(documentType, parentReference)`: Creates upload session with opaque encounter reference.
  - `getUploadSession(sessionId)`: Polls session status if SSE drops.
  - `consumeUploadSession(sessionId)`: Idempotently consumes the upload and extracts the `StorageReference`.
  - `cancelUploadSession(sessionId)`: Cancels in-flight session when changing categories.
  - `subscribeToSessionEvents(sessionId, onEvent, onError)`: Opens `EventSource` connection for real-time `UPLOADED` notifications.

### 2. `medikiosk-frontend/src/pages/patient/documents/Scan.tsx` [MODIFIED]
- **Purpose**: Integrated QR acquisition mechanism into the existing Medikiosk kiosk screen while preserving 100% of the UI design, bilingual Hindi/English labels, accessibility audio, and styling.
- **Key Changes**:
  - Replaced manual local scan placeholder with dynamic QR generation (`QRCode.toDataURL`).
  - Added SSE subscription hook to immediately trigger consume when mobile upload completes.
  - Added consume-before-attach failure recovery: if the Medikiosk `/attach` call fails, a retry box appears to safely retry attachment without re-uploading.
  - Fixed session continuity: `getActiveEncounterId()` now calls `setEncounterId()` and `setPatientId()`, guaranteeing that `Submit.tsx` will submit the exact encounter to which documents were attached.

### 3. `medikiosk-frontend/src/pages/doctor/Consultation.tsx` [MODIFIED]
- **Purpose**: Renders uploaded documents in the Doctor Consultation screen under "PATIENT INTAKE SUMMARY" $\to$ "DOCUMENTS".
- **Key Changes**:
  - Added document category labeling (`Prescription`, `Lab Report`, `Discharge Summary`, `OPD Slip`, `Other Document`).
  - Rendered document item cards styled with the existing doctor design system: category title, filename, `✓ Available` status badge, and a `View` button.
  - Integrated presigned URL resolution (`GET /api/v1/documents/{id}/url`) to open the MinIO binary directly in a new browser tab.

### 4. `medikiosk-frontend/package.json` & `package-lock.json` [MODIFIED]
- **Added Dependencies**:
  - `qrcode`: `^1.5.4` (Canvas/DataURL QR code generation)
  - `@types/qrcode`: `^1.5.6`

### 5. `medikiosk-frontend/.env.example` [MODIFIED]
- Added `VITE_UPLOAD_MODULE_URL=http://localhost:8010`

---

## 4. Medikiosk Backend Changes (`medikiosk-backend/`)

### 1. `medikiosk-backend/app/schemas/document.py` [MODIFIED]
- **Added Schema**:
  ```python
  class DocumentAttach(DocumentBase):
      storage_key: str = Field(..., description="MinIO object storage key")
      file_name: str = Field(..., description="Original file name")
      content_type: str = Field(..., description="MIME content type")
      file_size: int = Field(..., description="File size in bytes")
      bucket: Optional[str] = Field(default="kiosk-uploads", description="MinIO bucket name")
  ```

### 2. `medikiosk-backend/app/services/document/document_service.py` [MODIFIED]
- **Added Function**: `attach_document_reference(db, encounter_id, storage_key, file_name, content_type, file_size, document_type, bucket)`
- **Behavior**:
  - Resolves `encounter_id` and finds associated `patient_id`.
  - Constructs normalized storage key (`kiosk-uploads/...`).
  - Persists `Document` row in PostgreSQL with `processing_status="UPLOADED"`.
  - Does NOT delete the MinIO object on error, allowing idempotent retry.

### 3. `medikiosk-backend/app/api/v1/encounters.py` [MODIFIED]
- **Added Route**: `POST /api/v1/encounters/{encounter_id}/documents/attach`
- **Response**: `DocumentRead` (HTTP 201 Created).

### 4. `medikiosk-backend/app/providers/storage/minio.py` [MODIFIED]
- **Added Method**: `_split_bucket_and_key(object_name, bucket_name)`
- **Behavior**: Inspects object key prefix. If key starts with `kiosk-uploads/`, it routes MinIO download and presigned URL operations to the `kiosk-uploads` bucket; otherwise defaults to `medikiosk-documents`. This enables the existing doctor-side document retrieval system to serve files uploaded by the standalone module without breaking existing documents.

### 5. `medikiosk-backend/tests/test_stage3b_documents.py` [MODIFIED]
- Added unit tests:
  - `test_attach_kiosk_document_success`: Verifies attachment persists metadata linked to patient and encounter.
  - `test_attach_kiosk_document_invalid_encounter`: Verifies 404 response on missing encounter.

### 6. `medikiosk-backend/scratch/live_integration_e2e.py` [NEW FILE]
- 15-step automated end-to-end integration test verifying the full pipeline against running services (Patient creation $\to$ Encounter creation $\to$ QR session $\to$ Mobile upload simulation $\to$ Consume $\to$ Attach $\to$ Doctor login $\to$ Document listing $\to$ Presigned URL $\to$ Binary integrity check).

---

## 5. Database Changes

### PostgreSQL (`medikiosk` database)
- **No schema migrations are required.** The existing `documents` table (from migration `0003_documents.py`) already contains all necessary columns:
  - `id` (UUID, primary key)
  - `patient_id` (UUID, foreign key `patients.id`)
  - `encounter_id` (UUID, foreign key `encounters.id`)
  - `file_name` (VARCHAR)
  - `content_type` (VARCHAR)
  - `file_size` (INTEGER)
  - `storage_key` (VARCHAR)
  - `document_type` (VARCHAR: `PRESCRIPTION`, `LAB_REPORT`, `DISCHARGE_SUMMARY`, `OPD_SLIP`, `OTHER`)
  - `processing_status` (VARCHAR: `UPLOADED`)
  - `uploaded_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

### SQLite (`kiosk_upload.db` for standalone module)
- Created automatically on first startup by `kiosk-upload-module/backend/app/database.py`.
- Table: `upload_sessions`.

---

## 6. Dependencies

### Medikiosk Frontend (`medikiosk-frontend/`)
```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

### Standalone Upload Module Backend (`kiosk-upload-module/backend/`)
Installed via `requirements.txt`:
- `fastapi>=0.110.0`
- `uvicorn[standard]>=0.28.0`
- `pydantic>=2.6.0`
- `pydantic-settings>=2.2.0`
- `sqlalchemy>=2.0.28`
- `aiosqlite>=0.20.0`
- `minio>=7.2.5`
- `python-multipart>=0.0.9`
- `httpx>=0.27.0`
- `pytest>=8.0.0`
- `pytest-asyncio>=0.23.5`

### Standalone Upload Module Frontend (`kiosk-upload-module/frontend/`)
Installed via `package.json`:
- `react`, `react-dom`
- `lucide-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `vite`, `@vitejs/plugin-react`

---

## 7. Automated Tests
1. **Standalone Module Unit Tests**:
   ```bash
   cd kiosk-upload-module/backend
   pytest tests/
   ```
2. **Medikiosk Backend Unit Tests**:
   ```bash
   cd medikiosk-backend
   pytest tests/test_stage3b_documents.py
   ```
3. **Live End-to-End Automated Integration Test**:
   ```bash
   cd medikiosk-backend
   python scratch/live_integration_e2e.py
   ```

---

## 8. Environment Variables

| Variable Name | Purpose | Example Value | Secret? | Machine-Specific? |
| :--- | :--- | :--- | :---: | :---: |
| `HOST` | Bind address for Kiosk Upload Backend | `0.0.0.0` | NO | NO |
| `PORT` | Port for Kiosk Upload Backend | `8010` | NO | NO |
| `LAN_HOST` | Wi-Fi / LAN IP of host machine for physical phone QR access | `192.168.1.100` | NO | **YES** |
| `FRONTEND_PORT` | Port for Kiosk Upload Frontend | `5174` | NO | NO |
| `PUBLIC_WEB_URL` | Explicit public URL for mobile upload page | `http://192.168.1.100:5174` | NO | **YES** |
| `DATABASE_URL` | SQLite or PostgreSQL connection string for upload sessions | `sqlite+aiosqlite:///./kiosk_upload.db` | NO | NO |
| `MINIO_ENDPOINT` | MinIO host and port | `localhost:9000` | NO | NO |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` | **YES** | NO |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadminpassword` | **YES** | NO |
| `MINIO_BUCKET` | MinIO bucket for kiosk uploads | `kiosk-uploads` | NO | NO |
| `MINIO_SECURE` | Use SSL for MinIO | `false` | NO | NO |
| `DEFAULT_SESSION_TTL_SECONDS` | QR session duration | `600` | NO | NO |
| `MAX_FILE_SIZE_MB` | Upload file size limit | `15` | NO | NO |
| `VITE_API_BASE_URL` | Upload frontend API URL (points to Upload Backend) | `http://192.168.1.100:8010` | NO | **YES** |
| `VITE_UPLOAD_MODULE_URL` | Medikiosk frontend pointer to Upload Backend | `http://localhost:8010` | NO | NO |
| `VITE_API_URL` | Medikiosk frontend pointer to Medikiosk Core API | `http://localhost:8000/api/v1` | NO | NO |

---

## 9. Runtime Services & Ports

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RUNTIME TOPOLOGY                                │
│                                                                             │
│  [ Patient Kiosk Browser ]          [ Mobile Phone Browser (Wi-Fi) ]        │
│    (http://localhost:5173)             (http://<LAN_IP>:5174)               │
│           │       │                             │                           │
│           │       │                             │ Upload File               │
│           │       ▼                             ▼                           │
│           │  [ Kiosk Upload Backend ] ◄─────────┘                           │
│           │    (http://0.0.0.0:8010)                                        │
│           │       │                                                         │
│           │       │ Stores Raw File                                         │
│           │       ▼                                                         │
│           │  [ MinIO Object Storage ]                                       │
│           │    (http://localhost:9000)                                      │
│           │    Buckets: medikiosk-documents, kiosk-uploads                  │
│           │       ▲                                                         │
│           ▼       │ Presigned URLs                                          │
│  [ Medikiosk Core API ] ────────────────────────────────────────┐           │
│    (http://0.0.0.0:8000)                                        │           │
│           │                                                     │           │
│           │ Metadata                                            ▼           │
│           ▼                                            [ Doctor Workstation ]
│  [ PostgreSQL (medikiosk) ]                             (http://localhost:5173)
│    (localhost:5433 / 5432)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Service | Port | Host Binding | Responsibility |
| :--- | :--- | :--- | :--- |
| **Medikiosk Frontend** | `5173` | `0.0.0.0` | Patient Kiosk & Doctor Consultation UI |
| **Medikiosk Core API** | `8000` | `0.0.0.0` | Patient, Encounter, Document Attach, Queue, Doctor Auth |
| **Kiosk Upload Module Frontend** | `5174` | `0.0.0.0` | Mobile Web Upload View for phone |
| **Kiosk Upload Module Backend** | `8010` | `0.0.0.0` | Session lifecycle, SSE streaming, MinIO file ingestion |
| **MinIO Storage** | `9000` (API) / `9001` (Console) | `0.0.0.0` | S3-compatible document storage |
| **PostgreSQL** | `5433` (or `5432`) | `0.0.0.0` | Relational clinical records |

---

## 10. Integration Architecture & Boundaries

1. **Domain-Agnostic Boundary**:
   - The Kiosk Upload Module does **not** know about patients, medical records, or consultation statuses.
   - The Medikiosk terminal passes an opaque integration reference:
     ```json
     { "document_type": "PRESCRIPTION", "parent_reference": "<encounter_id>" }
     ```
   - The Kiosk Upload Module stores this in `external_metadata` without parsing it.

2. **Decoupled File Storage & Metadata**:
   - The phone uploads directly to the Kiosk Upload Module $\to$ MinIO.
   - Medikiosk Core API receives only the storage coordinates (`storage_key`, `bucket`, `file_name`, `content_type`, `file_size`).
   - No large binary payloads pass through the Medikiosk Node/Vite frontend.

3. **Multi-Bucket MinIO Compatibility**:
   - Medikiosk `MinIOStorageProvider` seamlessly resolves objects stored under `kiosk-uploads/` as well as legacy `medikiosk-documents/`.

---

## 11. Installation Steps on Receiving Machine

### Step 1: Install Frontend Dependencies
```bash
cd medikiosk-frontend
npm install qrcode
npm install --save-dev @types/qrcode
```

### Step 2: Set up Standalone Module Backend
```bash
cd kiosk-upload-module/backend
python -m venv .venv
# On Windows: .\.venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```
Edit `.env` and set `LAN_HOST=<NEW_MACHINE_WIFI_IP>` (e.g. `192.168.1.100`).

### Step 3: Set up Standalone Module Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
```
Edit `.env` and set `VITE_API_BASE_URL=http://<NEW_MACHINE_WIFI_IP>:8010`.

### Step 4: Configure MinIO Bucket
Ensure the `kiosk-uploads` bucket exists in MinIO:
```bash
# Using MinIO Client (mc) or MinIO Web Console (http://localhost:9001)
mc mb myminio/kiosk-uploads
```

### Step 5: Start Services
```bash
# 1. Start Kiosk Upload Backend
cd kiosk-upload-module/backend
uvicorn app.main:app --host 0.0.0.0 --port 8010

# 2. Start Kiosk Upload Frontend
cd kiosk-upload-module/frontend
npm run dev -- --host 0.0.0.0 --port 5174

# 3. Start Medikiosk Backend
cd medikiosk-backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 4. Start Medikiosk Frontend
cd medikiosk-frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## 12. Physical Phone Verification Checklist

- [ ] Connect host machine and phone to the same Wi-Fi network or phone hotspot.
- [ ] Note host machine's Wi-Fi IPv4 address (`ipconfig` on Windows or `ifconfig` on Linux).
- [ ] Set `LAN_HOST` in `kiosk-upload-module/backend/.env` and `VITE_API_BASE_URL` in `kiosk-upload-module/frontend/.env`.
- [ ] Open Medikiosk at `http://localhost:5173/patient/documents/scan`.
- [ ] Select **Prescription**: Verify QR code renders on screen.
- [ ] Scan QR code with phone camera: Verify mobile web page opens at `http://<LAN_IP>:5174/upload/<token>`.
- [ ] On phone, take a photo of a prescription or choose an image, tap **Upload Document**.
- [ ] Verify Kiosk screen automatically detects upload via SSE, displays success banner, and adds document to "Scanned Documents" list.
- [ ] Select **Lab Report**: Verify a fresh QR code generates.
- [ ] Scan and upload a PDF on phone: Verify it attaches to the visit.
- [ ] Click **Continue** $\to$ Allergies $\to$ Review $\to$ **Submit to OPD Queue**.
- [ ] Open Doctor Portal at `http://localhost:5173/doctor/login` (login as `dr.priya` / `DoctorPass123!`).
- [ ] Open Patient Consultation for the queued patient.
- [ ] Verify both uploaded documents appear under **PATIENT INTAKE SUMMARY** $\to$ **DOCUMENTS** with category titles and `✓ Available` badges.
- [ ] Click **View**: Verify the document opens in a new tab using the presigned MinIO URL.

---

## 13. Known Assumptions & Compatibility Concerns with Ahead Branch

| File | Nature of Change | Potential Conflict in Newer Branch | Mitigation |
| :--- | :--- | :--- | :--- |
| `Scan.tsx` | Replaced mock scan state with QR/SSE/attach orchestration; fixed encounter session sync | High, if newer branch redesigned Scan layout | The QR logic is cleanly modularized into `initUploadSession`, `attachDocumentToMedikiosk`, and `kioskUploadClient.ts`. Keep UI props intact. |
| `Consultation.tsx` | Added category label formatting and document card styling | Low to Moderate | Changes are localized within the Documents sidebar section (`lines 855-895`) and document loading mapping (`lines 45-65`). |
| `encounters.py` | Added `POST /{id}/documents/attach` | Low | Pure additive route. |
| `document_service.py` | Added `attach_document_reference` | Low | Pure additive function. |
| `minio.py` | Added `_split_bucket_and_key` | Low | Enhances key resolution without breaking existing paths. |
| `document.py` (schema) | Added `DocumentAttach` | Low | Pure additive Pydantic model. |
| `package.json` | Added `qrcode` & `@types/qrcode` | Low | Run `npm install qrcode` on receiving machine. |
