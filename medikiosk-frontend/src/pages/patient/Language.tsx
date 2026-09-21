import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import type { Language as LangType } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { LanguageCard, type LanguageItem } from '@/components/kiosk/LanguageCard';

const LANGUAGES: LanguageItem[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    subtext: 'Speak and read in English throughout your consultation.',
    badge: 'Standard',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    subtext: 'अपनी भाषा में बोलें और सरलता से जानकारी दर्ज करें।',
    badge: 'लोकप्रिय / Popular',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    subtext: 'आपल्या भाषेत बोला आणि संपूर्ण माहिती सहज भरा.',
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
    <div className="w-full max-w-4xl mx-auto py-6 flex flex-col items-center">
      {/* Title Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-1 font-devanagari">
          {t('language.title')}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          {t('language.subtitle')}
        </p>
      </div>

      {/* 3-Card Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        {LANGUAGES.map((lang) => (
          <LanguageCard
            key={lang.code}
            language={lang}
            isSelected={language === lang.code}
            onSelect={handleSelectLanguage}
          />
        ))}
      </div>
    </div>
  );
}