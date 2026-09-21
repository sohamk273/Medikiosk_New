import { 
  DEMO_DOCTOR_PATIENTS, 
  type DemoDoctorPatient 
} from '../data/demoDoctorDataset';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import type { ConsultationState } from '@/features/patient/PatientSessionContext';
import { isDemoIntelligenceModeActive } from '../config/demoConfig';

// In-memory state clone so doctor actions (e.g. status changes, consultation drafts) persist in session
let liveDemoPatients: DemoDoctorPatient[] = JSON.parse(JSON.stringify(DEMO_DOCTOR_PATIENTS));

export class DemoDoctorProvider {
  /**
   * Returns whether demo mode is actively providing the doctor dataset
   */
  static isDemoMode(): boolean {
    return isDemoIntelligenceModeActive();
  }

  /**
   * Reset the demo dataset to original pristine state
   */
  static resetDemoDataset(): void {
    liveDemoPatients = JSON.parse(JSON.stringify(DEMO_DOCTOR_PATIENTS));
  }

  /**
   * Get all 16 deterministic mock patients
   */
  static getAllPatients(): DemoDoctorPatient[] {
    return [...liveDemoPatients];
  }

  /**
   * Get patient by case ID (or token number)
   */
  static getPatientByCaseId(caseId: string): DemoDoctorPatient | undefined {
    return liveDemoPatients.find(
      p => p.caseId.toLowerCase() === caseId.toLowerCase() ||
           p.tokenDisplay.toLowerCase() === caseId.toLowerCase() ||
           String(p.tokenNumber) === caseId
    );
  }

  /**
   * Get all cases mapped for MockDoctorCaseProvider
   */
  static getAllDoctorCases(): Record<string, DoctorCase> {
    const map: Record<string, DoctorCase> = {};
    liveDemoPatients.forEach(p => {
      map[p.caseId] = {
        caseId: p.caseId,
        patientName: p.patientName,
        age: p.age,
        gender: p.gender,
        mobile: p.mobile,
        abhaId: p.abhaId,
        chiefComplaint: p.chiefComplaint,
        voiceResponses: p.voiceResponses as any,
        ayushResponses: [],
        medicationHistory: {
          takingMedicines: p.currentMedications.length > 0 ? 'yes_daily' : 'no',
          medicines: p.currentMedications.map(m => `${m.name} ${m.dosage}`).join(', ')
        },
        allergyHistory: {
          hasAllergy: p.allergies.length > 0 ? 'yes' : 'no',
          allergyType: p.allergies.map(a => a.allergen).join(', '),
          reaction: p.allergies[0]?.reaction
        },
        documents: p.documents,
        consultation: p.consultationDraft ? {
          status: p.status === 'completed' || p.status === 'closed' ? 'finalized' : 'draft',
          clinicalAssessment: {
            findings: p.consultationDraft.findings,
            assessment: p.consultationDraft.assessment,
            diagnosis: p.consultationDraft.diagnosis,
            notes: p.consultationDraft.notes
          },
          ayushAssessment: {
            prakriti: p.ayushProfile?.dashavidhaPariksha?.prakriti || 'Vata-Pitta',
            agni: p.ayushProfile?.dashavidhaPariksha?.anala || 'Samagni',
            koshtha: 'Madhyama',
            dosha: 'Vata',
            notes: ''
          },
          prescription: {
            items: p.consultationDraft.prescription.map((rx, idx) => ({
              id: `rx-${p.caseId}-${idx}`,
              medicineName: rx.medicine,
              dosage: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration,
              instructions: rx.instructions
            }))
          },
          followUp: p.consultationDraft.followUp,
          updatedAt: new Date().toISOString(),
          finalizedAt: p.status === 'completed' || p.status === 'closed' ? new Date().toISOString() : undefined
        } : undefined,
        redFlagTriggered: p.redFlagTriggered,
        submittedAt: p.visitDateTime,
        status: p.status
      };
    });
    return map;
  }

  /**
   * Formatted queue rows for DoctorQueue.tsx
   */
  static getQueueItems() {
    return liveDemoPatients.map(p => ({
      queueEntryId: `Q-${p.caseId}`,
      encounterId: p.caseId,
      caseId: p.caseId,
      tokenNumber: p.tokenNumber,
      encounterNumber: p.tokenDisplay,
      patientName: p.patientName,
      age: p.age,
      gender: p.gender,
      chiefComplaint: p.chiefComplaint,
      redFlagTriggered: p.redFlagTriggered,
      submittedAt: p.visitDateTime,
      status: p.status,
      operationalState: p.operationalState,
      completenessScore: p.completenessScore,
      discrepanciesCount: p.discrepanciesCount,
      discrepancies: p.discrepancies,
      abnormalLabs: p.abnormalLabs,
      documentsCount: p.documents.length
    }));
  }

  /**
   * Summary metrics for Doctor Dashboard
   */
  static getDashboardStats() {
    const total = 24; // Simulated total including morning walk-ins
    const waiting = liveDemoPatients.filter(p => p.status === 'waiting').length;
    const inConsultation = liveDemoPatients.filter(p => p.status === 'in-consultation').length;
    const completed = liveDemoPatients.filter(p => p.status === 'completed').length;
    const closed = liveDemoPatients.filter(p => p.status === 'closed').length;
    const attention = liveDemoPatients.filter(p => p.redFlagTriggered || p.discrepanciesCount > 0).length;
    const ready = liveDemoPatients.filter(p => p.operationalState === 'Ready for Consultation').length;

    return {
      totalRegistered: total,
      waiting,
      inConsultation,
      completed,
      closed,
      attention,
      ready,
      drafts: 2
    };
  }

  /**
   * Update status of a demo patient (e.g. doctor starts consultation or finishes)
   */
  static updateStatus(caseId: string, status: DemoDoctorPatient['status']): void {
    const patient = this.getPatientByCaseId(caseId);
    if (patient) {
      patient.status = status;
      if (status === 'in-consultation') {
        patient.operationalState = 'In Progress';
      } else if (status === 'completed') {
        patient.operationalState = 'Consultation Complete';
      } else if (status === 'closed') {
        patient.operationalState = 'Follow-up';
      }
    }
  }

  /**
   * Save consultation state to mock patient
   */
  static saveConsultation(caseId: string, consultation: ConsultationState): void {
    const patient = this.getPatientByCaseId(caseId);
    if (patient) {
      patient.consultationDraft = {
        findings: consultation.clinicalAssessment.findings,
        assessment: consultation.clinicalAssessment.assessment,
        diagnosis: consultation.clinicalAssessment.diagnosis,
        notes: consultation.clinicalAssessment.notes,
        prescription: consultation.prescription.items.map(i => ({
          medicine: i.medicineName || (i as any).medicine || '',
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration,
          instructions: i.instructions
        })),
        followUp: consultation.followUp
      };
      if (consultation.status === 'finalized') {
        patient.status = 'completed';
        patient.operationalState = 'Consultation Complete';
      }
    }
  }
}
