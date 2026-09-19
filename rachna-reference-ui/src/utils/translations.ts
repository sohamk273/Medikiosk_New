import { LanguageCode } from '../types/kiosk';

export interface Translations {
  appName: string;
  appSubtitle: string;
  help: string;
  back: string;
  audioPrompt: string;
  secureFooter: string;
  close: string;
  hospitalHelpTitle: string;
  hospitalHelpDesc: string;
  callAttendant: string;
  attendantNotification: string;
  
  // Screen 1: Language
  langTitle: string;
  langSubtitle: string;
  langFooterNote: string;
  continueBtn: string;
  
  // Screen 2: Login / Register
  welcomeTitle: string;
  welcomeSubtitle: string;
  loginCardTitle: string;
  loginCardDesc: string;
  registerCardTitle: string;
  registerCardDesc: string;
  orDivider: string;
  
  // Screen 3: Login Options
  loginOptionsTitle: string;
  loginOptionsSubtitle: string;
  abhaScanTitle: string;
  abhaScanDesc: string;
  phoneLoginTitle: string;
  phoneLoginDesc: string;

  // Screen 4: Register Options
  registerOptionsTitle: string;
  registerOptionsSubtitle: string;
  regAbhaTitle: string;
  regAbhaDesc: string;
  regPhoneTitle: string;
  regPhoneDesc: string;

  // Phone input
  enterPhoneTitle: string;
  enterPhoneSubtitle: string;
  sendOtpBtn: string;
  invalidPhoneMsg: string;

  // ABHA Scan / Entry
  scanAbhaTitle: string;
  scanAbhaSubtitle: string;
  cameraScanning: string;
  orEnterAbhaManual: string;
  simulateScanSuccess: string;

  // OTP Screen
  otpTitle: string;
  otpSubtitle: string;
  verifyBtn: string;
  resendIn: string;
  resendAvailable: string;
  didntReceiveOtp: string;
  resendOtp: string;
  dataSafeBadge: string;
  otpInvalid: string;

  // Demographics (Non-ABHA Fallback)
  demographicsTitle: string;
  demographicsSubtitle: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  male: string;
  female: string;
  other: string;
  emergencyPhone: string;
  submitDemographics: string;

  // Consent
  consentTitle: string;
  consentSubtitle: string;
  consentDataTitle: string;
  consentDataDesc: string;
  consentVoiceTitle: string;
  consentVoiceDesc: string;
  consentOcrTitle: string;
  consentOcrDesc: string;
  consentAbdmTitle: string;
  consentAbdmDesc: string;
  consentAgreeBtn: string;
  consentAudioGuide: string;

  // Chief Complaint
  ccTitle: string;
  ccSubtitle: string;
  ccVoiceInstruction: string;
  ccListening: string;
  ccTapToSpeak: string;
  ccCommonChipHeader: string;
  ccChipFever: string;
  ccChipChestPain: string;
  ccChipCough: string;
  ccChipHeadache: string;
  ccChipStomach: string;
  ccChipBreathing: string;
  ccChipJointPain: string;
  ccChipVomiting: string;
  ccChipRash: string;
  ccChipDizziness: string;
  ccContinue: string;

  // SOCRATES Adaptive History
  socratesTitle: string;
  socratesSubtitle: string;
  socratesSectionHPI: string;
  socratesSectionPMH: string;
  socratesSectionAllergies: string;
  socratesSectionFamily: string;
  socratesSectionPersonal: string;
  socratesSectionROS: string;
  socratesVoiceOrTouch: string;
  socratesNextQuestion: string;
  socratesSubmitTurn: string;

  // AYUSH Intake
  ayushTitle: string;
  ayushSubtitle: string;
  ayushIntro: string;
  ayushNadi: string;
  ayushMala: string;
  ayushMutra: string;
  ayushJihva: string;
  ayushPrakriti: string;
  ayushSkip: string;
  ayushSave: string;

  // Document Scanner
  docTitle: string;
  docSubtitle: string;
  docInstructions: string;
  docSimulateScan: string;
  docScanning: string;
  docExtractedHeader: string;
  docNoDocsUploaded: string;
  docContinue: string;

  // Red Flag Alert
  redFlagTitle: string;
  redFlagSubtitle: string;
  redFlagWarningText: string;
  redFlagTriageNotice: string;
  redFlagNurseAlerted: string;
  redFlagProceedBtn: string;

  // Review
  reviewTitle: string;
  reviewSubtitle: string;
  reviewReadAloud: string;
  reviewPatientCard: string;
  reviewCCCard: string;
  reviewHistoryCard: string;
  reviewDocsCard: string;
  reviewConfirmBtn: string;

  // Completion
  completeTitle: string;
  completeSubtitle: string;
  completeTokenBadge: string;
  completeDept: string;
  completeDoctor: string;
  completeRoom: string;
  completeWaitTime: string;
  completePrintSlip: string;
  completeNewPatient: string;

  // Legacy Dashboard strings
  verifiedSuccess: string;
  tokenGenerated: string;
  department: string;
  tokenNumber: string;
  queueEst: string;
  printReceipt: string;
  finishDone: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    appName: "MediKiosk",
    appSubtitle: "AI Patient Self-Service Kiosk",
    help: "Help",
    back: "Back",
    audioPrompt: "Read screen instructions aloud",
    secureFooter: "Secure • Private • Trusted",
    close: "Close",
    hospitalHelpTitle: "Need Assistance?",
    hospitalHelpDesc: "A hospital care assistant is on standby to help you operate this self-service kiosk.",
    callAttendant: "Request Hospital Staff Assistance",
    attendantNotification: "Hospital staff has been alerted. Please wait by the kiosk.",

    langTitle: "Choose Your Language",
    langSubtitle: "Select preferred language for voice and touch guidance",
    langFooterNote: "Your health, in your language. Your data, always secure.",
    continueBtn: "Continue",

    welcomeTitle: "Welcome!",
    welcomeSubtitle: "How would you like to continue?",
    loginCardTitle: "Login",
    loginCardDesc: "Login to your existing account",
    registerCardTitle: "Register",
    registerCardDesc: "Create a new account",
    orDivider: "OR",

    loginOptionsTitle: "Login",
    loginOptionsSubtitle: "Choose a login method",
    abhaScanTitle: "Login with ABHA Scanner",
    abhaScanDesc: "Scan your ABHA QR code",
    phoneLoginTitle: "Login with Phone Number",
    phoneLoginDesc: "Get OTP on your registered mobile",

    registerOptionsTitle: "Register",
    registerOptionsSubtitle: "Choose a registration method",
    regAbhaTitle: "Register with Existing ABHA ID",
    regAbhaDesc: "Use your ABHA ID to create account",
    regPhoneTitle: "Register with Phone Number",
    regPhoneDesc: "Get OTP on your mobile to create account",

    enterPhoneTitle: "Enter Mobile Number",
    enterPhoneSubtitle: "We will send an OTP verification code to this mobile number",
    sendOtpBtn: "Send OTP Code",
    invalidPhoneMsg: "Please enter a valid 10-digit mobile number",

    scanAbhaTitle: "Scan ABHA QR Code",
    scanAbhaSubtitle: "Hold your Ayushman Bharat Health Account (ABHA) card or app under the scanner",
    cameraScanning: "Positioning QR code in scanner window...",
    orEnterAbhaManual: "Or enter 14-digit ABHA Number manually",
    simulateScanSuccess: "Simulate QR Scan (Demo)",

    otpTitle: "OTP Verification",
    otpSubtitle: "Enter the 6-digit OTP sent to",
    verifyBtn: "Verify",
    resendIn: "Resend in",
    resendAvailable: "Resend OTP available",
    didntReceiveOtp: "Didn't receive OTP?",
    resendOtp: "Resend OTP",
    dataSafeBadge: "Your data is safe with us",
    otpInvalid: "Invalid OTP code. Please enter a valid 6-digit number.",

    demographicsTitle: "Patient Information",
    demographicsSubtitle: "Please provide basic details to proceed with your registration",
    firstName: "First Name",
    lastName: "Last Name",
    age: "Age (Years)",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    emergencyPhone: "Emergency Contact Phone",
    submitDemographics: "Save & Continue to Consent",

    consentTitle: "Patient Consent Toggles",
    consentSubtitle: "Please review and grant permission for self-service history intake",
    consentDataTitle: "Clinical Data Intake",
    consentDataDesc: "Allow OPD kiosk to process symptoms and medical history for consultation.",
    consentVoiceTitle: "Voice Recording & ASR",
    consentVoiceDesc: "Enable Bhashini speech-to-text to record your spoken answers.",
    consentOcrTitle: "Document Scanning & OCR",
    consentOcrDesc: "Scan previous paper prescriptions and lab reports.",
    consentAbdmTitle: "ABDM Health Record Sharing",
    consentAbdmDesc: "Share consultation records securely via Ayushman Bharat Digital Mission.",
    consentAgreeBtn: "I Agree & Continue",
    consentAudioGuide: "Listen to consent explanation",

    ccTitle: "What is your main health concern?",
    ccSubtitle: "Speak naturally into the mic or tap from common symptoms below",
    ccVoiceInstruction: "Press microphone and tell us what trouble brings you to the OPD today",
    ccListening: "Listening... Speak now",
    ccTapToSpeak: "Tap Mic to Speak",
    ccCommonChipHeader: "Quick Select Common Symptoms:",
    ccChipFever: "High Fever",
    ccChipChestPain: "Chest Pain / Tightness",
    ccChipCough: "Severe Cough",
    ccChipHeadache: "Bad Headache",
    ccChipStomach: "Stomach Ache",
    ccChipBreathing: "Breathing Difficulty",
    ccChipJointPain: "Joint & Body Pain",
    ccChipVomiting: "Nausea & Vomiting",
    ccChipRash: "Skin Rash / Itching",
    ccChipDizziness: "Dizziness & Weakness",
    ccContinue: "Continue to History",

    socratesTitle: "Adaptive Clinical History (SOCRATES)",
    socratesSubtitle: "Answer quick follow-up questions for your doctor",
    socratesSectionHPI: "History of Present Illness",
    socratesSectionPMH: "Past Medical History",
    socratesSectionAllergies: "Allergies & Medications",
    socratesSectionFamily: "Family History",
    socratesSectionPersonal: "Personal & Lifestyle",
    socratesSectionROS: "Review of Systems",
    socratesVoiceOrTouch: "Speak your response or select a quick option",
    socratesNextQuestion: "Next Question",
    socratesSubmitTurn: "Save Answer & Proceed",

    ayushTitle: "AYUSH Assessment (Optional)",
    ayushSubtitle: "Dashavidha Pariksha traditional holistic history",
    ayushIntro: "Optional traditional assessment to assist holistic AYUSH consultation",
    ayushNadi: "Nadi (Pulse Rate / Type)",
    ayushMala: "Mala (Bowel Habits)",
    ayushMutra: "Mutra (Urination Pattern)",
    ayushJihva: "Jihva (Tongue Appearance)",
    ayushPrakriti: "Prakriti (Body Constitution)",
    ayushSkip: "Skip AYUSH",
    ayushSave: "Save & Continue",

    docTitle: "Scan Prior Medical Records",
    docSubtitle: "Place past paper prescriptions or lab reports under the scanner",
    docInstructions: "Align your paper record flat under the camera lens or upload sample image",
    docSimulateScan: "Simulate Scanning Prescription / Lab Report",
    docScanning: "Analyzing document with PaddleOCR...",
    docExtractedHeader: "Extracted Clinical Entities",
    docNoDocsUploaded: "No documents attached yet",
    docContinue: "Proceed to Review",

    redFlagTitle: "EMERGENCY TRIAGE ALERT",
    redFlagSubtitle: "High priority symptom detected",
    redFlagWarningText: "Your symptoms indicate potential high priority emergency risk requiring immediate medical evaluation.",
    redFlagTriageNotice: "Please report directly to Room 102 Emergency Triage Desk immediately.",
    redFlagNurseAlerted: "Triage Nursing Staff has been notified of your token.",
    redFlagProceedBtn: "Acknowledge & Proceed to Triage Room",

    reviewTitle: "Review Your Clinical Intake",
    reviewSubtitle: "Verify your captured details before handing summary to doctor",
    reviewReadAloud: "Listen to Complete Summary (Voice)",
    reviewPatientCard: "Patient Profile",
    reviewCCCard: "Chief Complaint",
    reviewHistoryCard: "Extracted Symptoms & Timeline",
    reviewDocsCard: "Uploaded Medical Documents",
    reviewConfirmBtn: "Confirm & Generate OPD Token",

    completeTitle: "OPD Check-in Successful!",
    completeSubtitle: "Your structured summary is ready and transmitted to the doctor",
    completeTokenBadge: "OPD TOKEN NUMBER",
    completeDept: "Department",
    completeDoctor: "Assigned Doctor",
    completeRoom: "Consultation Room",
    completeWaitTime: "Est. Waiting Time",
    completePrintSlip: "Print OPD Slip",
    completeNewPatient: "Done / Next Patient",

    verifiedSuccess: "Verification Successful!",
    tokenGenerated: "OPD Check-in Confirmed",
    department: "Department",
    tokenNumber: "Token Number",
    queueEst: "Estimated waiting time: ~10 minutes",
    printReceipt: "Print OPD Slip",
    finishDone: "Done / New Patient",
  },
  hi: {
    appName: "मेडीकियोस्क",
    appSubtitle: "एआई रोगी स्व-सेवा कियोस्क",
    help: "मदद",
    back: "वापस",
    audioPrompt: "स्क्रीन के निर्देश सुनें",
    secureFooter: "सुरक्षित • निजी • विश्वसनीय",
    close: "बंद करें",
    hospitalHelpTitle: "क्या आपको सहायता चाहिए?",
    hospitalHelpDesc: "इस कियोस्क के उपयोग में सहायता के लिए अस्पताल सहायक उपलब्ध हैं।",
    callAttendant: "अस्पताल सहायक को बुलाएं",
    attendantNotification: "अस्पताल सहायक को सूचित कर दिया गया है। कृपया प्रतीक्षा करें।",

    langTitle: "अपनी भाषा चुनें",
    langSubtitle: "आवाज़ और स्क्रीन के लिए अपनी पसंदीदा भाषा चुनें",
    langFooterNote: "आपका स्वास्थ्य, आपकी भाषा में। आपका डेटा हमेशा सुरक्षित।",
    continueBtn: "आगे बढ़ें",

    welcomeTitle: "स्वागत है!",
    welcomeSubtitle: "आप आगे कैसे बढ़ना चाहते हैं?",
    loginCardTitle: "लॉगिन करें",
    loginCardDesc: "अपने मौजूदा खाते में लॉगिन करें",
    registerCardTitle: "पंजीकरण करें",
    registerCardDesc: "नया खाता बनाएं",
    orDivider: "या",

    loginOptionsTitle: "लॉगिन",
    loginOptionsSubtitle: "लॉगिन का माध्यम चुनें",
    abhaScanTitle: "आभा (ABHA) स्कैनर से लॉगिन",
    abhaScanDesc: "अपना आभा क्यूआर कोड स्कैन करें",
    phoneLoginTitle: "फ़ोन नंबर से लॉगिन करें",
    phoneLoginDesc: "अपने पंजीकृत मोबाइल पर ओटीपी प्राप्त करें",

    registerOptionsTitle: "पंजीकरण",
    registerOptionsSubtitle: "पंजीकरण विधि चुनें",
    regAbhaTitle: "मौजूदा आभा आईडी से पंजीकरण",
    regAbhaDesc: "खाता बनाने के लिए अपनी आभा आईडी दर्ज करें",
    regPhoneTitle: "फ़ोन नंबर से पंजीकरण करें",
    regPhoneDesc: "खाता बनाने के लिए मोबाइल पर ओटीपी प्राप्त करें",

    enterPhoneTitle: "मोबाइल नंबर दर्ज करें",
    enterPhoneSubtitle: "हम इस मोबाइल नंबर पर एक ओटीपी सत्यापन कोड भेजेंगे",
    sendOtpBtn: "ओटीपी कोड भेजें",
    invalidPhoneMsg: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें",

    scanAbhaTitle: "आभा क्यूआर कोड स्कैन करें",
    scanAbhaSubtitle: "अपने आभा कार्ड को स्कैनर के सामने रखें",
    cameraScanning: "क्यूआर कोड स्कैन किया जा रहा है...",
    orEnterAbhaManual: "या 14 अंकों का आभा नंबर मैन्युअल दर्ज करें",
    simulateScanSuccess: "क्यूआर स्कैन सिमुलेट करें (डेमो)",

    otpTitle: "ओटीपी सत्यापन",
    otpSubtitle: "भेजे गए 6-अंकीय ओटीपी को दर्ज करें",
    verifyBtn: "सत्यापित करें",
    resendIn: "पुनः भेजने का समय:",
    resendAvailable: "ओटीपी पुनः उपलब्ध है",
    didntReceiveOtp: "ओटीपी नहीं मिला?",
    resendOtp: "ओटीपी पुनः भेजें",
    dataSafeBadge: "आपका डेटा हमारे पास सुरक्षित है",
    otpInvalid: "अमान्य ओटीपी कोड। कृपया सही 6 अंक दर्ज करें।",

    demographicsTitle: "रोगी की जानकारी",
    demographicsSubtitle: "पंजीकरण जारी रखने के लिए बुनियादी विवरण दर्ज करें",
    firstName: "पहला नाम",
    lastName: "अंतिम नाम",
    age: "आयु (वर्ष)",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    emergencyPhone: "आपातकालीन संपर्क नंबर",
    submitDemographics: "सहेजें और सहमति पर जाएं",

    consentTitle: "रोगी सहमति विकल्प",
    consentSubtitle: "स्व-सेवा इतिहास के लिए अनुमति प्रदान करें",
    consentDataTitle: "चिकित्सा डेटा संग्रह",
    consentDataDesc: "परामर्श के लिए लक्षणों को संसाधित करने की अनुमति दें।",
    consentVoiceTitle: "आवाज़ रिकॉर्डिंग (ASR)",
    consentVoiceDesc: "भाषिणी आवाज़ से बोलकर उत्तर दर्ज करने की अनुमति।",
    consentOcrTitle: "दस्तावेज़ स्कैनिंग और OCR",
    consentOcrDesc: "पुरानी पर्चियों और लैब रिपोर्ट को स्कैन करें।",
    consentAbdmTitle: "आभा (ABDM) स्वास्थ्य डेटा साझा करना",
    consentAbdmDesc: "आयुष्मान भारत डिजिटल मिशन पर रिकॉर्ड साझा करें।",
    consentAgreeBtn: "मैं सहमत हूँ और आगे बढ़ें",
    consentAudioGuide: "सहमति विवरण सुनें",

    ccTitle: "आपकी मुख्य स्वास्थ्य समस्या क्या है?",
    ccSubtitle: "माइक में बोलकर बताएं या नीचे दिए गए विकल्पों को चुनें",
    ccVoiceInstruction: "माइक बटन दबाएं और बताएं कि आपको क्या तकलीफ है",
    ccListening: "सुन रहे हैं... अब बोलें",
    ccTapToSpeak: "बोलने के लिए माइक दबाएं",
    ccCommonChipHeader: "सामान्य लक्षण चुनें:",
    ccChipFever: "तेज़ बुखार",
    ccChipChestPain: "छाती में दर्द / भारीपन",
    ccChipCough: "गंभीर खांसी",
    ccChipHeadache: "तेज़ सिरदर्द",
    ccChipStomach: "पेट दर्द",
    ccChipBreathing: "सांस लेने में तकलीफ",
    ccChipJointPain: "जोड़ों और शरीर में दर्द",
    ccChipVomiting: "उल्टी और मिचली",
    ccChipRash: "त्वचा पर दाने / खुजली",
    ccChipDizziness: "चक्कर और कमजोरी",
    ccContinue: "इतिहास जारी रखें",

    socratesTitle: "विस्तृत चिकित्सा इतिहास",
    socratesSubtitle: "डॉक्टर के लिए कुछ आसान प्रश्नों के उत्तर दें",
    socratesSectionHPI: "वर्तमान बीमारी का इतिहास",
    socratesSectionPMH: "पुराना चिकित्सा इतिहास",
    socratesSectionAllergies: "एलर्जी और दवाएं",
    socratesSectionFamily: "पारिवारिक इतिहास",
    socratesSectionPersonal: "व्यक्तिगत दिनचर्या",
    socratesSectionROS: "शारीरिक प्रणालियों की जांच",
    socratesVoiceOrTouch: "बोलकर या बटन दबाकर उत्तर दें",
    socratesNextQuestion: "अगला प्रश्न",
    socratesSubmitTurn: "उत्तर सहेजें और आगे बढ़ें",

    ayushTitle: "आयुष मूल्यांकन (ऐच्छिक)",
    ayushSubtitle: "दशविध परीक्षा पारंपरिक स्वास्थ्य विश्लेषण",
    ayushIntro: "आयुष ओपीडी परामर्श के लिए ऐच्छिक पारंपरिक विवरण",
    ayushNadi: "नाड़ी की स्थिति",
    ayushMala: "मल त्याग की स्थिति",
    ayushMutra: "मूत्र त्याग की स्थिति",
    ayushJihva: "जिह्वा (जीभ) का रंग",
    ayushPrakriti: "प्रकृति (शरीर का प्रकार)",
    ayushSkip: "आयुष छोड़ें",
    ayushSave: "सहेजें और आगे बढ़ें",

    docTitle: "पुरानी पर्चियां / लैब रिपोर्ट स्कैन करें",
    docSubtitle: "अपनी पुरानी रिपोर्ट को स्कैनर के नीचे रखें",
    docInstructions: "कागज को स्कैनर के नीचे सीधा रखें या सैंपल रिपोर्ट अपलोड करें",
    docSimulateScan: "सैंपल पर्ची / लैब रिपोर्ट स्कैन करें",
    docScanning: "रिपोर्ट पढ़ी जा रही है...",
    docExtractedHeader: "रिपोर्ट से प्राप्त जानकारी",
    docNoDocsUploaded: "कोई रिपोर्ट संलग्न नहीं है",
    docContinue: "समीक्षा पर जाएं",

    redFlagTitle: "आपातकालीन चेतावनी",
    redFlagSubtitle: "अति-महत्वपूर्ण लक्षण पाया गया",
    redFlagWarningText: "आपके लक्षण किसी आपातकालीन स्थिति का संकेत देते हैं जिसके लिए तुरंत डॉक्टर की आवश्यकता है।",
    redFlagTriageNotice: "कृपया तुरंत कमरा नंबर 102 (इमरजेंसी ट्राइएज) में जाएं।",
    redFlagNurseAlerted: "इमरजेंसी नर्सिंग स्टाफ को आपकी सूचना भेज दी गई है।",
    redFlagProceedBtn: "समझ गया, इमरजेंसी कक्ष में जाएं",

    reviewTitle: "अपनी जानकारी की समीक्षा करें",
    reviewSubtitle: "डॉक्टर के पास भेजने से पहले जानकारी जांच लें",
    reviewReadAloud: "पूरा विवरण सुनें (आवाज़ में)",
    reviewPatientCard: "रोगी प्रोफ़ाइल",
    reviewCCCard: "मुख्य शिकायत",
    reviewHistoryCard: "दर्ज लक्षण एवं इतिहास",
    reviewDocsCard: "स्कैन किए गए दस्तावेज़",
    reviewConfirmBtn: "पुष्टि करें और ओपीडी टोकन पाएं",

    completeTitle: "ओपीडी चेक-इन सफल रहा!",
    completeSubtitle: "आपका विवरण डॉक्टर के पास भेज दिया गया है",
    completeTokenBadge: "ओपीडी टोकन नंबर",
    completeDept: "विभाग",
    completeDoctor: "आवंटित डॉक्टर",
    completeRoom: "कमरा नंबर",
    completeWaitTime: "अनुमानित प्रतीक्षा समय",
    completePrintSlip: "ओपीडी पर्ची प्रिंट करें",
    completeNewPatient: "पूर्ण / नया मरीज",

    verifiedSuccess: "सत्यापन सफल रहा!",
    tokenGenerated: "ओपीडी टोकन जारी किया गया",
    department: "विभाग",
    tokenNumber: "टोकन नंबर",
    queueEst: "अनुमानित प्रतीक्षा समय: लगभग 10 मिनट",
    printReceipt: "ओपीडी पर्ची प्रिंट करें",
    finishDone: "समाप्त / नया मरीज",
  },
  mr: {
    appName: "मेडीकिऑस्क",
    appSubtitle: "एआय रुग्ण स्व-सेवा किऑस्क",
    help: "मदत",
    back: "मागे",
    audioPrompt: "स्क्रीनवरील सूचना ऐका",
    secureFooter: "सुरक्षित • खाजगी • विश्वासार्ह",
    close: "बंद करा",
    hospitalHelpTitle: "मदत हवी आहे का?",
    hospitalHelpDesc: "किऑस्क वापरण्यासाठी रुग्णालय सहाय्यक उपलब्ध आहेत.",
    callAttendant: "रुग्णालय सहाय्यकाला बोलवा",
    attendantNotification: "सहाय्यकाला सूचना दिली आहे. कृपया येथे थांबा.",

    langTitle: "आपली भाषा निवडा",
    langSubtitle: "आवाज आणि स्क्रीनसाठी आपली आवडती भाषा निवडा",
    langFooterNote: "तुमचे आरोग्य, तुमच्या भाषेत. तुमचा डेटा नेहमी सुरक्षित.",
    continueBtn: "पुढे चला",

    welcomeTitle: "स्वागत आहे!",
    welcomeSubtitle: "तुम्ही पुढे कसे जाऊ इच्छिता?",
    loginCardTitle: "लॉगिन करा",
    loginCardDesc: "तुमच्या खात्यात लॉगिन करा",
    registerCardTitle: "नोंदणी करा",
    registerCardDesc: "नवीन खाते तयार करा",
    orDivider: "किंवा",

    loginOptionsTitle: "लॉगिन",
    loginOptionsSubtitle: "लॉगिन पद्धत निवडा",
    abhaScanTitle: "आभा (ABHA) स्कॅनरने लॉगिन",
    abhaScanDesc: "तुमचा आभा क्यूआर कोड स्कॅन करा",
    phoneLoginTitle: "फोन नंबरने लॉगिन करा",
    phoneLoginDesc: "नोंदणीकृत मोबाईलवर ओटीपी मिळवा",

    registerOptionsTitle: "नोंदणी",
    registerOptionsSubtitle: "नोंदणी पद्धत निवडा",
    regAbhaTitle: "विद्यमान आभा आयडीने नोंदणी",
    regAbhaDesc: "खाते तयार करण्यासाठी आभा आयडी वापरा",
    regPhoneTitle: "फोन नंबरने नोंदणी करा",
    regPhoneDesc: "खाते तयार करण्यासाठी मोबाईलवर ओटीपी मिळवा",

    enterPhoneTitle: "मोबाईल नंबर टाका",
    enterPhoneSubtitle: "आम्ही या नंबरवर पडताळणी ओटीपी पाठवू",
    sendOtpBtn: "ओटीपी पाठवा",
    invalidPhoneMsg: "कृपया वैध 10 अंकी मोबाईल नंबर टाका",

    scanAbhaTitle: "आभा क्यूआर स्कॅन करा",
    scanAbhaSubtitle: "आपले आभा कार्ड स्कॅनरसमोर धरा",
    cameraScanning: "क्यूआर स्कॅन होत आहे...",
    orEnterAbhaManual: "किंवा आभा नंबर स्वतः टाईप करा",
    simulateScanSuccess: "क्यूआर स्कॅन चाचणी (डेमो)",

    otpTitle: "ओटीपी पडताळणी",
    otpSubtitle: "पाठवलेला 6-अंकी ओटीपी टाका",
    verifyBtn: "पडताळणी करा",
    resendIn: "पुन्हा पाठवण्याची वेळ:",
    resendAvailable: "ओटीपी पुन्हा पाठवता येईल",
    didntReceiveOtp: "ओटीपी आला नाही?",
    resendOtp: "ओटीपी पुन्हा पाठवा",
    dataSafeBadge: "तुमचा डेटा आमच्याकडे पूर्णपणे सुरक्षित आहे",
    otpInvalid: "चुकीचा ओटीपी. कृपया 6 अंक तपासा.",

    demographicsTitle: "रुग्णाची माहिती",
    demographicsSubtitle: "नोंदणीसाठी तुमची प्राथमिक माहिती भरा",
    firstName: "पहिले नाव",
    lastName: "आडनाव",
    age: "वय (वर्षे)",
    gender: "लिंग",
    male: "पुरुष",
    female: "स्त्री",
    other: "इतर",
    emergencyPhone: "आणीबाणी संपर्क क्रमांक",
    submitDemographics: "जतन करा आणि संमतीवर जा",

    consentTitle: "संमती पर्याय",
    consentSubtitle: "किऑस्क वापरासाठी संमती द्या",
    consentDataTitle: "वैद्यकीय माहिती संकलन",
    consentDataDesc: "तपासणीसाठी लक्षणांची नोंद घेण्याची परवानगी द्या.",
    consentVoiceTitle: "आवाज नोंदणी (ASR)",
    consentVoiceDesc: "बोलून उत्तरे नोंदवण्याची परवानगी.",
    consentOcrTitle: "कागदपत्रे स्कॅनिंग",
    consentOcrDesc: "जुने रिपोर्ट स्कॅन करण्याची परवानगी.",
    consentAbdmTitle: "आभा (ABDM) सहभाग",
    consentAbdmDesc: "आरोग्य रेकॉर्ड डिजिटल शेअर करण्याची संमती.",
    consentAgreeBtn: "मी सहमत आहे",
    consentAudioGuide: "संमती माहिती ऐका",

    ccTitle: "तुम्हाला मुख्य काय त्रास होत आहे?",
    ccSubtitle: "माईकमध्ये बोला किंवा खालील पर्यायांवर क्लिक करा",
    ccVoiceInstruction: "माईक बटण दाबा आणि तुमचा त्रास सांगा",
    ccListening: "ऐकत आहे... आता बोला",
    ccTapToSpeak: "बोलण्यासाठी माईक दाबा",
    ccCommonChipHeader: "सामान्य लक्षणे निवडा:",
    ccChipFever: "कडक ताप",
    ccChipChestPain: "छातीत दुखणे",
    ccChipCough: "खोकला",
    ccChipHeadache: "डोकेदुखी",
    ccChipStomach: "पोटदुखी",
    ccChipBreathing: "दमा / श्वास त्रास",
    ccChipJointPain: "सांधेदुखी",
    ccChipVomiting: "उलट्या / मळमळ",
    ccChipRash: "अंगावर खाज",
    ccChipDizziness: "चक्कर येणे",
    ccContinue: "इतिहास सुरू ठेवा",

    socratesTitle: "वैद्यकीय इतिहास",
    socratesSubtitle: "डॉक्टरांसाठी काही प्रश्नांची उत्तरे द्या",
    socratesSectionHPI: "सध्याचा आजार",
    socratesSectionPMH: "जुने आजार",
    socratesSectionAllergies: "ॲलर्जी व औषधे",
    socratesSectionFamily: "कौटुंबिक इतिहास",
    socratesSectionPersonal: "वैयक्तिक सवयी",
    socratesSectionROS: "इतर शारीरिक तपासणी",
    socratesVoiceOrTouch: "बोलून किंवा बटण दाबून उत्तर द्या",
    socratesNextQuestion: "पुढील प्रश्न",
    socratesSubmitTurn: "उत्तर जतन करा",

    ayushTitle: "आयुष माहिती (पर्यायी)",
    ayushSubtitle: "दशविध परीक्षा पारंपरिक तपासणी",
    ayushIntro: "आयुष ओपीडीसाठी पारंपरिक माहिती",
    ayushNadi: "नाडी परीक्षा",
    ayushMala: "शौचाची सवय",
    ayushMutra: "लघवीची सवय",
    ayushJihva: "जिभ रंग",
    ayushPrakriti: "शरीर प्रकृति",
    ayushSkip: "रद्द करा",
    ayushSave: "जतन करा",

    docTitle: "जुने रिपोर्ट स्कॅन करा",
    docSubtitle: "तुमचे जुने कागदपत्र स्कॅनरखाली ठेवा",
    docInstructions: "कागद सरळ ठेवा किंवा सॅम्पल अपलोड करा",
    docSimulateScan: "सॅम्पल स्कॅन करा",
    docScanning: "रिपोर्ट वाचत आहे...",
    docExtractedHeader: "वाचलेली माहिती",
    docNoDocsUploaded: "कागदपत्रे नाहीत",
    docContinue: "पुढील पायरी",

    redFlagTitle: "आणीबाणी इशारा",
    redFlagSubtitle: "गंभीर लक्षण आढळले",
    redFlagWarningText: "तुमचे लक्षण गंभीर असून तात्काळ डॉक्टरांची गरज आहे.",
    redFlagTriageNotice: "कृपया ताबडतोब रूम नंबर 102 (इमर्जन्सी) मध्ये जा.",
    redFlagNurseAlerted: "परिचारिकांना सूचना पाठवली आहे.",
    redFlagProceedBtn: "समजले, इमर्जन्सी रूममध्ये जा",

    reviewTitle: "माहिती तपासा",
    reviewSubtitle: "डॉक्टरांकडे पाठवण्यापूर्वी तपासा",
    reviewReadAloud: "माहिती ऐका (आवाज)",
    reviewPatientCard: "रुग्ण माहिती",
    reviewCCCard: "मुख्य त्रास",
    reviewHistoryCard: "नोंदवलेली लक्षणे",
    reviewDocsCard: "स्कॅन केलेले रिपोर्ट",
    reviewConfirmBtn: "खात्री करा व टोकन मिळवा",

    completeTitle: "ओपीडी नोंदणी यशस्वी!",
    completeSubtitle: "माहिती डॉक्टरांकडे पाठवली आहे",
    completeTokenBadge: "ओपीडी टोकन नंबर",
    completeDept: "विभाग",
    completeDoctor: "डॉक्टर",
    completeRoom: "रूम नंबर",
    completeWaitTime: "अंदाजे वेळ",
    completePrintSlip: "पावती प्रिंट करा",
    completeNewPatient: "पूर्ण / नवीन रुग्ण",

    verifiedSuccess: "पडताळणी यशस्वी झाली!",
    tokenGenerated: "ओपीडी नोंदणी निश्चित",
    department: "विभाग",
    tokenNumber: "टोकन क्रमांक",
    queueEst: "अंदाजे प्रतीक्षा वेळ: ~10 मिनिटे",
    printReceipt: "ओपीडी पावती प्रिंट करा",
    finishDone: "पूर्ण / नवीन रुग्ण",
  },
  ta: {
    appName: "மெடிகியோஸ்க்",
    appSubtitle: "AI நோயாளி சுய சேவை கியோஸ்க்",
    help: "உதவி",
    back: "பின்செல்",
    audioPrompt: "திரை வழிமுறைகளைக் கேட்கவும்",
    secureFooter: "பாதுகாப்பானது • தனிப்பட்டது • நம்பகமானது",
    close: "மூடு",
    hospitalHelpTitle: "உதவி தேவையா?",
    hospitalHelpDesc: "உங்களுக்கு உதவ மருத்துவமனை உதவியாளர் தயாராக உள்ளார்.",
    callAttendant: "உதவியாளரை அழைக்கவும்",
    attendantNotification: "உதவியாளருக்கு தகவல் அனுப்பப்பட்டது.",

    langTitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    langSubtitle: "குரல் மற்றும் திரைக்கு விரும்பிய மொழியைத் தேர்ந்தெடுக்கவும்",
    langFooterNote: "உங்கள் உடல்நலம், உங்கள் மொழியில். எப்போதும் பாதுகாப்பானது.",
    continueBtn: "தொடரவும்",

    welcomeTitle: "வரவேற்கிறோம்!",
    welcomeSubtitle: "நீங்கள் எவ்வாறு தொடர விரும்புகிறீர்கள்?",
    loginCardTitle: "உள்நுழையவும்",
    loginCardDesc: "உள்ளிட்ட கணக்கில் நுழையவும்",
    registerCardTitle: "பதிவு செய்யவும்",
    registerCardDesc: "புதிய கணக்கை உருவாக்கவும்",
    orDivider: "அல்லது",

    loginOptionsTitle: "உள்நுழைவு",
    loginOptionsSubtitle: "உள்நுழைவு முறையைத் தேர்ந்தெடுக்கவும்",
    abhaScanTitle: "ABHA ஸ்கேனர் மூலம் உள்நுழைவு",
    abhaScanDesc: "உங்கள் ABHA QR குறியீட்டை ஸ்கேன் செய்யவும்",
    phoneLoginTitle: "தொலைபேசி எண் மூலம் உள்நுழைவு",
    phoneLoginDesc: "பதிவுசெய்த எண்ணில் OTP பெறவும்",

    registerOptionsTitle: "பதிவு",
    registerOptionsSubtitle: "பதிவு முறையைத் தேர்ந்தெடுக்கவும்",
    regAbhaTitle: "முந்தைய ABHA ஐடி மூலம் பதிவு",
    regAbhaDesc: "கணக்கை உருவாக்க ABHA ஐடியைப் பயன்படுத்தவும்",
    regPhoneTitle: "தொலைபேசி எண் மூலம் பதிவு",
    regPhoneDesc: "கணக்கை உருவாக்க OTP பெறவும்",

    enterPhoneTitle: "தொலைபேசி எண்ணை உள்ளிடவும்",
    enterPhoneSubtitle: "இந்த எண்ணிற்கு OTP அனுப்பப்படும்",
    sendOtpBtn: "OTP அனுப்புக",
    invalidPhoneMsg: "சரியான 10 இலக்க எண்ணை உள்ளிடவும்",

    scanAbhaTitle: "ABHA QR குறியீட்டை ஸ்கேன் செய்யவும்",
    scanAbhaSubtitle: "கார்டை ஸ்கேனர் முன் காட்டவும்",
    cameraScanning: "ஸ்கேன் செய்யப்படுகிறது...",
    orEnterAbhaManual: "அல்லது ABHA எண்ணை கைமுறையாக உள்ளிடவும்",
    simulateScanSuccess: "மாதிரி ஸ்கேன் (டெமோ)",

    otpTitle: "OTP சரிபார்ப்பு",
    otpSubtitle: "அனுப்பப்பட்ட 6-இலக்க OTP குறியீட்டை உள்ளிடவும்",
    verifyBtn: "சரிபார்க்கவும்",
    resendIn: "மீண்டும் அனுப்ப நேரம்:",
    resendAvailable: "OTP மீண்டும் அனுப்ப தயாராக உள்ளது",
    didntReceiveOtp: "OTP கிடைக்கவில்லையா?",
    resendOtp: "OTP மீண்டும் அனுப்பவும்",
    dataSafeBadge: "உங்கள் தரவு பாதுகாப்பானது",
    otpInvalid: "தவறான OTP. மீண்டும் சரிபார்க்கவும்.",

    demographicsTitle: "நோயாளி விவரங்கள்",
    demographicsSubtitle: "பதிவைத் தொடர உங்கள் விவரங்களை வழங்கவும்",
    firstName: "முதல் பெயர்",
    lastName: "கடைசி பெயர்",
    age: "வயது",
    gender: "பாலினம்",
    male: "ஆண்",
    female: "பெண்",
    other: "இதர",
    emergencyPhone: "அவசர தொடர்பு எண்",
    submitDemographics: "சேமித்து தொடரவும்",

    consentTitle: "சம்மத உரிமைகள்",
    consentSubtitle: "சேவையைப் பயன்படுத்த சம்மதம் அளிக்கவும்",
    consentDataTitle: "மருத்துவ தரவு சேகரிப்பு",
    consentDataDesc: "அறிகுறிகளைச் செயல்படுத்த அனுமதிக்கவும்.",
    consentVoiceTitle: "குரல் பதிவு (ASR)",
    consentVoiceDesc: "பேசி பதில் அளிக்க அனுமதி.",
    consentOcrTitle: "ஆவணங்கள் ஸ்கேன்",
    consentOcrDesc: "பழைய அறிக்கைகளை ஸ்கேன் செய்ய அனுமதி.",
    consentAbdmTitle: "ABHA பகிர்வு",
    consentAbdmDesc: "டிஜிட்டல் மருத்துவக் குறிப்புகளைப் பகிர அனுமதி.",
    consentAgreeBtn: "சம்மதிக்கிறேன்",
    consentAudioGuide: "சம்மதத்தைக் கேட்கவும்",

    ccTitle: "உங்களுக்கு என்ன முக்கிய பிரச்சனை?",
    ccSubtitle: "மைக்கில் பேசவும் அல்லது கீழே உள்ளவற்றைத் தேர்ந்தெடுக்கவும்",
    ccVoiceInstruction: "மைக்கை அழுத்தி உங்கள் பிரச்சனையைக் கூறவும்",
    ccListening: "கேட்கிறது... இப்போது பேசுங்கள்",
    ccTapToSpeak: "பேச மைக்கை அழுத்தவும்",
    ccCommonChipHeader: "பொதுவான அறிகுறிகள்:",
    ccChipFever: "கடும் காய்ச்சல்",
    ccChipChestPain: "நெஞ்சு வலி",
    ccChipCough: "இருமல்",
    ccChipHeadache: "தலைவலி",
    ccChipStomach: "வயிற்று வலி",
    ccChipBreathing: "மூச்சுத் திணறல்",
    ccChipJointPain: "மூட்டு வலி",
    ccChipVomiting: "வாந்தி",
    ccChipRash: "தோல் அரிப்பு",
    ccChipDizziness: "மயக்கம் / பலவீனம்",
    ccContinue: "தொடரவும்",

    socratesTitle: "மருத்துவ வரலாறு",
    socratesSubtitle: "மருத்துவருக்கான கேள்விகளுக்கு பதிலளிக்கவும்",
    socratesSectionHPI: "தற்போதைய நோய் வரலாறு",
    socratesSectionPMH: "முந்தைய நோய் வரலாறு",
    socratesSectionAllergies: "அலர்ஜி மற்றும் மருந்துகள்",
    socratesSectionFamily: "குடும்ப வரலாறு",
    socratesSectionPersonal: "தனிப்பட்ட பழக்கங்கள்",
    socratesSectionROS: "உடல் பரிசோதனை",
    socratesVoiceOrTouch: "பேசியோ அல்லது தொட்டோ பதிலளிக்கவும்",
    socratesNextQuestion: "அடுத்த கேள்வி",
    socratesSubmitTurn: "பதிலைச் சேமிக்கவும்",

    ayushTitle: "ஆயுஷ் விவரங்கள் (விருப்பம்)",
    ayushSubtitle: "பாரம்பரிய ஆரோக்கிய ஆய்வு",
    ayushIntro: "ஆயுஷ் சிகிச்சைக்கு பாரம்பரிய விவரங்கள்",
    ayushNadi: "நாடி பரிசோதனை",
    ayushMala: "மலம் கழித்தல்",
    ayushMutra: "சிறுநீர் கழித்தல்",
    ayushJihva: "நாக்கு நிறம்",
    ayushPrakriti: "உடல் தத்துவம்",
    ayushSkip: "தவிர்க்கவும்",
    ayushSave: "சேமிக்கவும்",

    docTitle: "பழைய அறிக்கைகளை ஸ்கேன் செய்யவும்",
    docSubtitle: "ஆவணங்களை ஸ்கேனரில் வைக்கவும்",
    docInstructions: "ஆவணத்தை நேராக வைக்கவும்",
    docSimulateScan: "மாதிரி ஸ்கேன் செய்யவும்",
    docScanning: "படிக்கப்படுகிறது...",
    docExtractedHeader: "கண்டறியப்பட்ட விவரங்கள்",
    docNoDocsUploaded: "ஆவணங்கள் இல்லை",
    docContinue: "அடுத்த படி",

    redFlagTitle: "அவசர எச்சரிக்கை",
    redFlagSubtitle: "அவசர அறிகுறி கண்டறியப்பட்டது",
    redFlagWarningText: "உடனடி மருத்துவ உதவி தேவைப்படுகிறது.",
    redFlagTriageNotice: "உடனடியாக அறை எண் 102 அவசர சிகிச்சைப் பிரிவிற்குச் செல்லவும்.",
    redFlagNurseAlerted: "செவிலியருக்கு தகவல் தெரிவிக்கப்பட்டது.",
    redFlagProceedBtn: "அவசர சிகிச்சைக்குச் செல்லவும்",

    reviewTitle: "விவரங்களைச் சரிபார்க்கவும்",
    reviewSubtitle: "மருத்துவருக்கு அனுப்பும் முன் சரிபார்க்கவும்",
    reviewReadAloud: "விவரங்களைக் கேட்கவும் (குரல்)",
    reviewPatientCard: "நோயாளி சுயவிவரம்",
    reviewCCCard: "முக்கிய பிரச்சனை",
    reviewHistoryCard: "பதிவுசெய்த அறிகுறிகள்",
    reviewDocsCard: "ஆவணங்கள்",
    reviewConfirmBtn: "உறுதிசெய்து டோக்கன் பெறவும்",

    completeTitle: "பதிவு முடிந்தது!",
    completeSubtitle: "விவரங்கள் மருத்துவருக்கு அனுப்பப்பட்டது",
    completeTokenBadge: "OPD டோக்கன் எண்",
    completeDept: "துறை",
    completeDoctor: "மருத்துவர்",
    completeRoom: "அறை எண்",
    completeWaitTime: "காத்திருப்பு நேரம்",
    completePrintSlip: "சீட்டை அச்சிடுக",
    completeNewPatient: "முடிந்தது / புதிய நோயாளி",

    verifiedSuccess: "சரிபார்ப்பு வெற்றிகரமாக முடிந்தது!",
    tokenGenerated: "OPD டோக்கன் பதிவு செய்யப்பட்டது",
    department: "துறை",
    tokenNumber: "டோக்கன் எண்",
    queueEst: "காத்திருப்பு நேரம்: ~10 நிமிடங்கள்",
    printReceipt: "OPD சீட்டை அச்சிடுக",
    finishDone: "முடிந்தது / புதிய நோயாளி",
  },
  te: {
    appName: "మెడికియోస్క్",
    appSubtitle: "AI రోగి స్వయం-సేవ కియోస్క్",
    help: "సహాయం",
    back: "వెనుకకు",
    audioPrompt: "స్క్రీన్ సూచనలను వినండి",
    secureFooter: "సురక్షితం • ప్రైవేట్ • విశ్వసనీయం",
    close: "మూసివేయి",
    hospitalHelpTitle: "సహాయం కావాలా?",
    hospitalHelpDesc: "మీకు సహాయం చేయడానికి హాస్పిటల్ సిబ్బంది అందుబాటులో ఉన్నారు.",
    callAttendant: "హాస్పిటల్ సిబ్బందిని పిలవండి",
    attendantNotification: "సిబ్బందికి సమాచారం పంపబడింది.",

    langTitle: "మీ భాషను ఎంచుకోండి",
    langSubtitle: "వాయిస్ మరియు స్క్రీన్ కోసం మీ భాషను ఎంచుకోండి",
    langFooterNote: "మీ ఆరోగ్యం, మీ భాషలో. మీ డేటా ఎల్లప్పుడూ భద్రం.",
    continueBtn: "కొనసాగించండి",

    welcomeTitle: "స్వాగతం!",
    welcomeSubtitle: "మీరు ఎలా కొనసాగాలనుకుంటున్నారు?",
    loginCardTitle: "లాగిన్ అవ్వండి",
    loginCardDesc: "మీ ఖాతాలోకి ప్రవేశించండి",
    registerCardTitle: "నమోదు చేసుకోండి",
    registerCardDesc: "కొత్త ఖాతాను సృష్టించండి",
    orDivider: "లేదా",

    loginOptionsTitle: "లాగిన్",
    loginOptionsSubtitle: "లాగిన్ పద్ధతిని ఎంచుకోండి",
    abhaScanTitle: "ABHA స్కానర్ ద్వారా లాగిన్",
    abhaScanDesc: "మీ ABHA QR కోడ్‌ను స్కాన్ చేయండి",
    phoneLoginTitle: "ఫోన్ నంబర్ ద్వారా లాగిన్",
    phoneLoginDesc: "రిజిస్టర్డ్ మొబైల్‌కు OTP పొందండి",

    registerOptionsTitle: "నమోదు",
    registerOptionsSubtitle: "నమోదు పద్ధతిని ఎంచుకోండి",
    regAbhaTitle: "ఉన్న ABHA ID తో నమోదు",
    regAbhaDesc: "ఖాతా కోసం ABHA ID ని ఉపయోగించండి",
    regPhoneTitle: "ఫోన్ నంబర్ తో నమోదు",
    regPhoneDesc: "ఖాతా కోసం మొబైల్‌కు OTP పొందండి",

    enterPhoneTitle: "మొబైల్ నంబర్ నమోదు చేయండి",
    enterPhoneSubtitle: "మేము ఈ నంబర్‌కు OTP కోడ్‌ను పంపుతాము",
    sendOtpBtn: "OTP పంపండి",
    invalidPhoneMsg: "దయచేసి సరైన 10 అంకెల నంబర్ నమోదు చేయండి",

    scanAbhaTitle: "ABHA QR కోడ్‌ను స్కాన్ చేయండి",
    scanAbhaSubtitle: "కార్డును స్కానర్ ముందు ఉంచండి",
    cameraScanning: "స్కాన్ చేస్తోంది...",
    orEnterAbhaManual: "లేదా ABHA నంబర్‌ను స్వయంగా నమోదు చేయండి",
    simulateScanSuccess: "స్కాన్ డెమో",

    otpTitle: "OTP ధృవీకరణ",
    otpSubtitle: "పంపిన 6-అంకెల OTP ని నమోదు చేయండి",
    verifyBtn: "ధృవీకరించండి",
    resendIn: "మళ్ళీ పంపడానికి సమయం:",
    resendAvailable: "OTP మళ్ళీ పంపడానికి సిద్ధంగా ఉంది",
    didntReceiveOtp: "OTP రాలేదా?",
    resendOtp: "OTP మళ్ళీ పంపండి",
    dataSafeBadge: "మీ సమాచారం భద్రంగా ఉంది",
    otpInvalid: "సరైన OTP నమోదు చేయండి.",

    demographicsTitle: "రోగి వివరాలు",
    demographicsSubtitle: "నమోదు కోసం వివరాలను అందించండి",
    firstName: "మొదటి పేరు",
    lastName: "చివరి పేరు",
    age: "వయస్సు (సంవత్సరాలు)",
    gender: "లింగం",
    male: "పురుషుడు",
    female: "స్త్రీ",
    other: "ఇతర",
    emergencyPhone: "అత్యవసర సంప్రదింపు సంఖ్య",
    submitDemographics: "సేవ్ చేసి కొనసాగించండి",

    consentTitle: "అనుమతుల ఎంపిక",
    consentSubtitle: "సేవల వినియోగానికి అనుమతి ఇవ్వండి",
    consentDataTitle: "వైద్య సమాచార సేకరణ",
    consentDataDesc: "లక్షణాలను నమోదు చేయడానికి అనుమతించండి.",
    consentVoiceTitle: "వాయిస్ రికార్డింగ్ (ASR)",
    consentVoiceDesc: "మాట్లాడి సమాధానం చెప్పడానికి అనుమతి.",
    consentOcrTitle: "పత్రాల స్కానింగ్",
    consentOcrDesc: "పాత రిపోర్టులను స్కాన్ చేయడానికి అనుమతి.",
    consentAbdmTitle: "ABHA షేరింగ్",
    consentAbdmDesc: "డిజిటల్ రికార్డులను పంచుకోవడానికి అనుమతి.",
    consentAgreeBtn: "నేను అంగీకరిస్తున్నాను",
    consentAudioGuide: "అనుమతి వివరాలను వినండి",

    ccTitle: "మీకు ఉన్న ప్రధాన ఆరోగ్య సమస్య ఏమిటి?",
    ccSubtitle: "మైక్‌లో మాట్లాడండి లేదా కింద ఉన్న వాటిని ఎంచుకోండి",
    ccVoiceInstruction: "మైక్ నొక్కి మీ సమస్యను చెప్పండి",
    ccListening: "వింటోంది... ఇప్పుడు మాట్లాడండి",
    ccTapToSpeak: "మాట్లాడటానికి మైక్ నొక్కండి",
    ccCommonChipHeader: "సాధారణ లక్షణాలు:",
    ccChipFever: "తీవ్రమైన జ్వరం",
    ccChipChestPain: "ఛాతీ నొప్పి",
    ccChipCough: "దగ్గు",
    ccChipHeadache: "తలనొప్పి",
    ccChipStomach: "కడుపు నొప్పి",
    ccChipBreathing: "ఆయాసం / శ్వాస ఇబ్బంది",
    ccChipJointPain: "కీళ్ళ నొప్పులు",
    ccChipVomiting: "వాంతులు",
    ccChipRash: "చర్మం దురద",
    ccChipDizziness: "తలతిరుగుడు / బలహీనత",
    ccContinue: "కొనసాగించండి",

    socratesTitle: "వైద్య చరిత్ర",
    socratesSubtitle: "డాక్టర్ కోసం కొన్ని ప్రశ్నలకు సమాధానం ఇవ్వండి",
    socratesSectionHPI: "ప్రస్తుత అనారోగ్య చరిత్ర",
    socratesSectionPMH: "పాత వైద్య చరిత్ర",
    socratesSectionAllergies: "అలెర్జీలు మరియు మందులు",
    socratesSectionFamily: "కుటుంబ చరిత్ర",
    socratesSectionPersonal: "వ్యక్తిగత అలవాట్లు",
    socratesSectionROS: "శరీర పరీక్షలు",
    socratesVoiceOrTouch: "మాట్లాడి లేదా బటన్ నొక్కి జవాబు ఇవ్వండి",
    socratesNextQuestion: "తరువాతి ప్రశ్న",
    socratesSubmitTurn: "సమాధానం సేవ్ చేయండి",

    ayushTitle: "ఆయుష్ వివరాలు (ఐచ్ఛికం)",
    ayushSubtitle: "సాంప్రదాయ ఆరోగ్య పరీక్ష",
    ayushIntro: "ఆయుష్ సంప్రదింపుల కోసం సాంప్రదాయ వివరాలు",
    ayushNadi: "నాడీ పరీక్ష",
    ayushMala: "మల విసర్జన",
    ayushMutra: "మూత్ర విసర్జన",
    ayushJihva: "నాలుక రంగు",
    ayushPrakriti: "శరీర తత్వం",
    ayushSkip: "వదిలేయండి",
    ayushSave: "సేవ్ చేయండి",

    docTitle: "పాత రిపోర్టులను స్కాన్ చేయండి",
    docSubtitle: "మీ కాగితాలను స్కానర్ కింద ఉంచండి",
    docInstructions: "కాగితాన్ని నిలువుగా ఉంచండి",
    docSimulateScan: "డెమో స్కాన్ చేయండి",
    docScanning: "చదువుతోంది...",
    docExtractedHeader: "గుర్తించిన వివరాలు",
    docNoDocsUploaded: "పత్రాలు లేవు",
    docContinue: "తరువాతి దశ",

    redFlagTitle: "అత్యవసర హెచ్చరిక",
    redFlagSubtitle: "తీవ్రమైన లక్షణం గుర్తించబడింది",
    redFlagWarningText: "మీ లక్షణాలకు తక్షణ వైద్య సహాయం అవసరం.",
    redFlagTriageNotice: "దయచేసి వెంటనే రూమ్ నంబర్ 102 అత్యవసర విభాగంలోకి వెళ్ళండి.",
    redFlagNurseAlerted: "నర్సింగ్ సిబ్బందికి సమాచారం పంపబడింది.",
    redFlagProceedBtn: "అత్యవసర గదికి వెళ్ళండి",

    reviewTitle: "వివరాలను తనిఖీ చేయండి",
    reviewSubtitle: "డాక్టర్‌కు పంపే ముందు సరిచూసుకోండి",
    reviewReadAloud: "వివరాలను వినండి (వాయిస్)",
    reviewPatientCard: "రోగి వివరాలు",
    reviewCCCard: "ప్రధాన సమస్య",
    reviewHistoryCard: "నమోదైన లక్షణాలు",
    reviewDocsCard: "పత్రాలు",
    reviewConfirmBtn: "ధృవీకరించి టోకెన్ పొందండి",

    completeTitle: "నమోదు పూర్తయింది!",
    completeSubtitle: "వివరాలు డాక్టర్‌కు పంపబడ్డాయి",
    completeTokenBadge: "OPD టోకెన్ నంబర్",
    completeDept: "విభాగం",
    completeDoctor: "డాక్టర్",
    completeRoom: "రూమ్ నంబర్",
    completeWaitTime: "వేచి ఉండే సమయం",
    completePrintSlip: "రసీదు ముద్రించండి",
    completeNewPatient: "పూర్తయింది / కొత్త రోగి",

    verifiedSuccess: "ధృవీకరణ విజయవంతమైంది!",
    tokenGenerated: "OPD టోకెన్ జారీ చేయబడింది",
    department: "విభాగం",
    tokenNumber: "టోకెన్ నంబర్",
    queueEst: "వేచి ఉండే సమయం: ~10 నిమిషాలు",
    printReceipt: "OPD రసీదును ముద్రించండి",
    finishDone: "పూర్తయింది / కొత్త రోగి",
  },
  kn: {
    appName: "ಮೆಡಿಕಿಯೋಸ್ಕ್",
    appSubtitle: "AI ರೋಗಿ ಸ್ವಯಂ-ಸೇವಾ ಕಿಯೋಸ್ಕ್",
    help: "ಸಹಾಯ",
    back: "ಹಿಂದೆ",
    audioPrompt: "ಸ್ಕ್ರೀನ್ ಸೂಚನೆಗಳನ್ನು ಆಲಿಸಿ",
    secureFooter: "ಸುರಕ್ಷಿತ • ಖಾಸಗಿ • ವಿಶ್ವಾಸಾರ್ಹ",
    close: "ಮುಚ್ಚಿ",
    hospitalHelpTitle: "ಸಹಾಯ ಬೇಕೇ?",
    hospitalHelpDesc: "ನಿಮಗೆ ನೆರವಾಗಲು ಆಸ್ಪತ್ರೆಯ ಸಿಬ್ಬಂದಿ ಲಭ್ಯವಿದ್ದಾರೆ.",
    callAttendant: "ಸಿಬ್ಬಂದಿಯನ್ನು ಕರೆಯಿರಿ",
    attendantNotification: "ಸಿಬ್ಬಂದಿಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.",

    langTitle: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    langSubtitle: "ಧ್ವನಿ ಮತ್ತು ಸ್ಕ್ರೀನ್‌ಗಾಗಿ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    langFooterNote: "ನಿಮ್ಮ ಆರೋಗ್ಯ, ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ. ನಿಮ್ಮ ಡೇಟಾ ಯಾವಾಗಲೂ ಸುರಕ್ಷಿತ.",
    continueBtn: "ಮುಂದುವರಿಯಿರಿ",

    welcomeTitle: "ಸ್ವಾಗತ!",
    welcomeSubtitle: "ನೀವು ಹೇಗೆ ಮುಂದುವರಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    loginCardTitle: "ಲಾಗಿನ್ ಮಾಡಿ",
    loginCardDesc: "ನಿಮ್ಮ ಖಾತೆಗೆ ಪ್ರವೇಶಿಸಿ",
    registerCardTitle: "ನೋಂದಣಿ ಮಾಡಿ",
    registerCardDesc: "ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    orDivider: "ಅಥವಾ",

    loginOptionsTitle: "ಲಾಗಿನ್",
    loginOptionsSubtitle: "ಲಾಗಿನ್ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ",
    abhaScanTitle: "ABHA ಸ್ಕ್ಯಾನರ್ ಮೂಲಕ ಲಾಗಿನ್",
    abhaScanDesc: "ನಿಮ್ಮ ABHA QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    phoneLoginTitle: "ಫೋನ್ ಸಂಖ್ಯೆಯ ಮೂಲಕ ಲಾಗಿನ್",
    phoneLoginDesc: "ನೋಂದಾಯಿತ ಮೊಬೈಲ್‌ಗೆ OTP ಪಡೆಯಿರಿ",

    registerOptionsTitle: "ನೋಂದಣಿ",
    registerOptionsSubtitle: "ನೋಂದಣಿ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ",
    regAbhaTitle: "ಹಾಲಿ ABHA ID ಯೊಂದಿಗೆ ನೋಂದಣಿ",
    regAbhaDesc: "ಖಾತೆ ರಚಿಸಲು ABHA ID ಬಳಸಿ",
    regPhoneTitle: "ಫೋನ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ನೋಂದಣಿ",
    regPhoneDesc: "ಖಾತೆ ರಚಿಸಲು ಮೊಬೈಲ್‌ಗೆ OTP ಪಡೆಯಿರಿ",

    enterPhoneTitle: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
    enterPhoneSubtitle: "ನಾವು ಈ ಸಂಖ್ಯೆಗೆ OTP ಕೋಡ್ ಕಳುಹಿಸುತ್ತೇವೆ",
    sendOtpBtn: "OTP ಕಳುಹಿಸಿ",
    invalidPhoneMsg: "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10 ಅಂಕಿಯ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",

    scanAbhaTitle: "ABHA QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    scanAbhaSubtitle: "ಕಾರ್ಡನ್ನು ಸ್ಕ್ಯಾನರ್ ಮುಂದೆ ಹಿಡಿಯಿರಿ",
    cameraScanning: "ಸ್ಕ್ಯಾನ್ ಆಗುತ್ತಿದೆ...",
    orEnterAbhaManual: "ಅಥವಾ ABHA ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
    simulateScanSuccess: "ಸ್ಕ್ಯಾನ್ ಡೆಮೊ",

    otpTitle: "OTP ಪರಿಶೀಲನೆ",
    otpSubtitle: "ಕಳುಹಿಸಲಾದ 6-ಅಂಕಿಯ OTP ನಮೂದಿಸಿ",
    verifyBtn: "ಪರಿಶೀಲಿಸಿ",
    resendIn: "ಮತ್ತೆ ಕಳುಹಿಸಲು ಸಮಯ:",
    resendAvailable: "OTP ಮತ್ತೆ ಕಳುಹಿಸಲು ಸಿದ್ಧವಾಗಿದೆ",
    didntReceiveOtp: "OTP ಬಂದಿಲ್ಲವೇ?",
    resendOtp: "OTP ಮತ್ತೆ ಕಳುಹಿಸಿ",
    dataSafeBadge: "ನಿಮ್ಮ ಮಾಹಿತಿ ಸುರಕ್ಷಿತವಾಗಿದೆ",
    otpInvalid: "ಸರಿಯಾದ OTP ನಮೂದಿಸಿ.",

    demographicsTitle: "ರೋಗಿಯ ಮಾಹಿತಿ",
    demographicsSubtitle: "ನೋಂದಣಿಗಾಗಿ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ",
    firstName: "ಮೊದಲ ಹೆಸರು",
    lastName: "ಕೊನೆಯ ಹೆಸರು",
    age: "ವಯಸ್ಸು (ವರ್ಷಗಳು)",
    gender: "ಲಿಂಗ",
    male: "ಪುರುಷ",
    female: "ಮಹಿಳೆ",
    other: "ಇತರ",
    emergencyPhone: "ತುರ್ತು ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
    submitDemographics: "ಉಳಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ",

    consentTitle: "ಸಮ್ಮತಿಯ ಆಯ್ಕೆಗಳು",
    consentSubtitle: "ಸೇವೆಗಾಗಿ ನಿಮ್ಮ ಸಮ್ಮತಿ ನೀಡಿ",
    consentDataTitle: "ವೈದ್ಯಕೀಯ ಮಾಹಿತಿ ಸಂಗ್ರಹ",
    consentDataDesc: "ಲಕ್ಷಣಗಳನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಅನುಮತಿಸಿ.",
    consentVoiceTitle: "ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ (ASR)",
    consentVoiceDesc: "ಮಾತನಾಡಿ ಉತ್ತರ ನೀಡಲು ಅನುಮತಿ.",
    consentOcrTitle: "ದಾಖಲೆಗಳ ಸ್ಕ್ಯಾನಿಂಗ್",
    consentOcrDesc: "ಹಳೆಯ ವರದಿಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಅನುಮತಿ.",
    consentAbdmTitle: "ABHA ಹಂಚಿಕೆ",
    consentAbdmDesc: "ಡಿಜಿಟಲ್ ದಾಖಲೆ ಹಂಚಿಕೊಳ್ಳಲು ಅನುಮತಿ.",
    consentAgreeBtn: "ನಾನು ಒಪ್ಪುತ್ತೇನೆ",
    consentAudioGuide: "ಸಮ್ಮತಿಯ ವಿವರ ಆಲಿಸಿ",

    ccTitle: "ನಿಮಗೆ ಇರುವ ಮುಖ್ಯ ಆರೋಗ್ಯ ತೊಂದರೆ ಏನು?",
    ccSubtitle: "ಮೈಕ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗಿನ ಆಯ್ಕೆಗಳನ್ನು ಒತ್ತಿ",
    ccVoiceInstruction: "ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ನಿಮ್ಮ ತೊಂದರೆ ತಿಳಿಸಿ",
    ccListening: "ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ",
    ccTapToSpeak: "ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ",
    ccCommonChipHeader: "ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳು:",
    ccChipFever: "ತೀವ್ರ ಜ್ವರ",
    ccChipChestPain: "ದೆದೆಯ ಉರಿ / ನೋವು",
    ccChipCough: "ಕೆಮ್ಮು",
    ccChipHeadache: "ತಲೆನೋವು",
    ccChipStomach: "ಹೊಟ್ಟೆ ನೋವು",
    ccChipBreathing: "ಉಸಿರಾಟದ ತೊಂದರೆ",
    ccChipJointPain: "ಸಂಧಿ ನೋವು",
    ccChipVomiting: "ವಾಂತಿ",
    ccChipRash: "ಚರ್ಮದ ತುರಿಕೆ",
    ccChipDizziness: "ತಲೆಸುತ್ತು / ಸುಸ್ತು",
    ccContinue: "ಮುಂದುವರಿಯಿರಿ",

    socratesTitle: "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ",
    socratesSubtitle: "ವೈದ್ಯರಿಗಾಗಿ ಕೆಲವು ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ",
    socratesSectionHPI: "ಪ್ರಸ್ತುತ ರೋಗದ ಇತಿಹಾಸ",
    socratesSectionPMH: "ಹಳೆಯ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ",
    socratesSectionAllergies: "ಅಲರ್ಜಿ ಮತ್ತು ಔಷಧಿಗಳು",
    socratesSectionFamily: "ಕುಟುಂಬದ ಇತಿಹಾಸ",
    socratesSectionPersonal: "ವೈಯಕ್ತಿಕ ಅಭ್ಯಾಸಗಳು",
    socratesSectionROS: "ದೇಹ ಪರಿಶೀಲನೆ",
    socratesVoiceOrTouch: "ಮಾತನಾಡಿ ಅಥವಾ ಬಟನ್ ಒತ್ತಿ ಉತ್ತರಿಸಿ",
    socratesNextQuestion: "ಮುಂದಿನ ಪ್ರಶ್ನೆ",
    socratesSubmitTurn: "ಉತ್ತರ ಉಳಿಸಿ",

    ayushTitle: "ಆಯುಷ್ ಮಾಹಿತಿ (ಐಚ್ಛಿಕ)",
    ayushSubtitle: "ಸಾಂಪ್ರದಾಯಿಕ ಆರೋಗ್ಯ ತಪಾಸಣೆ",
    ayushIntro: "ಆಯುಷ್ ಚಿಕಿತ್ಸೆಗಾಗಿ ಸಾಂಪ್ರದಾಯಿಕ ವಿವರ",
    ayushNadi: "ನಾಡಿ ಪರಿಶೀಲನೆ",
    ayushMala: "ಮಲ ವಿಸರ್ಜನೆ",
    ayushMutra: "ಮೂತ್ರ ವಿಸರ್ಜನೆ",
    ayushJihva: "ಾಲಿನ ಬಣ್ಣ",
    ayushPrakriti: "ದೇಹದ ಪ್ರಕೃತಿ",
    ayushSkip: "ಬಿಟ್ಟುಬಿಡಿ",
    ayushSave: "ಉಳಿಸಿ",

    docTitle: "ಹಳೆಯ ವರದಿಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    docSubtitle: "ದಾಖಲೆಗಳನ್ನು ಸ್ಕ್ಯಾನರ್ ಅಡಿಯಲ್ಲಿ ಇರಿಸಿ",
    docInstructions: "ದಾಖಲೆಯನ್ನು ನೇರವಾಗಿ ಇರಿಸಿ",
    docSimulateScan: "ಡೆಮೊ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    docScanning: "ಓದಲಾಗುತ್ತಿದೆ...",
    docExtractedHeader: "ಪತ್ತೆಯಾದ ವಿವರಗಳು",
    docNoDocsUploaded: "ದಾಖಲೆಗಳಿಲ್ಲ",
    docContinue: "ಮುಂದಿನ ಹಂತ",

    redFlagTitle: "ತುರ್ತು ಎಚ್ಚರಿಕೆ",
    redFlagSubtitle: "ತೀವ್ರ ಲಕ್ಷಣ ಪತ್ತೆಯಾಗಿದೆ",
    redFlagWarningText: "ನಿಮ್ಮ ಲಕ್ಷಣಗಳಿಗೆ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ನೆರವು ಬೇಕಾಗಿದೆ.",
    redFlagTriageNotice: "ದಯವಿಟ್ಟು ತಕ್ಷಣ ಕೊಠಡಿ ಸಂಖ್ಯೆ 102 ತುರ್ತು ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ.",
    redFlagNurseAlerted: "ನರ್ಸ್‌ಗೆ ಮಾಹಿತಿ ತಲುಪಿಸಲಾಗಿದೆ.",
    redFlagProceedBtn: "ತುರ್ತು ಕೊಠಡಿಗೆ ಹೋಗಿ",

    reviewTitle: "ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    reviewSubtitle: "ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ",
    reviewReadAloud: "ವಿವರ ಆಲಿಸಿ (ಧ್ವನಿ)",
    reviewPatientCard: "ರೋಗಿಯ ಪ್ರೊಫೈಲ್",
    reviewCCCard: "ಮುಖ್ಯ ತೊಂದರೆ",
    reviewHistoryCard: "ನಮೂದಿಸಿದ ಲಕ್ಷಣಗಳು",
    reviewDocsCard: "ದಾಖಲೆಗಳು",
    reviewConfirmBtn: "ಖಚಿತಪಡಿಸಿ ಟೋಕನ್ ಪಡೆಯಿರಿ",

    completeTitle: "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!",
    completeSubtitle: "ವಿವರಗಳನ್ನು ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
    completeTokenBadge: "OPD ಟೋಕನ್ ಸಂಖ್ಯೆ",
    completeDept: "ವಿಭಾಗ",
    completeDoctor: "ವೈದ್ಯರು",
    completeRoom: "ಕೊಠಡಿ ಸಂಖ್ಯೆ",
    completeWaitTime: "ಕಾಯುವ ಸಮಯ",
    completePrintSlip: "ರಶೀದಿ ಮುದ್ರಿಸಿ",
    completeNewPatient: "ಮುಕ್ತಾಯ / ಹೊಸ ರೋಗಿ",

    verifiedSuccess: "ಪರಿಶೀಲನೆ ಯಶಸ್ವಿಯಾಗಿದೆ!",
    tokenGenerated: "OPD ಟೋಕನ್ ನೀಡಲಾಗಿದೆ",
    department: "ವಿಭಾಗ",
    tokenNumber: "ಟೋಕನ್ ಸಂಖ್ಯೆ",
    queueEst: "ಕಾಯುವ ಸಮಯ: ~10 ನಿಮಿಷಗಳು",
    printReceipt: "OPD ರಶೀದಿ ಮುದ್ರಿಸಿ",
    finishDone: "ಮುಕ್ತಾಯ / ಹೊಸ ರೋಗಿ",
  }
};
