import { apiFetchSafe } from '@/services/api/client';
import type { DocumentType } from '@/features/patient/PatientSessionContext';

export interface DocumentRead {
  id: string;
  patient_id: string;
  encounter_id: string;
  file_name: string;
  content_type: string;
  file_size: number;
  storage_key: string;
  document_type?: string;
  processing_status: string;
  uploaded_at: string;
  updated_at: string;
}

export interface DocumentPresignedUrlResponse {
  document_id: string;
  file_name: string;
  content_type: string;
  url: string;
  expires_in: number;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Normalizes UI document type keys into backend-compatible category strings.
 */
export function mapDocTypeToBackend(type?: string | DocumentType): string {
  if (!type) return 'OTHER';
  switch (type.toLowerCase()) {
    case 'prescription':
      return 'PRESCRIPTION';
    case 'lab_report':
      return 'LAB_REPORT';
    case 'discharge_summary':
      return 'DISCHARGE_SUMMARY';
    case 'opd_slip':
      return 'OPD_SLIP';
    case 'diagnostic_report':
      return 'DIAGNOSTIC_REPORT';
    default:
      return type.toUpperCase().replace(/\s+/g, '_');
  }
}

/**
 * Validates a file before upload.
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const type = file.type?.toLowerCase() || '';
  const name = file.name.toLowerCase();
  const isValidType =
    ALLOWED_MIME_TYPES.includes(type) ||
    name.endsWith('.pdf') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg');

  if (!isValidType) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PDF, PNG, or JPG document.',
    };
  }

  return { valid: true };
}

/**
 * Uploads a real patient medical document to the FastAPI backend and MinIO.
 */
export async function uploadEncounterDocument(
  encounterId: string,
  file: File,
  documentType?: string | DocumentType
): Promise<{ ok: boolean; data: DocumentRead | null; error?: string; status?: number }> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    return { ok: false, data: null, error: validation.error, status: 400 };
  }

  const formData = new FormData();
  formData.append('file', file);
  if (documentType) {
    formData.append('document_type', mapDocTypeToBackend(documentType));
  }

  return await apiFetchSafe<DocumentRead>(`/encounters/${encounterId}/documents`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Lists all documents attached to a specific clinical encounter.
 */
export async function fetchEncounterDocuments(
  encounterId: string
): Promise<{ ok: boolean; data: DocumentRead[] | null; error?: string; status?: number }> {
  return await apiFetchSafe<DocumentRead[]>(`/encounters/${encounterId}/documents`, {
    method: 'GET',
  });
}

/**
 * Generates a short-lived MinIO presigned URL for secure doctor viewing.
 */
export async function fetchDocumentPresignedUrl(
  documentId: string
): Promise<{ ok: boolean; data: DocumentPresignedUrlResponse | null; error?: string; status?: number }> {
  return await apiFetchSafe<DocumentPresignedUrlResponse>(`/documents/${documentId}/url`, {
    method: 'GET',
  });
}

/**
 * Deletes a document from MinIO and PostgreSQL metadata.
 */
export async function deleteDocumentRecord(
  documentId: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  return await apiFetchSafe<void>(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}
