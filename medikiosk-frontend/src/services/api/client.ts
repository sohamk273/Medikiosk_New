/**
 * Centralized API client using native browser fetch.
 * Handles base URL configuration, headers, token attachment, and JSON parsing.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export interface ApiError {
  message: string;
  status: number;
  detail?: any;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Doctor JWT token if available
  const token = localStorage.getItem('medikiosk_doctor_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Centralized 401 Unauthorized handling for doctor session expiration
    if (response.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('medikiosk_doctor_token');
      localStorage.removeItem('medikiosk_doctor_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('medikiosk:auth-expired'));
      }
    }

    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore JSON parse error on non-JSON error response
    }

    const error: ApiError = {
      message: errorDetail || `Request failed with status ${response.status}`,
      status: response.status,
    };
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function apiFetchSafe<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const data = await apiFetch<T>(endpoint, options);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, data: null, error: err?.message || 'Request failed' };
  }
}
