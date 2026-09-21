import type { 
  PatientSessionState, 
  PatientDocument,
  VoiceResponse,
  AyushResponse,
  MedicationHistory,
  AllergyHistory,
  ConsultationState
} from '@/features/patient/PatientSessionContext';

export interface DoctorCase {
  caseId: string;
  patientName: string;
  age: string | number;
  gender: string;
  mobile?: string;
  abhaId?: string;
  chiefComplaint?: string;
  
  voiceResponses: VoiceResponse[];
  ayushResponses: AyushResponse[];
  medicationHistory?: MedicationHistory;
  allergyHistory?: AllergyHistory;
  documents: PatientDocument[];
  consultation?: ConsultationState;
  
  redFlagTriggered: boolean;
  submittedAt: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'closed';
}

import { DEMO_DOCTOR_CASES_RECORD } from '@/demo/data/demoDoctorDataset';

const MOCK_DB: Record<string, DoctorCase> = {
  ...DEMO_DOCTOR_CASES_RECORD,
  'MEDI-OPD-2026-00041': {
    caseId: 'MEDI-OPD-2026-00041',
    patientName: 'Savitri Devi',
    age: 54,
    gender: 'female',
    mobile: '9876543210',
    abhaId: '1234-5678-9012-3456',
    chiefComplaint: 'Joint pain and stiffness in knees',
    voiceResponses: [
      {
        questionId: 'duration',
        question: 'How long have you been experiencing this problem?',
        questionHindi: 'आपको यह समस्या कितने समय से हो रही है?',
        inputMethod: 'voice',
        transcript: 'For the last 6 months',
        confirmed: true,
        timestamp: new Date().toISOString(),
        isRedFlag: false
      }
    ],
    ayushResponses: [],
    medicationHistory: { takingMedicines: 'no' },
    allergyHistory: { hasAllergy: 'no' },
    documents: [],
    redFlagTriggered: false,
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'waiting',
  },
  'MEDI-OPD-2026-00040': {
    caseId: 'MEDI-OPD-2026-00040',
    patientName: 'Ramesh Kumar',
    age: 47,
    gender: 'male',
    mobile: '8877665544',
    chiefComplaint: 'Digestive discomfort after meals',
    voiceResponses: [],
    ayushResponses: [],
    medicationHistory: { takingMedicines: 'not_sure' },
    allergyHistory: { hasAllergy: 'no' },
    documents: [],
    redFlagTriggered: false,
    submittedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'in-consultation',
  },
  'MEDI-OPD-2026-00039': {
    caseId: 'MEDI-OPD-2026-00039',
    patientName: 'Meena Joshi',
    age: 36,
    gender: 'female',
    mobile: '7766554433',
    chiefComplaint: 'Recurring headache',
    voiceResponses: [],
    ayushResponses: [],
    medicationHistory: { takingMedicines: 'yes_daily', medicines: 'Paracetamol' },
    allergyHistory: { hasAllergy: 'no' },
    documents: [],
    redFlagTriggered: false,
    submittedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'completed',
  }
};

export class MockDoctorCaseProvider {
  static getCases(): DoctorCase[] {
    return Object.values(MOCK_DB).sort((a, b) => {
      // Sort priority: Attention required waiting -> Waiting -> In Consultation -> Completed
      const getPriority = (c: DoctorCase) => {
        if (c.status === 'waiting' && c.redFlagTriggered) return 0;
        if (c.status === 'waiting') return 1;
        if (c.status === 'in-consultation') return 2;
        if (c.status === 'completed') return 3;
        if (c.status === 'closed') return 4;
        return 5;
      };
      
      const pA = getPriority(a);
      const pB = getPriority(b);
      
      if (pA !== pB) return pA - pB;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }

  static getCaseById(id: string): DoctorCase | undefined {
    return MOCK_DB[id];
  }

  static updateCaseStatus(id: string, newStatus: 'waiting' | 'in-consultation' | 'completed' | 'closed'): void {
    if (MOCK_DB[id]) {
      MOCK_DB[id].status = newStatus;
    }
  }

  static getFinalizedCase(id: string): DoctorCase | undefined {
    const caseData = MOCK_DB[id];
    if (caseData && caseData.consultation?.status === 'finalized') {
      return caseData;
    }
    return undefined;
  }

  static closeCase(id: string): void {
    if (MOCK_DB[id]) {
      MOCK_DB[id].status = 'closed';
    }
  }

  static getConsultation(id: string): ConsultationState | undefined {
    return MOCK_DB[id]?.consultation;
  }

  static getAttentionCases(): DoctorCase[] {
    return this.getCases().filter(c => c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed');
  }

  static getActiveConsultations(): DoctorCase[] {
    return this.getCases().filter(c => c.status === 'in-consultation');
  }

  static getRecentlyCompletedCases(limit: number): DoctorCase[] {
    return this.getCases()
      .filter(c => c.status === 'completed' || c.status === 'closed')
      .slice(0, limit);
  }

  static getDraftConsultations(): DoctorCase[] {
    return this.getCases().filter(c => c.consultation?.status === 'draft' && c.status !== 'completed' && c.status !== 'closed');
  }

  static saveConsultation(id: string, consultation: ConsultationState): void {
    if (MOCK_DB[id]) {
      MOCK_DB[id].consultation = consultation;
    }
  }

  static injectPatientSession(session: PatientSessionState): void {
    if (session.submission.status === 'success' && session.submission.caseId) {
      const caseId = session.submission.caseId;
      
      // Prevent overwriting if already in MOCK_DB (e.g. status was updated by doctor)
      if (MOCK_DB[caseId]) return;

      MOCK_DB[caseId] = {
        caseId: caseId,
        patientName: session.patient?.name || 'Unknown Patient',
        age: session.patient?.age || 0,
        gender: session.patient?.gender || 'unknown',
        mobile: session.patient?.mobile,
        abhaId: session.abhaId,
        chiefComplaint: session.chiefComplaint.primaryComplaint,
        
        voiceResponses: session.voiceIntake.responses,
        ayushResponses: session.ayushIntake.responses,
        
        medicationHistory: session.medicationHistory,
        allergyHistory: session.allergyHistory,
        
        documents: session.documentIntake.documents,
        
        redFlagTriggered: session.voiceIntake.redFlagTriggered || 
                          (session.allergyHistory.hasAllergy === 'yes' && session.allergyHistory.reaction === 'breathing_difficulty'),
                          
        submittedAt: session.submission.submittedAt || new Date().toISOString(),
        status: 'waiting',
      };
    }
  }

  static injectEmergencyCase(session: PatientSessionState): void {
    const caseId = `EMERGENCY-${Date.now()}`;
    
    MOCK_DB[caseId] = {
      caseId: caseId,
      patientName: session.patient?.name || 'Unknown Patient (Emergency)',
      age: session.patient?.age || 0,
      gender: session.patient?.gender || 'unknown',
      mobile: session.patient?.mobile,
      abhaId: session.abhaId,
      chiefComplaint: `[EMERGENCY TRIGGERED] ${session.emergencyReason || 'Immediate Medical Assistance Required'}`,
      
      voiceResponses: [],
      ayushResponses: [],
      documents: [],
      
      redFlagTriggered: true, // Forces "Attention Required" status
      submittedAt: session.emergencyTriggeredAt || new Date().toISOString(),
      status: 'waiting', // Appears in active patients
    };
  }
}
