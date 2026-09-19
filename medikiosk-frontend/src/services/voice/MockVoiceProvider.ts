import type { Language } from '@/features/patient/PatientSessionContext';

export interface TouchOption {
  id: string;
  label: string;
  labelHindi: string;
  labelMarathi: string;
  isRedFlag: boolean;
}

export interface VoiceQuestion {
  id: string;
  question: string;
  questionHindi: string;
  questionMarathi: string;
  audioPromptEnglish: string;
  audioPromptHindi: string;
  audioPromptMarathi: string;
  touchOptions: TouchOption[];
}

export interface VoiceMockResult {
  transcript: string;
  isRedFlag: boolean;
  englishTranslation?: string;
}

const MOCK_TRANSCRIPTS: Record<string, Record<Language, string>> = {
  q1_location: {
    en: 'I have severe pain in the upper right part of my stomach.',
    hi: 'मुझे पेट के ऊपरी दाहिने हिस्से में तेज दर्द है।',
    mr: 'माझ्या पोटाच्या वरच्या उजव्या भागात खूप दुखत आहे.',
  },
  q2_duration: {
    en: 'It started suddenly about 3 days ago.',
    hi: 'यह लगभग 3 दिन पहले अचानक शुरू हुआ था।',
    mr: 'हे साधारण ३ दिवसांपूर्वी अचानक सुरू झाले.',
  },
  q3_severity: {
    en: 'The pain is very sharp and moderate to severe.',
    hi: 'दर्द काफी तेज और असहनीय सा लग रहा है।',
    mr: 'वेदना खूप तीव्र आणि असह्य वाटत आहेत.',
  },
  q4_triggers: {
    en: 'It gets worse after eating spicy or oily food.',
    hi: 'मसालेदार खाना खाने के बाद दर्द और बढ़ जाता है।',
    mr: 'तिखट किंवा तेलकट जेवणानंतर त्रास जास्त वाढतो.',
  },
  q5_redflags: {
    en: 'I have no chest pain or breathlessness, only abdominal discomfort.',
    hi: 'मुझे सीने में दर्द या सांस फूलने की समस्या नहीं है, केवल पेट में तकलीफ़ है।',
    mr: 'मला छातीत दुखत नाही किंवा धाप लागत नाही, फक्त पोटात त्रास आहे.',
  },
};

export const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    id: 'q1_location',
    question: 'Where is your discomfort or pain located?',
    questionHindi: 'आपको शरीर में कहाँ तकलीफ़ या दर्द महसूस हो रहा है?',
    questionMarathi: 'तुम्हाला शरीरात कुठे त्रास किंवा वेदना होत आहेत?',
    audioPromptEnglish: 'Please speak clearly about where you feel the pain or discomfort.',
    audioPromptHindi: 'कृपया स्पष्ट बताएं कि आपको कहाँ दर्द या तकलीफ़ है।',
    audioPromptMarathi: 'कृपया स्पष्ट सांगा की तुम्हाला नक्की कुठे त्रास होत आहे.',
    touchOptions: [
      { id: 'upper_abdomen', label: 'Upper Stomach / Chest Area', labelHindi: 'पेट का ऊपरी हिस्सा / छाती', labelMarathi: 'पोटाचा वरचा भाग / छाती', isRedFlag: false },
      { id: 'lower_abdomen', label: 'Lower Stomach / Pelvis', labelHindi: 'पेट का निचला हिस्सा / पेल्विस', labelMarathi: 'पोटाचा खालचा भाग', isRedFlag: false },
      { id: 'head_neck', label: 'Head, Neck or Throat', labelHindi: 'सिर, गर्दन या गला', labelMarathi: 'डोके, मान किंवा घसा', isRedFlag: false },
      { id: 'back_joints', label: 'Back, Joints or Legs', labelHindi: 'पीठ, कमर या जोड़', labelMarathi: 'पाठ, कंबर किंवा सांधे', isRedFlag: false },
    ],
  },
  {
    id: 'q2_duration',
    question: 'How long have you had this issue, and how did it begin?',
    questionHindi: 'यह तकलीफ़ आपको कितने समय से है, और कैसे शुरू हुई?',
    questionMarathi: 'हा त्रास तुम्हाला किती दिवसांपासून आहे, आणि कसा सुरू झाला?',
    audioPromptEnglish: 'Tell us how many days or weeks you have had this problem.',
    audioPromptHindi: 'बताएं कि यह तकलीफ़ कितने दिनों या हफ़्तों से है।',
    audioPromptMarathi: 'हा त्रास किती दिवसांपासून किंवा आठवड्यांपासून आहे ते सांगा.',
    touchOptions: [
      { id: 'today', label: 'Started Today (Sudden)', labelHindi: 'आज ही शुरू हुआ (अचानक)', labelMarathi: 'आजच सुरू झाले (अचानक)', isRedFlag: false },
      { id: 'few_days', label: 'Past 2–5 Days', labelHindi: 'पिछले 2–5 दिनों से', labelMarathi: 'गेल्या २–५ दिवसांपासून', isRedFlag: false },
      { id: 'one_week', label: 'About 1 Week', labelHindi: 'लगभग 1 हफ़्ते से', labelMarathi: 'साधारण १ आठवड्यापासून', isRedFlag: false },
      { id: 'weeks_months', label: 'More than a Month (Chronic)', labelHindi: '1 महीने से अधिक (लंबे समय से)', labelMarathi: '१ महिन्यापेक्षा जास्त (दीर्घकालीन)', isRedFlag: false },
    ],
  },
  {
    id: 'q3_severity',
    question: 'How severe is the discomfort right now?',
    questionHindi: 'इस समय तकलीफ़ कितनी तेज या गंभीर है?',
    questionMarathi: 'सध्या त्रास किती तीव्र आहे?',
    audioPromptEnglish: 'Describe the intensity of your discomfort.',
    audioPromptHindi: 'बताएं कि दर्द हल्का, मध्यम या बहुत तेज है।',
    audioPromptMarathi: 'त्रास सौम्य, मध्यम की तीव्र आहे ते सांगा.',
    touchOptions: [
      { id: 'mild', label: 'Mild (Noticeable but manageable)', labelHindi: 'हल्का (सहन करने योग्य)', labelMarathi: 'सौम्य (सहन होणारा)', isRedFlag: false },
      { id: 'moderate', label: 'Moderate (Affecting daily tasks)', labelHindi: 'मध्यम (दैनिक काम में रुकावट)', labelMarathi: 'मध्यम (दैनंदिन कामात अडचण)', isRedFlag: false },
      { id: 'severe', label: 'Severe (Hard to bear / sleep)', labelHindi: 'गंभीर (सहन करना मुश्किल / नींद नहीं)', labelMarathi: 'तीव्र (असह्य वेदना / झोप नाही)', isRedFlag: false },
      { id: 'unbearable', label: 'Unbearable (Need urgent help)', labelHindi: 'असहनीय (तुरंत मदद चाहिए)', labelMarathi: 'अतिशय तीव्र (तातडीने मदत हवी)', isRedFlag: true },
    ],
  },
  {
    id: 'q4_triggers',
    question: 'Does anything make it better or worse (food, movement, rest)?',
    questionHindi: 'क्या किसी चीज़ से (खाने, चलने या आराम से) तकलीफ़ कम या ज्यादा होती है?',
    questionMarathi: 'काही खाण्याने, हालचालीने किंवा विश्रांतीने त्रास कमी किंवा जास्त होतो का?',
    audioPromptEnglish: 'Speak about any foods or activities that affect your symptoms.',
    audioPromptHindi: 'बताएं कि क्या खाने या करने से तकलीफ़ घटती या बढ़ती है।',
    audioPromptMarathi: 'कशाने त्रास वाढतो किंवा कमी होतो ते सांगा.',
    touchOptions: [
      { id: 'after_food', label: 'Worse after eating (spicy/oily)', labelHindi: 'खाना (मसालेदार) खाने के बाद बढ़ता है', labelMarathi: 'खाण्यानंतर वाढतो', isRedFlag: false },
      { id: 'empty_stomach', label: 'Worse on empty stomach', labelHindi: 'खाली पेट ज्यादा होता है', labelMarathi: 'उपाशीपोटी जास्त होतो', isRedFlag: false },
      { id: 'better_rest', label: 'Better with rest / lying down', labelHindi: 'आराम करने या लेटने से आराम मिलता है', labelMarathi: 'विश्रांतीने आराम मिळतो', isRedFlag: false },
      { id: 'constant', label: 'No difference / Constant', labelHindi: 'लगातार एक जैसा रहता है', labelMarathi: 'सतत एकसारखा राहतो', isRedFlag: false },
    ],
  },
  {
    id: 'q5_redflags',
    question: 'Do you have any of these: chest pain, breathlessness, fainting, or blood?',
    questionHindi: 'क्या आपको सीने में दर्द, सांस फूलना, चक्कर/बेहोशी या खून आने की समस्या है?',
    questionMarathi: 'तुम्हाला छातीत दुखणे, श्वास लागणे, चक्कर किंवा रक्तस्त्राव असा त्रास आहे का?',
    audioPromptEnglish: 'Please answer clearly if you have any emergency symptoms.',
    audioPromptHindi: 'कृपया स्पष्ट बताएं यदि कोई गंभीर या आपातकालीन लक्षण है।',
    audioPromptMarathi: 'काही गंभीर लक्षणे असल्यास कृपया स्पष्ट सांगा.',
    touchOptions: [
      { id: 'none', label: 'None of these symptoms', labelHindi: 'इनमें से कोई लक्षण नहीं है', labelMarathi: 'यांपैकी कोणतेही लक्षण नाही', isRedFlag: false },
      { id: 'chest_pain', label: 'Chest Pain / Pressure', labelHindi: 'सीने में दर्द या भारीपन', labelMarathi: 'छातीत दुखणे किंवा जड वाटणे', isRedFlag: true },
      { id: 'breathlessness', label: 'Shortness of breath / Difficulty breathing', labelHindi: 'सांस फूलना / सांस लेने में तकलीफ़', labelMarathi: 'श्वास लागणे / धाप लागणे', isRedFlag: true },
      { id: 'vomit_blood', label: 'Blood in vomit or stool', labelHindi: 'उल्टी या मल में खून', labelMarathi: 'उलटीत किंवा शौचात रक्त', isRedFlag: true },
    ],
  },
];

export class MockVoiceProvider {
  static getMockResult(
    language: Language = 'en',
    questionId: string = 'q1_location'
  ): VoiceMockResult {
    const transcript =
      MOCK_TRANSCRIPTS[questionId]?.[language] ||
      MOCK_TRANSCRIPTS[questionId]?.en ||
      'I described my symptoms clearly.';

    const isRedFlag =
      questionId === 'q5_redflags' &&
      (transcript.toLowerCase().includes('chest') ||
        transcript.toLowerCase().includes('breath') ||
        transcript.includes('सीने') ||
        transcript.includes('सांस'));

    return {
      transcript,
      isRedFlag,
      englishTranslation:
        language !== 'en' ? MOCK_TRANSCRIPTS[questionId]?.en : undefined,
    };
  }

  static async processVoice(
    questionId: string,
    language: Language = 'en'
  ): Promise<VoiceMockResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return this.getMockResult(language, questionId);
  }
}
