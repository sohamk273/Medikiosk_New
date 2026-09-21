import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, type Language } from '@/i18n';
import { ttsService } from '@/services/voice/ttsService';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

export interface LocalizedText {
  en: string;
  hi: string;
  mr: string;
}

export interface GuidedStepInfo {
  stepNumber: number;
  route: string;
  targetId: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  instruction: LocalizedText;
  audioPrompt: LocalizedText;
}

const STEP_CONFIGS: Record<string, GuidedStepInfo> = {
  '/patient/identify': {
    stepNumber: 1,
    route: '/patient/identify',
    targetId: 'sahayak-target-new-reg',
    placement: 'bottom',
    instruction: {
      en: 'Tap here to begin a new patient registration.',
      hi: 'नए मरीज का पंजीकरण शुरू करने के लिए यहाँ टैप करें।',
      mr: 'नवीन रुग्ण नोंदणी सुरू करण्यासाठी येथे टॅप करा.',
    },
    audioPrompt: {
      en: 'Please tap New Registration to begin your patient intake.',
      hi: 'कृपया अपना पंजीकरण शुरू करने के लिए न्यू रजिस्ट्रेशन पर टैप करें।',
      mr: 'कृपया आपली नोंदणी सुरू करण्यासाठी न्यू रजिस्ट्रेशन वर टॅप करा.',
    },
  },
  '/patient/register': {
    stepNumber: 2,
    route: '/patient/register',
    targetId: 'sahayak-target-mobile',
    placement: 'right',
    instruction: {
      en: 'Enter your 10-digit mobile number, full name, age and gender.',
      hi: 'अपना 10 अंकों का मोबाइल नंबर, पूरा नाम, उम्र और लिंग दर्ज करें।',
      mr: 'आपला 10 अंकी मोबाइल क्रमांक, पूर्ण नाव, वय आणि लिंग प्रविष्ट करा.',
    },
    audioPrompt: {
      en: 'Please enter your mobile number and demographic details, then tap Continue.',
      hi: 'कृपया अपना मोबाइल नंबर और विवरण दर्ज करें, फिर आगे बढ़ें पर टैप करें।',
      mr: 'कृपया आपला मोबाइल क्रमांक आणि तपशील प्रविष्ट करा, नंतर पुढे जा वर टॅप करा.',
    },
  },
  '/patient/consent': {
    stepNumber: 3,
    route: '/patient/consent',
    targetId: 'sahayak-target-consent-cards',
    placement: 'top',
    instruction: {
      en: 'Tap the consent cards to confirm, then tap Continue.',
      hi: 'सहमति कार्ड पर टैप करके पुष्टि करें, फिर आगे बढ़ें पर टैप करें।',
      mr: 'संमती कार्डवर टॅप करून पुष्टी करा, नंतर पुढे जा वर टॅप करा.',
    },
    audioPrompt: {
      en: 'Please tap the consent boxes to authorize your consultation, then tap Continue.',
      hi: 'कृपया परामर्श के लिए सहमति दें, फिर आगे बढ़ें पर टैप करें।',
      mr: 'कृपया सल्लामसलतसाठी संमती द्या, नंतर पुढे जा वर टॅप करा.',
    },
  },
  '/patient/profile': {
    stepNumber: 4,
    route: '/patient/profile',
    targetId: 'sahayak-target-continue',
    placement: 'top',
    instruction: {
      en: 'Check that your details are correct on the screen, then tap Continue.',
      hi: 'जांचें कि आपके विवरण सही हैं, फिर आगे बढ़ें (Continue) पर टैप करें।',
      mr: 'स्क्रीनवर आपले तपशील बरोबर असल्याची खात्री करा, नंतर पुढे जा वर टॅप करा.',
    },
    audioPrompt: {
      en: 'Please verify your registered information and tap Continue.',
      hi: 'कृपया अपनी पंजीकृत जानकारी सत्यापित करें और आगे बढ़ें पर टैप करें।',
      mr: 'कृपया आपली नोंदणीकृत माहिती तपासा आणि पुढे जा वर टॅप करा.',
    },
  },
  '/patient/chief-complaint': {
    stepNumber: 5,
    route: '/patient/chief-complaint',
    targetId: 'sahayak-target-symptoms',
    placement: 'top',
    instruction: {
      en: 'Select what is troubling you today, or tap the microphone to speak.',
      hi: 'अपनी मुख्य स्वास्थ्य समस्या चुनें, या बोलने के लिए माइक पर टैप करें।',
      mr: 'आपली मुख्य आरोग्य समस्या निवडा, किंवा बोलण्यासाठी माइकवर टॅप करा.',
    },
    audioPrompt: {
      en: 'Please select your symptoms from the screen or speak clearly into the microphone.',
      hi: 'कृपया अपने लक्षणों का चयन करें या माइक्रोफोन में स्पष्ट रूप से बोलें।',
      mr: 'कृपया आपल्या लक्षणांची निवड करा किंवा मायक्रोफोनमध्ये स्पष्ट बोला.',
    },
  },
  '/patient/review': {
    stepNumber: 6,
    route: '/patient/review',
    targetId: 'sahayak-target-continue',
    placement: 'top',
    instruction: {
      en: 'Review your complete intake summary, then tap Schedule Appointment.',
      hi: 'अपने पूर्ण सारांश की समीक्षा करें, फिर अपॉइंटमेंट शेड्यूल करें पर टैप करें।',
      mr: 'आपल्या पूर्ण सारांशाचे पुनरावलोकन करा, नंतर अपॉइंटमेंट शेड्यूल करा वर टॅप करा.',
    },
    audioPrompt: {
      en: 'Please review your medical intake summary and tap Schedule Appointment.',
      hi: 'कृपया अपने सारांश की समीक्षा करें और अपॉइंटमेंट शेड्यूल करें पर टैप करें।',
      mr: 'कृपया आपल्या वैद्यकीय सारांशाची खात्री करा आणि अपॉइंटमेंट शेड्यूल करा वर टॅप करा.',
    },
  },
  '/patient/appointment': {
    stepNumber: 7,
    route: '/patient/appointment',
    targetId: 'sahayak-target-slots',
    placement: 'top',
    instruction: {
      en: 'Select your preferred consultation time slot, then tap Continue.',
      hi: 'परामर्श के लिए अपना पसंदीदा समय स्लॉट चुनें, फिर आगे बढ़ें पर टैप करें।',
      mr: 'सल्लामसलतीसाठी सोयीची वेळ निवडा, नंतर पुढे जा वर टॅप करा.',
    },
    audioPrompt: {
      en: 'Please choose an available appointment time slot and tap Continue.',
      hi: 'कृपया उपलब्ध समय स्लॉट चुनें और आगे बढ़ें पर टैप करें।',
      mr: 'कृपया उपलब्ध वेळ स्लॉट निवडा आणि पुढे जा वर टॅप करा.',
    },
  },
  '/patient/complete': {
    stepNumber: 8,
    route: '/patient/complete',
    targetId: 'sahayak-target-token-card',
    placement: 'top',
    instruction: {
      en: 'Registration complete! Please take your printed token slip.',
      hi: 'पंजीकरण पूरा हो गया! कृपया अपना मुद्रित टोकन पर्चा लें।',
      mr: 'नोंदणी पूर्ण झाली! कृपया आपली छापील टोकन पावती घ्या.',
    },
    audioPrompt: {
      en: 'Your registration is complete. Please collect your token slip.',
      hi: 'आपका पंजीकरण पूरा हो गया है। कृपया अपना टोकन पर्चा प्राप्त करें।',
      mr: 'आपली नोंदणी पूर्ण झाली आहे. कृपया आपली टोकन पावती घ्या.',
    },
  },
};

interface SahayakAssistContextType {
  guidedAssistMode: boolean;
  guidedStep: number;
  totalSteps: number;
  guidedTargetId: string | null;
  guidedPlacement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  currentInstruction: string;
  currentAudioPrompt: string;
  isModalOpen: boolean;
  isExitModalOpen: boolean;
  isCallModalOpen: boolean;
  isSahayakCalled: boolean;
  hasSavedProgress: boolean;
  pulseCounter: number;
  
  // Actions
  openSahayakModal: () => void;
  closeSahayakModal: () => void;
  startGuidedAssist: (fromBeginning?: boolean) => void;
  exitGuidedAssist: () => void;
  confirmExitGuidedAssist: () => void;
  cancelExitGuidedAssist: () => void;
  callSahayak: () => void;
  cancelCallSahayak: () => void;
  repeatInstruction: () => void;
  setCustomTarget: (targetId: string, instruction?: LocalizedText, audioPrompt?: LocalizedText, placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto') => void;
}

const SahayakAssistContext = createContext<SahayakAssistContextType | undefined>(undefined);

export function SahayakAssistProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { audioEnabled } = usePatientSession();

  const [guidedAssistMode, setGuidedAssistMode] = useState<boolean>(() => {
    return sessionStorage.getItem('medikiosk_sahayak_mode') === 'true';
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isSahayakCalled, setIsSahayakCalled] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [pulseCounter, setPulseCounter] = useState(0);

  // Dynamic step parameters
  const [customTargetId, setCustomTargetId] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState<LocalizedText | null>(null);
  const [customAudioPrompt, setCustomAudioPrompt] = useState<LocalizedText | null>(null);
  const [customPlacement, setCustomPlacement] = useState<'top' | 'bottom' | 'left' | 'right' | 'auto'>('auto');

  const currentPath = location.pathname.replace(/\/$/, '');
  const stepConfig = STEP_CONFIGS[currentPath] || null;

  const guidedStep = stepConfig ? stepConfig.stepNumber : 1;
  const totalSteps = 8;
  const guidedTargetId = customTargetId || (stepConfig ? stepConfig.targetId : null);
  const guidedPlacement = customPlacement !== 'auto' ? customPlacement : (stepConfig?.placement || 'top');

  const activeLang: Language = (language === 'hi' || language === 'mr') ? language : 'en';

  const instructionText = customInstruction 
    ? customInstruction[activeLang] || customInstruction.en 
    : stepConfig 
      ? stepConfig.instruction[activeLang] || stepConfig.instruction.en 
      : 'Please follow the on-screen assistance.';

  const audioPromptText = customAudioPrompt 
    ? customAudioPrompt[activeLang] || customAudioPrompt.en 
    : stepConfig 
      ? stepConfig.audioPrompt[activeLang] || stepConfig.audioPrompt.en 
      : instructionText;

  // Persist mode to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('medikiosk_sahayak_mode', guidedAssistMode ? 'true' : 'false');
    if (guidedAssistMode) {
      setHasSavedProgress(true);
    }
  }, [guidedAssistMode]);

  // Reset custom target override on route change
  useEffect(() => {
    setCustomTargetId(null);
    setCustomInstruction(null);
    setCustomAudioPrompt(null);
    setCustomPlacement('auto');
    setPulseCounter(c => c + 1);
  }, [location.pathname]);

  // Trigger audio prompt when step changes and audio is enabled
  useEffect(() => {
    if (guidedAssistMode && audioEnabled && audioPromptText) {
      const timer = setTimeout(() => {
        ttsService.speak(audioPromptText, activeLang).catch(() => {});
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [guidedAssistMode, audioEnabled, location.pathname, activeLang, audioPromptText, pulseCounter]);

  const openSahayakModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeSahayakModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const startGuidedAssist = useCallback((fromBeginning: boolean = false) => {
    setGuidedAssistMode(true);
    setIsModalOpen(false);
    setIsExitModalOpen(false);

    if (fromBeginning && location.pathname !== '/patient/identify') {
      navigate('/patient/identify');
    }
    setPulseCounter(c => c + 1);
  }, [location.pathname, navigate]);

  const exitGuidedAssist = useCallback(() => {
    setIsExitModalOpen(true);
  }, []);

  const confirmExitGuidedAssist = useCallback(() => {
    setGuidedAssistMode(false);
    setIsExitModalOpen(false);
    ttsService.stop();
  }, []);

  const cancelExitGuidedAssist = useCallback(() => {
    setIsExitModalOpen(false);
  }, []);

  const callSahayak = useCallback(() => {
    setIsSahayakCalled(true);
    setIsModalOpen(false);
    setIsCallModalOpen(true);
  }, []);

  const cancelCallSahayak = useCallback(() => {
    setIsSahayakCalled(false);
    setIsCallModalOpen(false);
  }, []);

  const repeatInstruction = useCallback(() => {
    setPulseCounter(c => c + 1);
    if (audioPromptText) {
      ttsService.speak(audioPromptText, activeLang).catch(() => {});
    }
  }, [audioPromptText, activeLang]);

  const setCustomTarget = useCallback((
    targetId: string, 
    instruction?: LocalizedText, 
    audioPrompt?: LocalizedText, 
    placement: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'auto'
  ) => {
    setCustomTargetId(targetId);
    if (instruction) setCustomInstruction(instruction);
    if (audioPrompt) setCustomAudioPrompt(audioPrompt);
    setCustomPlacement(placement);
    setPulseCounter(c => c + 1);
  }, []);

  return (
    <SahayakAssistContext.Provider
      value={{
        guidedAssistMode,
        guidedStep,
        totalSteps,
        guidedTargetId,
        guidedPlacement,
        currentInstruction: instructionText,
        currentAudioPrompt: audioPromptText,
        isModalOpen,
        isExitModalOpen,
        isCallModalOpen,
        isSahayakCalled,
        hasSavedProgress,
        pulseCounter,
        openSahayakModal,
        closeSahayakModal,
        startGuidedAssist,
        exitGuidedAssist,
        confirmExitGuidedAssist,
        cancelExitGuidedAssist,
        callSahayak,
        cancelCallSahayak,
        repeatInstruction,
        setCustomTarget,
      }}
    >
      {children}
    </SahayakAssistContext.Provider>
  );
}

export function useSahayakAssist() {
  const context = useContext(SahayakAssistContext);
  if (!context) {
    throw new Error('useSahayakAssist must be used within a SahayakAssistProvider');
  }
  return context;
}
