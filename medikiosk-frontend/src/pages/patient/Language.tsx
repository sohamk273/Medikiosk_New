import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import type { Language as LangType } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface LanguageOption {
  code: LangType;
  name: string;
  nativeName: string;
  subtext: string;
  badge: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    subtext: 'Speak and read in English throughout your visit',
    badge: 'Standard',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    subtext: 'अपनी भाषा में स्वास्थ्य जानकारी दर्ज करें',
    badge: 'लोकप्रिय / Popular',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    subtext: 'तुमच्या भाषेत आरोग्य माहिती प्रविष्ट करा',
    badge: 'प्रादेशिक / Regional',
  },
];

export default function Language() {
  const navigate = useNavigate();
  const { language, setLanguage } = usePatientSession();
  const { t } = useTranslation();

  const handleSelectLanguage = (code: LangType) => {
    setLanguage(code);
    navigate('/patient/identify');
  };

  useKioskScreen({
    onContinue: () => navigate('/patient/identify'),
    onBack: () => navigate('/patient'),
    audioPrompt: t('language.audioGuidance') || 'Please choose your preferred language for this registration.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto pt-8 px-6 pb-24 flex flex-col items-center">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-black text-primary tracking-tight mb-2 font-devanagari">
          {t('language.title')}
        </h2>
        <p className="text-lg text-slate-600 font-medium">
          {t('language.subtitle')}
        </p>
      </div>

      <div className="w-full max-w-3xl mb-8">
        <AudioGuidanceBanner 
          englishText="Audio prompt: Please select your preferred language."
          regionalText="कृपया आपली भाषा निवडा / कृपया अपनी भाषा चुनें।"
        />
      </div>

      {/* Language Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              className={`relative flex flex-col justify-between p-8 rounded-3xl border-2 transition-all duration-200 text-left min-h-[260px] shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-[#064E3B] bg-emerald-50/50 shadow-emerald-950/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isSelected ? 'bg-[#064E3B] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {lang.badge}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-6 h-6 text-[#064E3B]" />
                )}
              </div>

              <div>
                <h3 className="text-3xl font-bold text-primary font-devanagari mb-1">
                  {lang.nativeName}
                </h3>
                <p className="text-sm font-bold text-slate-500 mb-3">{lang.name}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed font-devanagari">
                  {lang.subtext}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-[#064E3B] mt-4 pt-4 border-t border-slate-100">
                <span>{t('language.selectAndContinue')}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
