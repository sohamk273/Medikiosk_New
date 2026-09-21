import { DEMO_CLINICAL_FACTS } from '../data/demoClinicalFacts';
import { DEMO_DOCUMENTS } from '../data/demoDocuments';
import type { ClinicalFact, AuditTrailEntry, EvidenceMetadata } from '../types/demoTypes';

export class DemoEvidenceEngine {
  private facts: Map<string, ClinicalFact>;
  private auditTrail: AuditTrailEntry[];

  constructor() {
    this.facts = new Map();
    DEMO_CLINICAL_FACTS.forEach((fact) => {
      this.facts.set(fact.id, { ...fact });
    });

    this.auditTrail = [
      {
        id: 'audit-01',
        timestamp: '10:42 AM',
        action: 'AI_EXTRACTED',
        factId: 'fact-cc-01',
        factLabel: 'Epigastric Burning Discomfort',
        source: 'Multimodal Voice Audio Turn 1',
        userRole: 'AI_ENGINE',
        detail: 'Extracted symptom: Upper abdominal burning (5 days duration, postprandial trigger).',
        confidence: 'high',
      },
      {
        id: 'audit-02',
        timestamp: '10:43 AM',
        action: 'PATIENT_CONFIRMED',
        factId: 'fact-cc-01',
        factLabel: 'Epigastric Burning Discomfort',
        source: 'Patient Touch Screen Confirmation',
        userRole: 'PATIENT',
        detail: 'Patient reviewed structured "AI Understood" card and tapped Confirm.',
      },
      {
        id: 'audit-03',
        timestamp: '10:45 AM',
        action: 'AI_EXTRACTED',
        factId: 'fact-med-01',
        factLabel: 'Metformin 500 mg BD',
        source: 'OCR Scanned Prescription (Max Hospital)',
        userRole: 'AI_ENGINE',
        detail: 'Simulated OCR extracted active medication: Tab Metformin 500mg twice daily.',
        confidence: 'high',
      },
      {
        id: 'audit-04',
        timestamp: '10:45 AM',
        action: 'DISCREPANCY_FLAGGED',
        factId: 'fact-med-01',
        factLabel: 'Medication Conflict',
        source: 'Clinical Consistency Engine',
        userRole: 'AI_ENGINE',
        detail: 'Flagged conflict: Patient stated "No medicines" vs Prescription shows "Metformin 500mg".',
      },
      {
        id: 'audit-05',
        timestamp: '10:46 AM',
        action: 'AI_EXTRACTED',
        factId: 'fact-alg-01',
        factLabel: 'Penicillin Group Allergy',
        source: 'Apollo Hospitals Discharge Summary (2023)',
        userRole: 'AI_ENGINE',
        detail: 'OCR extracted documented severe Urticarial allergy to Penicillin/Amoxicillin.',
        confidence: 'high',
      },
      {
        id: 'audit-06',
        timestamp: '10:46 AM',
        action: 'AI_EXTRACTED',
        factId: 'fact-lab-01',
        factLabel: 'Elevated HbA1c 8.2%',
        source: 'Metropolis Lab Report (2025)',
        userRole: 'AI_ENGINE',
        detail: 'Extracted abnormal HbA1c 8.2% and Fasting Blood Sugar 158 mg/dL.',
        confidence: 'high',
      },
    ];
  }

  public getAllFacts(): ClinicalFact[] {
    return Array.from(this.facts.values());
  }

  public getFactById(factId: string): ClinicalFact | null {
    return this.facts.get(factId) || null;
  }

  public getFactsByCategory(category: ClinicalFact['category']): ClinicalFact[] {
    return Array.from(this.facts.values()).filter((f) => f.category === category);
  }

  public getEvidenceForFact(factId: string): EvidenceMetadata | null {
    const fact = this.facts.get(factId);
    return fact ? fact.evidence : null;
  }

  public getSourceDocument(documentId: string) {
    return DEMO_DOCUMENTS.find((d) => d.id === documentId) || null;
  }

  public verifyFactByDoctor(factId: string, doctorName: string = 'Dr. Priya Sharma'): boolean {
    const fact = this.facts.get(factId);
    if (!fact) return false;

    fact.status = 'doctor_verified';
    fact.evidence.verifiedBy = doctorName;
    fact.evidence.verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'DOCTOR_VERIFIED',
      factId: fact.id,
      factLabel: fact.label,
      source: 'Doctor EMR 30-Second Cockpit',
      userRole: 'PHYSICIAN',
      detail: `Clinically verified and accepted into final encounter record by ${doctorName}.`,
    });

    return true;
  }

  public editFactValue(factId: string, newValue: string, doctorName: string = 'Dr. Priya Sharma'): boolean {
    const fact = this.facts.get(factId);
    if (!fact) return false;

    const oldValue = fact.value;
    fact.value = newValue;
    fact.status = 'doctor_verified';

    this.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'FIELD_EDITED',
      factId: fact.id,
      factLabel: fact.label,
      source: 'Physician Direct Correction',
      userRole: 'PHYSICIAN',
      detail: `Value edited from "${oldValue}" to "${newValue}" by ${doctorName}.`,
    });

    return true;
  }

  public getAuditTrail(): AuditTrailEntry[] {
    return [...this.auditTrail];
  }

  public reset(): void {
    this.facts.clear();
    DEMO_CLINICAL_FACTS.forEach((fact) => {
      this.facts.set(fact.id, { ...fact });
    });
  }
}

export const demoEvidenceEngine = new DemoEvidenceEngine();
