import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Plus } from 'lucide-react';
import { HelpButton } from '../ui/HelpButton';
import { BackButton } from '../ui/BackButton';
import { useKiosk } from '../../context/KioskContext';
import { TRANSLATIONS } from '../../utils/translations';

interface HeaderProps {
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ showBack = false, backTo, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, resetKiosk, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const isRootLanguageScreen = location.pathname === '/' || location.pathname === '/language';

  const handleLogoClick = () => {
    playClickSound();
    resetKiosk();
    navigate('/language');
  };

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 md:px-12 z-20 select-none">
      {/* Left side: Back Button (if applicable) + Logo & Subtitle */}
      <div className="flex items-center gap-4 md:gap-6">
        {showBack && !isRootLanguageScreen && (
          <BackButton to={backTo} onClick={onBack} />
        )}

        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3.5 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="MediKiosk Home"
        >
          {/* Medical Plus Cross Badge */}
          <div className="relative w-13 h-13 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-mediblue-500 to-mediblue-700 shadow-md shadow-mediblue-500/20 flex items-center justify-center text-white border border-white/60 group-hover:scale-105 transition-transform">
            <div className="relative flex items-center justify-center">
              <Plus className="w-8 h-8 md:w-9 md:h-9 stroke-[3]" />
              <Activity className="w-4 h-4 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-navy-900">
                Medi<span className="text-mediblue-600">Kiosk</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                ABDM Enabled
              </span>
            </div>
            <p className="text-xs md:text-sm font-semibold text-slate-500 tracking-normal">
              {t.appSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Help Button */}
      <div className="flex items-center gap-3">
        <HelpButton />
      </div>
    </header>
  );
};
