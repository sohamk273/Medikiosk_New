import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  LanguageCode, 
  LanguageInfo, 
  AuthMode, 
  AuthMethod, 
  PatientProfile,
  ConsentState,
  HistoryEntry,
  AyushEntry,
  DocumentItem,
  RedFlagAlert,
  OPDToken
} from '../types/kiosk';

export const LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    character: 'A',
    subtext: 'English',
    greeting: 'Please choose an option to proceed with your OPD check-in.',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    character: 'अ',
    subtext: 'Hindi',
    greeting: 'कृपया अपनी ओपीडी सेवा जारी रखने के लिए एक विकल्प चुनें।',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    character: 'म',
    subtext: 'Marathi',
    greeting: 'कृपया आपली ओपीडी सेवा सुरू ठेवण्यासाठी एक पर्याय निवडा.',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    character: 'அ',
    subtext: 'Tamil',
    greeting: 'உங்கள் மருத்துவமனை சேவையைத் தொடர ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்.',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    character: 'అ',
    subtext: 'Telugu',
    greeting: 'దయచేసి మీ OPD సేవలను కొనసాగించడానికి ఒక ఎంపికను ఎంచుకోండి.',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    character: 'ಅ',
    subtext: 'Kannada',
    greeting: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಒಪಿಡಿ ಸೇವೆಯನ್ನು ಮುಂದುವರಿಸಲು ಆಯ್ಕೆಮಾಡಿ.',
  },
];

interface KioskContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languageInfo: LanguageInfo;
  authMode: AuthMode | null;
  setAuthMode: (mode: AuthMode | null) => void;
  authMethod: AuthMethod | null;
  setAuthMethod: (method: AuthMethod | null) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  abhaNumber: string;
  setAbhaNumber: (abha: string) => void;
  verifiedPatient: PatientProfile | null;
  setVerifiedPatient: (patient: PatientProfile | null) => void;
  consents: ConsentState;
  setConsents: React.Dispatch<React.SetStateAction<ConsentState>>;
  chiefComplaint: string;
  setChiefComplaint: (cc: string) => void;
  historyEntries: HistoryEntry[];
  addHistoryEntry: (entry: HistoryEntry) => void;
  ayushEntries: AyushEntry[];
  setAyushEntries: React.Dispatch<React.SetStateAction<AyushEntry[]>>;
  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;
  removeDocument: (docId: string) => void;
  redFlag: RedFlagAlert | null;
  triggerRedFlag: (alert: RedFlagAlert) => void;
  clearRedFlag: () => void;
  opdToken: OPDToken | null;
  setOpdToken: (token: OPDToken | null) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  isPlayingAudio: boolean;
  playClickSound: () => void;
  playSuccessSound: () => void;
  speakText: (text: string, overrideLang?: LanguageCode) => void;
  playStepVoice: (stepText: string) => void;
  stopAudio: () => void;
  resetKiosk: () => void;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

class AudioFeedbackEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTap() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 clinical chime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.36);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

const audioFeedback = new AudioFeedbackEngine();

export const KioskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [abhaNumber, setAbhaNumber] = useState<string>('');
  const [verifiedPatient, setVerifiedPatient] = useState<PatientProfile | null>(null);
  const [consents, setConsents] = useState<ConsentState>({
    dataCollection: true,
    voiceRecording: true,
    documentOcr: true,
    abdmShare: true
  });
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [ayushEntries, setAyushEntries] = useState<AyushEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [redFlag, setRedFlag] = useState<RedFlagAlert | null>(null);
  const [opdToken, setOpdToken] = useState<OPDToken | null>(null);
  
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const languageInfo = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const playClickSound = useCallback(() => {
    audioFeedback.playTap();
  }, []);

  const playSuccessSound = useCallback(() => {
    audioFeedback.playSuccess();
  }, []);

  const stopAudio = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, []);

  const speakText = useCallback(
    (text: string, overrideLang?: LanguageCode) => {
      if (!('speechSynthesis' in window) || !text) return;
      window.speechSynthesis.cancel();

      const activeLang = overrideLang || language;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Calm, clear speech for elderly/patients
      utterance.pitch = 1.0;

      const langMap: Record<LanguageCode, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
      };

      const targetLangStr = langMap[activeLang] || 'en-IN';
      utterance.lang = targetLangStr;

      // Select voice based on current language
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(v => 
          v.lang.toLowerCase().replace('_', '-').includes(targetLangStr.toLowerCase()) ||
          v.lang.toLowerCase().startsWith(activeLang)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playStepVoice = useCallback((stepText: string) => {
    playClickSound();
    speakText(stepText);
  }, [playClickSound, speakText]);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistoryEntries(prev => {
      const idx = prev.findIndex(item => item.fieldKey === entry.fieldKey);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [...prev, entry];
    });
  }, []);

  const addDocument = useCallback((doc: DocumentItem) => {
    setDocuments(prev => [...prev, doc]);
  }, []);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  }, []);

  const triggerRedFlag = useCallback((alert: RedFlagAlert) => {
    setRedFlag(alert);
  }, []);

  const clearRedFlag = useCallback(() => {
    setRedFlag(null);
  }, []);

  const resetKiosk = useCallback(() => {
    stopAudio();
    setAuthMode(null);
    setAuthMethod(null);
    setPhoneNumber('');
    setAbhaNumber('');
    setVerifiedPatient(null);
    setConsents({
      dataCollection: true,
      voiceRecording: true,
      documentOcr: true,
      abdmShare: true
    });
    setChiefComplaint('');
    setHistoryEntries([]);
    setAyushEntries([]);
    setDocuments([]);
    setRedFlag(null);
    setOpdToken(null);
    setIsHelpOpen(false);
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <KioskContext.Provider
      value={{
        language,
        setLanguage,
        languageInfo,
        authMode,
        setAuthMode,
        authMethod,
        setAuthMethod,
        phoneNumber,
        setPhoneNumber,
        abhaNumber,
        setAbhaNumber,
        verifiedPatient,
        setVerifiedPatient,
        consents,
        setConsents,
        chiefComplaint,
        setChiefComplaint,
        historyEntries,
        addHistoryEntry,
        ayushEntries,
        setAyushEntries,
        documents,
        addDocument,
        removeDocument,
        redFlag,
        triggerRedFlag,
        clearRedFlag,
        opdToken,
        setOpdToken,
        isHelpOpen,
        setIsHelpOpen,
        isPlayingAudio,
        playClickSound,
        playSuccessSound,
        speakText,
        playStepVoice,
        stopAudio,
        resetKiosk,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = (): KioskContextType => {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
};
