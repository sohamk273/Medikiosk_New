/**
 * API client helper functions for Kiosk and Mobile flows.
 */

export interface SessionCreated {
  session_id: string;
  status: string;
  upload_url: string;
  expires_at: string;
  created_at: string;
  ttl_seconds?: number;
}

export interface FileMetadata {
  file_name: string;
  content_type: string;
  file_size: number;
  sha256: string;
  uploaded_at?: string;
}

export interface SessionDetail {
  session_id: string;
  status: string;
  file_metadata?: FileMetadata | null;
  expires_at: string;
  created_at: string;
  consumed_at?: string | null;
  error_reason?: string | null;
  metadata?: Record<string, any>;
}

export interface HandshakeResponse {
  session_id: string;
  status: string;
  allowed_types: string[];
  max_size_mb: number;
  expires_at: string;
}

export interface ConsumeResponse {
  session_id: string;
  status: string;
  storage_reference: {
    bucket: string;
    object_key: string;
    content_type: string;
    file_size: number;
    sha256: string;
  };
  metadata?: Record<string, any>;
  consumed_at: string;
}

/**
 * Base API URL resolution.
 * If VITE_API_BASE_URL is provided (e.g. 'http://192.168.1.100:8010'), use it directly.
 * Otherwise, fall back to relative '/api/v1' which is proxied by the local Vite dev server.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== '')
  ? `${import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

export async function createUploadSession(ttlSeconds: number = 600, metadata?: Record<string, any>): Promise<SessionCreated> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: ttlSeconds, metadata }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create session' }));
    throw new Error(err.detail || 'Failed to create session');
  }
  return res.json();
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch session' }));
    throw new Error(err.detail || 'Failed to fetch session');
  }
  return res.json();
}

export async function getPreviewUrl(sessionId: string): Promise<{ url: string | null; available: boolean; file_name?: string }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/preview-url`);
  if (!res.ok) return { url: null, available: false };
  return res.json();
}

export async function consumeSession(sessionId: string): Promise<ConsumeResponse> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/consume`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to consume session' }));
    throw new Error(err.detail || 'Failed to consume session');
  }
  return res.json();
}

export async function mobileHandshake(token: string): Promise<HandshakeResponse> {
  const res = await fetch(`${API_BASE}/upload/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Session expired or invalid' }));
    throw new Error(err.detail || 'Invalid upload token');
  }
  return res.json();
}

export function uploadFileWithProgress(
  token: string,
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<{ status: string; message: string; file_name: string; file_size: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', `${API_BASE}/upload/${token}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve({ status: 'UPLOADED', message: 'Uploaded successfully', file_name: file.name, file_size: file.size });
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}
