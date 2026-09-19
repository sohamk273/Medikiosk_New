import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { LanguageCard } from '../components/kiosk/LanguageCard';
import { useKiosk, LANGUAGES } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { LanguageInfo } from '../types/kiosk';

export const LanguageSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleSelectLanguage = (lang: LanguageInfo) => {
    playClickSound();
    setLanguage(lang.code);
    speakText(lang.greeting);
    // Smooth transition to welcome/auth screen
    setTimeout(() => {
      navigate('/auth');
    }, 280);
  };

  const handleManualContinue = () => {
    playClickSound();
    navigate('/auth');
  };

  return (
    <KioskLayout
      showBack={false}
      audioText={`${t.langTitle}. ${t.langSubtitle}`}
      bottomMessage={t.langFooterNote}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header Titles */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-3">
            {t.langTitle}
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-slate-500 tracking-normal">
            {t.langSubtitle}
          </p>
        </div>

        {/* 6 Language Cards in 3x2 Grid (matching design mockup) */}
        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 px-2">
          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              language={lang}
              isSelected={language === lang.code}
              onSelect={handleSelectLanguage}
            />
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-8 md:mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleManualContinue}
            className="flex items-center gap-3 px-10 py-4 md:py-5 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-xl md:text-2xl shadow-lg shadow-mediblue-600/25 active:scale-98 transition-all min-h-[64px]"
          >
            <span>{t.continueBtn}</span>
            <ArrowRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
