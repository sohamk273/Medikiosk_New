import type { MultimodalInterviewTurn } from '../types/demoTypes';

export const DEMO_INTERVIEW_TURNS: MultimodalInterviewTurn[] = [
  {
    turnId: 1,
    questionId: 'q1_chief_complaint',
    question: 'What brings you to the clinic today? Please describe your main symptoms and when they started.',
    questionHindi: 'आज आप किस समस्या के लिए आए हैं? कृपया अपने मुख्य लक्षण बताएं और यह कब से शुरू हुए।',
    questionMarathi: 'आज आपल्याला काय त्रास होत आहे? कृपया मुख्य लक्षणे आणि ती कधीपासून सुरू झाली ते सांगा.',
    simulatedPatientResponseVoice: {
      audioText: 'Mujhe 5 din se pet mein jalan ho rahi hai aur khana khane ke baad zyada hoti hai.',
      audioTextHindi: 'मुझे ५ दिन से पेट में जलन हो रही है और खाना खाने के बाद ज्यादा होती है।',
      durationSec: 5,
    },
    touchOptions: [
      { id: 'opt_stomach_burn', label: 'Severe Stomach / Epigastric Burning (5 days)', labelHindi: 'पेट के ऊपरी भाग में तेज जलन (५ दिन)', isRedFlag: false },
      { id: 'opt_fever_chills', label: 'Fever with Bodyache / Shivering', labelHindi: 'तेज बुखार और बदन दर्द', isRedFlag: false },
      { id: 'opt_chest_pain', label: 'Chest Pressure radiating to Left Arm', labelHindi: 'छाती में भारीपन व बाएं हाथ में दर्द', isRedFlag: true },
      { id: 'opt_cough_breathless', label: 'Persistent Cough with Breathlessness', labelHindi: 'लगातार खांसी व सांस लेने में कठिनाई', isRedFlag: false },
    ],
    extractedEntities: {
      symptoms: [
        { name: 'Epigastric / Abdominal Burning', duration: '5 days', severity: 'Moderate to High', trigger: 'Postprandial (After Meals)' },
        { name: 'Abdominal Heaviness', duration: '5 days', severity: 'Moderate' }
      ],
      importantNegatives: ['No fever reported', 'No hematemesis (vomiting blood)'],
      associatedSymptoms: ['Post-meal distress'],
      redFlags: [],
    },
    aiUnderstoodSummary: {
      title: 'AI UNDERSTOOD & STRUCTURED',
      points: [
        { label: 'PRIMARY SYMPTOM', value: 'Epigastric / Upper Abdominal Burning' },
        { label: 'DURATION', value: '5 Days (Recent Acute-on-Chronic Onset)' },
        { label: 'TRIGGER FACTOR', value: 'Aggravated Post-Meals & Spicy/Fried Diet' },
        { label: 'SEVERITY ESTIMATE', value: 'Moderate (Impacts Daily Activities)' },
      ],
    },
  },
  {
    turnId: 2,
    questionId: 'q2_radiation_nausea',
    question: 'Does the burning sensation radiate upward to your chest or throat, and do you feel nausea or vomiting?',
    questionHindi: 'क्या यह जलन ऊपर छाती या गले की तरफ जाती है, और क्या आपको उल्टी या मिचली जैसा लगता है?',
    questionMarathi: 'ही जळजळ छातीत किंवा घशात वर जाते का, आणि आपल्याला उलटी किंवा मळमळ होते का?',
    simulatedPatientResponseVoice: {
      audioText: 'Chhati mein koi dard nahi hai, lekin oily khana khane ke baad halka jee machalta hai, ulti nahi hui.',
      audioTextHindi: 'छाती में कोई दर्द नहीं है, लेकिन भारी खाना खाने के बाद थोड़ा जी मचलता है, उल्टी नहीं हुई।',
      durationSec: 6,
    },
    touchOptions: [
      { id: 'opt_nausea_no_chest', label: 'Mild Nausea after meals; No Chest Pain or Throat Radiation', labelHindi: 'हल्की मिचली, छाती में कोई दर्द नहीं', isRedFlag: false },
      { id: 'opt_acid_reflux', label: 'Severe Acid Regurgitation into throat with Sour Water', labelHindi: 'गले तक खट्टा पानी आना व तीव्र जलन', isRedFlag: false },
      { id: 'opt_vomiting_food', label: 'Frequent Vomiting of ingested food contents', labelHindi: 'भोजन के तुरंत बाद लगातार उल्टियां', isRedFlag: false },
      { id: 'opt_chest_tightness', label: 'Tightness and Squeezing in the Chest', labelHindi: 'छाती में भारीपन व सांस फूलना', isRedFlag: true },
    ],
    extractedEntities: {
      symptoms: [
        { name: 'Mild Nausea', trigger: 'After heavy/oily meals', severity: 'Mild' }
      ],
      importantNegatives: ['No chest pain', 'No cardiac radiation', 'No recurrent vomiting'],
      associatedSymptoms: ['Nausea postprandial'],
      redFlags: [],
    },
    aiUnderstoodSummary: {
      title: 'AI UNDERSTOOD & STRUCTURED',
      points: [
        { label: 'ASSOCIATED SYMPTOM', value: 'Mild Postprandial Nausea' },
        { label: 'IMPORTANT NEGATIVE', value: 'No Chest Tightness / No Cardiac Pain' },
        { label: 'ORAL TOLERANCE', value: 'Preserved (No Vomiting)' },
      ],
    },
  },
  {
    turnId: 3,
    questionId: 'q3_appetite_bowels',
    question: 'How has your appetite and digestion been, and have you experienced difficulty swallowing?',
    questionHindi: 'आपकी भूख और पाचन की क्या स्थिति है, और क्या खाना निगलने में कोई तकलीफ होती है?',
    questionMarathi: 'आपली भूक आणि पचन कसे आहे, आणि घास गिळताना काही त्रास होतो का?',
    simulatedPatientResponseVoice: {
      audioText: 'Bhook thodi kam ho gayi hai jalan ki wajah se, nigalne mein koi dikkat nahi hai.',
      audioTextHindi: 'भूख थोड़ी कम हो गई है जलन की वजह से, खाना निगलने में कोई दिक्कत नहीं है।',
      durationSec: 5,
    },
    touchOptions: [
      { id: 'opt_appetite_reduced', label: 'Appetite mildly reduced due to fear of burning; Swallowing Normal', labelHindi: 'भूख में हल्की कमी, निगलना बिल्कुल सामान्य', isRedFlag: false },
      { id: 'opt_appetite_normal', label: 'Normal Appetite; Normal Bowel movements', labelHindi: 'सामान्य भूख, नियमित पेट साफ', isRedFlag: false },
      { id: 'opt_dysphagia', label: 'Difficulty or Pain during swallowing solid food', labelHindi: 'खाना निगलने में रुकावट या दर्द', isRedFlag: true },
      { id: 'opt_black_stools', label: 'Black tarry stools or extreme weakness', labelHindi: 'काले रंग का मल या अत्यधिक कमजोरी', isRedFlag: true },
    ],
    extractedEntities: {
      symptoms: [
        { name: 'Mild Hyporexia (Reduced appetite due to dyspepsia)', severity: 'Mild' }
      ],
      importantNegatives: ['No dysphagia (normal swallowing)', 'No melena (no dark stools)', 'No weight loss'],
      associatedSymptoms: ['Early postprandial fullness'],
      redFlags: [],
    },
    aiUnderstoodSummary: {
      title: 'AI UNDERSTOOD & STRUCTURED',
      points: [
        { label: 'APPETITE STATUS', value: 'Mildly Reduced (Fear of Burning Discomfort)' },
        { label: 'SWALLOWING (DYSPHAGIA)', value: 'Normal (No Obstruction)' },
        { label: 'CLINICAL ALARM SIGNS', value: 'None Detected (Case Ready for Doctor Review)' },
      ],
    },
  },
];
