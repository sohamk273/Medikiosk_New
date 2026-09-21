import type { Language } from '@/features/patient/PatientSessionContext';

export interface TouchOption {
  id: string;
  label: string;
  labelHindi: string;
  labelMarathi: string;
  sublabel?: string;
  sublabelHindi?: string;
  sublabelMarathi?: string;
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
  isMultiSelect?: boolean;
  isScale?: boolean;
  touchOptions: TouchOption[];
  demoTranscript?: {
    en: string;
    hi: string;
    mr: string;
  };
  demoSelectedOptionIds?: string[];
}

export interface VoiceMockResult {
  transcript: string;
  isRedFlag: boolean;
  englishTranslation?: string;
}

// ─── Symptom Category Detection ──────────────────────────────────────────────

export type SymptomCategory =
  | 'stomach' | 'fever' | 'cough' | 'breathing'
  | 'pain' | 'weakness' | 'skin' | 'other';

export function detectSymptomCategory(primaryComplaint: string): SymptomCategory {
  const lc = (primaryComplaint || '').toLowerCase();
  if (lc.includes('stomach') || lc.includes('abdomen') || lc.includes('digestion') || lc.includes('burning') || lc.includes('acid')) return 'stomach';
  if (lc.includes('fever') || lc.includes('chill')) return 'fever';
  if (lc.includes('cough') || lc.includes('cold') || lc.includes('flu')) return 'cough';
  if (lc.includes('breath') || lc.includes('chest')) return 'breathing';
  if (lc.includes('pain') || lc.includes('headache')) return 'pain';
  if (lc.includes('weakness') || lc.includes('fatigue')) return 'weakness';
  if (lc.includes('skin') || lc.includes('rash') || lc.includes('allergy')) return 'skin';
  return 'stomach'; // Default to stomach for demo case
}

// ─── 8-Question Stomach Burning Clinical Case-Taking Sequence ────────────────

export const STOMACH_QUESTIONS: VoiceQuestion[] = [
  // Q1 — Primary Complaint / Location
  {
    id: 'q1_location',
    question: 'Where exactly do you feel the burning sensation?',
    questionHindi: 'पेट में जलन किस हिस्से में महसूस होती है?',
    questionMarathi: 'पोटात जळजळ नक्की कुठे जाणवते?',
    audioPromptEnglish: 'Where exactly do you feel the burning sensation in your abdomen?',
    audioPromptHindi: 'बताएं पेट में जलन किस हिस्से में महसूस होती है।',
    audioPromptMarathi: 'पोटात जळजळ नक्की कुठे जाणवते ते सांगा.',
    touchOptions: [
      {
        id: 'upper_abdomen',
        label: 'Upper abdomen',
        labelHindi: 'ऊपरी पेट',
        labelMarathi: 'वरचे पोट',
        sublabel: 'Just below the chest and ribcage',
        sublabelHindi: 'छाती के ठीक नीचे',
        sublabelMarathi: 'छातीखाली',
        isRedFlag: false,
      },
      {
        id: 'navel',
        label: 'Around the navel',
        labelHindi: 'नाभि के आसपास',
        labelMarathi: 'बेंबीच्या आसपास',
        sublabel: 'Central or mid-abdominal area',
        sublabelHindi: 'नाभि के बीच में',
        sublabelMarathi: 'पोटाच्या मध्यभागी',
        isRedFlag: false,
      },
      {
        id: 'lower_abdomen',
        label: 'Lower abdomen',
        labelHindi: 'निचला पेट',
        labelMarathi: 'खालचे पोट',
        sublabel: 'Below the belly button',
        sublabelHindi: 'नाभि के नीचे',
        sublabelMarathi: 'बेंबीच्या खाली',
        isRedFlag: false,
      },
      {
        id: 'entire_abdomen',
        label: 'Entire abdomen',
        labelHindi: 'पूरा पेट',
        labelMarathi: 'संपूर्ण पोट',
        sublabel: 'Spread across the whole stomach',
        sublabelHindi: 'पूरे पेट में फैला हुआ',
        sublabelMarathi: 'संपूर्ण पोटात पसरलेले',
        isRedFlag: false,
      },
      {
        id: 'not_sure_loc',
        label: 'I am not sure',
        labelHindi: 'मुझे पक्का नहीं पता',
        labelMarathi: 'मला नक्की खात्री नाही',
        sublabel: 'Difficult to pinpoint exact spot',
        sublabelHindi: 'सही जगह बताना मुश्किल है',
        sublabelMarathi: 'नक्की जागा सांगणे कठीण',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: 'I feel a burning sensation in my upper abdomen.',
      hi: 'मुझे अपने ऊपरी पेट में जलन महसूस होती है।',
      mr: 'मला वरच्या पोटात जळजळ जाणवते.',
    },
    demoSelectedOptionIds: ['upper_abdomen'],
  },

  // Q2 — Timing / Pattern
  {
    id: 'q2_timing',
    question: 'When do you notice the burning sensation most often?',
    questionHindi: 'जलन सबसे ज्यादा कब महसूस होती है?',
    questionMarathi: 'जळजळ सर्वात जास्त कधी जाणवते?',
    audioPromptEnglish: 'When do you notice the burning sensation most often?',
    audioPromptHindi: 'बताएं जलन किस समय ज्यादा महसूस होती है।',
    audioPromptMarathi: 'जळजळ कोणत्या वेळी जास्त होते ते सांगा.',
    touchOptions: [
      {
        id: 'after_eating',
        label: 'After eating',
        labelHindi: 'खाना खाने के बाद',
        labelMarathi: 'जेवणानंतर',
        sublabel: 'Burning usually increases after meals',
        sublabelHindi: 'भोजन के बाद जलन बढ़ती है',
        sublabelMarathi: 'जेवण झाल्यावर जळजळ वाढते',
        isRedFlag: false,
      },
      {
        id: 'before_eating',
        label: 'Before eating',
        labelHindi: 'खाना खाने से पहले',
        labelMarathi: 'जेवणापूर्वी',
        sublabel: 'Burning is stronger when stomach is empty',
        sublabelHindi: 'खाली पेट पर ज्यादा जलन',
        sublabelMarathi: 'उपाशी पोटी जास्त त्रास',
        isRedFlag: false,
      },
      {
        id: 'when_hungry',
        label: 'When I am hungry',
        labelHindi: 'भूख लगने पर',
        labelMarathi: 'भूक लागल्यावर',
        sublabel: 'Sensation worsens when fasting or delayed food',
        sublabelHindi: 'भूख लगने पर तेज जलन',
        sublabelMarathi: 'उशीर झाल्यावर त्रास',
        isRedFlag: false,
      },
      {
        id: 'at_night',
        label: 'At night',
        labelHindi: 'रात के समय',
        labelMarathi: 'रात्रीच्या वेळी',
        sublabel: 'Noticeable when lying down to sleep',
        sublabelHindi: 'रात को लेटने पर जलन',
        sublabelMarathi: 'रात्री झोपताना त्रास',
        isRedFlag: false,
      },
      {
        id: 'throughout_day',
        label: 'It happens throughout the day',
        labelHindi: 'दिनभर होती रहती है',
        labelMarathi: 'दिवसभर होत राहते',
        sublabel: 'Constant or recurring all day',
        sublabelHindi: 'लगातार दिनभर तकलीफ',
        sublabelMarathi: 'सतत दिवसभर त्रास',
        isRedFlag: false,
      },
      {
        id: 'it_varies',
        label: 'It varies',
        labelHindi: 'समय बदलता रहता है',
        labelMarathi: 'वेळ बदलत राहते',
        sublabel: 'No predictable timing',
        sublabelHindi: 'कोई निश्चित समय नहीं',
        sublabelMarathi: 'निश्चित वेळ नाही',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: 'It usually gets worse after I eat, especially after a heavy meal.',
      hi: 'यह आमतौर पर खाना खाने के बाद बढ़ जाता है, खासकर भारी भोजन के बाद।',
      mr: 'हे जेवणानंतर जास्त वाढते, विशेषतः जास्त जेवल्यावर.',
    },
    demoSelectedOptionIds: ['after_eating'],
  },

  // Q3 — Food Relationship
  {
    id: 'q3_triggers',
    question: 'Does any type of food seem to make the burning worse?',
    questionHindi: 'क्या किसी खास खाने से जलन ज्यादा बढ़ती है?',
    questionMarathi: 'विशिष्ट अन्नामुळे जळजळ जास्त वाढते का?',
    audioPromptEnglish: 'Does any type of food seem to make the burning worse?',
    audioPromptHindi: 'बताएं क्या किसी खास खाने से जलन बढ़ती है।',
    audioPromptMarathi: 'विशिष्ट अन्नाने जळजळ वाढते का ते सांगा.',
    touchOptions: [
      {
        id: 'spicy_food',
        label: 'Spicy food',
        labelHindi: 'मसालेदार खाना',
        labelMarathi: 'तिखट अन्न',
        sublabel: 'Chilies, hot spices, or curries',
        sublabelHindi: 'मिर्च और गरम मसाले',
        sublabelMarathi: 'मसालेदार आणि तिखट पदार्थ',
        isRedFlag: false,
      },
      {
        id: 'oily_fried',
        label: 'Oily or fried food',
        labelHindi: 'तला-भुना या चिकना खाना',
        labelMarathi: 'तळलेले किंवा तेलकट अन्न',
        sublabel: 'Fried snacks, oily gravy, or fast food',
        sublabelHindi: 'पकौड़े, समोसे या भारी तेल',
        sublabelMarathi: 'तळलेले पदार्थ आणि तेल',
        isRedFlag: false,
      },
      {
        id: 'tea_coffee',
        label: 'Tea or coffee',
        labelHindi: 'चाय या कॉफी',
        labelMarathi: 'चहा किंवा कॉफी',
        sublabel: 'Caffeinated or hot beverages',
        sublabelHindi: 'चाय-कॉफी पीने पर जलन',
        sublabelMarathi: 'चहा-कॉफीमुळे त्रास',
        isRedFlag: false,
      },
      {
        id: 'heavy_meals',
        label: 'Heavy meals',
        labelHindi: 'भारी या ज्यादा भोजन',
        labelMarathi: 'जास्त जेवण',
        sublabel: 'Large portion sizes or late-night dinners',
        sublabelHindi: 'अधिक मात्रा में भोजन',
        sublabelMarathi: 'भरपेट जेवण',
        isRedFlag: false,
      },
      {
        id: 'no_specific_food',
        label: 'No specific food',
        labelHindi: 'कोई खास खाना नहीं',
        labelMarathi: 'विशिष्ट काही नाही',
        sublabel: 'Food does not seem to trigger it directly',
        sublabelHindi: 'खाने से सीधा संबंध नहीं',
        sublabelMarathi: 'अन्नाशी संबंध नाही',
        isRedFlag: false,
      },
      {
        id: 'not_sure_food',
        label: 'I am not sure',
        labelHindi: 'मुझे पक्का नहीं पता',
        labelMarathi: 'मला खात्री नाही',
        sublabel: 'Have not observed a clear pattern',
        sublabelHindi: 'ध्यान नहीं दिया',
        sublabelMarathi: 'लक्षात आले नाही',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: 'Spicy and oily food seems to make it worse.',
      hi: 'मसालेदार और तला हुआ खाना खाने से यह ज्यादा बढ़ जाता है।',
      mr: 'तिखट आणि तेलकट खाल्ल्यावर जास्त त्रास होतो.',
    },
    demoSelectedOptionIds: ['spicy_food'],
  },

  // Q4 — Associated Symptoms (Multi-Select)
  {
    id: 'q4_associated',
    question: 'Do you also experience any of these along with the burning?',
    questionHindi: 'जलन के साथ क्या इनमें से कोई और लक्षण भी हैं?',
    questionMarathi: 'जळजळीसोबत यांपैकी इतर लक्षणे आहेत का?',
    audioPromptEnglish: 'Do you also experience any of these symptoms along with the burning?',
    audioPromptHindi: 'बताएं जलन के साथ क्या खट्टी डकार, पेट फूलना या उल्टी जैसा लगता है।',
    audioPromptMarathi: 'जळजळीसोबत इतर कोणती लक्षणे आहेत ते सांगा.',
    isMultiSelect: true,
    touchOptions: [
      {
        id: 'acidity_sour',
        label: 'Acidity / sour taste',
        labelHindi: 'एसिडिटी / खट्टा स्वाद',
        labelMarathi: 'ऍसिडिटी / आंबट चव',
        sublabel: 'Acid reflux or sour fluid coming up throat',
        sublabelHindi: 'गले में खट्टा पानी आना',
        sublabelMarathi: 'घशात आंबट पाणी येणे',
        isRedFlag: false,
      },
      {
        id: 'bloating',
        label: 'Bloating',
        labelHindi: 'पेट फूलना / गैस',
        labelMarathi: 'पोट फुगणे / गॅस',
        sublabel: 'Feeling excessively full or tight abdomen',
        sublabelHindi: 'पेट में भारीपन और तनाव',
        sublabelMarathi: 'पोटात जडपणा आणि गॅस',
        isRedFlag: false,
      },
      {
        id: 'nausea',
        label: 'Nausea',
        labelHindi: 'जी मचलाना',
        labelMarathi: 'मळमळ होणे',
        sublabel: 'Queasy feeling or urge to vomit',
        sublabelHindi: 'उल्टी जैसा महसूस होना',
        sublabelMarathi: 'उलटीसारखे वाटणे',
        isRedFlag: false,
      },
      {
        id: 'vomiting',
        label: 'Vomiting',
        labelHindi: 'उल्टी होना',
        labelMarathi: 'उलटी होणे',
        sublabel: 'Actually throwing up food or fluid',
        sublabelHindi: 'खाना बाहर निकलना',
        sublabelMarathi: 'अन्न बाहेर पडणे',
        isRedFlag: false,
      },
      {
        id: 'burping',
        label: 'Burping',
        labelHindi: 'बार-बार डकार आना',
        labelMarathi: 'वारंवार ढेकर येणे',
        sublabel: 'Frequent belching or gas release',
        sublabelHindi: 'डकार के साथ गैस निकलना',
        sublabelMarathi: 'सतत ढेकर येणे',
        isRedFlag: false,
      },
      {
        id: 'loss_appetite',
        label: 'Loss of appetite',
        labelHindi: 'भूख न लगना',
        labelMarathi: 'भूक न लागणे',
        sublabel: 'Reduced food intake or disinterest in eating',
        sublabelHindi: 'खाने की इच्छा कम होना',
        sublabelMarathi: 'जेवणाची इच्छा नसणे',
        isRedFlag: false,
      },
      {
        id: 'none_of_these_assoc',
        label: 'None of these',
        labelHindi: 'इनमें से कोई नहीं',
        labelMarathi: 'यांपैकी काही नाही',
        sublabel: 'Only the burning sensation, no other symptoms',
        sublabelHindi: 'केवल जलन है',
        sublabelMarathi: 'फक्त जळजळ आहे',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: "I sometimes feel bloated and I burp a lot, but I don't vomit.",
      hi: 'मुझे कभी-कभी पेट फूला हुआ लगता है और बहुत डकारें आती हैं, लेकिन उल्टी नहीं होती।',
      mr: 'मला कधीकधी पोट फुगल्यासारखे वाटते आणि खूप ढेकर येतात, पण उलटी होत नाही.',
    },
    demoSelectedOptionIds: ['bloating', 'burping'],
  },

  // Q5 — Severity (Scale 1 to 10)
  {
    id: 'q5_severity',
    question: 'How strong is the burning sensation when it is at its worst?',
    questionHindi: 'जलन सबसे तेज होने पर कितनी गंभीर होती है?',
    questionMarathi: 'जळजळ सर्वात जास्त असताना किती तीव्र असते?',
    audioPromptEnglish: 'How strong is the burning sensation when it is at its worst on a scale of 1 to 10?',
    audioPromptHindi: 'बताएं 1 से 10 के पैमाने पर जलन कितनी तेज होती है।',
    audioPromptMarathi: '1 ते 10 च्या प्रमाणात जळजळ किती तीव्र आहे ते सांगा.',
    isScale: true,
    touchOptions: [
      { id: 'sev_1', label: '1 — Very mild', labelHindi: '1 — बहुत हल्की', labelMarathi: '1 — अतिशय सौम्य', sublabel: 'Barely noticeable', isRedFlag: false },
      { id: 'sev_2', label: '2 — Mild', labelHindi: '2 — हल्की', labelMarathi: '2 — सौम्य', sublabel: 'Minor discomfort', isRedFlag: false },
      { id: 'sev_3', label: '3 — Mild to moderate', labelHindi: '3 — हल्की से मध्यम', labelMarathi: '3 — सौम्य ते मध्यम', sublabel: 'Noticeable but manageable', isRedFlag: false },
      { id: 'sev_4', label: '4 — Moderate', labelHindi: '4 — मध्यम', labelMarathi: '4 — मध्यम', sublabel: 'Tolerable discomfort', isRedFlag: false },
      { id: 'sev_5', label: '5 — Moderate', labelHindi: '5 — मध्यम', labelMarathi: '5 — मध्यम', sublabel: 'Noticeably affects routine', isRedFlag: false },
      { id: 'sev_6', label: '6 — Moderate to severe', labelHindi: '6 — मध्यम से तेज', labelMarathi: '6 — मध्यम ते तीव्र', sublabel: 'Distracting and uncomfortable', isRedFlag: false },
      { id: 'sev_7', label: '7 — Severe', labelHindi: '7 — तेज', labelMarathi: '7 — तीव्र', sublabel: 'Limits daily activities', isRedFlag: false },
      { id: 'sev_8', label: '8 — Very severe', labelHindi: '8 — बहुत तेज', labelMarathi: '8 — अतिशय तीव्र', sublabel: 'Hard to focus or sleep', isRedFlag: false },
      { id: 'sev_9', label: '9 — Extremely severe', labelHindi: '9 — अत्यंत गंभीर', labelMarathi: '9 — अत्यंत तीव्र', sublabel: 'Intolerable burning pain', isRedFlag: true },
      { id: 'sev_10', label: '10 — Worst possible', labelHindi: '10 — असहनीय', labelMarathi: '10 — असह्य', sublabel: 'Worst imaginable pain', isRedFlag: true },
    ],
    demoTranscript: {
      en: "When it gets bad, I would say it's around a six out of ten.",
      hi: 'जब यह ज्यादा होता है, तो मैं कहूंगा कि यह 10 में से लगभग 6 है।',
      mr: 'त्रास वाढल्यावर 10 पैकी साधारण 6 इतका असतो.',
    },
    demoSelectedOptionIds: ['sev_6'],
  },

  // Q6 — Frequency
  {
    id: 'q6_frequency',
    question: 'How often does the burning sensation occur?',
    questionHindi: 'जलन कितनी बार और कब-कब होती है?',
    questionMarathi: 'जळजळ किती वेळा होते?',
    audioPromptEnglish: 'How often does the burning sensation occur throughout the day?',
    audioPromptHindi: 'बताएं दिन में जलन कितनी बार महसूस होती है।',
    audioPromptMarathi: 'दिवसात जळजळ किती वेळा जाणवते ते सांगा.',
    touchOptions: [
      {
        id: 'once_twice',
        label: 'Once or twice a day',
        labelHindi: 'दिन में 1-2 बार',
        labelMarathi: 'दिवसातून १-२ वेळा',
        sublabel: 'Occasional episodes during the day',
        sublabelHindi: 'कभी-कभी दिन में',
        sublabelMarathi: 'कधीतरी दिवसातून',
        isRedFlag: false,
      },
      {
        id: 'several_times',
        label: 'Several times a day',
        labelHindi: 'दिन में कई बार',
        labelMarathi: 'दिवसातून अनेक वेळा',
        sublabel: 'Frequent flare-ups throughout the day',
        sublabelHindi: 'दिन में बार-बार जलन',
        sublabelMarathi: 'दिवसात वारंवार त्रास',
        isRedFlag: false,
      },
      {
        id: 'only_after_meals',
        label: 'Only after meals',
        labelHindi: 'केवल भोजन के बाद',
        labelMarathi: 'फक्त जेवणानंतर',
        sublabel: 'Tied exclusively to meal times',
        sublabelHindi: 'सिर्फ खाने के बाद होती है',
        sublabelMarathi: 'केवळ जेवल्यावर होते',
        isRedFlag: false,
      },
      {
        id: 'mainly_at_night',
        label: 'Mainly at night',
        labelHindi: 'मुख्य रूप से रात को',
        labelMarathi: 'मुख्यतः रात्रीच्या वेळी',
        sublabel: 'Disturbs evening rest or sleep',
        sublabelHindi: 'सोते समय परेशानी',
        sublabelMarathi: 'झोपेच्या वेळी त्रास',
        isRedFlag: false,
      },
      {
        id: 'almost_continuously',
        label: 'Almost continuously',
        labelHindi: 'लगभग लगातार',
        labelMarathi: 'जवळजवळ सतत',
        sublabel: 'Nearly uninterrupted burning throughout',
        sublabelHindi: 'हमेशा बनी रहती है',
        sublabelMarathi: 'सतत जाणवते',
        isRedFlag: false,
      },
      {
        id: 'unpredictable_freq',
        label: 'It comes and goes unpredictably',
        labelHindi: 'अचानक आती-जाती रहती है',
        labelMarathi: 'अचानक येते आणि जाते',
        sublabel: 'Random flare-ups with calm periods',
        sublabelHindi: 'कभी भी बिना कारण',
        sublabelMarathi: 'अनपेक्षितपणे होते',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: 'It happens several times during the day, mostly after meals.',
      hi: 'यह दिन में कई बार होता है, ज्यादातर भोजन के बाद।',
      mr: 'हे दिवसातून अनेक वेळा होते, विशेषतः जेवण झाल्यावर.',
    },
    demoSelectedOptionIds: ['several_times'],
  },

  // Q7 — Relief
  {
    id: 'q7_relief',
    question: 'What usually gives you some relief?',
    questionHindi: 'आमतौर पर किस चीज़ से थोड़ा आराम मिलता है?',
    questionMarathi: 'कशाने थोडे बरे वाटते किंवा आराम मिळतो?',
    audioPromptEnglish: 'What remedies or actions usually give you some relief from the burning?',
    audioPromptHindi: 'बताएं पानी, खाना या दवा लेने से क्या आराम मिलता है।',
    audioPromptMarathi: 'पाणी, अन्न किंवा औषधाने आराम मिळतो का ते सांगा.',
    touchOptions: [
      {
        id: 'drinking_water',
        label: 'Drinking water',
        labelHindi: 'पानी पीने से',
        labelMarathi: 'पाणी प्यायल्याने',
        sublabel: 'Cold or room-temperature water soothes burning',
        sublabelHindi: 'पानी से जलन शांत होती है',
        sublabelMarathi: 'पाण्याने आराम मिळतो',
        isRedFlag: false,
      },
      {
        id: 'eating_something',
        label: 'Eating something',
        labelHindi: 'कुछ खाने से',
        labelMarathi: 'काहीतरी खाल्ल्याने',
        sublabel: 'Having a light snack or milk helps',
        sublabelHindi: 'दूध या हल्का नाश्ता लेने पर',
        sublabelMarathi: 'हलके खाणे किंवा दुधाने',
        isRedFlag: false,
      },
      {
        id: 'sitting_upright',
        label: 'Sitting upright',
        labelHindi: 'सीधे बैठने से',
        labelMarathi: 'सरळ बसल्याने',
        sublabel: 'Staying elevated reduces acid reflux',
        sublabelHindi: 'पीठ सीधी रखने पर आराम',
        sublabelMarathi: 'उभे किंवा सरळ बसल्यावर',
        isRedFlag: false,
      },
      {
        id: 'taking_antacid',
        label: 'Taking an antacid',
        labelHindi: 'एंटासिड दवा लेने से',
        labelMarathi: 'ऍसिडिटीचे औषध घेतल्याने',
        sublabel: 'Antacid syrups, tablets, or home remedies',
        sublabelHindi: 'दवा या सिरप से आराम',
        sublabelMarathi: 'औषध किंवा सिरपने',
        isRedFlag: false,
      },
      {
        id: 'resting',
        label: 'Resting',
        labelHindi: 'आराम करने से',
        labelMarathi: 'विश्रांती घेतल्याने',
        sublabel: 'Lying quietly helps discomfort subside',
        sublabelHindi: 'शांत लेटने पर फायदा',
        sublabelMarathi: 'शांत झोपल्याने',
        isRedFlag: false,
      },
      {
        id: 'nothing_helps',
        label: 'Nothing seems to help',
        labelHindi: 'कुछ भी असर नहीं करता',
        labelMarathi: 'कशानेही फरक पडत नाही',
        sublabel: 'Discomfort persists despite trying remedies',
        sublabelHindi: 'लगातार तकलीफ बनी रहती है',
        sublabelMarathi: 'त्रास तसाच राहतो',
        isRedFlag: false,
      },
      {
        id: 'not_tried_relief',
        label: 'I have not tried anything',
        labelHindi: 'कुछ भी नहीं आजमाया',
        labelMarathi: 'काहीही प्रयत्न केला नाही',
        sublabel: 'No home remedies or medicines attempted yet',
        sublabelHindi: 'अभी तक कोई दवा नहीं ली',
        sublabelMarathi: 'अजून काही घेतले नाही',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: 'Drinking water and sitting upright seem to help a little.',
      hi: 'पानी पीने और सीधे बैठने से थोड़ा आराम मिलता है।',
      mr: 'पाणी प्यायल्याने आणि सरळ बसल्याने थोडा आराम मिळतो.',
    },
    demoSelectedOptionIds: ['drinking_water'],
  },

  // Q8 — Warning Symptoms (Screening Only — No diagnosis)
  {
    id: 'q8_redflags',
    question: 'Have you experienced any of these symptoms along with the abdominal burning?',
    questionHindi: 'क्या आपको पेट में जलन के साथ इनमें से कोई गंभीर लक्षण महसूस हुआ है?',
    questionMarathi: 'पोटात जळजळीसोबत यांपैकी कोणते गंभीर लक्षण जाणवले आहे का?',
    audioPromptEnglish: 'Have you experienced any warning symptoms like blood in vomit or black stools?',
    audioPromptHindi: 'बताएं यदि उल्टी में खून, काला मल या अत्यधिक कमजोरी जैसे लक्षण हैं।',
    audioPromptMarathi: 'उलटीत रक्त किंवा काळे शौच यांसारखी गंभीर लक्षणे आहेत का ते सांगा.',
    touchOptions: [
      {
        id: 'blood_in_vomit',
        label: 'Blood in vomit',
        labelHindi: 'उल्टी में खून',
        labelMarathi: 'उलटीत रक्त येणे',
        sublabel: 'Red or dark coffee-ground vomit',
        sublabelHindi: 'उल्टी में लाल या गहरा रंग',
        sublabelMarathi: 'उलटीत रक्ताचे अंश',
        isRedFlag: true,
      },
      {
        id: 'black_stool',
        label: 'Black or tar-like stool',
        labelHindi: 'काला या डामर जैसा मल',
        labelMarathi: 'काळे किंवा डांबरासारखे शौच',
        sublabel: 'Unusually dark, sticky bowel movements',
        sublabelHindi: 'शौच का रंग बहुत गहरा काला',
        sublabelMarathi: 'शौचाचा रंग अतिशय काळा',
        isRedFlag: true,
      },
      {
        id: 'severe_pain',
        label: 'Severe or worsening abdominal pain',
        labelHindi: 'अत्यधिक या बढ़ता हुआ पेट दर्द',
        labelMarathi: 'अतिशय तीव्र पोटदुखी',
        sublabel: 'Sudden, agonizing, or sharp pain',
        sublabelHindi: 'असहनीय तेज पेट दर्द',
        sublabelMarathi: 'असह्य पोटदुखी',
        isRedFlag: true,
      },
      {
        id: 'persistent_vomiting',
        label: 'Persistent vomiting',
        labelHindi: 'लगातार उल्टी होना',
        labelMarathi: 'सतत उलटी होणे',
        sublabel: 'Unable to keep any food or liquids down',
        sublabelHindi: 'पानी भी पेट में न रुकना',
        sublabelMarathi: 'पाणीही पोटात न टिकणे',
        isRedFlag: true,
      },
      {
        id: 'difficulty_swallowing',
        label: 'Difficulty swallowing',
        labelHindi: 'खाना निगलने में कठिनाई',
        labelMarathi: 'अन्न गिळताना त्रास',
        sublabel: 'Food getting stuck in chest or throat',
        sublabelHindi: 'गले या सीने में खाना अटकना',
        sublabelMarathi: 'घशात अन्न अडकणे',
        isRedFlag: true,
      },
      {
        id: 'fainting_weakness',
        label: 'Fainting or extreme weakness',
        labelHindi: 'बेहोशी या अत्यधिक कमजोरी',
        labelMarathi: 'चक्कर किंवा अतिशय अशक्तपणा',
        sublabel: 'Dizziness, collapse, or severe lightheadedness',
        sublabelHindi: 'चक्कर आकर गिरना या भारी कमजोरी',
        sublabelMarathi: 'भोवळ येणे किंवा खूप थकवा',
        isRedFlag: true,
      },
      {
        id: 'none_of_these_flags',
        label: 'None of these',
        labelHindi: 'इनमें से कोई नहीं',
        labelMarathi: 'यांपैकी काही नाही',
        sublabel: 'No emergency warning symptoms experienced',
        sublabelHindi: 'कोई गंभीर आपातकालीन लक्षण नहीं',
        sublabelMarathi: 'कोणतीही गंभीर लक्षणे नाहीत',
        isRedFlag: false,
      },
    ],
    demoTranscript: {
      en: "I haven't noticed any blood, black stools, or severe vomiting.",
      hi: 'मैंने कोई खून, काला मल या लगातार उल्टी जैसी गंभीर समस्या नहीं देखी है।',
      mr: 'मला कोणतेही रक्त, काळे शौच किंवा सतत उलटी असा त्रास झालेला नाही.',
    },
    demoSelectedOptionIds: ['none_of_these_flags'],
  },
];

export function getQuestionsForSymptom(_primaryComplaint?: string): VoiceQuestion[] {
  // Return the stomach burning 8-question sequence for full clinical flow
  return STOMACH_QUESTIONS;
}

export const VOICE_QUESTIONS: VoiceQuestion[] = STOMACH_QUESTIONS;

// ─── Contextual Demo Transcript Generator ────────────────────────────────────

type DemoContext = {
  language: Language;
  primaryComplaint: string;
  questionId: string;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
};

/**
 * Returns a natural-language patient statement for demo mode.
 * Deterministic: same question produces the corresponding natural English statement.
 */
export function getContextualDemoTranscript(ctx: DemoContext): string {
  const { language, questionId } = ctx;
  const q = STOMACH_QUESTIONS.find((item) => item.id === questionId);
  if (q && q.demoTranscript) {
    return q.demoTranscript[language] || q.demoTranscript.en;
  }

  const defaults: Record<string, Record<Language, string>> = {
    q1_location: {
      en: 'I feel a burning sensation in my upper abdomen.',
      hi: 'मुझे अपने ऊपरी पेट में जलन महसूस होती है।',
      mr: 'मला वरच्या पोटात जळजळ जाणवते.',
    },
    q2_timing: {
      en: 'It usually gets worse after I eat, especially after a heavy meal.',
      hi: 'यह आमतौर पर खाना खाने के बाद बढ़ जाता है।',
      mr: 'हे जेवणानंतर जास्त वाढते.',
    },
    q3_triggers: {
      en: 'Spicy and oily food seems to make it worse.',
      hi: 'मसालेदार और तला हुआ खाना खाने से यह ज्यादा बढ़ जाता है।',
      mr: 'तिखट आणि तेलकट खाल्ल्यावर जास्त त्रास होतो.',
    },
    q4_associated: {
      en: "I sometimes feel bloated and I burp a lot, but I don't vomit.",
      hi: 'मुझे कभी-कभी पेट फूला हुआ लगता है और बहुत डकारें आती हैं।',
      mr: 'मला कधीकधी पोट फुगल्यासारखे वाटते आणि खूप ढेकर येतात.',
    },
    q5_severity: {
      en: "When it gets bad, I would say it's around a six out of ten.",
      hi: 'जब यह ज्यादा होता है, तो मैं कहूंगा कि यह 10 में से लगभग 6 है।',
      mr: 'त्रास वाढल्यावर 10 पैकी साधारण 6 इतका असतो.',
    },
    q6_frequency: {
      en: 'It happens several times during the day, mostly after meals.',
      hi: 'यह दिन में कई बार होता है, ज्यादातर भोजन के बाद।',
      mr: 'हे दिवसातून अनेक वेळा होते, विशेषतः जेवण झाल्यावर.',
    },
    q7_relief: {
      en: 'Drinking water and sitting upright seem to help a little.',
      hi: 'पानी पीने और सीधे बैठने से थोड़ा आराम मिलता है।',
      mr: 'पाणी प्यायल्याने आणि सरळ बसल्याने थोडा आराम मिळतो.',
    },
    q8_redflags: {
      en: "I haven't noticed any blood, black stools, or severe vomiting.",
      hi: 'मैंने कोई खून, काला मल या लगातार उल्टी जैसी गंभीर समस्या नहीं देखी है।',
      mr: 'मला कोणतेही रक्त, काळे शौच किंवा सतत उलटी असा त्रास झालेला नाही.',
    },
  };

  const found = defaults[questionId];
  if (found) {
    return found[language] || found.en;
  }

  return 'I feel a burning sensation in my upper abdomen, worse after meals.';
}

export class MockVoiceProvider {
  static getMockResult(language: Language = 'en', questionId: string = 'q1_location'): VoiceMockResult {
    const transcript = getContextualDemoTranscript({
      language,
      primaryComplaint: 'Burning sensation in upper abdomen',
      questionId,
    });

    const isRedFlag =
      questionId === 'q8_redflags' &&
      (transcript.toLowerCase().includes('blood') || transcript.toLowerCase().includes('black') || transcript.toLowerCase().includes('severe'));

    return {
      transcript,
      isRedFlag,
      englishTranslation: language !== 'en' ? getContextualDemoTranscript({ language: 'en', primaryComplaint: '', questionId }) : undefined,
    };
  }

  static async processVoice(questionId: string, language: Language = 'en'): Promise<VoiceMockResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return this.getMockResult(language, questionId);
  }
}
