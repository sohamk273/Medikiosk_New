import type { 
  ClinicalFact, 
  DiscrepancyItem, 
  LabResultItem, 
  AyushCaseProfile, 
  TimelineEvent 
} from '../types/demoTypes';
import type { PatientDocument } from '@/features/patient/PatientSessionContext';

export interface DemoDoctorPatient {
  caseId: string;
  tokenNumber: number;
  tokenDisplay: string;
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  abhaId: string;
  visitDateTime: string;
  chiefComplaint: string;
  duration: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  status: 'waiting' | 'in-consultation' | 'completed' | 'closed';
  operationalState: 
    | 'Waiting' 
    | 'In Progress' 
    | 'History Taking Complete' 
    | 'Documents Pending' 
    | 'AI Processing' 
    | 'Verification Required' 
    | 'Ready for Consultation' 
    | 'Consultation Complete' 
    | 'Follow-up';
  completenessScore: number;
  redFlagTriggered: boolean;
  redFlagReason?: string;
  discrepanciesCount: number;
  discrepancies: DiscrepancyItem[];
  medicalHistory: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    source: string;
    verified?: boolean;
  }>;
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: string;
    source: string;
    verified?: boolean;
  }>;
  abnormalLabs: LabResultItem[];
  normalLabs: LabResultItem[];
  documents: PatientDocument[];
  timeline: TimelineEvent[];
  clinicalFacts: ClinicalFact[];
  ayushProfile?: Partial<AyushCaseProfile>;
  aiDraftSummary: {
    chiefComplaintSummary: string;
    clinicalHistorySummary: string;
    differentialDiagnoses: string[];
    recommendedWorkup: string[];
    suggestedPrescription: Array<{
      medicine: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
  };
  voiceResponses: Array<{
    questionId: string;
    question: string;
    questionHindi: string;
    inputMethod: 'voice' | 'touch';
    transcript: string;
    confirmed: boolean;
    timestamp: string;
    isRedFlag?: boolean;
  }>;
  consultationDraft?: {
    findings: string;
    assessment: string;
    diagnosis: string;
    notes: string;
    prescription: Array<{
      medicine: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    followUp: {
      required: boolean;
      timeframe: string;
      instructions: string;
    };
  };
}

// ------------------------------------------------------------------------------------------------
// 16 DETERMINISTIC MOCK PATIENTS
// ------------------------------------------------------------------------------------------------

export const DEMO_DOCTOR_PATIENTS: DemoDoctorPatient[] = [
  // 1. Patient A: Aarav Mehta (GI Complaint, Double Discrepancy, Abnormal HbA1c/ALT, AYUSH)
  {
    caseId: 'MEDI-OPD-2026-00010',
    tokenNumber: 10,
    tokenDisplay: 'OPD-010',
    patientName: 'Aarav Mehta',
    age: 42,
    gender: 'male',
    mobile: '9876543210',
    abhaId: '91-4432-8871-0010',
    visitDateTime: '2026-09-20T08:15:00Z',
    chiefComplaint: 'Severe post-prandial burning sensation in epigastrium and acid regurgitation for 3 weeks',
    duration: '3 weeks',
    severity: 'severe',
    status: 'waiting',
    operationalState: 'Verification Required',
    completenessScore: 92,
    redFlagTriggered: true,
    redFlagReason: 'Dual clinical contradiction: unstated Metformin therapy and concealed Penicillin hypersensitivity',
    discrepanciesCount: 2,
    discrepancies: [
      {
        id: 'disc-med-010',
        category: 'medication',
        title: 'Medication Concealment Discrepancy',
        titleHindi: 'दवा विवरण में विरोधाभास',
        description: 'Patient verbally stated taking "No current daily medicines" during kiosk intake, but scanned prescription reveals active Metformin 500mg BD.',
        severity: 'discrepancy',
        patientStatement: {
          text: 'I do not take any regular medicines every day.',
          source: 'Multimodal Voice Intake Turn 2',
          timestamp: '08:18:22'
        },
        documentEvidence: {
          text: 'Tab Metformin 500 mg 1-0-1 after meals x 3 months',
          documentTitle: 'Previous Prescription — City Diabetes Clinic (Nov 2025)',
          snippet: 'Rx: Tab Metformin 500mg BD. Fasting glucose monitoring advised.',
          date: '2025-11-14'
        },
        recommendedAction: 'Physician must verify active glycemic medication before prescribing PPIs or NSAIDs.',
        status: 'active'
      },
      {
        id: 'disc-all-010',
        category: 'allergy',
        title: 'Allergy Omission Discrepancy',
        titleHindi: 'एलर्जी विवरण में विरोधाभास',
        description: 'Patient selected "No known drug allergies" at kiosk touch screen, but past medical record indicates severe urticarial rash to Amoxicillin.',
        severity: 'red_flag',
        patientStatement: {
          text: 'No known allergies to medicines or food items.',
          source: 'Allergy Screen Self-Declaration',
          timestamp: '08:20:05'
        },
        documentEvidence: {
          text: 'Allergy: Penicillin / Amoxicillin — Erythematous pruritic rash with periorbital edema (2022)',
          documentTitle: 'Hospital Discharge Summary (Dr. Singhal Nursing Home)',
          snippet: 'Caution: Penicillin class hypersensitivity recorded.',
          date: '2022-04-18'
        },
        recommendedAction: 'Flag Penicillin cross-reactivity and update EMR master allergy registry.',
        status: 'active'
      }
    ],
    medicalHistory: ['Gastroesophageal Reflux Disease (GERD)', 'Type 2 Diabetes Mellitus (diagnosed 2025)', 'Amoxicillin allergy (2022)'],
    currentMedications: [
      { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', duration: 'Ongoing', source: 'Scanned Prescription (Doc-101)', verified: false },
      { name: 'Antacid Gel', dosage: '10 ml', frequency: 'SOS post meals', duration: '3 weeks', source: 'Patient Voice Intake', verified: true }
    ],
    allergies: [
      { allergen: 'Penicillin / Amoxicillin', reaction: 'Urticarial rash, facial edema', severity: 'Severe', source: 'Historical Discharge Summary (Doc-102)', verified: false }
    ],
    abnormalLabs: [
      {
        id: 'lab-010-1',
        testName: 'HbA1c (Glycated Hemoglobin)',
        category: 'Glycemic Profile',
        value: '8.2',
        numericValue: 8.2,
        unit: '%',
        referenceRange: '4.0 - 5.6',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Sub-optimal glycemic control indicating inadequate antidiabetic compliance or titration need.',
        reportDate: '2026-09-15',
        labName: 'Metro Diagnostic Center',
        evidence: {
          sourceType: 'lab_report',
          sourceLabel: 'Glycemic Panel Report',
          documentTitle: 'Glycemic Panel — Metro Labs',
          snippet: 'HbA1c: 8.2 % [High]. Fasting Plasma Glucose: 162 mg/dL',
          confidence: 'high',
          confidenceScore: 97,
          extractedAt: '2026-09-20T08:22:00Z'
        },
        status: 'needs_verification'
      },
      {
        id: 'lab-010-2',
        testName: 'ALT (Alanine Transaminase)',
        category: 'Liver Function Test',
        value: '68',
        numericValue: 68,
        unit: 'U/L',
        referenceRange: '7 - 56',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Mild transaminitis secondary to metabolic syndrome / steatosis.',
        reportDate: '2026-09-15',
        labName: 'Metro Diagnostic Center',
        evidence: {
          sourceType: 'lab_report',
          sourceLabel: 'LFT Profile',
          confidence: 'high',
          confidenceScore: 94,
          extractedAt: '2026-09-20T08:22:00Z'
        },
        status: 'needs_verification'
      }
    ],
    normalLabs: [
      {
        id: 'lab-010-3',
        testName: 'Serum Creatinine',
        category: 'Renal Function',
        value: '0.9',
        numericValue: 0.9,
        unit: 'mg/dL',
        referenceRange: '0.7 - 1.3',
        isAbnormal: false,
        clinicalSignificance: 'Normal renal function.',
        reportDate: '2026-09-15',
        labName: 'Metro Diagnostic Center',
        evidence: {
          sourceType: 'lab_report',
          sourceLabel: 'RFT Profile',
          confidence: 'high',
          confidenceScore: 98,
          extractedAt: '2026-09-20T08:22:00Z'
        },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-10-001',
        type: 'prescription',
        title: 'Prescription — City Diabetes Clinic (Dr. Singhal)',
        titleHindi: 'डॉक्टर का पर्चा — सिटी डायबिटीज़ क्लिनिक',
        fileName: 'prescription_singhal_nov2025.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T08:21:10Z'
      },
      {
        id: 'DOC-10-002',
        type: 'lab_report',
        title: 'Comprehensive Metabolic Panel — Metro Diagnostics',
        titleHindi: 'लैब रिपोर्ट — मेट्रो डायग्नोस्टिक्स',
        fileName: 'metabolic_panel_sep2026.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T08:21:40Z'
      }
    ],
    timeline: [
      {
        id: 'tl-10-1',
        year: '2020',
        date: '12 Aug 2020',
        title: 'Initial Dyspepsia Episode',
        category: 'diagnosis',
        description: 'Onset of intermittent acid reflux after spicy meals; managed with OTC antacids.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Clinical Notes', confidence: 'medium', confidenceScore: 82, extractedAt: '2026-09-20T08:22:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-10-2',
        year: '2022',
        date: '18 Apr 2022',
        title: 'Amoxicillin Adverse Drug Reaction',
        category: 'hospitalization',
        description: 'Developed generalized urticaria and facial puffiness 45 minutes after Amoxicillin dose for dental infection.',
        clinicalFacts: [],
        evidence: { sourceType: 'discharge_summary', sourceLabel: 'Discharge Note', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:22:00Z' },
        iconName: 'ShieldAlert',
        status: 'discrepancy_flagged'
      },
      {
        id: 'tl-10-3',
        year: '2025',
        date: '14 Nov 2025',
        title: 'Type 2 Diabetes Mellitus Diagnosis',
        category: 'medication',
        description: 'FBS 174 mg/dL. Commenced Tab Metformin 500mg twice daily with lifestyle dietary modification.',
        clinicalFacts: [],
        evidence: { sourceType: 'scanned_prescription', sourceLabel: 'Prescription Doc-101', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T08:22:00Z' },
        iconName: 'Pill',
        status: 'discrepancy_flagged'
      },
      {
        id: 'tl-10-4',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Acute Amlapitta Flare & Unverified Meds',
        category: 'current_visit',
        description: 'Severe retrosternal pyrosis and sour eructation. Kiosk flagged glycemic non-disclosure and allergy risks.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Multimodal Intake', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T08:23:00Z' },
        iconName: 'AlertCircle',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-10-1',
        category: 'chief_complaint',
        label: 'Epigastric Burning',
        value: 'Post-prandial severe burning x 3 weeks',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T08:18:00Z' },
        status: 'patient_confirmed'
      },
      {
        id: 'cf-10-2',
        category: 'medication',
        label: 'Metformin Therapy',
        value: '500 mg BD (Active)',
        evidence: { sourceType: 'scanned_prescription', sourceLabel: 'Scanned Rx', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T08:21:00Z' },
        status: 'discrepancy_flagged',
        hasDiscrepancy: true
      },
      {
        id: 'cf-10-3',
        category: 'allergy',
        label: 'Penicillin Allergy',
        value: 'Urticaria & facial edema (High Risk)',
        evidence: { sourceType: 'discharge_summary', sourceLabel: 'Historical Summary', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:21:00Z' },
        status: 'discrepancy_flagged',
        isRedFlag: true,
        hasDiscrepancy: true
      },
      {
        id: 'cf-10-4',
        category: 'lab_value',
        label: 'HbA1c',
        value: '8.2% (Elevated)',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Metro Labs', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T08:22:00Z' },
        status: 'needs_verification',
        isAbnormal: true
      }
    ],
    ayushProfile: {
      completenessScore: 92,
      dashavidhaPariksha: {
        dushya: 'Rasa, Rakta, Mamsa',
        desha: 'Sadharana Desha',
        bala: 'Madhyama Bala',
        kala: 'Sharad Ritu / Ushna Kala',
        anala: 'Tikshnagni with Vidagdha Paka',
        prakriti: 'Pitta-Vata',
        vayas: 'Madhyama (42 years)',
        sattva: 'Madhyama Sattva',
        satmya: 'Katu-Amla Lavana Satmya',
        ahara: 'Vishamashana & Adhyashana'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '42M presenting with 3-week worsening retrosternal pyrosis, sour belching, and post-meal epigastric burning.',
      clinicalHistorySummary: 'History of T2DM on Metformin (hidden in voice intake) and verified Penicillin anaphylactoid allergy. Labs show HbA1c 8.2% and mild transaminitis.',
      differentialDiagnoses: ['Gastroesophageal Reflux Disease (GERD) with Reflux Esophagitis', 'Non-Ulcer Dyspepsia / Amlapitta (Urdhwaga)', 'Uncontrolled Type 2 Diabetes Mellitus'],
      recommendedWorkup: ['Upper GI Endoscopy if alarm symptoms develop', 'Titrate antidiabetic regimen with Repeat FBS/PPBS in 4 weeks', 'Urea Breath Test for H. pylori'],
      suggestedPrescription: [
        { medicine: 'Tab Pantoprazole', dosage: '40 mg', frequency: 'Once daily before breakfast', duration: '14 days', instructions: 'Take 30 mins before morning meal' },
        { medicine: 'Syrup Sucralfate + Oxetacaine', dosage: '10 ml', frequency: 'Thrice daily', duration: '7 days', instructions: 'Take 1 hour before food' },
        { medicine: 'Tab Metformin PR', dosage: '500 mg', frequency: 'Twice daily with meals', duration: '30 days', instructions: 'Reinforce glycemic compliance' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'What symptoms or difficulties brought you to the hospital today?',
        questionHindi: 'आज आपको अस्पताल किस समस्या के लिए आना पड़ा?',
        inputMethod: 'voice',
        transcript: 'Doctor, for the past 3 weeks my stomach and chest burn badly whenever I eat food, and sour water comes into my throat.',
        confirmed: true,
        timestamp: '08:16:30Z',
        isRedFlag: false
      },
      {
        questionId: 'q-duration',
        question: 'How long have you been having this burning sensation?',
        questionHindi: 'यह जलन आपको कितने समय से हो रही है?',
        inputMethod: 'voice',
        transcript: 'About 3 weeks now, getting worse over the last 4 days.',
        confirmed: true,
        timestamp: '08:17:15Z',
        isRedFlag: false
      },
      {
        questionId: 'q-meds',
        question: 'Are you taking any regular medications daily for BP, sugar, or other conditions?',
        questionHindi: 'क्या आप ब्लड प्रेशर, शुगर या किसी अन्य बीमारी के लिए नियमित दवा लेते हैं?',
        inputMethod: 'voice',
        transcript: 'No regular medicines. I only took some gel antacid from the medical shop.',
        confirmed: true,
        timestamp: '08:18:22Z',
        isRedFlag: false
      }
    ],
    consultationDraft: {
      findings: 'Epigastric tenderness present on deep palpation. No guarding or rigidity. Normal bowel sounds.',
      assessment: 'Acute exacerbation of GERD / Urdhwaga Amlapitta with unmonitored Type 2 Diabetes Mellitus.',
      diagnosis: 'Gastroesophageal Reflux Disease (GERD) with Sub-optimal T2DM Control',
      notes: 'Reviewed discrepancy: patient clarified he skipped Metformin for 2 weeks fearing stomach irritation. Re-educated patient on glycemic safety.',
      prescription: [
        { medicine: 'Tab Pantoprazole', dosage: '40 mg', frequency: '1-0-0', duration: '14 days', instructions: 'Empty stomach' },
        { medicine: 'Syrup Sucralfate + Oxetacaine', dosage: '10 ml', frequency: '1-1-1', duration: '7 days', instructions: 'Before meals' },
        { medicine: 'Tab Metformin', dosage: '500 mg', frequency: '1-0-1', duration: '30 days', instructions: 'After meals' }
      ],
      followUp: {
        required: true,
        timeframe: '2 weeks',
        instructions: 'Repeat Fasting Glucose and review symptom resolution.'
      }
    }
  },

  // 2. Patient B: Sunita Devi (Respiratory, Normal Investigations, Complete Case)
  {
    caseId: 'MEDI-OPD-2026-00011',
    tokenNumber: 11,
    tokenDisplay: 'OPD-011',
    patientName: 'Sunita Devi',
    age: 38,
    gender: 'female',
    mobile: '9811223344',
    abhaId: '91-6621-9903-0011',
    visitDateTime: '2026-09-20T08:30:00Z',
    chiefComplaint: 'Dry hacking cough with throat tickle and mild exertional breathlessness for 10 days',
    duration: '10 days',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Ready for Consultation',
    completenessScore: 98,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Allergic rhinitis (seasonal)', 'Post-viral bronchial hyper-reactivity'],
    currentMedications: [
      { name: 'Levocetirizine', dosage: '5 mg', frequency: 'Once daily at night', duration: '5 days', source: 'Kiosk Voice Intake', verified: true }
    ],
    allergies: [
      { allergen: 'House dust mites', reaction: 'Sneezing, watery eyes', severity: 'Mild', source: 'Patient Declaration', verified: true }
    ],
    abnormalLabs: [],
    normalLabs: [
      {
        id: 'lab-011-1',
        testName: 'Oxygen Saturation (SpO2)',
        category: 'Vitals',
        value: '98',
        numericValue: 98,
        unit: '%',
        referenceRange: '95 - 100',
        isAbnormal: false,
        clinicalSignificance: 'Adequate room air oxygenation; no respiratory failure.',
        reportDate: '2026-09-20',
        labName: 'Kiosk Point-of-Care Vitals',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Pulse Oximeter Sensor', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:32:00Z' },
        status: 'patient_confirmed'
      },
      {
        id: 'lab-011-2',
        testName: 'Complete Blood Count (CBC) - Hemoglobin',
        category: 'Hematology',
        value: '13.2',
        numericValue: 13.2,
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5',
        isAbnormal: false,
        clinicalSignificance: 'Normal hemoglobin; no anemia.',
        reportDate: '2026-09-18',
        labName: 'Apex Diagnostic Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'CBC Report', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T08:33:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-11-001',
        type: 'lab_report',
        title: 'Chest X-Ray PA View & Radiologist Report',
        titleHindi: 'छाती का एक्स-रे — एपेक्स लैब',
        fileName: 'chest_xray_pa_sunitadevi.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T08:33:15Z'
      }
    ],
    timeline: [
      {
        id: 'tl-11-1',
        year: '2023',
        date: '10 Nov 2023',
        title: 'Seasonal Allergic Rhinitis Evaluation',
        category: 'diagnosis',
        description: 'Diagnosed with seasonal dust-mite rhinitis. Managed with intranasal spray and antihistamines.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'OPD Card', confidence: 'high', confidenceScore: 90, extractedAt: '2026-09-20T08:34:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-11-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Post-Viral Cough Ready for Consultation',
        category: 'current_visit',
        description: 'Complete 98% intake recorded. Normal vitals (SpO2 98%) and clear lung fields on X-Ray.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T08:34:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-11-1',
        category: 'chief_complaint',
        label: 'Dry Irritant Cough',
        value: '10 days duration with nocturnal throat tickle',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T08:31:00Z' },
        status: 'patient_confirmed'
      },
      {
        id: 'cf-11-2',
        category: 'lab_value',
        label: 'SpO2 Room Air',
        value: '98% (Normal)',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Pulse Oximeter', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:32:00Z' },
        status: 'patient_confirmed'
      }
    ],
    ayushProfile: {
      completenessScore: 98,
      dashavidhaPariksha: {
        dushya: 'Pranavaha Srotas, Rasa',
        desha: 'Sadharana',
        bala: 'Pravara Bala',
        kala: 'Sharad Ritu',
        anala: 'Samagni',
        prakriti: 'Vata-Kapha',
        vayas: 'Madhyama (38 years)',
        sattva: 'Pravara',
        satmya: 'Sarva Rasa',
        ahara: 'Matravat Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '38F presenting with 10-day dry irritant cough post mild upper respiratory viral illness.',
      clinicalHistorySummary: 'Clear chest X-Ray, SpO2 98%, no fever, no hemoptysis, no wheeze. High case completeness.',
      differentialDiagnoses: ['Post-Viral Cough / Bronchial Hyperresponsiveness', 'Upper Airway Cough Syndrome (UACS)', 'Vataja Kasa'],
      recommendedWorkup: ['Steam inhalation with Karpooradi taila', 'Avoid cold foods & night air exposure'],
      suggestedPrescription: [
        { medicine: 'Syrup Dextromethorphan + Chlorpheniramine', dosage: '10 ml', frequency: 'Thrice daily', duration: '5 days', instructions: 'Take after food' },
        { medicine: 'Tab Levocetirizine', dosage: '5 mg', frequency: 'Once daily at bedtime', duration: '5 days', instructions: 'For nocturnal throat tickle' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'What is your main complaint today?',
        questionHindi: 'आज आपकी मुख्य समस्या क्या है?',
        inputMethod: 'voice',
        transcript: 'I have had a dry tickling cough in my throat for 10 days, especially worse at night.',
        confirmed: true,
        timestamp: '08:31:00Z'
      }
    ]
  },

  // 3. Patient C: Rajesh Sharma (Musculoskeletal / L4-L5 Disc, Radiculopathy, NSAID Allergy Warning)
  {
    caseId: 'MEDI-OPD-2026-00012',
    tokenNumber: 12,
    tokenDisplay: 'OPD-012',
    patientName: 'Rajesh Sharma',
    age: 52,
    gender: 'male',
    mobile: '9822334455',
    abhaId: '91-1188-4432-0012',
    visitDateTime: '2026-09-20T08:45:00Z',
    chiefComplaint: 'Severe lower back pain radiating down posterior left thigh and calf for 4 months, aggravated by bending',
    duration: '4 months',
    severity: 'severe',
    status: 'in-consultation',
    operationalState: 'In Progress',
    completenessScore: 85,
    redFlagTriggered: false,
    redFlagReason: 'Left lower extremity radicular pain with L5 dermatomal paresthesia',
    discrepanciesCount: 1,
    discrepancies: [
      {
        id: 'disc-med-012',
        category: 'allergy',
        title: 'Unverified NSAID Gastric Tolerance',
        titleHindi: 'दर्द निवारक दवा के प्रति संवेदनशीलता',
        description: 'Patient noted severe gastric burning when taking Diclofenac in 2024; allergy record unfinalized.',
        severity: 'warning',
        patientStatement: {
          text: 'Diclofenac gave me bad stomach cramps and vomiting.',
          source: 'Voice Intake Turn 3',
          timestamp: '08:48:10'
        },
        documentEvidence: {
          text: 'History of NSAID-induced gastritis noted in 2024.',
          documentTitle: 'Orthopedic Consultation Note',
          snippet: 'Caution: Avoid non-selective NSAIDs without PPI coverage.',
          date: '2024-06-12'
        },
        recommendedAction: 'Prescribe selective COX-2 inhibitor or neuropathic analgesia with PPI.',
        status: 'active'
      }
    ],
    medicalHistory: ['L4-L5 Disc Herniation (MRI 2024)', 'Sciatica (Gridhrasi)', 'Mild Hypertension'],
    currentMedications: [
      { name: 'Pregabalin', dosage: '75 mg', frequency: 'Once daily at night', duration: '2 months', source: 'Scanned Prescription', verified: true },
      { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration: 'Ongoing', source: 'Patient Voice', verified: true }
    ],
    allergies: [
      { allergen: 'Diclofenac / Non-selective NSAIDs', reaction: 'Severe epigastric pain & nausea', severity: 'Moderate', source: 'Clinical Note 2024', verified: false }
    ],
    abnormalLabs: [
      {
        id: 'lab-012-1',
        testName: 'Lumbar Spine MRI (L4-L5)',
        category: 'Imaging',
        value: 'L4-L5 Posterior Disc Herniation',
        unit: 'Descriptive',
        referenceRange: 'Normal alignment',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Left paracentral disc protrusion compressing descending L5 nerve root.',
        reportDate: '2024-06-10',
        labName: 'Metro Advanced MRI Center',
        evidence: { sourceType: 'lab_report', sourceLabel: 'MRI Spine Report', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:50:00Z' },
        status: 'needs_verification'
      }
    ],
    normalLabs: [
      {
        id: 'lab-012-2',
        testName: 'ESR (Erythrocyte Sedimentation Rate)',
        category: 'Inflammatory Markers',
        value: '18',
        numericValue: 18,
        unit: 'mm/hr',
        referenceRange: '0 - 20',
        isAbnormal: false,
        clinicalSignificance: 'No systemic inflammatory spondyloarthropathy.',
        reportDate: '2026-09-10',
        labName: 'Metro Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'ESR Report', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T08:50:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-12-001',
        type: 'lab_report',
        title: 'Lumbar Spine MRI Report (L4-L5 Disc Herniation)',
        titleHindi: 'एमआरआई रिपोर्ट — लंबर स्पाइन',
        fileName: 'mri_lumbar_rajeshsharma.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T08:49:15Z'
      }
    ],
    timeline: [
      {
        id: 'tl-12-1',
        year: '2021',
        date: '14 May 2021',
        title: 'First Mechanical Low Back Strain',
        category: 'diagnosis',
        description: 'Lifting heavy generator resulted in acute lumbago; treated conservatively.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Clinic Note', confidence: 'medium', confidenceScore: 80, extractedAt: '2026-09-20T08:51:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-12-2',
        year: '2024',
        date: '10 Jun 2024',
        title: 'MRI Confirmed L4-L5 Disc Protrusion',
        category: 'investigation',
        description: 'Developed sciatica radiating to left calf. MRI showed left paracentral extrusion.',
        clinicalFacts: [],
        evidence: { sourceType: 'lab_report', sourceLabel: 'MRI Report', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:51:00Z' },
        iconName: 'FileText',
        status: 'doctor_verified'
      },
      {
        id: 'tl-12-3',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Consultation In Progress with Dr. Priya',
        category: 'current_visit',
        description: 'Exacerbation after long car travel. SLR positive at 45 degrees on left side.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T08:52:00Z' },
        iconName: 'Clock',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-12-1',
        category: 'chief_complaint',
        label: 'Lumbar Radiculopathy',
        value: 'L4-L5 Sciatica radiating to left leg x 4 months',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T08:46:00Z' },
        status: 'patient_confirmed'
      }
    ],
    ayushProfile: {
      completenessScore: 85,
      dashavidhaPariksha: {
        dushya: 'Asthi, Majja, Snayu',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Varsha / Sharad',
        anala: 'Vishamagni',
        prakriti: 'Vata',
        vayas: 'Madhyama (52 years)',
        sattva: 'Madhyama',
        satmya: 'Vata-Vardhaka Ahara',
        ahara: 'Ruksha Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '52M presenting with chronic left lumbar radiculopathy and tingling along L5 dermatome.',
      clinicalHistorySummary: 'Prior MRI documented L4-L5 disc protrusion. NSAID intolerance history requiring gastro-protective therapy.',
      differentialDiagnoses: ['Lumbar Disc Herniation with L5 Radiculopathy (Sciatica / Gridhrasi)', 'Lumbar Canal Stenosis', 'Piriformis Syndrome'],
      recommendedWorkup: ['Physical therapy: McKenzie lumbar extension exercises', 'Kati Basti with Sahacharadi taila', 'Lumbosacral belt support while sitting'],
      suggestedPrescription: [
        { medicine: 'Tab Pregabalin', dosage: '75 mg', frequency: '0-0-1', duration: '30 days', instructions: 'Bedtime for nerve pain' },
        { medicine: 'Tab Etoricoxib', dosage: '90 mg', frequency: '1-0-0', duration: '5 days', instructions: 'Take after meals with Pantoprazole' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Where is your pain located?',
        questionHindi: 'आपको दर्द कहाँ हो रहा है?',
        inputMethod: 'voice',
        transcript: 'My lower back has sharp pain that shoots down the back of my left leg to my calf whenever I try to bend.',
        confirmed: true,
        timestamp: '08:46:10Z'
      }
    ]
  },

  // 4. Patient D: Ananya Sen (Dermatology, High IgE, Eczema Patch Test)
  {
    caseId: 'MEDI-OPD-2026-00013',
    tokenNumber: 13,
    tokenDisplay: 'OPD-013',
    patientName: 'Ananya Sen',
    age: 29,
    gender: 'female',
    mobile: '9833445566',
    abhaId: '91-5502-3319-0013',
    visitDateTime: '2026-09-20T09:00:00Z',
    chiefComplaint: 'Intensely itchy red rash and dry scaling across bilateral forearms for 2 weeks',
    duration: '2 weeks',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Ready for Consultation',
    completenessScore: 91,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Atopic dermatitis (childhood)', 'Contact dermatitis to synthetic detergents'],
    currentMedications: [
      { name: 'Clobetasol Propionate Cream', dosage: '0.05%', frequency: 'Apply twice daily', duration: '7 days', source: 'Scanned Prescription', verified: true },
      { name: 'Fexofenadine', dosage: '120 mg', frequency: 'Once daily', duration: '10 days', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [
      { allergen: 'Nickel sulfate & Sodium lauryl sulfate', reaction: 'Erythema and vesicular eruption', severity: 'Moderate', source: 'Patch Test Report', verified: true }
    ],
    abnormalLabs: [
      {
        id: 'lab-013-1',
        testName: 'Total Serum IgE',
        category: 'Immunology',
        value: '340',
        numericValue: 340,
        unit: 'IU/mL',
        referenceRange: '< 100',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Elevated atopic sensitivity consistent with active eczematous flare.',
        reportDate: '2026-09-12',
        labName: 'Skin & Allergy Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'IgE Report', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T09:05:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [],
    documents: [
      {
        id: 'DOC-13-001',
        type: 'prescription',
        title: 'Dermatology Consultation & Patch Test Report',
        titleHindi: 'त्वचा रोग विशेषज्ञ का पर्चा — स्किन क्लिनिक',
        fileName: 'dermatology_rx_ananyasen.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T09:04:30Z'
      }
    ],
    timeline: [
      {
        id: 'tl-13-1',
        year: '2022',
        date: '05 Mar 2022',
        title: 'Patch Test Confirmation of Detergent Allergy',
        category: 'investigation',
        description: 'Positive reaction to sodium lauryl sulfate. Advised soap-free cleansers.',
        clinicalFacts: [],
        evidence: { sourceType: 'lab_report', sourceLabel: 'Patch Test', confidence: 'high', confidenceScore: 94, extractedAt: '2026-09-20T09:06:00Z' },
        iconName: 'FileText',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-13-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Recurrent Forearm Eczema Flare',
        category: 'current_visit',
        description: 'Flare started after gardening. Scanned prior steroid prescription.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T09:06:00Z' },
        iconName: 'Activity',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-13-1',
        category: 'chief_complaint',
        label: 'Pruritic Forearm Rash',
        value: 'Eczema flare with dry scaling x 2 weeks',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T09:01:00Z' },
        status: 'patient_confirmed'
      }
    ],
    ayushProfile: {
      completenessScore: 91,
      dashavidhaPariksha: {
        dushya: 'Twak, Rakta, Mamsa, Lasika',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad Ritu',
        anala: 'Mandagni with Ama',
        prakriti: 'Pitta-Kapha',
        vayas: 'Yuva (29 years)',
        sattva: 'Pravara',
        satmya: 'Tikta Satmya',
        ahara: 'Amla-Lavana Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '29F presenting with acute flare of bilateral forearm pruritic atopic/contact dermatitis (Vicharchika).',
      clinicalHistorySummary: 'Serum IgE 340 IU/mL, prior nickel/detergent allergy. Currently on Clobetasol and Fexofenadine.',
      differentialDiagnoses: ['Allergic Contact Dermatitis', 'Atopic Eczema (Vicharchika)', 'Nummular Dermatitis'],
      recommendedWorkup: ['Step down to mild topical calcineurin inhibitor or barrier ceramide cream', 'Ayurvedic Mahatiktaka Ghrita or Gandhaka Rasayana for Rakta Shodhan'],
      suggestedPrescription: [
        { medicine: 'Ceramide Barrier Moisturizing Lotion', dosage: 'Liberal', frequency: '3-4 times daily', duration: 'Ongoing', instructions: 'Apply immediately after bath on damp skin' },
        { medicine: 'Tab Bilastine', dosage: '20 mg', frequency: '1-0-0', duration: '10 days', instructions: 'Take on empty stomach for itch relief' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Describe the skin rash and how long it has been present.',
        questionHindi: 'अपनी त्वचा की समस्या के बारे में बताएं।',
        inputMethod: 'voice',
        transcript: 'Both my forearms have red bumpy dry patches that itch terribly, especially at night. It started 2 weeks ago after gardening.',
        confirmed: true,
        timestamp: '09:01:30Z'
      }
    ]
  },

  // 5. Patient E: Harish Chandra (Chronic Polypharmacy, Diabetic Nephropathy Stage 3a, 11-Year Timeline)
  {
    caseId: 'MEDI-OPD-2026-00014',
    tokenNumber: 14,
    tokenDisplay: 'OPD-014',
    patientName: 'Harish Chandra',
    age: 64,
    gender: 'male',
    mobile: '9844556677',
    abhaId: '91-8844-2211-0014',
    visitDateTime: '2026-09-20T09:15:00Z',
    chiefComplaint: 'Routine 6-month review for Type 2 Diabetes & Hypertension; mild morning postural lightheadedness',
    duration: '6 months review',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Verification Required',
    completenessScore: 95,
    redFlagTriggered: false,
    redFlagReason: 'Borderline postural drop (Sitting BP 138/84 -> Standing 116/70) & early CKD 3a (eGFR 58 mL/min)',
    discrepanciesCount: 1,
    discrepancies: [
      {
        id: 'disc-med-014',
        category: 'medication',
        title: 'Sulfa Drug Historical Allergy Alert',
        titleHindi: 'सल्फा दवा एलर्जी चेतावनी',
        description: 'Patient is on Glimepiride (Sulfonylurea class) despite documented historical Sulfa-induced urticaria in 2017.',
        severity: 'warning',
        patientStatement: {
          text: 'I had rashes from Septran antibiotic many years ago.',
          source: 'Voice Intake Turn 4',
          timestamp: '09:18:40'
        },
        documentEvidence: {
          text: 'Prescribed Tab Glimepiride 2mg OD in 2024 without adverse reaction reported.',
          documentTitle: 'Cardiac OPD Summary',
          snippet: 'Regimen: Metformin 1000mg + Glimepiride 2mg + Telmisartan 40mg',
          date: '2024-03-20'
        },
        recommendedAction: 'Verify tolerance to Sulfonylurea versus switching to DPP-4 inhibitor / SGLT-2 inhibitor.',
        status: 'active'
      }
    ],
    medicalHistory: ['Type 2 Diabetes Mellitus (since 2015)', 'Essential Hypertension (since 2018)', 'Coronary Artery Disease post LAD Stent (2023)', 'Early Diabetic Nephropathy Stage 3a'],
    currentMedications: [
      { name: 'Metformin XR', dosage: '1000 mg', frequency: 'Twice daily', duration: 'Ongoing', source: 'Cardio-Diabetic Summary', verified: true },
      { name: 'Glimepiride', dosage: '2 mg', frequency: 'Once daily before breakfast', duration: 'Ongoing', source: 'Cardio-Diabetic Summary', verified: true },
      { name: 'Telmisartan', dosage: '40 mg', frequency: 'Once daily in morning', duration: 'Ongoing', source: 'Cardio-Diabetic Summary', verified: true },
      { name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once daily at bedtime', duration: 'Ongoing', source: 'Cardio-Diabetic Summary', verified: true }
    ],
    allergies: [
      { allergen: 'Trimethoprim-Sulfamethoxazole (Sulfa)', reaction: 'Maculopapular rash, pruritus', severity: 'Moderate', source: 'Patient History 2017', verified: true }
    ],
    abnormalLabs: [
      {
        id: 'lab-014-1',
        testName: 'HbA1c',
        category: 'Glycemic',
        value: '7.9',
        numericValue: 7.9,
        unit: '%',
        referenceRange: '4.0 - 5.6',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Above target (<7.0%) for 64yo diabetic with cardiovascular history.',
        reportDate: '2026-09-14',
        labName: 'Fortis Clinical Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Diabetic Panel', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T09:20:00Z' },
        status: 'patient_confirmed'
      },
      {
        id: 'lab-014-2',
        testName: 'eGFR (CKD-EPI equation)',
        category: 'Renal',
        value: '58',
        numericValue: 58,
        unit: 'mL/min/1.73m²',
        referenceRange: '> 90',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Mild-to-moderate reduction in GFR (Stage 3a CKD). Monitor Metformin dose.',
        reportDate: '2026-09-14',
        labName: 'Fortis Clinical Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Renal Function', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T09:20:00Z' },
        status: 'needs_verification'
      },
      {
        id: 'lab-014-3',
        testName: 'Urine Albumin-to-Creatinine Ratio (UACR)',
        category: 'Renal',
        value: '64',
        numericValue: 64,
        unit: 'mg/g',
        referenceRange: '< 30',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Microalbuminuria confirming early diabetic nephropathy.',
        reportDate: '2026-09-14',
        labName: 'Fortis Clinical Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Urine Panel', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T09:20:00Z' },
        status: 'needs_verification'
      }
    ],
    normalLabs: [
      {
        id: 'lab-014-4',
        testName: 'LDL Cholesterol',
        category: 'Lipid Profile',
        value: '72',
        numericValue: 72,
        unit: 'mg/dL',
        referenceRange: '< 100',
        isAbnormal: false,
        clinicalSignificance: 'Well-controlled on Atorvastatin 20mg.',
        reportDate: '2026-09-14',
        labName: 'Fortis Clinical Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Lipid Panel', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T09:20:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-14-001',
        type: 'lab_report',
        title: 'Comprehensive Renal & Glycemic Panel — Fortis Labs',
        titleHindi: 'किडनी एवं शुगर टेस्ट रिपोर्ट — फोर्टिस लैब',
        fileName: 'renal_glycemic_harishchandra.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T09:19:15Z'
      },
      {
        id: 'DOC-14-002',
        type: 'discharge_summary',
        title: 'Post-PCI Discharge Summary (LAD Drug-Eluting Stent 2023)',
        titleHindi: 'डिस्चार्ज सारांश — एंजियोप्लास्टी (2023)',
        fileName: 'discharge_summary_pci_2023.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T09:19:40Z'
      }
    ],
    timeline: [
      {
        id: 'tl-14-1',
        year: '2015',
        date: '22 Jan 2015',
        title: 'Type 2 Diabetes Mellitus Diagnosis',
        category: 'diagnosis',
        description: 'Screened positive on routine health check. Started on Metformin 500mg.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Clinic Record', confidence: 'high', confidenceScore: 90, extractedAt: '2026-09-20T09:21:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-14-2',
        year: '2018',
        date: '10 Aug 2018',
        title: 'Hypertension Diagnosed',
        category: 'diagnosis',
        description: 'BP 154/96 mmHg. Added Telmisartan 40mg daily.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Cardiology Note', confidence: 'high', confidenceScore: 92, extractedAt: '2026-09-20T09:21:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-14-3',
        year: '2023',
        date: '04 Sep 2023',
        title: 'Coronary Angioplasty (LAD Stent)',
        category: 'surgery',
        description: 'Unstable angina with 85% mid-LAD lesion. Successful DES deployment. Dual antiplatelets.',
        clinicalFacts: [],
        evidence: { sourceType: 'discharge_summary', sourceLabel: 'PCI Discharge Summary', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:21:00Z' },
        iconName: 'ShieldAlert',
        status: 'doctor_verified'
      },
      {
        id: 'tl-14-4',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: 6-Month Review & Nephropathy Screen',
        category: 'current_visit',
        description: 'eGFR 58 mL/min with microalbuminuria detected. Postural BP drop identified at kiosk.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T09:22:00Z' },
        iconName: 'Clock',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-14-1',
        category: 'condition',
        label: 'T2DM & CAD Post-PCI',
        value: '11 years diabetes, stable post LAD stent',
        evidence: { sourceType: 'discharge_summary', sourceLabel: 'Discharge Summary', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:19:00Z' },
        status: 'doctor_verified'
      },
      {
        id: 'cf-14-2',
        category: 'lab_value',
        label: 'eGFR / Microalbuminuria',
        value: 'eGFR 58 mL/min (Stage 3a CKD), UACR 64 mg/g',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Fortis Labs', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T09:20:00Z' },
        status: 'needs_verification',
        isAbnormal: true
      }
    ],
    ayushProfile: {
      completenessScore: 95,
      dashavidhaPariksha: {
        dushya: 'Meda, Majja, Kleda, Mutra',
        desha: 'Sadharana',
        bala: 'Avara-Madhyama Bala',
        kala: 'Sharad Ritu',
        anala: 'Mandagni',
        prakriti: 'Kapha-Vata',
        vayas: 'Vriddha (64 years)',
        sattva: 'Madhyama',
        satmya: 'Madhura-Snigdha Satmya',
        ahara: 'Guru Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '64M with T2DM, HTN, post-PCI on 4 medications for routine 6-month follow-up. Reports mild morning postural dizziness.',
      clinicalHistorySummary: 'Lab findings show early diabetic nephropathy (eGFR 58, UACR 64) and HbA1c 7.9%. Kiosk detected 22 mmHg postural systolic drop.',
      differentialDiagnoses: ['Diabetic Autonomic Neuropathy / Postural Hypotension', 'Diabetic Kidney Disease (DKD Stage 3a)', 'Cardiovascular Polypharmacy review needed'],
      recommendedWorkup: ['Reduce Telmisartan or shift dose to bedtime', 'Introduce SGLT-2 inhibitor (Empagliflozin 10mg) for renal & cardiac protection if eGFR stable', '24-hour ambulatory blood pressure monitoring'],
      suggestedPrescription: [
        { medicine: 'Tab Telmisartan', dosage: '20 mg', frequency: '0-0-1', duration: '30 days', instructions: 'Dose reduced from 40mg to prevent postural drop' },
        { medicine: 'Tab Metformin XR', dosage: '500 mg', frequency: '1-0-1', duration: '30 days', instructions: 'Adjusted for eGFR 58' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'How are your diabetes and blood pressure medicines working?',
        questionHindi: 'आपकी शुगर और बीपी की दवाएं कैसी चल रही हैं?',
        inputMethod: 'voice',
        transcript: 'The medicines are going on fine, but in the morning when I get out of bed quickly, my head feels light and dizzy for a few seconds.',
        confirmed: true,
        timestamp: '09:16:30Z'
      }
    ]
  },

  // 6. Patient F: Aman Verma (Acute High Fever 103.2 F, Tachycardia, Low Platelets, Dengue Triage Priority 1)
  {
    caseId: 'MEDI-OPD-2026-00015',
    tokenNumber: 15,
    tokenDisplay: 'OPD-015',
    patientName: 'Aman Verma',
    age: 24,
    gender: 'male',
    mobile: '9855667788',
    abhaId: '91-7711-4402-0015',
    visitDateTime: '2026-09-20T09:30:00Z',
    chiefComplaint: 'High-grade spiking fever 103.2°F with severe retro-orbital headache, body aches, and rigors for 3 days',
    duration: '3 days',
    severity: 'critical',
    status: 'waiting',
    operationalState: 'Verification Required',
    completenessScore: 68,
    redFlagTriggered: false,
    redFlagReason: 'CRITICAL TRIAGE: High Fever 103.2°F, Tachycardia HR 114 bpm, BP 94/62 mmHg, Platelets 98,000 /uL (Dengue NS1+)',
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['No prior chronic illness', 'Lives in area with reported monsoon vector-borne outbreaks'],
    currentMedications: [
      { name: 'Paracetamol', dosage: '650 mg', frequency: 'Every 6 hours', duration: '2 days', source: 'Kiosk Voice Intake', verified: true },
      { name: 'Oral Rehydration Salts (ORS)', dosage: '1 sachet in 1L water', frequency: 'As needed', duration: 'Ongoing', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [
      { allergen: 'No known drug allergies (NKDA)', reaction: 'None', severity: 'None', source: 'Kiosk Self-Declaration', verified: true }
    ],
    abnormalLabs: [
      {
        id: 'lab-015-1',
        testName: 'Platelet Count',
        category: 'Hematology',
        value: '98,000',
        numericValue: 98000,
        unit: '/uL',
        referenceRange: '150,000 - 450,000',
        isAbnormal: true,
        abnormalSeverity: 'critical',
        clinicalSignificance: 'Thrombocytopenia requiring close daily platelet monitoring and hydration monitoring.',
        reportDate: '2026-09-20',
        labName: 'Emergency Rapid Point-of-Care Lab',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Stat CBC', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:35:00Z' },
        status: 'needs_verification'
      },
      {
        id: 'lab-015-2',
        testName: 'Dengue NS1 Antigen Rapid Card',
        category: 'Serology',
        value: 'POSITIVE',
        unit: 'Qualitative',
        referenceRange: 'Negative',
        isAbnormal: true,
        abnormalSeverity: 'critical',
        clinicalSignificance: 'Confirms acute Dengue virus infection (Day 3 of illness).',
        reportDate: '2026-09-20',
        labName: 'Emergency Rapid Serology Lab',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Dengue Card', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:35:00Z' },
        status: 'needs_verification'
      },
      {
        id: 'lab-015-3',
        testName: 'Heart Rate (Tachycardia)',
        category: 'Vitals',
        value: '114',
        numericValue: 114,
        unit: 'bpm',
        referenceRange: '60 - 100',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Febrile sinus tachycardia / dehydration.',
        reportDate: '2026-09-20',
        labName: 'Kiosk Point-of-Care Sensor',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Vitals Monitor', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T09:32:00Z' },
        status: 'needs_verification'
      }
    ],
    normalLabs: [
      {
        id: 'lab-015-4',
        testName: 'SpO2',
        category: 'Vitals',
        value: '97',
        numericValue: 97,
        unit: '%',
        referenceRange: '95 - 100',
        isAbnormal: false,
        clinicalSignificance: 'Normal oxygenation.',
        reportDate: '2026-09-20',
        labName: 'Kiosk Point-of-Care Sensor',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Pulse Oximeter', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:32:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-15-001',
        type: 'lab_report',
        title: 'Emergency Stat CBC & Dengue NS1 Report',
        titleHindi: 'आपातकालीन रक्त जांच रिपोर्ट — डेंगू एनएस1 पॉजिटिव',
        fileName: 'stat_dengue_amanverma.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T09:34:45Z'
      }
    ],
    timeline: [
      {
        id: 'tl-15-1',
        year: '2026',
        date: '17 Sep 2026',
        title: 'Sudden Onset High Fever with Chills',
        category: 'current_visit',
        description: 'Temperature spiked to 103°F with intense frontal and retro-orbital headache and myalgia.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T09:32:00Z' },
        iconName: 'AlertCircle',
        status: 'needs_verification'
      },
      {
        id: 'tl-15-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Kiosk Emergency Triage Priority 1',
        category: 'hospitalization',
        description: 'Platelets 98k, Dengue NS1 positive, HR 114 bpm, BP 94/62 mmHg. Immediate doctor review assigned.',
        clinicalFacts: [],
        evidence: { sourceType: 'lab_report', sourceLabel: 'Stat Lab', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:36:00Z' },
        iconName: 'ShieldAlert',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-15-1',
        category: 'symptom',
        label: 'Spiking Fever & Tachycardia',
        value: '103.2°F, HR 114 bpm (Urgent Priority)',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Kiosk Vitals', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:32:00Z' },
        status: 'needs_verification',
        isRedFlag: true
      },
      {
        id: 'cf-15-2',
        category: 'lab_value',
        label: 'Dengue NS1 Antigen & Thrombocytopenia',
        value: 'Dengue NS1 Positive, Platelets 98,000 /uL',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Stat CBC', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T09:35:00Z' },
        status: 'needs_verification',
        isRedFlag: true,
        isAbnormal: true
      }
    ],
    ayushProfile: {
      completenessScore: 68,
      dashavidhaPariksha: {
        dushya: 'Rasa, Rakta, Sweda',
        desha: 'Sadharana',
        bala: 'Avara Bala',
        kala: 'Varsha Ritu',
        anala: 'Vishamagni / Sannipata Jwara',
        prakriti: 'Pitta-Vata',
        vayas: 'Yuva (24 years)',
        sattva: 'Madhyama',
        satmya: 'Sadharana',
        ahara: 'Avara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '24M presenting with acute febrile illness Day 3, high fever (103.2°F), retro-orbital headache, and severe arthralgia.',
      clinicalHistorySummary: 'Dengue NS1 Positive with Platelets dropping to 98,000/uL, HR 114, BP 94/62. High risk for capillary leakage phase.',
      differentialDiagnoses: ['Acute Dengue Fever with Warning Signs', 'Malaria / Chikungunya Co-infection', 'Sannipata Jwara'],
      recommendedWorkup: ['Strict oral fluid intake (2.5 - 3.0 L/day with ORS/coconut water)', 'Daily CBC & Hematocrit monitoring', 'Watch for warning signs: severe abdominal pain, persistent vomiting, mucosal bleeding', 'AVOID Aspirin, Ibuprofen, and all NSAIDs'],
      suggestedPrescription: [
        { medicine: 'Tab Paracetamol', dosage: '650 mg', frequency: 'SOS (max 4 times/day)', duration: '5 days', instructions: 'Take only when fever > 100°F with plenty of water' },
        { medicine: 'ORS Solution Packets', dosage: '1 packet in 1 Liter water', frequency: '2-3 liters daily', duration: '5 days', instructions: 'Sip continuously throughout the day' },
        { medicine: 'Syp Carica Papaya Leaf Extract (Ayush supportive)', dosage: '10 ml', frequency: 'Thrice daily', duration: '5 days', instructions: 'For platelet stabilization' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'What symptoms are you feeling right now?',
        questionHindi: 'इस समय आपको क्या तकलीफ हो रही है?',
        inputMethod: 'voice',
        transcript: 'I have intense shaking chills, severe pain behind my eyes, and my whole body aches like my bones are breaking.',
        confirmed: true,
        timestamp: '09:31:00Z',
        isRedFlag: true
      }
    ]
  },

  // 7. Patient G: Meenakshi Sundaram (Comprehensive AYUSH Presentation - Prakriti/Vikriti/Agni/Koshtha/Dashavidha)
  {
    caseId: 'MEDI-OPD-2026-00016',
    tokenNumber: 16,
    tokenDisplay: 'OPD-016',
    patientName: 'Meenakshi Sundaram',
    age: 48,
    gender: 'female',
    mobile: '9866778899',
    abhaId: '91-3329-1104-0016',
    visitDateTime: '2026-09-20T09:45:00Z',
    chiefComplaint: 'Chronic sleep fragmentation, morning joint stiffness, sluggish digestion with abdominal distension for 8 months',
    duration: '8 months',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Ready for Consultation',
    completenessScore: 96,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Subclinical Hypothyroidism', 'Chronic Insomnia / Anidra', 'Vata-dominant generalized stiffness'],
    currentMedications: [
      { name: 'Thyroxine', dosage: '25 mcg', frequency: 'Once daily empty stomach', duration: '1 year', source: 'Kiosk Intake', verified: true },
      { name: 'Triphala Churna', dosage: '3 g', frequency: 'At bedtime with warm water', duration: '3 months', source: 'Ayush Intake', verified: true }
    ],
    allergies: [
      { allergen: 'No known drug allergies', reaction: 'None', severity: 'None', source: 'Kiosk Intake', verified: true }
    ],
    abnormalLabs: [
      {
        id: 'lab-016-1',
        testName: 'Serum 25-Hydroxy Vitamin D',
        category: 'Biochemical',
        value: '14.2',
        numericValue: 14.2,
        unit: 'ng/mL',
        referenceRange: '30.0 - 100.0',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Moderate vitamin D deficiency contributing to generalized musculoskeletal fatigue.',
        reportDate: '2026-09-10',
        labName: 'Apollo Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Vitamin Profile', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T09:50:00Z' },
        status: 'patient_confirmed'
      },
      {
        id: 'lab-016-2',
        testName: 'Thyroid Stimulating Hormone (TSH)',
        category: 'Endocrinology',
        value: '4.8',
        numericValue: 4.8,
        unit: 'uIU/mL',
        referenceRange: '0.4 - 4.5',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Borderline elevated TSH on 25mcg Thyroxine.',
        reportDate: '2026-09-10',
        labName: 'Apollo Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Thyroid Panel', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T09:50:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [
      {
        id: 'lab-016-3',
        testName: 'Rheumatoid Factor (RA Factor)',
        category: 'Serology',
        value: '8.4',
        numericValue: 8.4,
        unit: 'IU/mL',
        referenceRange: '< 14.0',
        isAbnormal: false,
        clinicalSignificance: 'Negative for seropositive rheumatoid arthritis.',
        reportDate: '2026-09-10',
        labName: 'Apollo Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Immunology Panel', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T09:50:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-16-001',
        type: 'other',
        title: 'Ayurvedic Nadi Pariksha & Panchakarma Intake Record',
        titleHindi: 'आयुर्वेदिक नाड़ी परीक्षा एवं पंचकर्म पत्र',
        fileName: 'ayush_nadi_record_meenakshi.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T09:48:20Z'
      }
    ],
    timeline: [
      {
        id: 'tl-16-1',
        year: '2022',
        date: '15 Oct 2022',
        title: 'Onset of Chronic Sleep Disturbance',
        category: 'diagnosis',
        description: 'Night shift job led to irregular diurnal cycle and chronic sleep fragmentation (Anidra).',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Ayush Clinic', confidence: 'high', confidenceScore: 91, extractedAt: '2026-09-20T09:51:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-16-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Comprehensive AYUSH Assessment Ready',
        category: 'current_visit',
        description: 'Full Dashavidha Pariksha completed at Kiosk. Vata-Pitta Prakriti with Mandagni diagnosed.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Multimodal Intake', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T09:52:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-16-1',
        category: 'ayush',
        label: 'Prakriti / Vikriti Assessment',
        value: 'Prakriti: Vata-Pitta | Vikriti: Vata Vriddhi with Sama Pitta',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Ayush Intake Screen', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T09:47:00Z' },
        status: 'doctor_verified'
      },
      {
        id: 'cf-16-2',
        category: 'ayush',
        label: 'Agni & Koshtha Pariksha',
        value: 'Agni: Mandagni | Koshtha: Krura Koshtha (constipation-prone)',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Pariksha', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T09:47:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 96,
      dashavidhaPariksha: {
        dushya: 'Rasa, Asthi, Majja, Manas',
        desha: 'Sadharana Desha',
        bala: 'Madhyama Bala',
        kala: 'Sharad Ritu / Shishira',
        anala: 'Mandagni with Vishama Paka',
        prakriti: 'Vata-Pitta',
        vayas: 'Madhyama (48 years)',
        sattva: 'Madhyama Sattva',
        satmya: 'Madhura-Lavana Satmya',
        ahara: 'Vishamashana, Ratri Jagarana (Shift Work)'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '48F presenting with 8-month history of Anidra (insomnia), Mandagni with bloating, and Vataja Sandhishoola.',
      clinicalHistorySummary: 'Subclinical hypothyroidism (TSH 4.8) and Vitamin D deficiency (14.2 ng/mL). Full AYUSH profiling complete.',
      differentialDiagnoses: ['Vata Prakopa with Anidra (Sleep fragmentation)', 'Mandagni leading to Ama accumulation and Sandhi Shaithilya', 'Subclinical Hypothyroidism needing minor dose titration'],
      recommendedWorkup: ['Shirodhara with Ksheerabala Taila (7 sessions)', 'Abhyanga with Dhanwantharam Taila', 'Cholecalciferol 60,000 IU sachet weekly x 8 weeks'],
      suggestedPrescription: [
        { medicine: 'Tab Ashwagandha Ghanavati', dosage: '500 mg', frequency: '1-0-1', duration: '30 days', instructions: 'Take with warm milk at bedtime for sleep and stress' },
        { medicine: 'Tab Hingwashtak Churna', dosage: '2 g', frequency: 'Twice daily', duration: '15 days', instructions: 'Take with first morsel of food for Mandagni' },
        { medicine: 'Cap Cholecalciferol (Vitamin D3)', dosage: '60,000 IU', frequency: 'Once weekly on Sundays', duration: '8 weeks', instructions: 'Take with milk after breakfast' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Describe how your sleep and digestion have been feeling.',
        questionHindi: 'अपनी नींद और पाचन की स्थिति बताएं।',
        inputMethod: 'voice',
        transcript: 'I wake up 3 to 4 times every night and cannot fall back asleep. In the mornings my joints feel stiff, and after eating anything my stomach gets bloated and heavy.',
        confirmed: true,
        timestamp: '09:46:15Z'
      }
    ]
  },

  // 8. Patient H: Nitin Deshmukh (New Registration, Low Completeness, Rapid In-take)
  {
    caseId: 'MEDI-OPD-2026-00017',
    tokenNumber: 17,
    tokenDisplay: 'OPD-017',
    patientName: 'Nitin Deshmukh',
    age: 19,
    gender: 'male',
    mobile: '9877889900',
    abhaId: '91-9988-1122-0017',
    visitDateTime: '2026-09-20T10:00:00Z',
    chiefComplaint: 'Mild generalized fatigue and lightheadedness during college lectures for 5 days',
    duration: '5 days',
    severity: 'mild',
    status: 'waiting',
    operationalState: 'In Progress',
    completenessScore: 42,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['No prior hospital visits recorded'],
    currentMedications: [],
    allergies: [],
    abnormalLabs: [],
    normalLabs: [],
    documents: [],
    timeline: [
      {
        id: 'tl-17-1',
        year: '2026',
        date: '20 Sep 2026',
        title: 'New Patient Kiosk Registration',
        category: 'current_visit',
        description: 'First time visit. Basic demographic and preliminary chief complaint recorded.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'medium', confidenceScore: 78, extractedAt: '2026-09-20T10:02:00Z' },
        iconName: 'User',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-17-1',
        category: 'chief_complaint',
        label: 'Generalized Fatigue',
        value: '5 days mild fatigue, intake in progress',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'medium', confidenceScore: 80, extractedAt: '2026-09-20T10:01:00Z' },
        status: 'needs_verification'
      }
    ],
    ayushProfile: {
      completenessScore: 42,
      dashavidhaPariksha: {
        dushya: 'Rasa',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad',
        anala: 'Samagni',
        prakriti: 'Pitta-Vata',
        vayas: 'Yuva (19 years)',
        sattva: 'Madhyama',
        satmya: 'Sadharana',
        ahara: 'Aniyata Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '19M college student with 5-day history of fatigue and mild postural lightheadedness. Intake ongoing.',
      clinicalHistorySummary: 'No past medical history. Recommend checking Hemoglobin, Vitals, and Blood Pressure.',
      differentialDiagnoses: ['Dehydration / Nutritional Fatigue', 'Early Viral Prodrome', 'Orthostatic intolerance / Inadequate sleep'],
      recommendedWorkup: ['CBC for anemia screen', 'Random Blood Glucose', 'Hydration and sleep counseling'],
      suggestedPrescription: [
        { medicine: 'Oral Hydration & Electrolytes', dosage: '2 liters daily', frequency: 'Daily', duration: '7 days', instructions: 'Maintain adequate fluid intake' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'What difficulty are you having?',
        questionHindi: 'आपको क्या परेशानी हो रही है?',
        inputMethod: 'voice',
        transcript: 'I have been feeling very tired and dizzy for the past 5 days while studying.',
        confirmed: true,
        timestamp: '10:01:00Z'
      }
    ]
  },

  // 9. Patient 9 (OPD-018): Savitri Devi (58/F, Bilateral Knee Osteoarthritis Kellgren-Lawrence Grade 3)
  {
    caseId: 'MEDI-OPD-2026-00018',
    tokenNumber: 18,
    tokenDisplay: 'OPD-018',
    patientName: 'Savitri Devi',
    age: 58,
    gender: 'female',
    mobile: '9888990011',
    abhaId: '91-1234-5678-0018',
    visitDateTime: '2026-09-20T10:15:00Z',
    chiefComplaint: 'Bilateral knee pain with joint crepitus, severe weight-bearing difficulty, and morning stiffness for 6 months',
    duration: '6 months',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Ready for Consultation',
    completenessScore: 90,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Bilateral Knee Osteoarthritis', 'Post-menopausal osteopenia'],
    currentMedications: [
      { name: 'Glucosamine + Chondroitin', dosage: '1500/1200 mg', frequency: 'Once daily', duration: '3 months', source: 'Kiosk Intake', verified: true },
      { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration: 'As needed', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [{ allergen: 'NKDA', reaction: 'None', severity: 'None', source: 'Declaration', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-018-1',
        testName: 'Bilateral Knee X-Ray (Standing AP/Lateral)',
        category: 'Radiology',
        value: 'Kellgren-Lawrence Grade 3 Medial Joint Space Narrowing',
        unit: 'Grade 3',
        referenceRange: 'Grade 0 (Normal)',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Advanced medial compartment cartilage loss with marginal osteophytes and subchondral sclerosis.',
        reportDate: '2026-08-20',
        labName: 'Orthopedic Imaging Center',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Knee X-Ray', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T10:20:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [
      {
        id: 'lab-018-2',
        testName: 'Serum Uric Acid',
        category: 'Biochemical',
        value: '5.2',
        numericValue: 5.2,
        unit: 'mg/dL',
        referenceRange: '2.4 - 6.0',
        isAbnormal: false,
        clinicalSignificance: 'Normal; rules out acute gouty arthritis.',
        reportDate: '2026-08-20',
        labName: 'Orthopedic Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Uric Acid', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T10:20:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-18-001',
        type: 'lab_report',
        title: 'Bilateral Knee Standing X-Ray Report',
        titleHindi: 'घुटनों का एक्स-रे — ऑर्थोपेडिक सेंटर',
        fileName: 'knee_xray_savitridevi.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T10:18:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-18-1',
        year: '2024',
        date: '12 Sep 2024',
        title: 'Initial Knee Crepitus & Morning Stiffness',
        category: 'diagnosis',
        description: 'First complained of knee clicking and difficulty climbing temple steps.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'OPD Record', confidence: 'high', confidenceScore: 89, extractedAt: '2026-09-20T10:21:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-18-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Janu Sandhigata Vata Evaluation',
        category: 'current_visit',
        description: 'Ready for doctor consultation. Janu Basti and quadriceps strengthening advised.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 95, extractedAt: '2026-09-20T10:21:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-18-1',
        category: 'chief_complaint',
        label: 'Bilateral Janu Sandhishoola',
        value: 'Grade 3 OA knees with crepitus x 6 months',
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Voice Intake', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T10:16:00Z' },
        status: 'patient_confirmed'
      }
    ],
    ayushProfile: {
      completenessScore: 90,
      dashavidhaPariksha: {
        dushya: 'Asthi, Majja, Sandhi',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad',
        anala: 'Mandagni',
        prakriti: 'Kapha-Vata',
        vayas: 'Vriddha (58 years)',
        sattva: 'Madhyama',
        satmya: 'Sadharana',
        ahara: 'Vata Vardhaka'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '58F presenting with bilateral knee osteoarthritis (KL Grade 3) and severe weight-bearing pain.',
      clinicalHistorySummary: 'Clear of gout (Uric Acid 5.2). Benefits from quadriceps rehabilitation, local Janu Basti with Ksheerabala Taila.',
      differentialDiagnoses: ['Primary Osteoarthritis of Bilateral Knees (Janu Sandhigata Vata)', 'Pes Anserine Bursitis', 'Degenerative Meniscal Tear'],
      recommendedWorkup: ['Quadriceps isometric physiotherapy', 'Knee hinged brace during walking', 'Ayurvedic Janu Basti / Taila Dhara'],
      suggestedPrescription: [
        { medicine: 'Tab Yogaraja Guggulu', dosage: '500 mg', frequency: '1-0-1', duration: '30 days', instructions: 'Take with warm water after meals' },
        { medicine: 'Sahacharadi Taila (External)', dosage: 'Apply gently', frequency: 'Twice daily', duration: '30 days', instructions: 'Warm application followed by fomentation' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Which joints are troubling you?',
        questionHindi: 'आपको किस जोड़ में दर्द है?',
        inputMethod: 'voice',
        transcript: 'Both of my knees make clicking sounds and hurt severely when I stand up from the floor or walk more than 100 meters.',
        confirmed: true,
        timestamp: '10:16:15Z'
      }
    ]
  },

  // 10. Patient 10 (OPD-019): Vikram Patel (45/M, Post-PCI Angioplasty Stable Follow-up)
  {
    caseId: 'MEDI-OPD-2026-00019',
    tokenNumber: 19,
    tokenDisplay: 'OPD-019',
    patientName: 'Vikram Patel',
    age: 45,
    gender: 'male',
    mobile: '9899001122',
    abhaId: '91-4477-8899-0019',
    visitDateTime: '2026-09-20T10:30:00Z',
    chiefComplaint: 'Post-coronary angioplasty 1-year routine cardiac check-up; mild chest tightness while climbing 2 flights of stairs',
    duration: '1 year review',
    severity: 'moderate',
    status: 'in-consultation',
    operationalState: 'In Progress',
    completenessScore: 94,
    redFlagTriggered: false,
    redFlagReason: 'Exertional chest tightness in patient with prior LAD stent — TMT / Echo review required',
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Coronary Artery Disease (CAD)', 'Status Post LAD Drug-Eluting Stent (2025)', 'Dyslipidemia'],
    currentMedications: [
      { name: 'Aspirin', dosage: '75 mg', frequency: 'Once daily after lunch', duration: 'Ongoing', source: 'Discharge Summary', verified: true },
      { name: 'Clopidogrel', dosage: '75 mg', frequency: 'Once daily after breakfast', duration: 'Ongoing', source: 'Discharge Summary', verified: true },
      { name: 'Metoprolol Succinate ER', dosage: '25 mg', frequency: 'Once daily in morning', duration: 'Ongoing', source: 'Discharge Summary', verified: true },
      { name: 'Rosuvastatin', dosage: '20 mg', frequency: 'Once daily at bedtime', duration: 'Ongoing', source: 'Discharge Summary', verified: true }
    ],
    allergies: [{ allergen: 'NKDA', reaction: 'None', severity: 'None', source: 'Declaration', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-019-1',
        testName: 'Triglycerides',
        category: 'Lipid Profile',
        value: '165',
        numericValue: 165,
        unit: 'mg/dL',
        referenceRange: '< 150',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Mild hypertriglyceridemia; LDL is well-controlled at 74 mg/dL.',
        reportDate: '2026-09-15',
        labName: 'City Heart Institute',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Lipid Profile', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T10:35:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [
      {
        id: 'lab-019-2',
        testName: '12-Lead Electrocardiogram (ECG)',
        category: 'Cardiology',
        value: 'Normal Sinus Rhythm, HR 68 bpm, No fresh ST-T changes',
        unit: 'Descriptive',
        referenceRange: 'Normal',
        isAbnormal: false,
        clinicalSignificance: 'Stable post-stent electrical conduction.',
        reportDate: '2026-09-20',
        labName: 'Kiosk ECG Station',
        evidence: { sourceType: 'lab_report', sourceLabel: 'ECG Station', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T10:33:00Z' },
        status: 'doctor_verified'
      }
    ],
    documents: [
      {
        id: 'DOC-19-001',
        type: 'discharge_summary',
        title: 'Angioplasty Discharge Summary (Apollo Heart Hospital 2025)',
        titleHindi: 'हार्ट डिस्चार्ज समरी — अपोलो अस्पताल (2025)',
        fileName: 'angioplasty_vikrampatel.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T10:34:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-19-1',
        year: '2025',
        date: '10 Aug 2025',
        title: 'Acute Coronary Syndrome & LAD Stenting',
        category: 'surgery',
        description: 'Successful DES stenting of LAD. Excellent post-procedure flow TIMI III.',
        clinicalFacts: [],
        evidence: { sourceType: 'discharge_summary', sourceLabel: 'Discharge Summary', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T10:36:00Z' },
        iconName: 'ShieldAlert',
        status: 'doctor_verified'
      },
      {
        id: 'tl-19-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: 1-Year Follow-up & Treadmill Test Scheduling',
        category: 'current_visit',
        description: 'Doctor consultation active. Mild stair-climbing tightness evaluated.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T10:36:00Z' },
        iconName: 'Clock',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-19-1',
        category: 'condition',
        label: 'Post-PCI LAD Stent',
        value: 'Stable on DAPT (Aspirin + Clopidogrel)',
        evidence: { sourceType: 'discharge_summary', sourceLabel: 'Discharge Doc', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T10:34:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 94,
      dashavidhaPariksha: {
        dushya: 'Rasa, Rakta, Meda, Hridaya',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad',
        anala: 'Samagni',
        prakriti: 'Pitta-Kapha',
        vayas: 'Madhyama (45 years)',
        sattva: 'Pravara',
        satmya: 'Sadharana',
        ahara: 'Snigdha-Katu Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '45M 1-year post LAD stent presenting for annual review with mild exertional chest heaviness on stairs.',
      clinicalHistorySummary: 'Normal resting ECG, LDL well controlled at 74 mg/dL. DAPT adherence verified.',
      differentialDiagnoses: ['Stable Post-PCI CAD / Microvascular Angina', 'In-Stent Restenosis (low probability, screen with TMT/Echo)', 'Gastroesophageal Reflux mimicking angina'],
      recommendedWorkup: ['2D Echocardiography for ejection fraction & regional wall motion', 'Stress Treadmill Test (TMT)', 'Continue DAPT & Statin'],
      suggestedPrescription: [
        { medicine: 'Tab Rosuvastatin', dosage: '20 mg', frequency: '0-0-1', duration: '90 days', instructions: 'Bedtime lipid management' },
        { medicine: 'Tab Arjuna Churna / Tablets (Ayush cardioprotective)', dosage: '500 mg', frequency: '1-0-1', duration: '90 days', instructions: 'Take with warm water after meals' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Are you having any chest pain or breathlessness?',
        questionHindi: 'क्या आपको सीने में दर्द या सांस फूलने की समस्या है?',
        inputMethod: 'voice',
        transcript: 'I feel a slight tightness in my chest when I quickly climb two flights of stairs, which goes away after resting for 2 minutes.',
        confirmed: true,
        timestamp: '10:31:00Z'
      }
    ]
  },

  // 11. Patient 11 (OPD-020): Kavita Iyer (34/F, Hypothyroidism TSH 8.9 uIU/mL, Completed Consultation)
  {
    caseId: 'MEDI-OPD-2026-00020',
    tokenNumber: 20,
    tokenDisplay: 'OPD-020',
    patientName: 'Kavita Iyer',
    age: 34,
    gender: 'female',
    mobile: '9811335577',
    abhaId: '91-6655-4433-0020',
    visitDateTime: '2026-09-20T07:45:00Z',
    chiefComplaint: 'Weight gain of 4 kg over 3 months, persistent lethargy, and cold intolerance',
    duration: '3 months',
    severity: 'mild',
    status: 'completed',
    operationalState: 'Consultation Complete',
    completenessScore: 97,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Hashimoto Hypothyroidism (diagnosed 2024)'],
    currentMedications: [
      { name: 'Thyroxine Sodium', dosage: '50 mcg', frequency: 'Once daily before breakfast', duration: '1 year', source: 'Prescription', verified: true }
    ],
    allergies: [{ allergen: 'NKDA', reaction: 'None', severity: 'None', source: 'Kiosk Intake', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-020-1',
        testName: 'TSH (Ultrasensitive)',
        category: 'Thyroid Panel',
        value: '8.9',
        numericValue: 8.9,
        unit: 'uIU/mL',
        referenceRange: '0.4 - 4.5',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Elevated TSH indicating inadequate thyroid hormone replacement.',
        reportDate: '2026-09-16',
        labName: 'Dr. Lal PathLabs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Thyroid Profile', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T07:50:00Z' },
        status: 'doctor_verified'
      }
    ],
    normalLabs: [
      {
        id: 'lab-020-2',
        testName: 'Free T4',
        category: 'Thyroid Panel',
        value: '1.1',
        numericValue: 1.1,
        unit: 'ng/dL',
        referenceRange: '0.8 - 1.8',
        isAbnormal: false,
        clinicalSignificance: 'Low-normal Free T4.',
        reportDate: '2026-09-16',
        labName: 'Dr. Lal PathLabs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Thyroid Profile', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T07:50:00Z' },
        status: 'doctor_verified'
      }
    ],
    documents: [
      {
        id: 'DOC-20-001',
        type: 'lab_report',
        title: 'Thyroid Function Panel — Dr. Lal PathLabs',
        titleHindi: 'थायराइड टेस्ट रिपोर्ट — लाल पैथलैब्स',
        fileName: 'tft_kavitaiyer.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T07:48:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-20-1',
        year: '2024',
        date: '14 Feb 2024',
        title: 'Hypothyroidism Diagnosis',
        category: 'diagnosis',
        description: 'TSH 12.4 uIU/mL. Started on Thyroxine 50 mcg.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Endocrine Note', confidence: 'high', confidenceScore: 94, extractedAt: '2026-09-20T07:52:00Z' },
        iconName: 'Activity',
        status: 'doctor_verified'
      },
      {
        id: 'tl-20-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Consultation Completed by Dr. Priya',
        category: 'current_visit',
        description: 'Thyroxine titrated from 50 mcg to 75 mcg daily. Repeat TSH in 6 weeks.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_confirmation', sourceLabel: 'Finalized Summary', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:10:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-20-1',
        category: 'condition',
        label: 'Under-replaced Hypothyroidism',
        value: 'TSH 8.9 uIU/mL on 50 mcg Thyroxine',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Dr. Lal Labs', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T07:50:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 97,
      dashavidhaPariksha: {
        dushya: 'Rasa, Meda, Dhatvagni',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad',
        anala: 'Mandagni with Dhatvagni Mandya',
        prakriti: 'Kapha',
        vayas: 'Yuva-Madhyama (34 years)',
        sattva: 'Pravara',
        satmya: 'Sadharana',
        ahara: 'Guru Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '34F with primary hypothyroidism presenting with weight gain and TSH 8.9 uIU/mL on 50mcg Thyroxine.',
      clinicalHistorySummary: 'Consultation finalized: dose titrated to 75mcg daily on empty stomach. Repeat TSH in 6 weeks.',
      differentialDiagnoses: ['Primary Hypothyroidism with Inadequate Replacement', 'Hashimoto Autoimmune Thyroiditis (Galaganda)', 'Kapha Vriddhi with Medodhatvagni Mandya'],
      recommendedWorkup: ['Kanchanara Guggulu for Dhatvagni deepana', 'Brisk walking 30 mins daily', 'Repeat Serum TSH in 6 weeks'],
      suggestedPrescription: [
        { medicine: 'Tab Thyroxine Sodium', dosage: '75 mcg', frequency: '1-0-0', duration: '60 days', instructions: 'Take on empty stomach 45 mins before tea/breakfast' },
        { medicine: 'Tab Kanchanara Guggulu', dosage: '500 mg', frequency: '1-0-1', duration: '30 days', instructions: 'Take with warm water after meals' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'What symptoms have you been noticing?',
        questionHindi: 'आपको क्या लक्षण महसूस हो रहे हैं?',
        inputMethod: 'voice',
        transcript: 'Even though I am eating normal food, I gained 4 kilos and feel cold and sleepy all the time.',
        confirmed: true,
        timestamp: '07:46:00Z'
      }
    ]
  },

  // 12. Patient 12 (OPD-021): Deepak Joshi (50/M, Grade II Fatty Liver, Elevated ALT/AST, Completed)
  {
    caseId: 'MEDI-OPD-2026-00021',
    tokenNumber: 21,
    tokenDisplay: 'OPD-021',
    patientName: 'Deepak Joshi',
    age: 50,
    gender: 'male',
    mobile: '9822446688',
    abhaId: '91-2233-4455-0021',
    visitDateTime: '2026-09-20T08:00:00Z',
    chiefComplaint: 'Right upper quadrant abdominal fullness, post-meal fatigue, and indigestion for 2 months',
    duration: '2 months',
    severity: 'mild',
    status: 'completed',
    operationalState: 'Consultation Complete',
    completenessScore: 93,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Non-Alcoholic Fatty Liver Disease (NAFLD)', 'Metabolic syndrome'],
    currentMedications: [
      { name: 'Vitamin E', dosage: '400 IU', frequency: 'Once daily after breakfast', duration: 'Ongoing', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [{ allergen: 'NKDA', reaction: 'None', severity: 'None', source: 'Kiosk Intake', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-021-1',
        testName: 'ALT (SGPT)',
        category: 'Liver Function',
        value: '76',
        numericValue: 76,
        unit: 'U/L',
        referenceRange: '7 - 56',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Elevated transaminases consistent with NASH / NAFLD.',
        reportDate: '2026-09-17',
        labName: 'Liver Diagnostics Lab',
        evidence: { sourceType: 'lab_report', sourceLabel: 'LFT Panel', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T08:05:00Z' },
        status: 'doctor_verified'
      },
      {
        id: 'lab-021-2',
        testName: 'Ultrasound Abdomen',
        category: 'Radiology',
        value: 'Grade II Diffuse Hepatic Steatosis',
        unit: 'Descriptive',
        referenceRange: 'Normal liver echotexture',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Significant parenchymal fat accumulation with hepatomegaly (15.8 cm).',
        reportDate: '2026-09-17',
        labName: 'City Imaging & Ultrasound Center',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Ultrasound Report', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:05:00Z' },
        status: 'doctor_verified'
      }
    ],
    normalLabs: [],
    documents: [
      {
        id: 'DOC-21-001',
        type: 'lab_report',
        title: 'Ultrasound Whole Abdomen & LFT Panel',
        titleHindi: 'अल्ट्रासाउंड एवं लिवर टेस्ट रिपोर्ट — सिटी इमेजिंग',
        fileName: 'usg_lft_deepakjoshi.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T08:04:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-21-1',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Consultation Finalized & Hepato-Protective Regimen Prescribed',
        category: 'current_visit',
        description: 'Prescribed Liv-52 DS, dietary restriction of refined sugars, and 45-min daily aerobic exercise.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_confirmation', sourceLabel: 'Finalized Record', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T08:25:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-21-1',
        category: 'condition',
        label: 'Grade II Hepatic Steatosis',
        value: 'ALT 76 U/L, Hepatomegaly 15.8 cm',
        evidence: { sourceType: 'lab_report', sourceLabel: 'USG Report', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T08:05:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 93,
      dashavidhaPariksha: {
        dushya: 'Meda, Rakta, Yakrit',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad',
        anala: 'Mandagni with Ama',
        prakriti: 'Pitta-Kapha',
        vayas: 'Madhyama (50 years)',
        sattva: 'Madhyama',
        satmya: 'Snigdha Satmya',
        ahara: 'Guru-Snigdha Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '50M with Grade II fatty liver (NAFLD) and ALT 76 U/L presenting for hepatology management.',
      clinicalHistorySummary: 'Consultation complete. Prescribed lifestyle modification, weight reduction target of 5%, and hepatoprotective therapy.',
      differentialDiagnoses: ['Non-Alcoholic Fatty Liver Disease (NAFLD / Yakridalyodara)', 'Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD)'],
      recommendedWorkup: ['Brisk walk 45 mins daily', 'Avoid fried foods and sugary drinks', 'Repeat LFT in 3 months'],
      suggestedPrescription: [
        { medicine: 'Tab Liv-52 DS', dosage: '1 tablet', frequency: '1-0-1', duration: '90 days', instructions: 'After meals for liver enzyme reduction' },
        { medicine: 'Tab Ursodeoxycholic Acid', dosage: '300 mg', frequency: '1-0-1', duration: '60 days', instructions: 'Take with food' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'What discomfort are you experiencing in your abdomen?',
        questionHindi: 'पेट में क्या परेशानी महसूस होती है?',
        inputMethod: 'voice',
        transcript: 'I have a heavy dragging feeling under my right ribcage, and after eating oily food I feel very sluggish.',
        confirmed: true,
        timestamp: '08:01:00Z'
      }
    ]
  },

  // 13. Patient 13 (OPD-022): Pooja Rani (27/F, Severe Microcytic Anemia Hb 8.4 g/dL, Ready)
  {
    caseId: 'MEDI-OPD-2026-00022',
    tokenNumber: 22,
    tokenDisplay: 'OPD-022',
    patientName: 'Pooja Rani',
    age: 27,
    gender: 'female',
    mobile: '9833557799',
    abhaId: '91-8899-7766-0022',
    visitDateTime: '2026-09-20T10:45:00Z',
    chiefComplaint: 'Extreme exhaustion, breathlessness on climbing one flight of stairs, and brittle spoon-shaped nails for 2 months',
    duration: '2 months',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Ready for Consultation',
    completenessScore: 91,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Heavy menstrual bleeding (Menorrhagia)', 'Nutritional Iron Deficiency Anemia'],
    currentMedications: [],
    allergies: [{ allergen: 'NKDA', reaction: 'None', severity: 'None', source: 'Kiosk Intake', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-022-1',
        testName: 'Hemoglobin (Hb)',
        category: 'Hematology',
        value: '8.4',
        numericValue: 8.4,
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Moderate-to-severe microcytic hypochromic anemia (Pandu Roga).',
        reportDate: '2026-09-18',
        labName: 'Metro Diagnostic Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'CBC Report', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T10:50:00Z' },
        status: 'patient_confirmed'
      },
      {
        id: 'lab-022-2',
        testName: 'Serum Ferritin',
        category: 'Iron Studies',
        value: '6.2',
        numericValue: 6.2,
        unit: 'ng/mL',
        referenceRange: '15.0 - 150.0',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Severely depleted iron stores.',
        reportDate: '2026-09-18',
        labName: 'Metro Diagnostic Labs',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Iron Studies', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T10:50:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [],
    documents: [
      {
        id: 'DOC-22-001',
        type: 'lab_report',
        title: 'Complete Blood Count & Iron Profile — Metro Labs',
        titleHindi: 'सीबीसी एवं आयरन रिपोर्ट — मेट्रो लैब',
        fileName: 'iron_profile_poojarani.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T10:48:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-22-1',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Iron Deficiency Anemia Evaluation Ready',
        category: 'current_visit',
        description: 'Hb 8.4 g/dL and Ferritin 6.2 ng/mL documented. Ready for oral iron and Ayurvedic Dhatri Lauha prescription.',
        clinicalFacts: [],
        evidence: { sourceType: 'lab_report', sourceLabel: 'CBC', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T10:52:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-22-1',
        category: 'condition',
        label: 'Iron Deficiency Anemia (Pandu)',
        value: 'Hb 8.4 g/dL, Ferritin 6.2 ng/mL',
        evidence: { sourceType: 'lab_report', sourceLabel: 'CBC', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T10:50:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 91,
      dashavidhaPariksha: {
        dushya: 'Rasa, Rakta, Ojas',
        desha: 'Sadharana',
        bala: 'Avara Bala',
        kala: 'Sharad',
        anala: 'Mandagni with Raktakshaya',
        prakriti: 'Vata-Pitta',
        vayas: 'Yuva (27 years)',
        sattva: 'Madhyama',
        satmya: 'Sadharana',
        ahara: 'Avara Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '27F with menorrhagia presenting with fatigue, paleness, and microcytic anemia (Hb 8.4 g/dL, Ferritin 6.2).',
      clinicalHistorySummary: 'Clear case of iron deficiency anemia (Pandu Roga). Ready for therapeutic oral iron supplementation and dietary iron counseling.',
      differentialDiagnoses: ['Nutritional Iron Deficiency Anemia', 'Menorrhagia-induced Anemia', 'Pandu Roga (Vata-Pitta)'],
      recommendedWorkup: ['Ferrous Ascorbate 100mg elemental iron daily', 'Pomegranate, beetroot, and jaggery in diet', 'Repeat CBC in 60 days'],
      suggestedPrescription: [
        { medicine: 'Tab Ferrous Ascorbate + Folic Acid', dosage: '100 mg elemental iron', frequency: '1-0-0', duration: '90 days', instructions: 'Take 1 hour after lunch with lemon water' },
        { medicine: 'Tab Dhatri Lauha / Punarnava Mandura', dosage: '500 mg', frequency: '1-0-1', duration: '60 days', instructions: 'Take with warm water after meals' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Describe your fatigue and weakness.',
        questionHindi: 'अपनी कमजोरी के बारे में बताएं।',
        inputMethod: 'voice',
        transcript: 'I feel out of breath even walking around my house, my eyes feel pale, and my fingernails have become brittle and flat.',
        confirmed: true,
        timestamp: '10:46:00Z'
      }
    ]
  },

  // 14. Patient 14 (OPD-023): Manoj Tiwari (61/M, Chronic COPD Wheeze, SpO2 93%, Attention Required)
  {
    caseId: 'MEDI-OPD-2026-00023',
    tokenNumber: 23,
    tokenDisplay: 'OPD-023',
    patientName: 'Manoj Tiwari',
    age: 61,
    gender: 'male',
    mobile: '9844668800',
    abhaId: '91-5544-3322-0023',
    visitDateTime: '2026-09-20T11:00:00Z',
    chiefComplaint: 'Chronic productive morning cough, audible expiratory wheezing, and dyspnea on walking 50 meters for 3 weeks',
    duration: '3 weeks flare',
    severity: 'severe',
    status: 'waiting',
    operationalState: 'Verification Required',
    completenessScore: 88,
    redFlagTriggered: false,
    redFlagReason: 'Borderline SpO2 93% on room air with active expiratory wheezing — COPD exacerbation risk',
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Chronic Obstructive Pulmonary Disease (COPD / Tamaka Shwasa)', '30 pack-year smoking history (quit 2023)'],
    currentMedications: [
      { name: 'Budesonide + Formoterol Inhaler', dosage: '400/6 mcg', frequency: '2 puffs twice daily', duration: 'Ongoing', source: 'Kiosk Intake', verified: true },
      { name: 'Deriphyllin Retard', dosage: '150 mg', frequency: 'Twice daily', duration: 'Ongoing', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [{ allergen: 'Cold air & biomass smoke', reaction: 'Bronchospasm', severity: 'Severe', source: 'Kiosk Intake', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-023-1',
        testName: 'Oxygen Saturation (SpO2)',
        category: 'Vitals',
        value: '93',
        numericValue: 93,
        unit: '%',
        referenceRange: '95 - 100',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Borderline hypoxemia in COPD flare.',
        reportDate: '2026-09-20',
        labName: 'Kiosk Vitals Sensor',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Pulse Oximeter', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T11:02:00Z' },
        status: 'needs_verification'
      },
      {
        id: 'lab-023-2',
        testName: 'Spirometry (Post-Bronchodilator FEV1/FVC)',
        category: 'Pulmonary Function',
        value: '62',
        numericValue: 62,
        unit: '%',
        referenceRange: '> 70',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Moderate airflow limitation (GOLD Stage 2 COPD).',
        reportDate: '2025-11-10',
        labName: 'Chest Care Center',
        evidence: { sourceType: 'lab_report', sourceLabel: 'Spirometry Report', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T11:05:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [],
    documents: [
      {
        id: 'DOC-23-001',
        type: 'lab_report',
        title: 'Spirometry Flow-Volume Loop Report',
        titleHindi: 'फेफड़ों की जांच रिपोर्ट (स्पायरोमेट्री)',
        fileName: 'spirometry_manojtiwari.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T11:04:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-23-1',
        year: '2022',
        date: '10 Dec 2022',
        title: 'COPD Diagnosis & Smoking Cessation',
        category: 'diagnosis',
        description: 'FEV1/FVC 62%. Prescribed dual inhaler therapy.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Pulmonology Record', confidence: 'high', confidenceScore: 93, extractedAt: '2026-09-20T11:06:00Z' },
        iconName: 'Activity',
        status: 'doctor_verified'
      },
      {
        id: 'tl-23-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: Acute Bronchospasm & SpO2 93%',
        category: 'current_visit',
        description: 'Priority evaluation for nebulization and corticosteroid burst.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T11:06:00Z' },
        iconName: 'AlertCircle',
        status: 'needs_verification'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-23-1',
        category: 'symptom',
        label: 'Expiratory Wheeze & Hypoxemia',
        value: 'SpO2 93%, COPD exacerbation (Tamaka Shwasa)',
        evidence: { sourceType: 'patient_touch', sourceLabel: 'Pulse Oximeter', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T11:02:00Z' },
        status: 'needs_verification',
        isRedFlag: true
      }
    ],
    ayushProfile: {
      completenessScore: 88,
      dashavidhaPariksha: {
        dushya: 'Pranavaha Srotas, Kapha, Vata',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad / Hemanta',
        anala: 'Mandagni',
        prakriti: 'Vata-Kapha',
        vayas: 'Vriddha (61 years)',
        sattva: 'Madhyama',
        satmya: 'Sadharana',
        ahara: 'Sheeta-Ruksha Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '61M with known COPD presenting with 3-week worsening productive cough, wheezing, and SpO2 93%.',
      clinicalHistorySummary: 'Prior spirometry FEV1/FVC 62%. Requires nebulization review and short course oral steroid / bronchodilator optimization.',
      differentialDiagnoses: ['Acute Exacerbation of COPD (Tamaka Shwasa)', 'Secondary Bronchial Infection', 'Left Ventricular Failure (less likely)'],
      recommendedWorkup: ['Duolin (Levosalbutamol + Ipratropium) nebulization stat in OPD', 'Incentive spirometry and diaphragmatic breathing training', 'Pneumococcal and influenza vaccination'],
      suggestedPrescription: [
        { medicine: 'Tab Deflazacort', dosage: '6 mg', frequency: '1-0-0', duration: '5 days', instructions: 'Take after breakfast for airway inflammation' },
        { medicine: 'Shwaskasa Chintamani Rasa (Ayush)', dosage: '125 mg', frequency: '1-0-1', duration: '30 days', instructions: 'Take with honey for bronchial clearance' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'How is your breathing today?',
        questionHindi: 'आपकी सांस कैसी चल रही है?',
        inputMethod: 'voice',
        transcript: 'I have a whistling sound in my chest whenever I breathe out, and I cough up thick yellow sputum every morning.',
        confirmed: true,
        timestamp: '11:01:00Z',
        isRedFlag: true
      }
    ]
  },

  // 15. Patient 15 (OPD-024): Tanvi Agarwal (31/F, Chronic Maxillary Sinusitis, Closed)
  {
    caseId: 'MEDI-OPD-2026-00024',
    tokenNumber: 24,
    tokenDisplay: 'OPD-024',
    patientName: 'Tanvi Agarwal',
    age: 31,
    gender: 'female',
    mobile: '9855779911',
    abhaId: '91-1122-3344-0024',
    visitDateTime: '2026-09-20T07:30:00Z',
    chiefComplaint: 'Frontal headache, facial fullness over right cheek, and persistent post-nasal drip for 3 weeks',
    duration: '3 weeks',
    severity: 'mild',
    status: 'closed',
    operationalState: 'Follow-up',
    completenessScore: 89,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Chronic Allergic Rhinosinusitis (Dushta Pratishyaya)'],
    currentMedications: [
      { name: 'Fluticasone Furoate Nasal Spray', dosage: '27.5 mcg/spray', frequency: '2 sprays in each nostril daily', duration: 'Ongoing', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [{ allergen: 'Pollen and damp air', reaction: 'Sneezing & nasal congestion', severity: 'Mild', source: 'Declaration', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-024-1',
        testName: 'X-Ray PNS (Water\'s View)',
        category: 'Radiology',
        value: 'Mucosal thickening in right maxillary antrum; no fluid level',
        unit: 'Descriptive',
        referenceRange: 'Clear paranasal sinuses',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Right chronic maxillary sinusitis.',
        reportDate: '2026-09-15',
        labName: 'Apex Imaging Center',
        evidence: { sourceType: 'lab_report', sourceLabel: 'PNS X-Ray', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T07:35:00Z' },
        status: 'doctor_verified'
      }
    ],
    normalLabs: [],
    documents: [
      {
        id: 'DOC-24-001',
        type: 'lab_report',
        title: 'X-Ray PNS Water\'s View & Radiologist Report',
        titleHindi: 'साइनस एक्स-रे रिपोर्ट — एपेक्स इमेजिंग',
        fileName: 'pns_xray_tanviagarwal.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T07:33:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-24-1',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Case Closed — Steam Inhalation & Nasal Saline Routine Finalized',
        category: 'current_visit',
        description: 'Discharged with Anu Taila Nasya and steam inhalation. Follow-up in 4 weeks.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_confirmation', sourceLabel: 'Discharge Summary', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T07:45:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-24-1',
        category: 'condition',
        label: 'Right Maxillary Sinusitis (Dushta Pratishyaya)',
        value: 'Mucosal thickening without air-fluid level',
        evidence: { sourceType: 'lab_report', sourceLabel: 'PNS X-Ray', confidence: 'high', confidenceScore: 97, extractedAt: '2026-09-20T07:35:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 89,
      dashavidhaPariksha: {
        dushya: 'Pranavaha Srotas, Kapha, Vata, Shiras',
        desha: 'Sadharana',
        bala: 'Madhyama',
        kala: 'Sharad',
        anala: 'Samagni',
        prakriti: 'Kapha-Vata',
        vayas: 'Yuva (31 years)',
        sattva: 'Pravara',
        satmya: 'Sadharana',
        ahara: 'Kaphakara Ahara'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '31F with 3-week right maxillary sinus mucosal thickening and post-nasal drip. Case closed.',
      clinicalHistorySummary: 'Treated with nasal corticosteroids and Ayurvedic Anu Taila Nasya. No bacterial complications.',
      differentialDiagnoses: ['Chronic Maxillary Sinusitis (Dushta Pratishyaya)', 'Allergic Rhinitis'],
      recommendedWorkup: ['Twice daily saline nasal irrigation', 'Anu Taila Nasya (2 drops in each nostril in morning)'],
      suggestedPrescription: [
        { medicine: 'Anu Taila (Ayush Nasya)', dosage: '2 drops per nostril', frequency: 'Once daily morning', duration: '30 days', instructions: 'Administer lying down after gentle facial steam' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'Where do you feel the facial pressure?',
        questionHindi: 'चेहरे पर भारीपन कहाँ महसूस होता है?',
        inputMethod: 'voice',
        transcript: 'Heavy throbbing pressure right behind my right eye and cheekbone.',
        confirmed: true,
        timestamp: '07:31:00Z'
      }
    ]
  },

  // 16. Patient 16 (OPD-025): Suresh Gokhale (70/M, BPH Prostate 42cc, Nocturia 4x, Ready)
  {
    caseId: 'MEDI-OPD-2026-00025',
    tokenNumber: 25,
    tokenDisplay: 'OPD-025',
    patientName: 'Suresh Gokhale',
    age: 70,
    gender: 'male',
    mobile: '9866880022',
    abhaId: '91-7788-9900-0025',
    visitDateTime: '2026-09-20T11:15:00Z',
    chiefComplaint: 'Nocturia 4-5 times per night, weak urinary stream, hesitancy, and post-void dribbling for 5 months',
    duration: '5 months',
    severity: 'moderate',
    status: 'waiting',
    operationalState: 'Ready for Consultation',
    completenessScore: 92,
    redFlagTriggered: false,
    discrepanciesCount: 0,
    discrepancies: [],
    medicalHistory: ['Benign Prostatic Hyperplasia (BPH Grade II)', 'Mild essential hypertension'],
    currentMedications: [
      { name: 'Tamsulosin', dosage: '0.4 mg', frequency: 'Once daily at bedtime', duration: '3 months', source: 'Kiosk Intake', verified: true }
    ],
    allergies: [{ allergen: 'NKDA', reaction: 'None', severity: 'None', source: 'Declaration', verified: true }],
    abnormalLabs: [
      {
        id: 'lab-025-1',
        testName: 'Ultrasound KUB (Prostate & Post-Void Residual)',
        category: 'Radiology',
        value: 'Prostate Volume: 42 cc (Grade II Enlargement), PVR: 65 mL',
        unit: 'cc / mL',
        referenceRange: 'Prostate < 25 cc, PVR < 30 mL',
        isAbnormal: true,
        abnormalSeverity: 'high',
        clinicalSignificance: 'Grade II BPH with moderate post-void residual urine volume.',
        reportDate: '2026-09-12',
        labName: 'Urology Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'USG KUB Report', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T11:20:00Z' },
        status: 'patient_confirmed'
      }
    ],
    normalLabs: [
      {
        id: 'lab-025-2',
        testName: 'Serum Total PSA',
        category: 'Urology',
        value: '2.8',
        numericValue: 2.8,
        unit: 'ng/mL',
        referenceRange: '< 4.0',
        isAbnormal: false,
        clinicalSignificance: 'Normal PSA; low risk for prostatic malignancy.',
        reportDate: '2026-09-12',
        labName: 'Urology Diagnostics',
        evidence: { sourceType: 'lab_report', sourceLabel: 'PSA Report', confidence: 'high', confidenceScore: 98, extractedAt: '2026-09-20T11:20:00Z' },
        status: 'patient_confirmed'
      }
    ],
    documents: [
      {
        id: 'DOC-25-001',
        type: 'lab_report',
        title: 'Ultrasound KUB & Serum PSA Report — Urology Diagnostics',
        titleHindi: 'प्रोस्टेट एवं यूरीन टेस्ट रिपोर्ट — यूरोलॉजी सेंटर',
        fileName: 'usg_psa_sureshgokhale.pdf',
        status: 'scanned',
        timestamp: '2026-09-20T11:18:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-25-1',
        year: '2025',
        date: '10 Nov 2025',
        title: 'Onset of Nocturia & Urinary Hesitancy',
        category: 'diagnosis',
        description: 'Night waking 3 times. Started on Tamsulosin 0.4mg.',
        clinicalFacts: [],
        evidence: { sourceType: 'consultation_note', sourceLabel: 'Urology Record', confidence: 'high', confidenceScore: 91, extractedAt: '2026-09-20T11:22:00Z' },
        iconName: 'Activity',
        status: 'patient_confirmed'
      },
      {
        id: 'tl-25-2',
        year: '2026',
        date: '20 Sep 2026',
        title: 'Current Visit: BPH Review (Prostate 42cc, PSA 2.8)',
        category: 'current_visit',
        description: 'Ready for consultation. Consider adding 5-alpha reductase inhibitor (Finasteride) or Gokshuradi Guggulu.',
        clinicalFacts: [],
        evidence: { sourceType: 'patient_voice', sourceLabel: 'Kiosk Intake', confidence: 'high', confidenceScore: 96, extractedAt: '2026-09-20T11:22:00Z' },
        iconName: 'CheckCircle2',
        status: 'doctor_verified'
      }
    ],
    clinicalFacts: [
      {
        id: 'cf-25-1',
        category: 'condition',
        label: 'Benign Prostatic Hyperplasia (Vatashthila)',
        value: 'Prostate 42cc, Nocturia 4-5x, PSA 2.8 ng/mL',
        evidence: { sourceType: 'lab_report', sourceLabel: 'USG KUB', confidence: 'high', confidenceScore: 99, extractedAt: '2026-09-20T11:20:00Z' },
        status: 'doctor_verified'
      }
    ],
    ayushProfile: {
      completenessScore: 92,
      dashavidhaPariksha: {
        dushya: 'Mutravaha Srotas, Basti, Vata',
        desha: 'Sadharana',
        bala: 'Madhyama-Avara',
        kala: 'Sharad',
        anala: 'Mandagni',
        prakriti: 'Vata',
        vayas: 'Vriddha (70 years)',
        sattva: 'Madhyama',
        satmya: 'Sadharana',
        ahara: 'Vata Vardhaka'
      }
    },
    aiDraftSummary: {
      chiefComplaintSummary: '70M with BPH Grade II (Prostate 42cc, PVR 65 mL, PSA 2.8) presenting with nocturia 4-5 times per night and hesitancy.',
      clinicalHistorySummary: 'Normal PSA rules out malignancy. Monotherapy with Tamsulosin 0.4mg requires review; add 5-ARI or Ayurvedic Gokshuradi Guggulu.',
      differentialDiagnoses: ['Benign Prostatic Hyperplasia Grade II (Vatashthila / Mutraghata)', 'Overactive Bladder (OAB)', 'Urinary Tract Infection (subclinical)'],
      recommendedWorkup: ['Add Finasteride 5mg or Gokshuradi Guggulu', 'Restrict evening fluid intake after 7 PM', 'Pelvic floor conditioning'],
      suggestedPrescription: [
        { medicine: 'Tab Tamsulosin + Finasteride', dosage: '0.4 / 5 mg', frequency: '0-0-1', duration: '90 days', instructions: 'Take 30 mins after dinner' },
        { medicine: 'Tab Gokshuradi Guggulu', dosage: '500 mg', frequency: '1-0-1', duration: '60 days', instructions: 'Take with warm water for urinary flow' }
      ]
    },
    voiceResponses: [
      {
        questionId: 'q-chief',
        question: 'How frequently do you wake up at night for urination?',
        questionHindi: 'रात में पेशाब के लिए कितनी बार उठना पड़ता है?',
        inputMethod: 'voice',
        transcript: 'I wake up 4 or 5 times every night, and the stream takes almost a full minute to start with very weak pressure.',
        confirmed: true,
        timestamp: '11:16:00Z'
      }
    ]
  }
];

// Helper to convert DemoDoctorPatient to DoctorCase format for backward compatibility
export const DEMO_DOCTOR_CASES_RECORD = DEMO_DOCTOR_PATIENTS.reduce<Record<string, any>>((acc, p) => {
  acc[p.caseId] = {
    caseId: p.caseId,
    tokenNumber: p.tokenNumber,
    tokenDisplay: p.tokenDisplay,
    patientName: p.patientName,
    age: p.age,
    gender: p.gender,
    mobile: p.mobile,
    abhaId: p.abhaId,
    chiefComplaint: p.chiefComplaint,
    voiceResponses: p.voiceResponses,
    ayushResponses: [],
    medicationHistory: {
      takingMedicines: p.currentMedications.length > 0 ? 'yes_daily' : 'no',
      medicines: p.currentMedications.map(m => `${m.name} ${m.dosage}`).join(', ')
    },
    allergyHistory: {
      hasAllergy: p.allergies.length > 0 ? 'yes' : 'no',
      allergies: p.allergies.map(a => a.allergen).join(', '),
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
          medicine: rx.medicine,
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
  return acc;
}, {});
