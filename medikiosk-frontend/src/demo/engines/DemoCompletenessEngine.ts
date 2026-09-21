import type { CaseCompletenessState, MissingFieldItem } from '../types/demoTypes';

export const INITIAL_MISSING_FIELDS: MissingFieldItem[] = [
  {
    id: 'miss-01',
    field: 'Allergy Verification',
    fieldHindi: 'दवा एलर्जी पुष्टि',
    category: 'Safety & Allergies',
    question: 'Before finalizing, we need to clarify: Have you ever experienced an allergic reaction (rash/swelling) to Penicillin or Amoxicillin in the past?',
    questionHindi: 'कृपया पुष्टि करें: क्या आपको कभी पेनिसिलिन या एमोक्सिसिलिन दवा से एलर्जी, चकत्ते या सूजन की समस्या हुई है?',
    options: [
      { id: 'opt_allergy_yes', label: 'Yes, I had severe rash to Penicillin in 2018 (Document record is correct)', labelHindi: 'हाँ, पेनिसिलिन से गंभीर एलर्जी हुई थी' },
      { id: 'opt_allergy_no', label: 'No, I have never had any allergy (Document belongs to family member)', labelHindi: 'नहीं, मुझे कोई एलर्जी नहीं है' },
      { id: 'opt_allergy_unsure', label: 'Not sure, doctor please verify during consultation', labelHindi: 'निश्चित नहीं, डॉक्टर जांच करें' },
    ],
    resolved: false,
  },
  {
    id: 'miss-02',
    field: 'Metformin Daily Dosage Confirmation',
    fieldHindi: 'मेटफॉर्मिन खुराक की पुष्टि',
    category: 'Medication History',
    question: 'Are you currently taking Metformin 500mg as prescribed, or did you stop it recently?',
    questionHindi: 'क्या आप अभी मेटफॉर्मिन ५०० मि.ग्रा. दवा ले रहे हैं, या हाल ही में बंद कर दी है?',
    options: [
      { id: 'opt_med_taking', label: 'Currently taking Metformin 500mg twice daily after meals', labelHindi: 'हाँ, नियमित रूप से दिन में २ बार ले रहा हूँ' },
      { id: 'opt_med_missed', label: 'I missed taking it for the last 2 weeks due to stomach burning', labelHindi: 'पेट में जलन की वजह से २ हफ्ते से नहीं ली' },
      { id: 'opt_med_stopped', label: 'Permanently stopped by another physician', labelHindi: 'डॉक्टर की सलाह पर बंद कर दी है' },
    ],
    resolved: false,
  },
];

export class DemoCompletenessEngine {
  private missingFields: MissingFieldItem[];

  constructor() {
    this.missingFields = JSON.parse(JSON.stringify(INITIAL_MISSING_FIELDS));
  }

  public getState(): CaseCompletenessState {
    const total = 10;
    const resolvedMissingCount = this.missingFields.filter((f) => f.resolved).length;
    const unresolvedCount = this.missingFields.filter((f) => !f.resolved).length;

    // Baseline intake starts at 78%, reaches 92% after OCR, 100% when all resolved
    let score = 78;
    if (resolvedMissingCount === 1) score = 92;
    if (resolvedMissingCount === 2) score = 100;

    return {
      score,
      completedFieldsCount: total - unresolvedCount,
      totalFieldsCount: total,
      missingFields: [...this.missingFields],
    };
  }

  public resolveField(fieldId: string, selectedValue: string): CaseCompletenessState {
    const field = this.missingFields.find((f) => f.id === fieldId);
    if (field) {
      field.resolved = true;
      field.resolvedValue = selectedValue;
    }
    return this.getState();
  }

  public reset(): void {
    this.missingFields = JSON.parse(JSON.stringify(INITIAL_MISSING_FIELDS));
  }
}

export const demoCompletenessEngine = new DemoCompletenessEngine();
