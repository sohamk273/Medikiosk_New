import type { DiscrepancyItem, LabResultItem } from '../types/demoTypes';
import { DEMO_LAB_RESULTS } from '../data/demoLabs';

export const INITIAL_DISCREPANCIES: DiscrepancyItem[] = [
  // Scenario A: Medication Discrepancy
  {
    id: 'disc-med-01',
    category: 'medication',
    title: 'Medication History Conflict (Metformin 500mg)',
    titleHindi: 'दवा इतिहास में विरोधाभास (मेटफॉर्मिन)',
    description: 'Patient verbally stated they are not taking any regular medications, but the scanned prescription from Max Hospital confirms active Metformin 500mg BD.',
    severity: 'discrepancy',
    patientStatement: {
      text: 'Patient stated during kiosk check-in: "I am not taking any daily medicines currently."',
      source: 'Kiosk Voice / Medication Intake Step',
      timestamp: '10:44 AM',
    },
    documentEvidence: {
      text: 'Tab. METFORMIN 500 mg — 1 Tab BD (After Meals)',
      documentTitle: 'Max Super Speciality Hospital Outpatient Slip (Oct 2024)',
      snippet: 'Rx: Tab. METFORMIN 500 mg — 1 Tab BD (After Meals) for Type 2 Diabetes Mellitus',
      date: '14 Oct 2024',
    },
    recommendedAction: 'Verify compliance with patient. Inquire if patient stopped taking Metformin or omitted mentioning it.',
    status: 'active',
  },

  // Scenario B: Allergy Discrepancy
  {
    id: 'disc-alg-02',
    category: 'allergy',
    title: 'Critical Allergy Discrepancy (Penicillin Group)',
    titleHindi: 'महत्वपूर्ण एलर्जी विरोधाभास (पेनिसिलिन ग्रुप)',
    description: 'Patient selected "No known drug allergies" on kiosk screen, whereas Apollo Hospital Inpatient Discharge Summary documents severe Urticaria and Angioedema to Penicillin.',
    severity: 'red_flag',
    patientStatement: {
      text: 'Kiosk screen response: "No known allergies to medicines."',
      source: 'Kiosk Allergy Touch Selection',
      timestamp: '10:45 AM',
    },
    documentEvidence: {
      text: 'KNOWN DRUG ALLERGY: PENICILLIN GROUP (Amoxicillin/Ampicillin) — Severe Urticaria',
      documentTitle: 'Apollo Hospitals Inpatient Discharge Summary',
      snippet: 'CAUTION: AVOID ALL PENICILLIN DERIVATIVES & CEPHALOSPORINS. Documented anaphylactoid urticaria.',
      date: '22 Mar 2023',
    },
    recommendedAction: 'High Alert: Do NOT prescribe Beta-lactam / Penicillin antibiotics without physician review.',
    status: 'active',
  },
];

export class DemoConsistencyEngine {
  private discrepancies: DiscrepancyItem[];
  private labResults: LabResultItem[];

  constructor() {
    this.discrepancies = JSON.parse(JSON.stringify(INITIAL_DISCREPANCIES));
    this.labResults = JSON.parse(JSON.stringify(DEMO_LAB_RESULTS));
  }

  public getDiscrepancies(): DiscrepancyItem[] {
    return [...this.discrepancies];
  }

  public getActiveDiscrepancies(): DiscrepancyItem[] {
    return this.discrepancies.filter((d) => d.status === 'active');
  }

  public getAbnormalLabs(): LabResultItem[] {
    return this.labResults.filter((l) => l.isAbnormal);
  }

  public getAllLabs(): LabResultItem[] {
    return [...this.labResults];
  }

  public getRedFlagsCount(): number {
    return this.discrepancies.filter((d) => d.severity === 'red_flag' && d.status === 'active').length;
  }

  public resolveDiscrepancy(discrepancyId: string, resolutionNote: string): boolean {
    const item = this.discrepancies.find((d) => d.id === discrepancyId);
    if (!item) return false;

    item.status = 'resolved';
    item.resolvedResolution = resolutionNote;
    return true;
  }

  public reset(): void {
    this.discrepancies = JSON.parse(JSON.stringify(INITIAL_DISCREPANCIES));
    this.labResults = JSON.parse(JSON.stringify(DEMO_LAB_RESULTS));
  }
}

export const demoConsistencyEngine = new DemoConsistencyEngine();
