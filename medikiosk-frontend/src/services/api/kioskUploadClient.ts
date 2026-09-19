/**
 * API client for interacting with the QR Kiosk Upload microservice (port 8010).
 * Handles ephemeral session creation, SSE realtime event subscription, and session consumption.
 */

export interface KioskUploadSession {
  session_id: string;
  status: 'WAITING' | 'CONNECTED' | 'UPLOADING' | 'UPLOADED' | 'CONSUMED' | 'EXPIRED' | 'FAILED';
  upload_url: string;
  expires_at: string;
  created_at: string;
  ttl_seconds?: number;
}

export interface KioskFileMetadata {
  file_name: string;
  content_type: string;
  file_size: number;
  sha256: string;
  uploaded_at?: string;
}

export interface KioskStorageReference {
  bucket: string;
  object_key: string;
  content_type: string;
  file_size: number;
  sha256: string;
  file_name: string;
}

export interface KioskConsumeResponse {
  session_id: string;
  status: string;
  storage_reference: KioskStorageReference;
  metadata?: Record<string, any>;
  consumed_at: string;
}

// Upload microservice base URL (defaults to http://localhost:8010/api/v1)
const UPLOAD_API_BASE = (
  (import.meta as any).env?.VITE_UPLOAD_API_URL || 'http://localhost:8010'
).replace(/\/+$/, '') + '/api/v1';

export async function createKioskUploadSession(
  ttlSeconds: number = 600,
  metadata?: Record<string, any>
): Promise<KioskUploadSession> {
  const res = await fetch(`${UPLOAD_API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: ttlSeconds, metadata }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create upload session' }));
    throw new Error(err.detail || 'Failed to create upload session');
  }
  return res.json();
}

export async function getKioskSession(sessionId: string): Promise<any> {
  const res = await fetch(`${UPLOAD_API_BASE}/sessions/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch upload session' }));
    throw new Error(err.detail || 'Failed to fetch upload session');
  }
  return res.json();
}

export async function consumeKioskSession(sessionId: string): Promise<KioskConsumeResponse> {
  const res = await fetch(`${UPLOAD_API_BASE}/sessions/${sessionId}/consume`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to consume upload session' }));
    throw new Error(err.detail || 'Failed to consume upload session');
  }
  return res.json();
}

export async function getKioskPreviewUrl(sessionId: string): Promise<{ url: string | null; available: boolean; file_name?: string }> {
  const res = await fetch(`${UPLOAD_API_BASE}/sessions/${sessionId}/preview-url`);
  if (!res.ok) return { url: null, available: false };
  return res.json();
}

export function createKioskEventSource(sessionId: string): EventSource {
  return new EventSource(`${UPLOAD_API_BASE}/sessions/${sessionId}/events`);
}
