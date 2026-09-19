import type { Language } from '@/features/patient/PatientSessionContext';

export interface TouchOption {
  id: string;
  label: string;
  labelHindi: string;
  labelMarathi?: string;
}

export interface AyushQuestion {
  id: string;
  internalField: string;
  question: string;
  questionHindi: string;
  questionMarathi?: string;
  touchOptions: TouchOption[];
}

const MOCK_TRANSCRIPTS: Record<string, Record<Language, string>> = {
  q1_appetite: {
    hi: 'मेरी भूख सामान्य है, दिन में दो बार सही समय पर खाना खाता हूँ।',
    en: 'My appetite is completely normal.',
    mr: 'माझी भूक सामान्य आहे, योग्य वेळी जेवतो.',
  },
  q2_digestion: {
    hi: 'पाचन ठीक है, कभी-कभी पेट में भारीपन महसूस होता है।',
    en: 'Digestion is fine, sometimes I feel a bit heavy.',
    mr: 'पचन ठीक आहे, कधीकधी पोट जड वाटते.',
  },
  q3_thirst: {
    hi: 'दिन में सामान्य रूप से पानी पीता हूँ, प्यास सामान्य है।',
    en: 'I feel thirsty multiple times a day.',
    mr: 'दिवसात सामान्य प्रमाणात पाणी पितो.',
  },
  q4_sleep: {
    hi: 'नींद अच्छी आती है, रात में ६-७ घंटे सोता हूँ।',
    en: 'My sleep is good, I sleep comfortably through the night.',
    mr: 'झोप चांगली लागते, रात्री शांत झोप होते.',
  },
  q5_energy: {
    hi: 'दिनभर सामान्य ऊर्जा रहती है, काम करने में कोई दिक्कत नहीं होती।',
    en: 'I feel normal and active throughout the day.',
    mr: 'दिवसभरात ऊर्जा चांगली राहते.',
  },
  q6_temperature: {
    hi: 'शरीर का तापमान सामान्य रहता है, ठंड या गर्मी ज्यादा नहीं लगती।',
    en: 'Normal temperature sensitivity.',
    mr: 'तापमान सहनशीलता सामान्य आहे.',
  },
  q7_bowel: {
    hi: 'पेट साफ होने में कोई खास परेशानी नहीं होती, नियमित है।',
    en: 'Regular bowel movements once daily in the morning.',
    mr: 'पोट नियमित साफ होते, कोणतीही अडचण नाही.',
  },
  q8_sweat: {
    hi: 'पसीना सामान्य रूप से आता है, मौसम के अनुसार।',
    en: 'Normal sweating according to the weather.',
    mr: 'सामान्य घाम येतो.',
  },
};

export const AYUSH_QUESTIONS: AyushQuestion[] = [
  {
    id: 'q1_appetite',
    internalField: 'appetite',
    question: 'How is your appetite (hunger)?',
    questionHindi: 'आपकी भूख कैसी है?',
    questionMarathi: 'तुमची भूक कशी आहे?',
    touchOptions: [
      { id: 'good', label: 'Good / Normal', labelHindi: 'अच्छी / सामान्य', labelMarathi: 'चांगली / सामान्य' },
      { id: 'low', label: 'Low / Reduced', labelHindi: 'कम / भूख नहीं लगती', labelMarathi: 'कमी' },
      { id: 'excessive', label: 'Excessive / Always hungry', labelHindi: 'बहुत ज्यादा / बार-बार भूख', labelMarathi: 'खूप जास्त' },
      { id: 'irregular', label: 'Irregular / Varies daily', labelHindi: 'अनियमित / कभी ज्यादा कभी कम', labelMarathi: 'अनियमित' },
    ],
  },
  {
    id: 'q2_digestion',
    internalField: 'digestion',
    question: 'How is your digestion after eating?',
    questionHindi: 'खाना खाने के बाद आपका पाचन कैसा रहता है?',
    questionMarathi: 'जेवणानंतर पचन कसे होते?',
    touchOptions: [
      { id: 'normal', label: 'Normal & comfortable', labelHindi: 'सामान्य और सहज', labelMarathi: 'सामान्य व सुलभ' },
      { id: 'bloating', label: 'Gas / Bloating / Heaviness', labelHindi: 'गैस / भारीपन / पेट फूलना', labelMarathi: 'गॅस / पोट जड होणे' },
      { id: 'acidity', label: 'Acidity / Heartburn', labelHindi: 'खट्टी डकार / जलन', labelMarathi: 'अॅसिडिटी / जळजळ' },
      { id: 'slow', label: 'Very slow / Sluggish', labelHindi: 'बहुत धीमा पाचन', labelMarathi: 'अतिशय मंद पचन' },
    ],
  },
  {
    id: 'q3_thirst',
    internalField: 'thirst',
    question: 'How often do you feel thirsty throughout the day?',
    questionHindi: 'दिनभर में आपको प्यास कैसी लगती है?',
    questionMarathi: 'दिवसभरात तुम्हाला तहान कशी लागते?',
    touchOptions: [
      { id: 'normal', label: 'Normal (6–8 glasses)', labelHindi: 'सामान्य (६-८ गिलास)', labelMarathi: 'सामान्य' },
      { id: 'frequent', label: 'Excessive / Dry throat', labelHindi: 'बहुत ज्यादा / गला सूखना', labelMarathi: 'खूप जास्त / घसा कोरडा' },
      { id: 'low', label: 'Rarely feel thirsty', labelHindi: 'बहुत कम प्यास लगती है', labelMarathi: 'कमी' },
    ],
  },
  {
    id: 'q4_sleep',
    internalField: 'sleep',
    question: 'How is your sleep quality?',
    questionHindi: 'आपकी नींद कैसी है?',
    questionMarathi: 'तुमची झोप कशी आहे?',
    touchOptions: [
      { id: 'sound', label: 'Sound / Deep (6–8 hrs)', labelHindi: 'गहरी और अच्छी नींद (६-८ घंटे)', labelMarathi: 'गाढ व शांत' },
      { id: 'disturbed', label: 'Disturbed / Wake up often', labelHindi: 'खराब / बार-बार खुलती है', labelMarathi: 'अशांत / वारंवार मोडणारी' },
      { id: 'insomnia', label: 'Difficulty falling asleep', labelHindi: 'नींद आने में कठिनाई', labelMarathi: 'झोप न येणे' },
      { id: 'excessive', label: 'Excessive drowsiness', labelHindi: 'दिनभर बहुत आलस / ज्यादा नींद', labelMarathi: 'अति झोप' },
    ],
  },
  {
    id: 'q5_energy',
    internalField: 'energy',
    question: 'How are your energy levels during the day?',
    questionHindi: 'दिनभर में आपके शरीर की ऊर्जा (स्फूर्ति) कैसी रहती है?',
    questionMarathi: 'दिवसभरात तुमची ऊर्जा कशी असते?',
    touchOptions: [
      { id: 'high', label: 'Energetic & active', labelHindi: 'ऊर्जावान और सक्रिय', labelMarathi: 'उत्साही व ताजेतवाने' },
      { id: 'moderate', label: 'Normal / Average', labelHindi: 'सामान्य / ठीक-ठाक', labelMarathi: 'मध्यम / ठीक' },
      { id: 'fatigue', label: 'Tired / Low energy', labelHindi: 'जल्दी थक जाना / कमजोरी', labelMarathi: 'थकवा / अशक्तपणा' },
    ],
  },
  {
    id: 'q6_temperature',
    internalField: 'temperature_sensitivity',
    question: 'Are you more sensitive to cold or heat?',
    questionHindi: 'आपको ठंड या गर्मी में से क्या ज्यादा परेशान करता है?',
    questionMarathi: 'तुम्हाला थंडी की उष्णता जास्त त्रासदायक वाटते?',
    touchOptions: [
      { id: 'cold', label: 'Cannot tolerate cold', labelHindi: 'ठंड ज्यादा लगती है', labelMarathi: 'थंडी जास्त सहन होत नाही' },
      { id: 'heat', label: 'Cannot tolerate heat', labelHindi: 'गर्मी ज्यादा लगती है', labelMarathi: 'उष्णता जास्त सहन होत नाही' },
      { id: 'neutral', label: 'Tolerate both equally', labelHindi: 'दोनों सामान्य लगते हैं', labelMarathi: 'दोन्ही समान' },
    ],
  },
  {
    id: 'q7_bowel',
    internalField: 'bowel_habits',
    question: 'How are your daily bowel movements?',
    questionHindi: 'आपका पेट साफ होने की आदत कैसी है?',
    questionMarathi: 'तुमचे पोट कसे साफ होते?',
    touchOptions: [
      { id: 'regular', label: 'Regular once daily', labelHindi: 'नियमित रोज़ सुबह एक बार', labelMarathi: 'रोज सकाळी नियमित' },
      { id: 'constipated', label: 'Constipated / Hard / Irregular', labelHindi: 'कब्ज / सख्त / कभी-कभी', labelMarathi: 'बद्धकोष्ठता / कठीण' },
      { id: 'loose', label: 'Loose / Multiple times', labelHindi: 'पतला / दिन में कई बार', labelMarathi: 'पातळ शौच' },
    ],
  },
  {
    id: 'q8_sweat',
    internalField: 'perspiration',
    question: 'How much do you sweat?',
    questionHindi: 'आपको पसीना कैसा आता है?',
    questionMarathi: 'तुम्हाला घाम कसा येतो?',
    touchOptions: [
      { id: 'normal', label: 'Normal', labelHindi: 'सामान्य', labelMarathi: 'सामान्य' },
      { id: 'profuse', label: 'Excessive sweating', labelHindi: 'बहुत ज्यादा पसीना', labelMarathi: 'खूप जास्त घाम' },
      { id: 'scanty', label: 'Very little / No sweat', labelHindi: 'बहुत कम / न के बराबर', labelMarathi: 'फार कमी' },
    ],
  },
];

export class MockAyushProvider {
  static async processAyushVoice(
    questionId: string,
    language: Language = 'en'
  ): Promise<{ transcript: string; matchedOptionId: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const transcript =
      MOCK_TRANSCRIPTS[questionId]?.[language] ||
      MOCK_TRANSCRIPTS[questionId]?.en ||
      'My response was recorded.';

    const question = AYUSH_QUESTIONS.find((q) => q.id === questionId);
    const matchedOptionId = question?.touchOptions[0]?.id || 'normal';

    return { transcript, matchedOptionId };
  }
}
