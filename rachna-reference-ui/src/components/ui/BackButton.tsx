import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useKiosk } from '../../context/KioskContext';
import { TRANSLATIONS } from '../../utils/translations';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to, onClick, className }) => {
  const navigate = useNavigate();
  const { language, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleClick = () => {
    playClickSound();
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t.back}
      className={`group flex items-center gap-3 px-6 py-3.5 rounded-2xl min-h-[58px] bg-white/80 hover:bg-white text-navy-900 border border-white/80 shadow-sm active:scale-95 transition-all duration-200 ${className || ''}`}
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-mediblue-50 flex items-center justify-center text-slate-700 group-hover:text-mediblue-600 transition-colors">
        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-800">
        {t.back}
      </span>
    </button>
  );
};
