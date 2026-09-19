/**
 * Client for interacting with the standalone Kiosk Document Upload Module.
 * Decoupled from patient identity - communicates via opaque integration references.
 */

export const UPLOAD_MODULE_BASE_URL = (
  import.meta.env.VITE_UPLOAD_MODULE_URL || 'http://localhost:8010'
).replace(/\/$/, '');

export interface StorageReference {
  bucket: string;
  object_key: string;
  file_name: string;
  content_type: string;
  file_size: number;
  sha256?: string;
}

export interface KioskUploadSession {
  session_id: string;
  id: string;
  upload_url: string;
  expires_at: string;
  expires_in_seconds?: number;
  ttl_seconds?: number;
  status: 'WAITING' | 'CONNECTED' | 'UPLOADING' | 'UPLOADED' | 'CONSUMED' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
  metadata?: {
    document_type?: string;
    parent_reference?: string;
    [key: string]: any;
  };
}

export interface ConsumeResponse {
  session_id: string;
  status: string;
  storage_reference: StorageReference;
  metadata?: Record<string, any>;
  consumed_at?: string;
}

export interface SSEEventData {
  status?: string;
  file_metadata?: {
    file_name: string;
    content_type: string;
    file_size: number;
    sha256?: string;
    uploaded_at?: string;
  };
  reason?: string;
  timestamp?: string;
}

/**
 * Creates a fresh upload session for acquiring a document.
 * Adheres to domain-agnostic constraint: NEVER sends patient_id.
 */
export async function createUploadSession(
  documentType: string,
  parentReference?: string
): Promise<KioskUploadSession> {
  const payload = {
    metadata: {
      document_type: documentType,
      ...(parentReference ? { parent_reference: parentReference } : {}),
    },
  };

  const response = await fetch(`${UPLOAD_MODULE_BASE_URL}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMessage = `Failed to create upload session (${response.status})`;
    try {
      const err = await response.json();
      if (err.detail) errMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMessage);
  }

  const raw = await response.json();
  const sid = raw.session_id || raw.id;
  return {
    ...raw,
    id: sid,
    session_id: sid,
    expires_in_seconds: raw.ttl_seconds || raw.expires_in_seconds || 600,
  };
}

/**
 * Consumes an uploaded session idempotently.
 * Returns the storage coordinates of the uploaded MinIO object.
 * Safe to retry if subsequent attach fails.
 */
export async function consumeUploadSession(sessionId: string): Promise<ConsumeResponse> {
  const response = await fetch(`${UPLOAD_MODULE_BASE_URL}/api/v1/sessions/${sessionId}/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let errMessage = `Failed to consume upload session (${response.status})`;
    try {
      const err = await response.json();
      if (err.detail) errMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return response.json();
}

/**
 * Cancels an in-flight upload session if the user switches category or navigates away.
 */
export async function cancelUploadSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${UPLOAD_MODULE_BASE_URL}/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    // Non-blocking cleanup failure
    console.warn(`Failed to cancel upload session ${sessionId}:`, e);
  }
}

/**
 * Fetches the current session state (used for verification or fallback polling).
 */
export async function getUploadSession(sessionId: string): Promise<KioskUploadSession> {
  const response = await fetch(`${UPLOAD_MODULE_BASE_URL}/api/v1/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch session (${response.status})`);
  }
  return response.json();
}

/**
 * Subscribes to live SSE events from the upload session.
 */
export function subscribeToSessionEvents(
  sessionId: string,
  onStatusChange: (event: SSEEventData) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${UPLOAD_MODULE_BASE_URL}/api/v1/sessions/${sessionId}/events`);

  const handleMessage = (e: MessageEvent) => {
    try {
      const data: SSEEventData = JSON.parse(e.data);
      onStatusChange(data);
    } catch {
      // Ignore heartbeat/ping formatting
    }
  };

  eventSource.addEventListener('status_change', handleMessage);
  eventSource.addEventListener('heartbeat', () => {
    // Keep-alive heartbeat
  });

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.removeEventListener('status_change', handleMessage);
    eventSource.close();
  };
}
