export type EvidenceSourceType =
  | 'patient_voice'
  | 'patient_touch'
  | 'scanned_prescription'
  | 'lab_report'
  | 'discharge_summary'
  | 'consultation_note'
  | 'patient_confirmation'
  | 'doctor_verified';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type VerificationStatus = 'needs_verification' | 'patient_confirmed' | 'doctor_verified' | 'discrepancy_flagged';

export interface EvidenceMetadata {
  sourceType: EvidenceSourceType;
  sourceLabel: string;
  sourceLabelHindi?: string;
  documentId?: string;
  documentTitle?: string;
  snippet?: string;
  pageNumber?: number;
  audioTimestamp?: string;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0 to 100
  extractedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ClinicalFact {
  id: string;
  category: 'chief_complaint' | 'symptom' | 'condition' | 'medication' | 'allergy' | 'lab_value' | 'ayush' | 'surgical_history';
  label: string;
  labelHindi?: string;
  value: string;
  valueHindi?: string;
  details?: Record<string, any>;
  evidence: EvidenceMetadata;
  status: VerificationStatus;
  isRedFlag?: boolean;
  isAbnormal?: boolean;
  hasDiscrepancy?: boolean;
}

export interface DiscrepancyItem {
  id: string;
  category: 'medication' | 'allergy' | 'timeline' | 'symptom';
  title: string;
  titleHindi?: string;
  description: string;
  severity: 'red_flag' | 'warning' | 'discrepancy' | 'verification_required';
  patientStatement: {
    text: string;
    source: string;
    timestamp: string;
  };
  documentEvidence: {
    text: string;
    documentTitle: string;
    snippet: string;
    date: string;
  };
  recommendedAction: string;
  status: 'active' | 'resolved' | 'acknowledged';
  resolvedResolution?: string;
}

export interface LabResultItem {
  id: string;
  testName: string;
  category: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  abnormalSeverity?: 'critical' | 'high' | 'low';
  clinicalSignificance: string;
  reportDate: string;
  labName: string;
  evidence: EvidenceMetadata;
  status: VerificationStatus;
}

export interface AyushParameterItem {
  parameter: string;
  parameterSanskrit: string;
  value: string;
  valueHindi: string;
  description: string;
  confidence: ConfidenceLevel;
  source: string;
  status: VerificationStatus;
  subCategories?: Record<string, string>;
}

export interface AyushCaseProfile {
  prakriti: AyushParameterItem;
  vikriti: AyushParameterItem;
  agni: AyushParameterItem;
  koshtha: AyushParameterItem;
  aharaVihara: AyushParameterItem;
  nidana: AyushParameterItem;
  samprapti: AyushParameterItem;
  dashavidhaPariksha: {
    dushya: string;
    desha: string;
    bala: string;
    kala: string;
    anala: string;
    prakriti: string;
    vayas: string;
    sattva: string;
    satmya: string;
    ahara: string;
  };
  completenessScore: number;
}

export interface TimelineEvent {
  id: string;
  year: string;
  date: string;
  title: string;
  titleHindi?: string;
  category: 'diagnosis' | 'medication' | 'surgery' | 'investigation' | 'hospitalization' | 'current_visit';
  description: string;
  clinicalFacts: ClinicalFact[];
  evidence: EvidenceMetadata;
  iconName: string;
  status: VerificationStatus;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: 'AI_EXTRACTED' | 'PATIENT_CONFIRMED' | 'DISCREPANCY_FLAGGED' | 'DOCTOR_VERIFIED' | 'FIELD_EDITED';
  factId: string;
  factLabel: string;
  source: string;
  userRole: 'AI_ENGINE' | 'PATIENT' | 'PHYSICIAN';
  detail: string;
  confidence?: ConfidenceLevel;
}

export interface MissingFieldItem {
  id: string;
  field: string;
  fieldHindi: string;
  question: string;
  questionHindi: string;
  category: string;
  options?: Array<{ id: string; label: string; labelHindi: string }>;
  resolved: boolean;
  resolvedValue?: string;
}

export interface CaseCompletenessState {
  score: number; // 0 - 100%
  completedFieldsCount: number;
  totalFieldsCount: number;
  missingFields: MissingFieldItem[];
}

export interface MultimodalInterviewTurn {
  turnId: number;
  questionId: string;
  question: string;
  questionHindi: string;
  questionMarathi?: string;
  simulatedPatientResponseVoice: {
    audioText: string;
    audioTextHindi: string;
    durationSec: number;
  };
  touchOptions: Array<{
    id: string;
    label: string;
    labelHindi: string;
    isRedFlag?: boolean;
  }>;
  extractedEntities: {
    symptoms: Array<{ name: string; duration?: string; severity?: string; trigger?: string }>;
    importantNegatives: string[];
    associatedSymptoms: string[];
    redFlags: string[];
  };
  aiUnderstoodSummary: {
    title: string;
    points: Array<{ label: string; value: string }>;
  };
}
