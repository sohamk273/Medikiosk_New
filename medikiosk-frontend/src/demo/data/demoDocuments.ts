export interface DemoDocumentItem {
  id: string;
  type: 'prescription' | 'lab_report' | 'discharge_summary' | 'consultation_note';
  title: string;
  titleHindi: string;
  facility: string;
  date: string;
  doctorName?: string;
  summary: string;
  extractedOcrSnippet: string;
  extractedFactsCount: number;
  highlightedKeywords: string[];
  visualHtmlPreview: string;
}

export const DEMO_DOCUMENTS: DemoDocumentItem[] = [
  {
    id: 'doc-rx-001',
    type: 'prescription',
    title: 'Outpatient Prescription Slip',
    titleHindi: 'पिछला डॉक्टर का पर्चा',
    facility: 'Max Super Speciality Hospital, New Delhi',
    date: '14 Oct 2024',
    doctorName: 'Dr. A. K. Verma, MD (Internal Medicine)',
    summary: 'Regular diabetes & blood pressure maintenance follow-up. Prescribed Metformin 500mg BD and Telmisartan 40mg OD.',
    extractedOcrSnippet: `MAX SUPER SPECIALITY HOSPITAL
Dept of Internal Medicine - Outpatient Slip
Date: 14/10/2024 | Patient: Rajesh Sharma, 50M
Diagnosis: Type 2 Diabetes Mellitus | Essential Hypertension
Rx:
1. Tab. METFORMIN 500 mg — 1 Tab BD (After Meals)
2. Tab. TELMISARTAN 40 mg — 1 Tab OD (Morning)
3. Tab. PANTOPRAZOLE 40 mg — 1 Tab OD (Before Breakfast, PRN for acidity)
Advice: Low glycaemic diet, 30 min daily brisk walking. Repeat HbA1c in 3 months.
Signed: Dr. A. K. Verma [Reg: DMC-48921]`,
    extractedFactsCount: 4,
    highlightedKeywords: ['METFORMIN 500 mg', 'TELMISARTAN 40 mg', 'Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    visualHtmlPreview: `
      <div class="border border-slate-300 rounded-lg p-4 bg-white text-slate-800 text-xs font-mono shadow-sm">
        <div class="border-b border-slate-200 pb-2 mb-2 flex justify-between">
          <span class="font-bold text-navy-900">MAX SUPER SPECIALITY HOSPITAL</span>
          <span class="text-slate-500">OPD Slip #RX-9941</span>
        </div>
        <p class="font-semibold text-slate-700">Patient: Rajesh Sharma (52M) | Date: 14 Oct 2024</p>
        <p class="text-slate-600 mb-2">Dx: Type 2 Diabetes Mellitus, Essential Hypertension</p>
        <div class="bg-amber-50 p-2 rounded border border-amber-200 mb-2">
          <p class="font-bold text-amber-900">Rx:</p>
          <p class="font-bold text-navy-900">• Tab. METFORMIN 500 mg — 1 BD p.c.</p>
          <p class="font-bold text-navy-900">• Tab. TELMISARTAN 40 mg — 1 OD a.m.</p>
        </div>
        <p class="text-[10px] text-slate-400">Verified by OCR Extraction Engine • Confidence: 96%</p>
      </div>
    `,
  },
  {
    id: 'doc-lab-002',
    type: 'lab_report',
    title: 'Diagnostic Biochemistry Laboratory Report',
    titleHindi: 'लैब जांच रिपोर्ट (रक्त जांच)',
    facility: 'Metropolis Healthcare Diagnostics, Delhi',
    date: '18 Nov 2025',
    doctorName: 'Dr. Sunita Rao, MD (Biochemistry)',
    summary: 'HbA1c is elevated at 8.2% (Target < 7.0%). Fasting Blood Glucose is 158 mg/dL. Renal function within normal limits.',
    extractedOcrSnippet: `METROPOLIS HEALTHCARE DIAGNOSTICS
Accredited by NABL & CAP
Patient Name: Rajesh Sharma | Age: 51Y / Male | Ref Dr: Dr. A. K. Verma
Sample Date: 18-Nov-2025 08:30 AM | Report Date: 18-Nov-2025 02:15 PM
----------------------------------------------------------------------
TEST NAME                     RESULT       REF RANGE        STATUS
----------------------------------------------------------------------
Glycosylated Haemoglobin HbA1c 8.2 %        4.0 - 5.6 %      [HIGH]
Average Blood Glucose (eAG)   189 mg/dL    70 - 100 mg/dL   [HIGH]
Fasting Plasma Glucose (FPG)  158 mg/dL    70 - 99 mg/dL    [HIGH]
Serum Creatinine              0.92 mg/dL   0.70 - 1.20 mg/dL [NORMAL]
Blood Urea Nitrogen (BUN)     14.2 mg/dL   7.0 - 20.0 mg/dL  [NORMAL]
Serum Bilirubin (Total)       0.85 mg/dL   0.20 - 1.20 mg/dL [NORMAL]
----------------------------------------------------------------------
Clinical Impression: Suboptimal glycaemic control. Recommend diabetologist consultation.`,
    extractedFactsCount: 4,
    highlightedKeywords: ['HbA1c 8.2 % [HIGH]', 'Fasting Plasma Glucose 158 mg/dL [HIGH]', 'Serum Creatinine 0.92 mg/dL'],
    visualHtmlPreview: `
      <div class="border border-slate-300 rounded-lg p-4 bg-white text-slate-800 text-xs font-mono shadow-sm">
        <div class="border-b border-slate-200 pb-2 mb-2 flex justify-between">
          <span class="font-bold text-mediblue-900">METROPOLIS HEALTHCARE</span>
          <span class="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">ABNORMAL VALUES FLAGGED</span>
        </div>
        <p class="font-semibold text-slate-700">Patient: Rajesh Sharma | Sample: 18 Nov 2025</p>
        <table class="w-full text-left my-2 border-collapse">
          <tr class="border-b border-slate-100 text-slate-500"><th>Parameter</th><th>Value</th><th>Ref</th></tr>
          <tr class="bg-rose-50/80 text-rose-900 font-bold"><td>HbA1c</td><td>8.2 %</td><td>4.0 - 5.6</td></tr>
          <tr class="bg-rose-50/80 text-rose-900 font-bold"><td>Fasting Sugar</td><td>158 mg/dL</td><td>70 - 99</td></tr>
          <tr class="text-slate-700"><td>Creatinine</td><td>0.92 mg/dL</td><td>0.7 - 1.2</td></tr>
        </table>
        <p class="text-[10px] text-slate-400">OCR Extraction Engine • Precision: High (98%)</p>
      </div>
    `,
  },
  {
    id: 'doc-ds-003',
    type: 'discharge_summary',
    title: 'Hospital Inpatient Discharge Summary',
    titleHindi: 'अस्पताल डिस्चार्ज सारांश (सर्जरी)',
    facility: 'Apollo Specialty Hospitals, Sarita Vihar',
    date: '22 Mar 2023',
    doctorName: 'Dr. Vikramaditya Sen, MS, MCh (Surgical Gastro)',
    summary: 'Elective Laparoscopic Cholecystectomy for symptomatic cholelithiasis. Uneventful recovery. Documented severe Urticarial allergy to Penicillin/Amoxicillin.',
    extractedOcrSnippet: `APOLLO HOSPITALS ENTERPRISE LTD.
INPATIENT DISCHARGE SUMMARY
IPD No: IP-2023-04981 | Bed: 408-A
Patient: Rajesh Sharma | Age/Sex: 49 / Male
DOA: 20-Mar-2023 | DOD: 22-Mar-2023
Final Diagnosis: Symptomatic Cholelithiasis (Gallstones)
Procedure: Laparoscopic Cholecystectomy under General Anaesthesia
Operative Findings: Inflamed gallbladder with multiple cholesterol stones.
*** DRUG ALLERGIES ***
KNOWN DRUG ALLERGY: PENICILLIN GROUP (Amoxicillin/Ampicillin)
REACTION: Generalized Urticaria, Facial Angioedema & Pruritus in 2018
*** CAUTION: AVOID ALL PENICILLIN DERIVATIVES & CEPHALOSPORINS ***
Condition on Discharge: Stable, afebrile, surgical wounds clean.`,
    extractedFactsCount: 3,
    highlightedKeywords: ['KNOWN DRUG ALLERGY: PENICILLIN GROUP', 'Laparoscopic Cholecystectomy', 'Symptomatic Cholelithiasis'],
    visualHtmlPreview: `
      <div class="border border-slate-300 rounded-lg p-4 bg-white text-slate-800 text-xs font-mono shadow-sm">
        <div class="border-b border-slate-200 pb-2 mb-2 flex justify-between">
          <span class="font-bold text-navy-900">APOLLO HOSPITALS</span>
          <span class="text-slate-500">IPD #2023-04981</span>
        </div>
        <p class="font-semibold">Patient: Rajesh Sharma | Surgery Date: 20 Mar 2023</p>
        <p class="text-slate-700">Procedure: Laparoscopic Cholecystectomy</p>
        <div class="bg-rose-100 border border-rose-300 p-2 rounded mt-2 text-rose-900">
          <p class="font-extrabold flex items-center gap-1">ALLERGY ALERT: PENICILLIN GROUP</p>
          <p class="text-[11px]">Reaction: Severe Urticaria & Angioedema (Documented 2018/2023)</p>
        </div>
      </div>
    `,
  },
  {
    id: 'doc-ayu-004',
    type: 'consultation_note',
    title: 'Ayurveda Integrative Health Assessment',
    titleHindi: 'आयुर्वेद स्वास्थ्य परामर्श पर्ची',
    facility: 'Chakrapani Ayurveda OPD & Research Centre',
    date: '08 Jan 2024',
    doctorName: 'Vaidya R. K. Shastri, BAMS, MD (Ayu)',
    summary: 'Prakriti assessment identified as Pitta-Vata Pradhana. Agni assessed as Mandagni with Vidagdha Ajeerna tendencies. Advised Ushnodaka and Laghu Ahara.',
    extractedOcrSnippet: `CHAKRAPANI AYURVEDA WELLNESS CLINIC
Integrative OPD Assessment
Patient: Rajesh Sharma, 50Y Male | Date: 08-Jan-2024
Dashavidha Pariksha Summary:
1. Prakriti: Pitta-Vata (Deha Prakriti: Pitta dominant, Manasa: Rajasika)
2. Vikriti: Pitta Vriddhi, Kapha Kshaya in Annavaha Srotas
3. Agni: Mandagni with Amlodgara (Acid eructations)
4. Koshtha: Madhyama Koshtha
5. Satmya: Katu-Lavana Satmya (Aggravating factor)
Diagnosis: Amlapitta (Vidagdha Pachana stage)
Advised: Takra with roasted Jeeraka, avoid Ratrijagarana (Late night work).`,
    extractedFactsCount: 3,
    highlightedKeywords: ['Prakriti: Pitta-Vata', 'Agni: Mandagni', 'Amlapitta', 'Madhyama Koshtha'],
    visualHtmlPreview: `
      <div class="border border-slate-300 rounded-lg p-4 bg-white text-slate-800 text-xs font-mono shadow-sm">
        <div class="border-b border-slate-200 pb-2 mb-2 flex justify-between">
          <span class="font-bold text-emerald-800">CHAKRAPANI AYURVEDA OPD</span>
          <span class="text-slate-500">08 Jan 2024</span>
        </div>
        <p class="font-semibold text-slate-800">Prakriti: Pitta-Vata | Agni: Mandagni</p>
        <p class="text-slate-600">Samprapti: Pitta aggravation in Annavaha Srotas (Amlapitta)</p>
      </div>
    `,
  }
];
