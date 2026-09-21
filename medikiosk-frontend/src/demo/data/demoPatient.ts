export interface DemoPatientData {
  id: string;
  name: string;
  nameHindi: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  abhaId: string;
  uhid: string;
  tokenNumber: number;
  encounterId: string;
  registeredAt: string;
  district: string;
  state: string;
  visitType: string;
  preferredLanguage: 'hi' | 'en' | 'mr';
  primaryComplaint: string;
  primaryComplaintHindi: string;
}

export const DEMO_PATIENT: DemoPatientData = {
  id: 'pat-demo-rajesh-001',
  name: 'Rajesh Sharma',
  nameHindi: 'राजेश शर्मा',
  age: 52,
  gender: 'Male',
  mobile: '9845123980',
  abhaId: '91-4521-8834-1092',
  uhid: 'UHID-2026-DL-8834',
  tokenNumber: 42,
  encounterId: 'ENC-2026-OPD-0042',
  registeredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  district: 'South Delhi',
  state: 'Delhi',
  visitType: 'General Medicine & AYUSH Integrative OPD',
  preferredLanguage: 'hi',
  primaryComplaint: 'Severe epigastric burning & discomfort for 5 days, aggravated after oily/spicy food.',
  primaryComplaintHindi: '५ दिनों से पेट के ऊपरी हिस्से में तेज जलन और भारीपन, तला-भुना खाने के बाद ज्यादा होता है।',
};
