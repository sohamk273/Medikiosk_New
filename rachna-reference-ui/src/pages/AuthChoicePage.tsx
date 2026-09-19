import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { ActionCard } from '../components/kiosk/ActionCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const AuthChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setAuthMode, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleChooseLogin = () => {
    playClickSound();
    setAuthMode('login');
    navigate('/login');
  };

  const handleChooseRegister = () => {
    playClickSound();
    setAuthMode('register');
    navigate('/register');
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/language"
      audioText={`${t.welcomeTitle}. ${t.welcomeSubtitle}. ${t.loginCardTitle} or ${t.registerCardTitle}.`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header Titles */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-3">
            {t.welcomeTitle}
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-slate-500 tracking-normal">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Two Giant Cards Side-by-Side with OR Divider (Matching Mockup Screen 2) */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 relative px-4">
          {/* LEFT: Login Card */}
          <ActionCard
            icon={LogIn}
            title={t.loginCardTitle}
            description={t.loginCardDesc}
            variant="blue"
            onClick={handleChooseLogin}
          />

          {/* Subtle "OR" Divider */}
          <div className="flex md:flex-col items-center justify-center z-10">
            <div className="w-14 h-14 rounded-full bg-white/95 border-2 border-slate-200/80 shadow-soft-neumorphic flex items-center justify-center font-extrabold text-sm text-slate-500 tracking-wider">
              {t.orDivider}
            </div>
          </div>

          {/* RIGHT: Register Card */}
          <ActionCard
            icon={UserPlus}
            title={t.registerCardTitle}
            description={t.registerCardDesc}
            variant="green"
            onClick={handleChooseRegister}
          />
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
