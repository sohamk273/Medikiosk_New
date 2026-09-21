import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export interface LanguageItem {
  code: 'en' | 'hi' | 'mr';
  name: string;
  nativeName: string;
  subtext: string;
  badge: string;
}

interface LanguageCardProps {
  language: LanguageItem;
  isSelected: boolean;
  onSelect: (code: 'en' | 'hi' | 'mr') => void;
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
      onClick={() => onSelect(language.code)}
      className={`flex flex-col justify-between p-6 md:p-8 min-h-[220px] md:min-h-[240px] text-left transition-all ${
        isSelected
          ? 'border-mediblue-600 bg-white ring-4 ring-mediblue-500/20'
          : 'hover:border-mediblue-300'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            isSelected
              ? 'bg-mediblue-600 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {language.badge}
        </span>
        {isSelected ? (
          <CheckCircle2 className="w-6 h-6 text-mediblue-600 fill-mediblue-100" />
        ) : (
          <span className="text-xs font-mono font-bold text-slate-400">
            {language.code.toUpperCase()}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-3xl md:text-4xl font-extrabold text-navy-900 font-devanagari mb-1">
          {language.nativeName}
        </h3>
        <p className="text-sm font-bold text-slate-500 mb-2">{language.name}</p>
        <p className="text-xs text-slate-500 font-medium font-devanagari leading-relaxed">
          {language.subtext}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm font-bold text-mediblue-600 mt-4 pt-3 border-t border-slate-100">
        <span>Select / चुनें</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </GlassCard>
  );
};
