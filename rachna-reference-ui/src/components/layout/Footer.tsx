import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { AudioButton } from '../ui/AudioButton';
import { useKiosk } from '../../context/KioskContext';
import { TRANSLATIONS } from '../../utils/translations';

interface FooterProps {
  customInstructionText?: string;
  customBottomMessage?: string;
}

export const Footer: React.FC<FooterProps> = ({
  customInstructionText,
  customBottomMessage,
}) => {
  const { language } = useKiosk();
  const t = TRANSLATIONS[language];

  return (
    <footer className="w-full flex items-center justify-between py-4 px-6 md:px-12 z-20 select-none">
      {/* Bottom-left: Audio / Speaker button */}
      <div className="flex items-center gap-3">
        <AudioButton instructionText={customInstructionText} />
      </div>

      {/* Center: Optional bottom message if provided (e.g. Screen 1 "Your health in your language") */}
      {customBottomMessage ? (
        <div className="hidden sm:flex items-center gap-2 text-sm md:text-base font-semibold text-slate-600 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/80 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-mediblue-600 shrink-0" />
          <span>{customBottomMessage}</span>
        </div>
      ) : null}

      {/* Bottom-right: Secure • Private • Trusted */}
      <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/80 shadow-sm">
        <Lock className="w-4 h-4 text-mediblue-600" />
        <span className="tracking-wide">{t.secureFooter}</span>
      </div>
    </footer>
  );
};
