import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Smartphone } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { ActionCard } from '../components/kiosk/ActionCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const LoginOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setAuthMethod, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleChooseAbha = () => {
    playClickSound();
    setAuthMethod('abha');
    navigate('/login/abha');
  };

  const handleChoosePhone = () => {
    playClickSound();
    setAuthMethod('phone');
    navigate('/login/phone');
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/auth"
      audioText={`${t.loginOptionsTitle}. ${t.loginOptionsSubtitle}. ${t.abhaScanTitle} or ${t.phoneLoginTitle}.`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header Titles */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-3">
            {t.loginOptionsTitle}
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-slate-500 tracking-normal">
            {t.loginOptionsSubtitle}
          </p>
        </div>

        {/* Two Giant Cards: ABHA Scanner vs Phone Number (Matching Mockup Screen 3) */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 relative px-4">
          {/* LEFT: ABHA Scanner */}
          <ActionCard
            icon={QrCode}
            title={t.abhaScanTitle}
            description={t.abhaScanDesc}
            variant="blue"
            onClick={handleChooseAbha}
            badgeText="Instant"
          />

          {/* Subtle OR Divider */}
          <div className="flex md:flex-col items-center justify-center z-10">
            <div className="w-14 h-14 rounded-full bg-white/95 border-2 border-slate-200/80 shadow-soft-neumorphic flex items-center justify-center font-extrabold text-sm text-slate-500 tracking-wider">
              {t.orDivider}
            </div>
          </div>

          {/* RIGHT: Phone Number */}
          <ActionCard
            icon={Smartphone}
            title={t.phoneLoginTitle}
            description={t.phoneLoginDesc}
            variant="blue"
            onClick={handleChoosePhone}
            badgeText="Via OTP"
          />
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
