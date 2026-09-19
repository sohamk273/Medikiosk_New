export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'kn';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  character: string;
  subtext: string;
  fontClass?: string;
  greeting: string;
}

export type AuthMode = 'login' | 'register';
export type AuthMethod = 'abha' | 'phone';

export interface PatientProfile {
  status: number;
  firstName: string;
  lastName: string;
  phone: string;
  abhaId?: string;
  tokenNumber?: string;
  department?: string;
  queuePosition?: number;
  slotTime?: string;
  gender?: string;
  age?: number;
  photoUrl?: string;
}

export interface ABDMResponse {
  status: 1 | 0;
  message?: string;
  patient?: PatientProfile;
}

export interface ConsentState {
  dataCollection: boolean;
  voiceRecording: boolean;
  documentOcr: boolean;
  abdmShare: boolean;
}

export interface HistoryEntry {
  id: string;
  section: 'chief_complaint' | 'hpi' | 'pmh' | 'drug_allergy' | 'family' | 'personal' | 'ros';
  fieldKey: string;
  question: string;
  answer: string;
  confidence?: number;
  isRedFlag?: boolean;
}

export interface AyushEntry {
  fieldKey: string;
  label: string;
  value: string;
}

export interface DocumentEntity {
  type: 'diagnosis' | 'medication' | 'lab_value' | 'procedure';
  name: string;
  value: string;
  unit?: string;
  isAbnormal?: boolean;
  date?: string;
}

export interface DocumentItem {
  id: string;
  fileName: string;
  docType: 'prescription' | 'lab_report' | 'discharge_summary';
  previewUrl: string;
  ocrText: string;
  entities: DocumentEntity[];
  uploadedAt: string;
}

export interface RedFlagAlert {
  triggered: boolean;
  symptom: string;
  severity: 'high' | 'critical';
  rule: string;
  triageRoom: string;
}

export interface OPDToken {
  tokenNumber: string;
  department: string;
  doctorName: string;
  roomNumber: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  qrCodeData: string;
}

