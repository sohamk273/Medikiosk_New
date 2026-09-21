import { MockDoctorCaseProvider, type DoctorCase } from './MockDoctorCaseProvider';

export type ClinicalReportType =
  | 'consultation-summary'
  | 'prescription'
  | 'ayush-assessment'
  | 'patient-history'
  | 'case-summary';

export type ClinicalReportStatus =
  | 'draft'
  | 'generating'
  | 'generated'
  | 'reviewed'
  | 'archived';

export interface ClinicalReport {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  maskedMobile: string;
  maskedAbhaId: string;
  reportType: ClinicalReportType;
  title: string;
  status: ClinicalReportStatus;
  generatedAt: string;
  formattedDate: string;
  formattedTime: string;
  updatedAt?: string;
  reviewedAt?: string;
  archivedAt?: string;
  doctorName: string;
  department: string;
  diagnosis?: string;
  chiefComplaint?: string;
  consultationId?: string;
  redFlagTriggered?: boolean;

  content: {
    patientInformation?: Record<string, string>;
    clinicalAssessment?: Record<string, string>;
    ayushAssessment?: Record<string, string>;
    prescriptions?: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    followUp?: {
      required: boolean;
      timeframe?: string;
      instructions?: string;
    };
    patientHistory?: Record<string, string>;
    documents?: Array<{
      id: string;
      fileName: string;
      type: string;
    }>;
  };
}

// -----------------------------------------------------------------------------------------
// 24 DETERMINISTIC PRODUCTION CLINICAL REPORT RECORDS
// Summary: Total = 24 | Generated = 18 | Reviewed = 4 | Drafts = 1 | Archived = 1
// -----------------------------------------------------------------------------------------

const INITIAL_REPORTS: ClinicalReport[] = [
  // 1. Aarav Mehta (Reviewed)
  {
    id: 'REP-2026-00024',
    caseId: 'MEDI-OPD-2026-00010',
    patientId: 'PAT-2026-00010',
    patientName: 'Aarav Mehta',
    age: 42,
    gender: 'Male',
    maskedMobile: '98••••3210',
    maskedAbhaId: '91-2345-6789-1234',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'reviewed',
    generatedAt: '2026-09-21T10:15:00.000Z',
    formattedDate: '21 Sep 2026',
    formattedTime: '10:15 AM',
    reviewedAt: '2026-09-21T10:30:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    department: 'General Medicine / AYUSH',
    diagnosis: 'Gastritis with acid reflux symptoms',
    chiefComplaint: 'Severe post-prandial burning sensation in epigastrium and acid regurgitation for 3 weeks',
    redFlagTriggered: true,
    content: {
      patientInformation: {
        'Name': 'Aarav Mehta',
        'Age / Gender': '42 / Male',
        'ABHA ID': '91-2345-6789-1234',
        'Mobile': '98••••3210',
        'Case ID': 'MEDI-OPD-2026-00010'
      },
      clinicalAssessment: {
        'Findings': 'Epigastric tenderness on deep palpation. No guarding or rigidity.',
        'Assessment': 'Gastroesophageal Reflux Disease (GERD) with secondary acute gastritis flare.',
        'Diagnosis': 'Gastritis with acid reflux symptoms',
        'Clinical Notes': 'Advised bland diet, avoidance of night snacks, elevation of head end of bed.'
      },
      ayushAssessment: {
        'Prakriti': 'Pitta-Vata',
        'Agni': 'Tikshnagni (Intense / Acidic digestive fire)',
        'Koshtha': 'Madhyama',
        'Dosha': 'Pitta-dominant Amlapitta',
        'Notes': 'Prescribed Avipattikar Churna with lukewarm water before meals.'
      },
      prescriptions: [
        { medicineName: 'Cap Pantoprazole', dosage: '40 mg', frequency: 'Once daily (OD)', duration: '14 days', instructions: 'Before breakfast' },
        { medicineName: 'Syrup Sucralfate', dosage: '10 ml', frequency: 'Thrice daily (TID)', duration: '7 days', instructions: '1 hour after meals' },
        { medicineName: 'Avipattikar Churna', dosage: '3 gm', frequency: 'Twice daily (BD)', duration: '15 days', instructions: 'With warm water before meals' }
      ],
      followUp: {
        required: true,
        timeframe: '2 weeks',
        instructions: 'Follow-up for symptom review. If burning persists, schedule Upper GI Endoscopy.'
      }
    }
  },

  // 2. Rajesh Sharma (Generated)
  {
    id: 'REP-2026-00023',
    caseId: 'MEDI-OPD-2026-00012',
    patientId: 'PAT-2026-00012',
    patientName: 'Rajesh Sharma',
    age: 52,
    gender: 'Male',
    maskedMobile: '98••••4455',
    maskedAbhaId: '12-9876-5432-1098',
    reportType: 'case-summary',
    title: 'Lab Report',
    status: 'generated',
    generatedAt: '2026-09-20T16:40:00.000Z',
    formattedDate: '20 Sep 2026',
    formattedTime: '04:40 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Orthopaedics & Pain Management',
    diagnosis: 'Routine blood investigation',
    chiefComplaint: 'Severe lower back pain radiating down posterior left thigh and calf for 4 months',
    redFlagTriggered: false,
    content: {
      patientInformation: {
        'Name': 'Rajesh Sharma',
        'Age / Gender': '52 / Male',
        'ABHA ID': '12-9876-5432-1098',
        'Case ID': 'MEDI-OPD-2026-00012'
      },
      clinicalAssessment: {
        'Findings': 'Positive Straight Leg Raise (SLR) on left at 45 degrees. Paravertebral spasm present.',
        'Assessment': 'L4-L5 Lumbar Disc Bulge with Left Sciatic Nerve Compression.',
        'Diagnosis': 'Lumbar Radiculopathy & Spondylosis'
      },
      prescriptions: [
        { medicineName: 'Tab Pregabalin + Methylcobalamin', dosage: '75mg / 1500mcg', frequency: 'Once daily at bedtime', duration: '30 days', instructions: 'Post dinner' },
        { medicineName: 'Tab Paracetamol', dosage: '650 mg', frequency: 'SOS (as needed)', duration: '5 days', instructions: 'For severe breakthrough pain' }
      ],
      followUp: {
        required: true,
        timeframe: '3 weeks',
        instructions: 'Lumbar spine MRI screening and physiotherapy follow-up.'
      }
    }
  },

  // 3. Harish Chandra (Reviewed)
  {
    id: 'REP-2026-00022',
    caseId: 'MEDI-OPD-2026-00014',
    patientId: 'PAT-2026-00014',
    patientName: 'Harish Chandra',
    age: 64,
    gender: 'Male',
    maskedMobile: '97••••2211',
    maskedAbhaId: '77-6655-4433-2211',
    reportType: 'prescription',
    title: 'Prescription',
    status: 'reviewed',
    generatedAt: '2026-09-19T11:30:00.000Z',
    formattedDate: '19 Sep 2026',
    formattedTime: '11:30 AM',
    reviewedAt: '2026-09-19T11:45:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    department: 'Geriatric & Rheumatology OPD',
    diagnosis: 'Osteoarthritis – knee pain',
    chiefComplaint: 'Persistent knee pain with difficulty during prolonged walking',
    redFlagTriggered: false,
    content: {
      patientInformation: {
        'Name': 'Harish Chandra',
        'Age / Gender': '64 / Male',
        'ABHA ID': '77-6655-4433-2211',
        'Case ID': 'MEDI-OPD-2026-00014'
      },
      clinicalAssessment: {
        'Findings': 'Crepitus in bilateral knee joints. Mild medial joint line tenderness.',
        'Diagnosis': 'Primary Osteoarthritis of Bilateral Knees (Grade II)'
      },
      prescriptions: [
        { medicineName: 'Tab Glucosamine Sulfate', dosage: '1500 mg', frequency: 'Once daily (OD)', duration: '60 days', instructions: 'Take with water after breakfast' },
        { medicineName: 'Shallaki (Boswellia serrata)', dosage: '500 mg', frequency: 'Twice daily (BD)', duration: '30 days', instructions: 'Post meals' },
        { medicineName: 'Mahanarayana Taila', dosage: 'External use', frequency: 'Twice daily', duration: '30 days', instructions: 'Gentle warm massage over knees' }
      ],
      followUp: {
        required: true,
        timeframe: '1 month',
        instructions: 'Quadriceps isometric strengthening exercises advised.'
      }
    }
  },

  // 4. Kavita Iyer (Generated)
  {
    id: 'REP-2026-00021',
    caseId: 'MEDI-OPD-2026-00020',
    patientId: 'PAT-2026-00020',
    patientName: 'Kavita Iyer',
    age: 36,
    gender: 'Female',
    maskedMobile: '99••••7766',
    maskedAbhaId: '44-1122-9988-7766',
    reportType: 'ayush-assessment',
    title: 'AYUSH Assessment',
    status: 'generated',
    generatedAt: '2026-09-18T15:20:00.000Z',
    formattedDate: '18 Sep 2026',
    formattedTime: '03:20 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'AYUSH Integrative Medicine',
    diagnosis: 'Stress related sleep disturbance',
    chiefComplaint: 'Difficulty maintaining sleep with increased work-related stress',
    redFlagTriggered: false,
    content: {
      patientInformation: {
        'Name': 'Kavita Iyer',
        'Age / Gender': '36 / Female',
        'ABHA ID': '44-1122-9988-7766',
        'Case ID': 'MEDI-OPD-2026-00020'
      },
      ayushAssessment: {
        'Prakriti': 'Vata-Pitta',
        'Agni': 'Vishamagni (Irregular digestive fire)',
        'Koshtha': 'Krura',
        'Dosha': 'Manovaha Srotas Vataja Anidra',
        'Notes': 'Ashwagandha and Brahmi recommended along with Pratimarsha Nasya with Ksheerabala taila.'
      },
      prescriptions: [
        { medicineName: 'Tab Brahmi Vati', dosage: '250 mg', frequency: 'Twice daily (BD)', duration: '30 days', instructions: 'With warm milk at bedtime' },
        { medicineName: 'Ashwagandha Churna', dosage: '3 gm', frequency: 'Once daily at bedtime', duration: '30 days', instructions: 'With warm milk' }
      ],
      followUp: {
        required: true,
        timeframe: '4 weeks',
        instructions: 'Review sleep log and daily pranayama practice.'
      }
    }
  },

  // 5. Priya Patel (Archived)
  {
    id: 'REP-2026-00020',
    caseId: 'MEDI-OPD-2026-00025',
    patientId: 'PAT-2026-00025',
    patientName: 'Priya Patel',
    age: 28,
    gender: 'Female',
    maskedMobile: '96••••3344',
    maskedAbhaId: '66-7788-1122-3344',
    reportType: 'patient-history',
    title: 'Patient History',
    status: 'archived',
    generatedAt: '2026-09-17T09:10:00.000Z',
    formattedDate: '17 Sep 2026',
    formattedTime: '09:10 AM',
    archivedAt: '2026-09-18T10:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    department: 'Neurology / General OPD',
    diagnosis: 'Migraine – recurrent headaches',
    chiefComplaint: 'Recurrent headaches occurring intermittently over the past several months',
    redFlagTriggered: false,
    content: {
      patientInformation: {
        'Name': 'Priya Patel',
        'Age / Gender': '28 / Female',
        'ABHA ID': '66-7788-1122-3344',
        'Case ID': 'MEDI-OPD-2026-00025'
      },
      patientHistory: {
        'First Consultation': '12 Jan 2026',
        'Total OPD Visits': '4 encounters logged',
        'Trigger Factors': 'Screen fatigue, irregular sleep, bright lights',
        'Known Allergies': 'No drug allergies reported'
      }
    }
  },

  // 6. Sunita Devi (Reviewed)
  {
    id: 'REP-2026-00019',
    caseId: 'MEDI-OPD-2026-00011',
    patientId: 'PAT-2026-00011',
    patientName: 'Sunita Devi',
    age: 38,
    gender: 'Female',
    maskedMobile: '98••••3344',
    maskedAbhaId: '91-6621-9903-0011',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'reviewed',
    generatedAt: '2026-09-16T14:30:00.000Z',
    formattedDate: '16 Sep 2026',
    formattedTime: '02:30 PM',
    reviewedAt: '2026-09-16T15:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    department: 'Pulmonary / General OPD',
    diagnosis: 'Post-viral bronchial hyperresponsiveness',
    chiefComplaint: 'Dry hacking cough with throat tickle for 10 days',
    redFlagTriggered: false,
    content: {
      patientInformation: { 'Name': 'Sunita Devi', 'Age / Gender': '38 / Female', 'Case ID': 'MEDI-OPD-2026-00011' },
      clinicalAssessment: { 'Diagnosis': 'Post-viral bronchial hyperresponsiveness', 'Findings': 'Chest clear, SpO2 98% room air' },
      prescriptions: [{ medicineName: 'Levocetirizine', dosage: '5 mg', frequency: 'Once daily', duration: '5 days', instructions: 'At night' }]
    }
  },

  // 7. Anand Sharma (Generated)
  {
    id: 'REP-2026-00018',
    caseId: 'MEDI-OPD-2026-00013',
    patientId: 'PAT-2026-00013',
    patientName: 'Anand Sharma',
    age: 35,
    gender: 'Male',
    maskedMobile: '98••••5566',
    maskedAbhaId: '88-4433-2211-5566',
    reportType: 'prescription',
    title: 'Prescription',
    status: 'generated',
    generatedAt: '2026-09-15T16:15:00.000Z',
    formattedDate: '15 Sep 2026',
    formattedTime: '04:15 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Orthopaedics',
    diagnosis: 'Acute lumbar muscle spasm',
    chiefComplaint: 'Sharp localized back stiffness following heavy lifting',
    redFlagTriggered: false,
    content: {
      patientInformation: { 'Name': 'Anand Sharma', 'Age / Gender': '35 / Male', 'Case ID': 'MEDI-OPD-2026-00013' },
      prescriptions: [{ medicineName: 'Tab Thiocolchicoside', dosage: '4 mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Post meals' }]
    }
  },

  // 8. Ramesh Kumar (Reviewed)
  {
    id: 'REP-2026-00017',
    caseId: 'MEDI-OPD-2026-00040',
    patientId: 'PAT-2026-00040',
    patientName: 'Ramesh Kumar',
    age: 47,
    gender: 'Male',
    maskedMobile: '88••••5544',
    maskedAbhaId: '33-8899-7744-1122',
    reportType: 'ayush-assessment',
    title: 'AYUSH Assessment',
    status: 'reviewed',
    generatedAt: '2026-09-15T11:45:00.000Z',
    formattedDate: '15 Sep 2026',
    formattedTime: '11:45 AM',
    reviewedAt: '2026-09-15T12:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    department: 'AYUSH Gastroenterology',
    diagnosis: 'Mandagni & Vata-Pitta imbalance',
    chiefComplaint: 'Digestive discomfort and bloating after oily meals',
    redFlagTriggered: false,
    content: {
      patientInformation: { 'Name': 'Ramesh Kumar', 'Age / Gender': '47 / Male', 'Case ID': 'MEDI-OPD-2026-00040' },
      ayushAssessment: { 'Prakriti': 'Vata-Kapha', 'Agni': 'Mandagni', 'Dosha': 'Samana Vata Dushti' }
    }
  },

  // 9. Meena Joshi (Generated)
  {
    id: 'REP-2026-00016',
    caseId: 'MEDI-OPD-2026-00039',
    patientId: 'PAT-2026-00039',
    patientName: 'Meena Joshi',
    age: 36,
    gender: 'Female',
    maskedMobile: '77••••4433',
    maskedAbhaId: '77-6655-4433-8899',
    reportType: 'case-summary',
    title: 'Case Summary',
    status: 'generated',
    generatedAt: '2026-09-14T10:00:00.000Z',
    formattedDate: '14 Sep 2026',
    formattedTime: '10:00 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'General OPD',
    diagnosis: 'Tension headache & cervical strain',
    chiefComplaint: 'Recurring bilateral throbbing head tension',
    redFlagTriggered: false,
    content: {
      patientInformation: { 'Name': 'Meena Joshi', 'Age / Gender': '36 / Female', 'Case ID': 'MEDI-OPD-2026-00039' }
    }
  },

  // 10. Suresh Babu Rao (Generated)
  {
    id: 'REP-2026-00015',
    caseId: 'MEDI-OPD-2026-00015',
    patientId: 'PAT-2026-00015',
    patientName: 'Suresh Babu Rao',
    age: 58,
    gender: 'Male',
    maskedMobile: '98••••3344',
    maskedAbhaId: '55-9988-1122-3344',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'generated',
    generatedAt: '2026-09-13T15:20:00.000Z',
    formattedDate: '13 Sep 2026',
    formattedTime: '03:20 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Endocrinology',
    diagnosis: 'Type 2 Diabetes Mellitus glycemic follow-up',
    chiefComplaint: 'Quarterly metabolic check-up and HbA1c review',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Suresh Babu Rao', 'Age / Gender': '58 / Male' } }
  },

  // 11. Deepa Nair (Generated)
  {
    id: 'REP-2026-00014',
    caseId: 'MEDI-OPD-2026-00016',
    patientId: 'PAT-2026-00016',
    patientName: 'Deepa Nair',
    age: 45,
    gender: 'Female',
    maskedMobile: '98••••7788',
    maskedAbhaId: '22-3344-5566-7788',
    reportType: 'prescription',
    title: 'Prescription',
    status: 'generated',
    generatedAt: '2026-09-12T11:10:00.000Z',
    formattedDate: '12 Sep 2026',
    formattedTime: '11:10 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Endocrinology',
    diagnosis: 'Hypothyroidism titration management',
    chiefComplaint: 'General lethargy, mild hair loss, and weight fluctuation',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Deepa Nair', 'Age / Gender': '45 / Female' } }
  },

  // 12. Mohammed Farooq (Generated)
  {
    id: 'REP-2026-00013',
    caseId: 'MEDI-OPD-2026-00017',
    patientId: 'PAT-2026-00017',
    patientName: 'Mohammed Farooq',
    age: 50,
    gender: 'Male',
    maskedMobile: '97••••8899',
    maskedAbhaId: '11-4455-6677-8899',
    reportType: 'patient-history',
    title: 'Patient History',
    status: 'generated',
    generatedAt: '2026-09-11T09:40:00.000Z',
    formattedDate: '11 Sep 2026',
    formattedTime: '09:40 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Cardiology OPD',
    diagnosis: 'Stage 1 Essential Hypertension',
    chiefComplaint: 'Routine blood pressure monitoring and prescription renewal',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Mohammed Farooq', 'Age / Gender': '50 / Male' } }
  },

  // 13. Sunita Verma (Generated)
  {
    id: 'REP-2026-00012',
    caseId: 'MEDI-OPD-2026-00018',
    patientId: 'PAT-2026-00018',
    patientName: 'Sunita Verma',
    age: 54,
    gender: 'Female',
    maskedMobile: '96••••3322',
    maskedAbhaId: '88-7766-5544-3322',
    reportType: 'ayush-assessment',
    title: 'AYUSH Assessment',
    status: 'generated',
    generatedAt: '2026-09-10T16:00:00.000Z',
    formattedDate: '10 Sep 2026',
    formattedTime: '04:00 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'AYUSH Rheumatology',
    diagnosis: 'Sandhivata (Degenerative joint disease)',
    chiefComplaint: 'Morning stiffness in finger joints and mild lower back tightness',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Sunita Verma', 'Age / Gender': '54 / Female' } }
  },

  // 14. Rajesh Naidu (Generated)
  {
    id: 'REP-2026-00011',
    caseId: 'MEDI-OPD-2026-00019',
    patientId: 'PAT-2026-00019',
    patientName: 'Rajesh Naidu',
    age: 49,
    gender: 'Male',
    maskedMobile: '95••••9900',
    maskedAbhaId: '44-5566-7788-9900',
    reportType: 'case-summary',
    title: 'Case Summary',
    status: 'generated',
    generatedAt: '2026-09-09T14:15:00.000Z',
    formattedDate: '09 Sep 2026',
    formattedTime: '02:15 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Preventive Medicine',
    diagnosis: 'Mixed Dyslipidemia with borderline elevated LDL',
    chiefComplaint: 'Preventive lipid screening and lifestyle modification follow-up',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Rajesh Naidu', 'Age / Gender': '49 / Male' } }
  },

  // 15. Lakshmi Devi (Generated)
  {
    id: 'REP-2026-00010',
    caseId: 'MEDI-OPD-2026-00021',
    patientId: 'PAT-2026-00021',
    patientName: 'Lakshmi Devi',
    age: 63,
    gender: 'Female',
    maskedMobile: '94••••6677',
    maskedAbhaId: '66-2233-4455-6677',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'generated',
    generatedAt: '2026-09-08T10:50:00.000Z',
    formattedDate: '08 Sep 2026',
    formattedTime: '10:50 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Orthopaedics',
    diagnosis: 'Bilateral Gonarthrosis with mild effusion',
    chiefComplaint: 'Knee pain aggravated by climbing stairs, improved with rest',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Lakshmi Devi', 'Age / Gender': '63 / Female' } }
  },

  // 16. Vikram Singh (Generated)
  {
    id: 'REP-2026-00009',
    caseId: 'MEDI-OPD-2026-00022',
    patientId: 'PAT-2026-00022',
    patientName: 'Vikram Singh',
    age: 41,
    gender: 'Male',
    maskedMobile: '93••••5566',
    maskedAbhaId: '99-1122-3344-5566',
    reportType: 'prescription',
    title: 'Prescription',
    status: 'generated',
    generatedAt: '2026-09-07T12:05:00.000Z',
    formattedDate: '07 Sep 2026',
    formattedTime: '12:05 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'ENT & General OPD',
    diagnosis: 'Seasonal Allergic Pharyngitis',
    chiefComplaint: 'Sore throat, nasal congestion, and dry cough for 4 days',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Vikram Singh', 'Age / Gender': '41 / Male' } }
  },

  // 17. Anita Deshmukh (Generated)
  {
    id: 'REP-2026-00008',
    caseId: 'MEDI-OPD-2026-00023',
    patientId: 'PAT-2026-00023',
    patientName: 'Anita Deshmukh',
    age: 39,
    gender: 'Female',
    maskedMobile: '92••••0011',
    maskedAbhaId: '55-6677-8899-0011',
    reportType: 'ayush-assessment',
    title: 'AYUSH Assessment',
    status: 'generated',
    generatedAt: '2026-09-06T15:30:00.000Z',
    formattedDate: '06 Sep 2026',
    formattedTime: '03:30 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'AYUSH Integrative Medicine',
    diagnosis: 'Anidra (Primary Insomnia) associated with Manasika Vata',
    chiefComplaint: 'Intermittent sleep onset delay and daytime fatigue',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Anita Deshmukh', 'Age / Gender': '39 / Female' } }
  },

  // 18. Pooja Hegde (Generated)
  {
    id: 'REP-2026-00007',
    caseId: 'MEDI-OPD-2026-00024',
    patientId: 'PAT-2026-00024',
    patientName: 'Pooja Hegde',
    age: 32,
    gender: 'Female',
    maskedMobile: '91••••8899',
    maskedAbhaId: '33-4455-6677-8899',
    reportType: 'patient-history',
    title: 'Patient History',
    status: 'generated',
    generatedAt: '2026-09-05T09:20:00.000Z',
    formattedDate: '05 Sep 2026',
    formattedTime: '09:20 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Hematology OPD',
    diagnosis: 'Nutritional Iron Deficiency Anemia',
    chiefComplaint: 'Exertional fatigue and mild dizziness upon standing',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Pooja Hegde', 'Age / Gender': '32 / Female' } }
  },

  // 19. Sanjay Rao (Generated)
  {
    id: 'REP-2026-00006',
    caseId: 'MEDI-OPD-2026-00026',
    patientId: 'PAT-2026-00026',
    patientName: 'Sanjay Rao',
    age: 55,
    gender: 'Male',
    maskedMobile: '90••••2233',
    maskedAbhaId: '77-8899-0011-2233',
    reportType: 'case-summary',
    title: 'Case Summary',
    status: 'generated',
    generatedAt: '2026-09-04T16:45:00.000Z',
    formattedDate: '04 Sep 2026',
    formattedTime: '04:45 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Gastroenterology',
    diagnosis: 'GERD with nocturnal cough',
    chiefComplaint: 'Epigastric sour regurgitation and nocturnal throat irritation',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Sanjay Rao', 'Age / Gender': '55 / Male' } }
  },

  // 20. Amit Verma (Generated)
  {
    id: 'REP-2026-00005',
    caseId: 'MEDI-OPD-2026-00027',
    patientId: 'PAT-2026-00027',
    patientName: 'Amit Verma',
    age: 44,
    gender: 'Male',
    maskedMobile: '89••••6677',
    maskedAbhaId: '11-2233-4455-6677',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'generated',
    generatedAt: '2026-09-03T11:00:00.000Z',
    formattedDate: '03 Sep 2026',
    formattedTime: '11:00 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'General Medicine',
    diagnosis: 'Acute Viral Gastroenteritis (Resolving)',
    chiefComplaint: 'Watery stools and cramping abdominal pain for 2 days',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Amit Verma', 'Age / Gender': '44 / Male' } }
  },

  // 21. Priya Nair (Generated)
  {
    id: 'REP-2026-00004',
    caseId: 'MEDI-OPD-2026-00028',
    patientId: 'PAT-2026-00028',
    patientName: 'Priya Nair',
    age: 37,
    gender: 'Female',
    maskedMobile: '88••••3344',
    maskedAbhaId: '88-9900-1122-3344',
    reportType: 'prescription',
    title: 'Prescription',
    status: 'generated',
    generatedAt: '2026-09-02T14:30:00.000Z',
    formattedDate: '02 Sep 2026',
    formattedTime: '02:30 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Psychiatry & Behavioral Health',
    diagnosis: 'Generalized Anxiety with somatic tension',
    chiefComplaint: 'Palpitations and muscle tightness during stressful work hours',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Priya Nair', 'Age / Gender': '37 / Female' } }
  },

  // 22. Rohan Gupta (Generated)
  {
    id: 'REP-2026-00003',
    caseId: 'MEDI-OPD-2026-00029',
    patientId: 'PAT-2026-00029',
    patientName: 'Rohan Gupta',
    age: 29,
    gender: 'Male',
    maskedMobile: '87••••9911',
    maskedAbhaId: '22-1133-5577-9911',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'generated',
    generatedAt: '2026-09-01T10:15:00.000Z',
    formattedDate: '01 Sep 2026',
    formattedTime: '10:15 AM',
    doctorName: 'Dr. Priya Sharma',
    department: 'General OPD',
    diagnosis: 'Acute Bronchitis (Mild)',
    chiefComplaint: 'Productive cough with whitish sputum for 5 days',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Rohan Gupta', 'Age / Gender': '29 / Male' } }
  },

  // 23. Neelam Kulkarni (Generated)
  {
    id: 'REP-2026-00002',
    caseId: 'MEDI-OPD-2026-00030',
    patientId: 'PAT-2026-00030',
    patientName: 'Neelam Kulkarni',
    age: 61,
    gender: 'Female',
    maskedMobile: '86••••1122',
    maskedAbhaId: '44-7788-9900-1122',
    reportType: 'case-summary',
    title: 'Case Summary',
    status: 'generated',
    generatedAt: '2026-08-31T13:40:00.000Z',
    formattedDate: '31 Aug 2026',
    formattedTime: '01:40 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Endocrinology & Bone Health',
    diagnosis: 'Post-Menopausal Osteopenia review',
    chiefComplaint: 'DEXA scan review and Calcium-Vitamin D3 supplementation',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Neelam Kulkarni', 'Age / Gender': '61 / Female' } }
  },

  // 24. Alok Mathur (Draft)
  {
    id: 'REP-2026-00001',
    caseId: 'MEDI-OPD-2026-00031',
    patientId: 'PAT-2026-00031',
    patientName: 'Alok Mathur',
    age: 53,
    gender: 'Male',
    maskedMobile: '85••••4433',
    maskedAbhaId: '99-8877-6655-4433',
    reportType: 'consultation-summary',
    title: 'Consultation Summary',
    status: 'draft',
    generatedAt: '2026-08-30T17:10:00.000Z',
    formattedDate: '30 Aug 2026',
    formattedTime: '05:10 PM',
    doctorName: 'Dr. Priya Sharma',
    department: 'Dermatology OPD',
    diagnosis: 'Chronic Plaque Psoriasis follow-up',
    chiefComplaint: 'Dry scaly erythematous plaques over bilateral extensor elbows',
    redFlagTriggered: false,
    content: { patientInformation: { 'Name': 'Alok Mathur', 'Age / Gender': '53 / Male' } }
  }
];

// Initialize in-memory report store with the 24 deterministic clinical reports
let MOCK_REPORTS: Record<string, ClinicalReport> = {};
INITIAL_REPORTS.forEach(r => {
  MOCK_REPORTS[r.id] = r;
});

let reportCounter = 25;

export class MockClinicalReportProvider {
  private static generateReportId(): string {
    reportCounter++;
    return `REP-2026-${String(reportCounter).padStart(5, '0')}`;
  }

  private static maskMobile(m?: string): string {
    return m && m.length >= 10 ? `${m.slice(0, 2)}••••${m.slice(-4)}` : 'N/A';
  }

  private static maskAbha(a?: string): string {
    if (!a) return 'N/A';
    const clean = a.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length === 14) return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}-${clean.slice(10, 14)}`;
    return a;
  }

  static getReports(): ClinicalReport[] {
    return Object.values(MOCK_REPORTS)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  static getActiveReports(): ClinicalReport[] {
    return Object.values(MOCK_REPORTS)
      .filter(r => r.status !== 'archived')
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  static getArchivedReports(): ClinicalReport[] {
    return Object.values(MOCK_REPORTS)
      .filter(r => r.status === 'archived')
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  static getReportById(reportId: string): ClinicalReport | undefined {
    return MOCK_REPORTS[reportId];
  }

  static getReportsByCaseId(caseId: string): ClinicalReport[] {
    return Object.values(MOCK_REPORTS).filter(r => r.caseId === caseId && r.status !== 'archived');
  }

  static getReportsByPatientId(patientId: string): ClinicalReport[] {
    return Object.values(MOCK_REPORTS).filter(r => r.patientId === patientId && r.status !== 'archived');
  }

  static searchReports(query: string, includeArchived = true): ClinicalReport[] {
    const reports = includeArchived ? Object.values(MOCK_REPORTS) : this.getActiveReports();
    if (!query || query.trim() === '') return reports;
    
    const q = query.toLowerCase().trim();
    return reports.filter(r => 
      r.patientName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.caseId.toLowerCase().includes(q) ||
      (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
      (r.chiefComplaint && r.chiefComplaint.toLowerCase().includes(q)) ||
      r.doctorName.toLowerCase().includes(q)
    );
  }

  static filterReports(type?: ClinicalReportType | 'All', status?: ClinicalReportStatus | 'All'): ClinicalReport[] {
    let reports = Object.values(MOCK_REPORTS);
    
    if (type && type !== 'All') {
      reports = reports.filter(r => r.reportType === type);
    }
    
    if (status && status !== 'All') {
      reports = reports.filter(r => r.status === status);
    }
    
    return reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  static generateReport(caseId: string, reportType: ClinicalReportType): Promise<string> {
    return new Promise((resolve, reject) => {
      const docCase = MockDoctorCaseProvider.getCaseById(caseId);
      if (!docCase) {
        reject(new Error('Case not found'));
        return;
      }

      const id = this.generateReportId();
      const now = new Date();
      
      const report: ClinicalReport = {
        id,
        caseId: docCase.caseId,
        patientId: `PAT-2026-${docCase.caseId.replace(/\D/g, '').slice(-5) || '00099'}`,
        patientName: docCase.patientName,
        age: typeof docCase.age === 'number' ? docCase.age : parseInt(String(docCase.age || 40), 10),
        gender: docCase.gender === 'female' ? 'Female' : 'Male',
        maskedMobile: this.maskMobile(docCase.mobile),
        maskedAbhaId: this.maskAbha(docCase.abhaId),
        reportType,
        title: this.getReportTitle(reportType),
        status: 'generating',
        generatedAt: now.toISOString(),
        formattedDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        formattedTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        doctorName: 'Dr. Priya Sharma',
        department: 'General OPD / AYUSH',
        diagnosis: docCase.consultation?.clinicalAssessment?.diagnosis || 'Clinical evaluation pending',
        chiefComplaint: docCase.chiefComplaint || 'Consultation intake record',
        redFlagTriggered: docCase.redFlagTriggered,
        content: this.buildReportContent(docCase, reportType)
      };

      MOCK_REPORTS[id] = report;

      setTimeout(() => {
        if (MOCK_REPORTS[id]) {
          MOCK_REPORTS[id].status = 'generated';
        }
        resolve(id);
      }, 1200);
    });
  }

  private static getReportTitle(type: ClinicalReportType): string {
    switch (type) {
      case 'consultation-summary': return 'Consultation Summary';
      case 'prescription': return 'Prescription';
      case 'ayush-assessment': return 'AYUSH Assessment';
      case 'patient-history': return 'Patient History';
      case 'case-summary': return 'Case Summary';
      default: return 'Clinical Report';
    }
  }

  private static buildReportContent(docCase: DoctorCase, type: ClinicalReportType): ClinicalReport['content'] {
    const content: ClinicalReport['content'] = {};
    const cons = docCase.consultation;

    content.patientInformation = {
      'Name': docCase.patientName,
      'Age / Gender': `${docCase.age} / ${docCase.gender}`,
      'Mobile': this.maskMobile(docCase.mobile),
      'ABHA ID': this.maskAbha(docCase.abhaId),
      'Case ID': docCase.caseId
    };

    if (type === 'consultation-summary' || type === 'case-summary') {
      content.clinicalAssessment = cons ? {
        'Findings': cons.clinicalAssessment.findings || 'Not provided',
        'Assessment': cons.clinicalAssessment.assessment || 'Not provided',
        'Diagnosis': cons.clinicalAssessment.diagnosis || 'Not provided',
        'Clinical Notes': cons.clinicalAssessment.notes || 'Not provided'
      } : {};
      
      content.prescriptions = cons?.prescription?.items || [];
      content.followUp = cons?.followUp;
    }

    if (type === 'prescription' || type === 'case-summary') {
      content.prescriptions = cons?.prescription?.items || [];
    }

    if (type === 'ayush-assessment' || type === 'consultation-summary' || type === 'case-summary') {
      content.ayushAssessment = cons?.ayushAssessment ? {
        'Prakriti': cons.ayushAssessment.prakriti || 'Not provided',
        'Agni': cons.ayushAssessment.agni || 'Not provided',
        'Koshtha': cons.ayushAssessment.koshtha || 'Not provided',
        'Dosha': cons.ayushAssessment.dosha || 'Not provided',
        'Notes': cons.ayushAssessment.notes || 'Not provided'
      } : {};
    }

    if (type === 'patient-history') {
      content.patientHistory = {
        'First Visit': docCase.submittedAt ? new Date(docCase.submittedAt).toLocaleDateString() : 'N/A',
        'Total Encounters': '1',
        'Allergies': docCase.allergyHistory?.hasAllergy === 'yes' ? docCase.allergyHistory.allergyType || 'Yes' : 'None reported',
        'Current Medications': docCase.medicationHistory?.takingMedicines === 'yes_daily' || docCase.medicationHistory?.takingMedicines === 'yes_sometimes' ? docCase.medicationHistory.medicines || 'Yes' : 'None reported'
      };
    }

    if (docCase.documents) {
      content.documents = docCase.documents.map(d => ({
        id: d.id,
        fileName: d.fileName || `${d.title}.pdf`,
        type: d.type
      }));
    }

    return content;
  }

  static markReportReviewed(reportId: string): void {
    if (MOCK_REPORTS[reportId]) {
      MOCK_REPORTS[reportId].status = 'reviewed';
      MOCK_REPORTS[reportId].reviewedAt = new Date().toISOString();
    }
  }

  static archiveReport(reportId: string): void {
    if (MOCK_REPORTS[reportId]) {
      MOCK_REPORTS[reportId].status = 'archived';
      MOCK_REPORTS[reportId].archivedAt = new Date().toISOString();
    }
  }
}
