import React from 'react';
import { Globe, Check } from 'lucide-react';
import { LanguageInfo } from '../../types/kiosk';
import { GlassCard } from '../ui/GlassCard';

interface LanguageCardProps {
  language: LanguageInfo;
  isSelected: boolean;
  onSelect: (lang: LanguageInfo) => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  isSelected,
  onSelect,
}) => {
  return (
    <GlassCard
      interactive
      selected={isSelected}
      onClick={() => onSelect(language)}
      className={`group flex flex-col items-center justify-center p-6 md:p-8 min-h-[140px] md:min-h-[170px] w-full text-center relative overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'bg-white/95 ring-4 ring-mediblue-500/30 border-mediblue-600 shadow-card-selected'
          : 'hover:bg-white/90'
      }`}
    >
      {/* Selected Indicator Badge */}
      {isSelected && (
        <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-mediblue-600 text-white flex items-center justify-center shadow-sm">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      )}

      {/* Prominent Script Character / Icon */}
      <div className="mb-2">
        {language.code === 'en' ? (
          <div className="w-14 h-14 rounded-2xl bg-mediblue-50 text-mediblue-600 flex items-center justify-center border border-mediblue-100 group-hover:scale-105 transition-transform">
            <Globe className="w-8 h-8 stroke-[1.8]" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-blue-50/80 text-mediblue-900 flex items-center justify-center border border-blue-100/80 font-bold text-3xl group-hover:scale-105 transition-transform">
            <span>{language.character}</span>
          </div>
        )}
      </div>

      {/* Language Native Name */}
      <h3 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight">
        {language.nativeName}
      </h3>

      {/* Subtext / English Translation */}
      <p className="text-sm md:text-base font-semibold text-slate-500 mt-1">
        {language.subtext}
      </p>
    </GlassCard>
  );
};
