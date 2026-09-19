# Standalone Kiosk Document Upload Module

A production-ready, decoupled microservice that enables physical kiosks to acquire photos and documents using the user's personal smartphone as a temporary, anonymous input device.

---

## 🚀 Key Architectural Principles

1. **Phone is an Input Device Only**: The mobile browser runs zero authentication, possesses zero persistent credentials, and stores no clinical/PII data.
2. **Kiosk Controls the Lifecycle**: The physical kiosk creates the temporary session, renders the high-entropy QR code, receives real-time progress via Server-Sent Events (SSE), and consumes the finalized MinIO document.
3. **Zero Leaky Abstractions**: The module is completely agnostic of parent domain models (e.g. patients, encounters, visits, diagnoses). Parent apps pass opaque metadata and receive canonical MinIO object coordinates upon consumption.
4. **Single-Use & Ephemeral**: Tokens are hashed with SHA-256 before storage. Sessions expire after a configurable TTL (e.g., 10 minutes) and become permanently immutable once consumed.

---

## 🏗️ System Flow

```
Kiosk Machine                      Upload Service                   User's Smartphone
    │                                    │                                  │
    │  1. POST /api/v1/sessions          │                                  │
    ├───────────────────────────────────►│                                  │
    │  (returns upload_url & token)      │                                  │
    │◄───────────────────────────────────┤                                  │
    │                                    │                                  │
    │  2. Renders QR code                │                                  │
    │  3. Connects SSE /events           │                                  │
    ├───────────────────────────────────►│                                  │
    │                                    │    4. Scans QR                   │
    │                                    │       GET /upload/{token}        │
    │                                    │◄─────────────────────────────────┤
    │  5. SSE: "CONNECTED"               │       (Handshake 200 OK)         │
    │◄───────────────────────────────────┼─────────────────────────────────►│
    │                                    │                                  │
    │                                    │    6. Captures / selects file    │
    │                                    │       POST /upload/{token}       │
    │                                    │◄─────────────────────────────────┤
    │  7. SSE: "UPLOADING"               │       - Validates magic bytes    │
    │◄───────────────────────────────────┤       - Enforces size limit      │
    │                                    │       - Streams to MinIO         │
    │                                    │       - Calculates SHA-256       │
    │  8. SSE: "UPLOADED"                │       (200 Upload Success)       │
    │◄───────────────────────────────────┼─────────────────────────────────►│
    │                                    │                                  │
    │  9. Kiosk previews document        │                                  │
    │  10. POST /sessions/{id}/consume   │                                  │
    ├───────────────────────────────────►│                                  │
    │  (returns MinIO storage ref)       │                                  │
    │◄───────────────────────────────────┤                                  │
```

---

## 📦 Directory Structure

```text
kiosk-upload-module/
├── backend/
│   ├── app/
│   │   ├── api/             # REST routes (/sessions, /upload, /health)
│   │   ├── models/          # SQLAlchemy session model
│   │   ├── schemas/         # Pydantic DTOs
│   │   ├── services/        # SessionService, UploadService, EventBroker (SSE)
│   │   ├── storage/         # StorageProvider ABC & MinIOStorageProvider
│   │   ├── config.py        # Environment settings
│   │   ├── database.py      # SQLite / PostgreSQL async engine
│   │   └── main.py          # FastAPI application
│   ├── tests/               # Pytest suite (lifecycle, validation, security)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── KioskView.tsx         # Kiosk UI: QR code, live SSE, document review
│   │   │   └── MobileUploadView.tsx  # Mobile UI: Camera capture, file picker, progress
│   │   ├── components/               # SVG QRCodeDisplay, FilePreview
│   │   └── services/                 # API client and SSE wrapper
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # One-command standalone stack (MinIO + Backend)
└── README.md
```

---

## 🔌 API Reference

### Kiosk Endpoints

#### 1. Create Upload Session
```http
POST /api/v1/sessions
Content-Type: application/json

{
  "ttl_seconds": 600,
  "allowed_types": ["image/jpeg", "image/png", "application/pdf"],
  "max_size_mb": 15,
  "metadata": {
    "kiosk_id": "KIOSK-01",
    "department": "Radiology"
  }
}
```
**Response (`201 Created`)**:
```json
{
  "session_id": "f8a03d12-1b1e-450e-9132-72c69503930b",
  "status": "WAITING",
  "upload_url": "http://192.168.1.10:5174/upload/uW8z-92K_aA89...",
  "expires_at": "2026-09-19T17:10:00Z",
  "created_at": "2026-09-19T17:00:00Z"
}
```

#### 2. Real-Time Push Events (SSE)
```http
GET /api/v1/sessions/{session_id}/events
Accept: text/event-stream
```
Streams state updates as they happen:
```text
event: status_change
data: {"status": "CONNECTED", "timestamp": "2026-09-19T17:01:20Z"}

event: status_change
data: {"status": "UPLOADING", "timestamp": "2026-09-19T17:02:10Z"}

event: status_change
data: {"status": "UPLOADED", "file_metadata": {"file_name": "xray.png", "file_size": 2048500, "content_type": "image/png", "sha256": "3a8b..."}}
```

#### 3. Consume Session
```http
POST /api/v1/sessions/{session_id}/consume
```
**Response (`200 OK`)**:
```json
{
  "session_id": "f8a03d12-1b1e-450e-9132-72c69503930b",
  "status": "CONSUMED",
  "storage_reference": {
    "bucket": "kiosk-uploads",
    "object_key": "uploads/2026/09/19/f8a03d12_xray.png",
    "content_type": "image/png",
    "file_size": 2048500,
    "sha256": "3a8b79..."
  },
  "metadata": {
    "kiosk_id": "KIOSK-01"
  },
  "consumed_at": "2026-09-19T17:05:00Z"
}
```

---

### Mobile Client Endpoints

#### 1. Validate Token / Handshake
```http
GET /api/v1/upload/{upload_token}
```
Transitions session from `WAITING` to `CONNECTED` and notifies kiosk.

#### 2. Submit Binary File
```http
POST /api/v1/upload/{upload_token}
Content-Type: multipart/form-data

file: [binary payload]
```

---

## 🔒 Security Architecture

1. **Pre-Image Token Isolation**: The QR contains a 256-bit entropy token (`secrets.token_urlsafe(32)`). The database stores only its `SHA-256` hash. Even with full database access, active tokens cannot be forged.
2. **Zero PII**: The QR code encodes only the upload URL. No patient names, hospital identifiers, or national IDs ever touch the phone.
3. **Strict Validation**: Validates file magic bytes (e.g. `%PDF-`, `\x89PNG`), not just browser-sent headers.
4. **Single-Use Guard**: Uploading locks the session into `UPLOADED`. Consuming locks the session into `CONSUMED`. Re-use returns `409 Conflict` or `410 Gone`.
5. **No Client MinIO Credentials**: MinIO access keys and endpoint secrets are isolated strictly on the backend.

---

## 🛠️ Running Locally & LAN Device Testing

### Option A: Local Testing (Same Computer)
By default, the module runs on `localhost`:
1. **Backend**:
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
- Kiosk Station: `http://localhost:5174/kiosk`

---

### Option B: Physical Mobile Device Testing (LAN / Wi-Fi Hotspot)
To test with a physical smartphone connected to the same Wi-Fi network or phone hotspot:

1. **Find your computer's Wi-Fi IPv4 address**:
   - Windows: `ipconfig` (e.g. `10.245.196.130` or `192.168.1.50`)
   - Mac/Linux: `ip a` or `ifconfig`

2. **Configure Backend (`backend/.env`)**:
   ```env
   LAN_HOST=10.245.196.130
   PUBLIC_WEB_URL=http://10.245.196.130:5174
   ```
   *This causes generated QR codes to embed your LAN IP instead of localhost, allowing smartphones to open the link.*

3. **Configure Frontend (`frontend/.env`)**:
   ```env
   VITE_API_BASE_URL=http://10.245.196.130:8010
   ```
   *This instructs the mobile web interface to route upload requests directly to the backend IP.*

4. **Start the servers**:
   - Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload`
   - Frontend: `npm run dev` (binds to `0.0.0.0:5174`)

5. **Open Kiosk on Laptop**:
   - Browse to `http://localhost:5174/kiosk` (or `http://10.245.196.130:5174/kiosk`).
   - Scan the QR code using your phone's camera.
   - The phone opens `http://10.245.196.130:5174/upload/<token>`.
   - Take a photo or pick a document and hit **Send to Kiosk**.
   - Watch the kiosk screen immediately update via Server-Sent Events (SSE).

---

### Run Automated Tests
```bash
cd backend
pytest -v tests/
```

---

## 🔗 Parent Application Integration Guide

When ready to integrate this module into a larger application (e.g. MediKiosk or another hospital EMR):

1. Deploy `kiosk-upload-module` as an internal microservice on port 8010.
2. In the parent application's kiosk UI:
   - Call `POST http://<upload-service>:8010/api/v1/sessions` passing `{ "metadata": { "encounter_id": "..." } }`.
   - Render the QR code using the returned `upload_url`.
   - Listen to SSE `http://<upload-service>:8010/api/v1/sessions/{id}/events`.
3. When status becomes `UPLOADED`, call `POST .../consume`.
4. Link the returned `storage_reference.object_key` to your parent application's database record.
