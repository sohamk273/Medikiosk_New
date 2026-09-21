import type { ClinicalCaseState, ClinicalTurnResponse, ConversationTurnRecord, ClinicalEncounterRead } from '@/services/clinical/clinicalService';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import { finalizeClinicalEncounter } from '@/services/clinical/clinicalService';
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';
export type IdentityMethod = 'abha' | 'opd' | 'new' | null;
export type VoiceInputMethod = 'voice' | 'touch';

export interface PatientProfile {
  id?: string;
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  district?: string;
  state?: string;
}

export interface ConsentState {
  accepted: boolean;
  timestamp?: string;
}

export interface ChiefComplaintState {
  primaryComplaint: string;
  voiceTranscript?: string;
}

export interface VoiceResponse {
  questionId: string;
  question: string;
  questionHindi: string;
  inputMethod: VoiceInputMethod;
  transcript?: string;       // set when inputMethod === 'voice'
  selectedOption?: string;   // set when inputMethod === 'touch'
  selectedOptions?: string[]; // set for multi-select options
  confirmed: boolean;
  timestamp: string;
  isRedFlag: boolean;
}

export interface VoiceIntakeState {
  currentQuestionIndex: number;
  responses: VoiceResponse[];
  activeInputMethod?: VoiceInputMethod;
  activeTranscript?: string;
  activeSelectedOption?: string;
  activeSelectedOptions?: string[];
  pendingConfirmation: boolean;
  activeIsRedFlag: boolean;
  completed: boolean;
  redFlagTriggered: boolean;
  staffNotified: boolean;
}

const defaultVoiceIntake: VoiceIntakeState = {
  currentQuestionIndex: 0,
  responses: [],
  activeInputMethod: undefined,
  activeTranscript: undefined,
  activeSelectedOption: undefined,
  activeSelectedOptions: undefined,
  pendingConfirmation: false,
  activeIsRedFlag: false,
  completed: false,
  redFlagTriggered: false,
  staffNotified: false,
};

// ─── Slice 4b: Appointment Scheduling ───────────────────────────────────────

export interface AppointmentState {
  date: string;          // e.g. 'Today'
  timeSlot: string;      // e.g. '03:30 PM'
  doctorName: string;    // 'Dr. Priya Sharma'
  roomNumber: string;    // 'Room 4'
  department: string;    // 'Smart OPD & AYUSH'
  confirmed: boolean;
}

const defaultAppointmentState: AppointmentState = {
  date: 'Today',
  timeSlot: '03:30 PM',
  doctorName: 'Dr. Priya Sharma',
  roomNumber: 'Room 4',
  department: 'Smart OPD & AYUSH',
  confirmed: false,
};

// ─── Slice 5: AYUSH, Medication, Allergy ─────────────────────────────────────

export interface AyushResponse {
  questionId: string;
  question: string;
  questionHindi: string;
  answer: string;
  answerHindi?: string;
  ayushField: string;
  timestamp: string;
}

export interface AyushIntakeState {
  currentQuestionIndex: number;
  responses: AyushResponse[];
  completed: boolean;
}

export interface MedicationHistory {
  takingMedicines: 'yes_daily' | 'yes_sometimes' | 'no' | 'not_sure' | null;
  medicines?: string;
  timestamp?: string;
}

export interface AllergyHistory {
  hasAllergy: 'yes' | 'no' | 'not_sure' | null;
  allergyType?: string;
  reaction?: string;
  breathingDifficulty?: boolean;
  timestamp?: string;
}

const defaultAyushIntake: AyushIntakeState = {
  currentQuestionIndex: 0,
  responses: [],
  completed: false,
};

const defaultMedicationHistory: MedicationHistory = {
  takingMedicines: null,
};

const defaultAllergyHistory: AllergyHistory = {
  hasAllergy: null,
};

// ─── Slice 6: Documents ──────────────────────────────────────────────────────

export type DocumentType =
  | 'prescription'
  | 'lab_report'
  | 'discharge_summary'
  | 'opd_slip'
  | 'other';

export interface PatientDocument {
  id: string;
  type: DocumentType;
  title: string;
  titleHindi: string;
  fileName?: string;
  fileSize?: number;
  status: 'scanned' | 'reviewed' | 'uploaded' | 'failed';
  timestamp: string;
  mockOcrText?: string;
  file?: File;
  backendDocId?: string;
  storageKey?: string;
  error?: string;
}

export interface DocumentIntakeState {
  documents: PatientDocument[];
  currentDocumentType: DocumentType | null;
  completed: boolean;
}

const defaultDocumentIntake: DocumentIntakeState = {
  documents: [],
  currentDocumentType: null,
  completed: false,
};

// ─── Slice 7: Review ────────────────────────────────────────────────────────

export interface ReviewState {
  confirmed: boolean;
  confirmedAt?: string;
}

const defaultReviewState: ReviewState = {
  confirmed: false,
};

// ─── Slice 8: Submission ──────────────────────────────────────────────────────

export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  caseId?: string;
  submittedAt?: string;
}

const defaultSubmissionState: SubmissionState = {
  status: 'idle',
};

// ─── Slice 10: Consultation ───────────────────────────────────────────────────

export interface ClinicalAssessment {
  findings: string;
  assessment: string;
  diagnosis: string;
  notes: string;
}

export interface AyushDoctorAssessment {
  prakriti: string;
  agni: string;
  koshtha: string;
  dosha: string;
  notes: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  items: PrescriptionItem[];
}

export interface FollowUpPlan {
  required: boolean;
  timeframe: string;
  instructions: string;
}

export interface ConsultationState {
  status: 'idle' | 'draft' | 'finalized';
  ayushStatus?: 'pending' | 'in-progress' | 'draft' | 'completed';
  clinicalAssessment: ClinicalAssessment;
  ayushAssessment: AyushDoctorAssessment;
  prescription: Prescription;
  followUp: FollowUpPlan;
  startedAt?: string;
  updatedAt?: string;
  finalizedAt?: string;
  ayushFinalizedAt?: string;
}

const defaultConsultationState: ConsultationState = {
  status: 'idle',
  ayushStatus: 'pending',
  clinicalAssessment: { findings: '', assessment: '', diagnosis: '', notes: '' },
  ayushAssessment: { prakriti: '', agni: '', koshtha: '', dosha: '', notes: '' },
  prescription: { items: [] },
  followUp: { required: false, timeframe: '', instructions: '' },
};

// ─── Slice 11: Case Closure ─────────────────────────────────────────────────

export interface CaseClosureState {
  acknowledged: boolean;
  closed: boolean;
  closedAt?: string;
}

const defaultCaseClosureState: CaseClosureState = {
  acknowledged: false,
  closed: false,
};

// ─── Full Session State ─────────────────────────────────────────────────────

export interface PatientSessionState {
  priority: 'NORMAL' | 'CRITICAL';
  emergencyStatus: 'NONE' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';
  emergencyReason?: string;
  emergencyTriggeredAt?: string;

  language: Language;
  identificationMethod: IdentityMethod;
  abhaId: string;
  patient: PatientProfile | null;
  audioEnabled: boolean;
  consent: ConsentState;
  chiefComplaint: ChiefComplaintState;
  voiceIntake: VoiceIntakeState;
  appointment: AppointmentState;
  ayushIntake: AyushIntakeState;
  medicationHistory: MedicationHistory;
  allergyHistory: AllergyHistory;
  documentIntake: DocumentIntakeState;
  review: ReviewState;
  submission: SubmissionState;
  consultation: ConsultationState;
  caseClosure: CaseClosureState;

  // Backend Relational Identifiers (Stage 2)
  patientId?: string;
  uhid?: string;
  encounterId?: string;
  queueEntryId?: string;
  tokenNumber?: number;

  // Stage 4 & Stage 5: Conversational Clinical Intelligence State
  clinicalCaseState: ClinicalCaseState | null;
  lastClinicalTurn: ClinicalTurnResponse | null;
  conversationHistory: ConversationTurnRecord[];
  currentConversationTurn: number;
  activeQuestionText?: string;
  activeQuestionType?: string;
  isConversationalIntakeComplete: boolean;

  // Stage 6: Persistent Record & Summary State
  finalClinicalSummary?: string;
  isCaseFinalized?: boolean;
  persistedCaseRecord?: ClinicalEncounterRead | null;
}

export interface PatientSessionContextType extends PatientSessionState {
  // Slice 1-3 setters
  setLanguage: (lang: Language) => void;
  setIdentificationMethod: (method: IdentityMethod) => void;
  setAbhaId: (id: string) => void;
  setPatient: (patient: PatientProfile | null) => void;
  updatePatientField: (field: keyof PatientProfile, value: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setConsent: (consent: ConsentState) => void;
  setChiefComplaint: (complaint: ChiefComplaintState) => void;
  clearSession: () => void;
  
  // Emergency setters
  triggerEmergency: (reason: string) => void;
  acknowledgeEmergency: () => void;

  // Backend Relational setters (Stage 2)
  setPatientId: (id?: string) => void;
  setUhid: (uhid?: string) => void;
  setEncounterId: (id?: string) => void;
  setQueueEntryId: (id?: string) => void;
  setTokenNumber: (token?: number) => void;

  // Slice 4: Voice Intake setters
  setActiveVoiceInput: (method: VoiceInputMethod) => void;
  setActiveTranscript: (transcript: string, isRedFlag: boolean) => void;
  setActiveSelectedOption: (option: string, isRedFlag: boolean) => void;
  setActiveSelectedOptions: (options: string[], isRedFlag: boolean) => void;
  setVoiceQuestionIndex: (index: number) => void;
  setPendingConfirmation: (pending: boolean) => void;
  addVoiceResponse: (response: VoiceResponse) => void;
  advanceVoiceQuestion: () => void;
  resetActiveVoiceResponse: () => void;
  setRedFlagTriggered: (triggered: boolean) => void;
  setStaffNotified: (notified: boolean) => void;
  setVoiceIntakeCompleted: (completed: boolean) => void;

  // Slice 4b: Appointment setters
  setAppointmentSlot: (timeSlot: string) => void;
  confirmAppointment: () => void;

  // Slice 5: AYUSH setters
  setAyushIntake: (state: AyushIntakeState) => void;
  addAyushResponse: (response: AyushResponse) => void;
  advanceAyushQuestion: (index: number) => void;
  setMedicationHistory: (history: MedicationHistory) => void;
  setAllergyHistory: (history: AllergyHistory) => void;

  // Slice 6: Document setters
  addDocument: (doc: PatientDocument) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<PatientDocument>) => void;
  setCurrentDocumentType: (type: DocumentType | null) => void;
  setDocumentIntake: (state: DocumentIntakeState) => void;
  completeDocumentIntake: (completed: boolean) => void;

  // Slice 7: Review setters
  setReviewConfirmed: (confirmed: boolean) => void;

  // Slice 8: Submission setters
  startSubmission: () => void;
  completeSubmission: (caseId: string) => void;
  failSubmission: () => void;
  resetSubmission: () => void;

  // Slice 10: Consultation setters
  startConsultation: () => void;
  updateClinicalAssessment: (assessment: Partial<ClinicalAssessment>) => void;
  updateAyushAssessment: (assessment: Partial<AyushDoctorAssessment>) => void;
  addPrescriptionItem: () => void;
  updatePrescriptionItem: (id: string, updates: Partial<PrescriptionItem>) => void;
  removePrescriptionItem: (id: string) => void;
  setFollowUp: (followUp: Partial<FollowUpPlan>) => void;
  saveConsultationDraft: () => void;
  finalizeConsultation: () => void;
  loadConsultation: (consultation: ConsultationState) => void;
  resetConsultation: () => void;

  // Slice 11: Case Closure setters
  setCaseAcknowledged: (acknowledged: boolean) => void;
  closeCase: () => void;
  resetCaseClosure: () => void;
  setClinicalCaseState: (caseState: ClinicalCaseState | null) => void;
  setLastClinicalTurn: (turn: ClinicalTurnResponse | null) => void;
  updateClinicalCase: (turn: ClinicalTurnResponse) => void;
  addConversationTurn: (record: ConversationTurnRecord) => void;
  advanceConversationTurn: () => void;
  resetConversationTurns: () => void;

  // Stage 6: Finalization
  setFinalClinicalSummary: (summary: string) => void;
  finalizeEncounter: () => Promise<ClinicalEncounterRead | null>;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('medikiosk_language') as Language;
    if (saved === 'en' || saved === 'hi' || saved === 'mr') return saved;
  }
  return 'en';
};

const getInitialAudioEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('medikiosk_audio_enabled') !== 'false';
  }
  return true;
};

const defaultState: PatientSessionState = {
  priority: 'NORMAL',
  emergencyStatus: 'NONE',
  emergencyReason: undefined,
  emergencyTriggeredAt: undefined,

  language: getInitialLanguage(),
  identificationMethod: 'abha',
  abhaId: '91-4820-8834-1290',
  patient: {
    id: 'pat-demo-rajesh-001',
    name: 'Rajesh Sharma',
    age: '52',
    gender: 'Male',
    mobile: '9876543210',
    district: 'Pune',
    state: 'Maharashtra',
  },
  audioEnabled: getInitialAudioEnabled(),
  consent: { accepted: true },
  chiefComplaint: {
    primaryComplaint: 'Burning sensation in the upper abdomen, worse after meals.',
    voiceTranscript: 'I have had a burning sensation in my stomach for 5 days, and it gets worse after eating.',
  },
  voiceIntake: defaultVoiceIntake,
  appointment: defaultAppointmentState,
  ayushIntake: defaultAyushIntake,
  medicationHistory: defaultMedicationHistory,
  allergyHistory: defaultAllergyHistory,
  documentIntake: defaultDocumentIntake,
  review: defaultReviewState,
  submission: defaultSubmissionState,
  consultation: defaultConsultationState,
  caseClosure: defaultCaseClosureState,
  patientId: 'pat-demo-rajesh-001',
  uhid: 'UHID-2026-DL-8834',
  encounterId: undefined,
  queueEntryId: undefined,
  tokenNumber: 42,
  clinicalCaseState: null,
  lastClinicalTurn: null,
  conversationHistory: [],
  currentConversationTurn: 1,
  activeQuestionText: undefined,
  activeQuestionType: undefined,
  isConversationalIntakeComplete: false,
  finalClinicalSummary: undefined,
  isCaseFinalized: false,
  persistedCaseRecord: null,
};

const PatientSessionContext = createContext<PatientSessionContextType | undefined>(undefined);

export function PatientSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PatientSessionState>(defaultState);

  // ─── Slice 1-3 setters ──────────────────────────────────────────────────
  const setLanguage = (language: Language) =>
    setState(s => ({ ...s, language }));

  const setIdentificationMethod = (identificationMethod: IdentityMethod) =>
    setState(s => ({ ...s, identificationMethod }));

  const setAbhaId = (abhaId: string) =>
    setState(s => ({ ...s, abhaId }));

  const setPatient = (patient: PatientProfile | null) =>
    setState(s => ({ ...s, patient }));

  const updatePatientField = (field: keyof PatientProfile, value: string) =>
    setState(s => ({
      ...s,
      patient: s.patient
        ? { ...s.patient, [field]: value }
        : { id: '', name: '', age: '', gender: 'Male', mobile: '', [field]: value },
    }));

  const setAudioEnabled = (audioEnabled: boolean) =>
    setState(s => ({ ...s, audioEnabled }));

  const setConsent = (consent: ConsentState) =>
    setState(s => ({ ...s, consent }));

  const setChiefComplaint = (chiefComplaint: ChiefComplaintState) =>
    setState(s => ({ ...s, chiefComplaint }));

  const clearSession = () => setState(defaultState);

  // ─── Emergency Setters ──────────────────────────────────────────────────
  const triggerEmergency = (reason: string) => {
    setState(s => {
      const newState = {
        ...s,
        priority: 'CRITICAL' as const,
        emergencyStatus: 'TRIGGERED' as const,
        emergencyReason: reason,
        emergencyTriggeredAt: new Date().toISOString()
      };
      
      // Inject into dashboard mock state
      MockDoctorCaseProvider.injectEmergencyCase(newState);
      
      return newState;
    });
  };

  const acknowledgeEmergency = () =>
    setState(s => ({ 
      ...s, 
      priority: 'NORMAL' as const,
      emergencyStatus: 'ACKNOWLEDGED' as const 
    }));

  // Stage 2 Relational setters
  const setPatientId = (patientId?: string) =>
    setState(s => ({ ...s, patientId }));

  const setUhid = (uhid?: string) =>
    setState(s => ({ ...s, uhid }));

  const setEncounterId = (encounterId?: string) =>
    setState(s => ({ ...s, encounterId }));

  const setQueueEntryId = (queueEntryId?: string) =>
    setState(s => ({ ...s, queueEntryId }));

  const setTokenNumber = (tokenNumber?: number) =>
    setState(s => ({ ...s, tokenNumber }));

  // ─── Slice 4: Voice Intake setters ──────────────────────────────────────

  const setActiveVoiceInput = (method: VoiceInputMethod) =>
    setState(s => ({
      ...s,
      voiceIntake: { ...s.voiceIntake, activeInputMethod: method },
    }));

  const setActiveTranscript = (transcript: string, isRedFlag: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: {
        ...s.voiceIntake,
        activeTranscript: transcript,
        activeIsRedFlag: isRedFlag,
        pendingConfirmation: true,
      },
    }));

  const setActiveSelectedOption = (option: string, isRedFlag: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: {
        ...s.voiceIntake,
        activeSelectedOption: option,
        activeSelectedOptions: [option],
        activeIsRedFlag: isRedFlag,
        pendingConfirmation: true,
      },
    }));

  const setActiveSelectedOptions = (options: string[], isRedFlag: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: {
        ...s.voiceIntake,
        activeSelectedOptions: options,
        activeSelectedOption: options.join(', '),
        activeIsRedFlag: isRedFlag,
        pendingConfirmation: true,
      },
    }));

  const setVoiceQuestionIndex = (index: number) =>
    setState(s => ({
      ...s,
      currentConversationTurn: index + 1,
      voiceIntake: {
        ...s.voiceIntake,
        currentQuestionIndex: index,
        activeInputMethod: undefined,
        activeTranscript: undefined,
        activeSelectedOption: undefined,
        activeSelectedOptions: undefined,
        pendingConfirmation: false,
        activeIsRedFlag: false,
      },
    }));

  const setPendingConfirmation = (pending: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: { ...s.voiceIntake, pendingConfirmation: pending },
    }));

  const addVoiceResponse = (response: VoiceResponse) =>
    setState(s => ({
      ...s,
      voiceIntake: {
        ...s.voiceIntake,
        responses: [
          // Replace any existing unconfirmed response for this question
          ...s.voiceIntake.responses.filter(r => r.questionId !== response.questionId),
          response,
        ],
        redFlagTriggered: s.voiceIntake.redFlagTriggered || response.isRedFlag,
      },
    }));

  const advanceVoiceQuestion = () =>
    setState(s => ({
      ...s,
      currentConversationTurn: Math.min(s.currentConversationTurn + 1, 8),
      voiceIntake: {
        ...s.voiceIntake,
        currentQuestionIndex: Math.min(s.voiceIntake.currentQuestionIndex + 1, 7),
        activeInputMethod: undefined,
        activeTranscript: undefined,
        activeSelectedOption: undefined,
        activeSelectedOptions: undefined,
        pendingConfirmation: false,
        activeIsRedFlag: false,
      },
    }));

  const resetActiveVoiceResponse = () =>
    setState(s => ({
      ...s,
      voiceIntake: {
        ...s.voiceIntake,
        activeInputMethod: undefined,
        activeTranscript: undefined,
        activeSelectedOption: undefined,
        activeSelectedOptions: undefined,
        pendingConfirmation: false,
        activeIsRedFlag: false,
      },
    }));

  const setRedFlagTriggered = (triggered: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: { ...s.voiceIntake, redFlagTriggered: triggered },
    }));

  const setStaffNotified = (notified: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: { ...s.voiceIntake, staffNotified: notified },
    }));

  const setVoiceIntakeCompleted = (completed: boolean) =>
    setState(s => ({
      ...s,
      voiceIntake: { ...s.voiceIntake, completed },
    }));

  // ─── Slice 4b: Appointment setters ───────────────────────────────────────

  const setAppointmentSlot = (timeSlot: string) =>
    setState(s => ({
      ...s,
      appointment: { ...s.appointment, timeSlot },
    }));

  const confirmAppointment = () =>
    setState(s => ({
      ...s,
      appointment: { ...s.appointment, confirmed: true },
    }));

  // ─── Slice 5: AYUSH setters ───────────────────────────────────────────────

  const setAyushIntake = (ayushIntake: AyushIntakeState) =>
    setState(s => ({ ...s, ayushIntake }));

  const addAyushResponse = (response: AyushResponse) =>
    setState(s => {
      // Avoid duplicates for the same question
      const existing = s.ayushIntake.responses.filter(r => r.questionId !== response.questionId);
      return {
        ...s,
        ayushIntake: {
          ...s.ayushIntake,
          responses: [...existing, response],
        },
      };
    });

  const advanceAyushQuestion = (index: number) =>
    setState(s => ({
      ...s,
      ayushIntake: { ...s.ayushIntake, currentQuestionIndex: index },
    }));

  const setMedicationHistory = (medicationHistory: MedicationHistory) =>
    setState(s => ({ ...s, medicationHistory }));

  const setAllergyHistory = (allergyHistory: AllergyHistory) =>
    setState(s => ({ ...s, allergyHistory }));

  // ─── Slice 6: Document setters ───────────────────────────────────────────

  const addDocument = (doc: PatientDocument) =>
    setState(s => ({
      ...s,
      documentIntake: {
        ...s.documentIntake,
        documents: [...s.documentIntake.documents, doc],
      }
    }));

  const removeDocument = (id: string) =>
    setState(s => ({
      ...s,
      documentIntake: {
        ...s.documentIntake,
        documents: s.documentIntake.documents.filter(d => d.id !== id),
      }
    }));

  const updateDocument = (id: string, updates: Partial<PatientDocument>) =>
    setState(s => ({
      ...s,
      documentIntake: {
        ...s.documentIntake,
        documents: s.documentIntake.documents.map(d => 
          d.id === id ? { ...d, ...updates } : d
        ),
      }
    }));

  const setCurrentDocumentType = (type: DocumentType | null) =>
    setState(s => ({
      ...s,
      documentIntake: { ...s.documentIntake, currentDocumentType: type },
    }));

  const setDocumentIntake = (documentIntake: DocumentIntakeState) =>
    setState(s => ({ ...s, documentIntake }));

  const completeDocumentIntake = (completed: boolean) =>
    setState(s => ({
      ...s,
      documentIntake: { ...s.documentIntake, completed },
    }));

  // ─── Slice 7: Review setters ─────────────────────────────────────────────

  const setReviewConfirmed = (confirmed: boolean) =>
    setState(s => ({
      ...s,
      review: {
        confirmed,
        confirmedAt: confirmed ? new Date().toISOString() : undefined,
      }
    }));

  // ─── Slice 8: Submission setters ─────────────────────────────────────────

  const startSubmission = () =>
    setState(s => ({
      ...s,
      submission: {
        ...s.submission,
        status: 'submitting',
      }
    }));

  const completeSubmission = (caseId: string) =>
    setState(s => ({
      ...s,
      submission: {
        status: 'success',
        caseId,
        submittedAt: new Date().toISOString(),
      }
    }));

  const failSubmission = () =>
    setState(s => ({
      ...s,
      submission: {
        ...s.submission,
        status: 'error',
      }
    }));

  const resetSubmission = () =>
    setState(s => ({
      ...s,
      submission: defaultSubmissionState,
    }));

  // ─── Slice 10: Consultation setters ──────────────────────────────────────

  const startConsultation = () =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        status: s.consultation.status === 'idle' ? 'draft' : s.consultation.status,
        startedAt: s.consultation.startedAt || new Date().toISOString(),
      }
    }));

  const updateClinicalAssessment = (assessment: Partial<ClinicalAssessment>) =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        clinicalAssessment: { ...s.consultation.clinicalAssessment, ...assessment },
      }
    }));

  const updateAyushAssessment = (assessment: Partial<AyushDoctorAssessment>) =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        ayushAssessment: { ...s.consultation.ayushAssessment, ...assessment },
      }
    }));

  const addPrescriptionItem = () =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        prescription: {
          ...s.consultation.prescription,
          items: [
            ...s.consultation.prescription.items,
            {
              id: crypto.randomUUID(),
              medicineName: '',
              dosage: '',
              frequency: '',
              duration: '',
              instructions: '',
            }
          ]
        }
      }
    }));

  const updatePrescriptionItem = (id: string, updates: Partial<PrescriptionItem>) =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        prescription: {
          ...s.consultation.prescription,
          items: s.consultation.prescription.items.map(item => 
            item.id === id ? { ...item, ...updates } : item
          ),
        }
      }
    }));

  const removePrescriptionItem = (id: string) =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        prescription: {
          ...s.consultation.prescription,
          items: s.consultation.prescription.items.filter(item => item.id !== id),
        }
      }
    }));

  const setFollowUp = (followUp: Partial<FollowUpPlan>) =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        followUp: { ...s.consultation.followUp, ...followUp },
      }
    }));

  const saveConsultationDraft = () =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      }
    }));

  const finalizeConsultation = () =>
    setState(s => ({
      ...s,
      consultation: {
        ...s.consultation,
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
      }
    }));

  const loadConsultation = (consultation: ConsultationState) =>
    setState(s => ({
      ...s,
      consultation,
    }));

  const resetConsultation = () =>
    setState(s => ({
      ...s,
      consultation: defaultConsultationState,
    }));

  // ─── Slice 11: Case Closure setters ──────────────────────────────────────

  const setCaseAcknowledged = (acknowledged: boolean) =>
    setState(s => ({
      ...s,
      caseClosure: { ...s.caseClosure, acknowledged }
    }));

  const closeCase = () =>
    setState(s => ({
      ...s,
      caseClosure: {
        acknowledged: true,
        closed: true,
        closedAt: new Date().toISOString(),
      }
    }));

  const resetCaseClosure = () =>
    setState(s => ({
      ...s,
      caseClosure: defaultCaseClosureState,
    }));

  // ─── Stage 4: Clinical Intelligence Setters ──────────────────────────────
  const setClinicalCaseState = (caseState: ClinicalCaseState | null) =>
    setState(s => ({ ...s, clinicalCaseState: caseState }));

  const setLastClinicalTurn = (turn: ClinicalTurnResponse | null) =>
    setState(s => ({ ...s, lastClinicalTurn: turn }));

  const updateClinicalCase = (turn: ClinicalTurnResponse) =>
    setState(s => ({
      ...s,
      clinicalCaseState: turn.case_state,
      lastClinicalTurn: turn,
      activeQuestionText: turn.next_question_regional || turn.next_question,
      activeQuestionType: turn.next_question_type,
      isConversationalIntakeComplete: turn.is_case_complete,
      chiefComplaint: turn.case_state.chief_complaint
        ? { ...s.chiefComplaint, primaryComplaint: turn.case_state.chief_complaint }
        : s.chiefComplaint,
      voiceIntake: {
        ...s.voiceIntake,
        redFlagTriggered: s.voiceIntake.redFlagTriggered || turn.requires_emergency_attention,
      },
    }));

  const addConversationTurn = (record: ConversationTurnRecord) =>
    setState(s => ({
      ...s,
      conversationHistory: [...s.conversationHistory, record],
    }));

  const advanceConversationTurn = () =>
    setState(s => ({
      ...s,
      currentConversationTurn: Math.min(s.currentConversationTurn + 1, 8),
      voiceIntake: {
        ...s.voiceIntake,
        currentQuestionIndex: Math.min(s.voiceIntake.currentQuestionIndex + 1, 7),
        activeTranscript: '',
        activeSelectedOption: undefined,
        activeSelectedOptions: undefined,
      },
    }));

  const resetConversationTurns = () =>
    setState(s => ({
      ...s,
      conversationHistory: [],
      currentConversationTurn: 1,
      activeQuestionText: undefined,
      activeQuestionType: undefined,
      isConversationalIntakeComplete: false,
    }));

  const setFinalClinicalSummary = (summary: string) =>
    setState(s => ({ ...s, finalClinicalSummary: summary }));

  const finalizeEncounter = async (): Promise<ClinicalEncounterRead | null> => {
    try {
      const isEmergency =
        state.lastClinicalTurn?.requires_emergency_attention ||
        state.voiceIntake.redFlagTriggered ||
        false;

      const turnsPayload = state.conversationHistory.map((item, idx) => ({
        turn_number: item.turn || idx + 1,
        question: item.question,
        question_type: item.question_type || 'GENERAL',
        patient_transcript: item.patient_transcript,
        language: item.language || state.language || 'en',
        extracted_entities: {},
      }));

      const result = await finalizeClinicalEncounter({
        encounter_id: state.encounterId || undefined,
        patient_id: state.patientId || undefined,
        case_state: state.clinicalCaseState || undefined,
        conversation_history: turnsPayload,
        language: state.language || 'en',
        is_emergency: isEmergency,
      });

      setState(s => ({
        ...s,
        encounterId: s.encounterId || result.id,
        finalClinicalSummary: result.final_summary,
        persistedCaseRecord: result,
        isCaseFinalized: true,
        voiceIntake: {
          ...s.voiceIntake,
          completed: true,
          redFlagTriggered: s.voiceIntake.redFlagTriggered || result.is_emergency,
        },
      }));

      return result;
    } catch (err) {
      console.error('Finalize clinical encounter failed in session provider:', err);
      return null;
    }
  };


  return (
    <PatientSessionContext.Provider value={{
      ...state,
      setLanguage,
      setIdentificationMethod,
      setAbhaId,
      setPatient,
      updatePatientField,
      setAudioEnabled,
      setConsent,
      setChiefComplaint,
      clearSession,
      triggerEmergency,
      acknowledgeEmergency,
      setPatientId,
      setUhid,
      setEncounterId,
      setQueueEntryId,
      setTokenNumber,
      setActiveVoiceInput,
      setActiveTranscript,
      setActiveSelectedOption,
      setActiveSelectedOptions,
      setVoiceQuestionIndex,
      setPendingConfirmation,
      addVoiceResponse,
      advanceVoiceQuestion,
      resetActiveVoiceResponse,
      setRedFlagTriggered,
      setStaffNotified,
      setVoiceIntakeCompleted,
      setAppointmentSlot,
      confirmAppointment,
      setAyushIntake,
      addAyushResponse,
      advanceAyushQuestion,
      setMedicationHistory,
      setAllergyHistory,
      addDocument,
      removeDocument,
      updateDocument,
      setCurrentDocumentType,
      setDocumentIntake,
      completeDocumentIntake,
      setReviewConfirmed,
      startSubmission,
      completeSubmission,
      failSubmission,
      resetSubmission,
      startConsultation,
      updateClinicalAssessment,
      updateAyushAssessment,
      addPrescriptionItem,
      updatePrescriptionItem,
      removePrescriptionItem,
      setFollowUp,
      saveConsultationDraft,
      finalizeConsultation,
      loadConsultation,
      resetConsultation,
      setCaseAcknowledged,
      closeCase,
      resetCaseClosure,
      setClinicalCaseState,
      setLastClinicalTurn,
      updateClinicalCase,
      addConversationTurn,
      advanceConversationTurn,
      resetConversationTurns,
      setFinalClinicalSummary,
      finalizeEncounter,
    }}>
      {children}
    </PatientSessionContext.Provider>
  );
}

export function usePatientSession() {
  const context = useContext(PatientSessionContext);
  if (context === undefined) {
    throw new Error('usePatientSession must be used within a PatientSessionProvider');
  }
  return context;
}


