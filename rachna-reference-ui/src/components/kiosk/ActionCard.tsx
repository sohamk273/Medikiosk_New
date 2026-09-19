import React from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'blue' | 'green';
  onClick: () => void;
  badgeText?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'blue',
  onClick,
  badgeText,
}) => {
  const isGreen = variant === 'green';

  const iconBg = isGreen
    ? 'bg-medigreen-50 text-medigreen-600 border-medigreen-200 group-hover:bg-medigreen-100'
    : 'bg-mediblue-50 text-mediblue-600 border-mediblue-200 group-hover:bg-mediblue-100';

  const hoverBorder = isGreen
    ? 'hover:border-medigreen-400 hover:ring-4 hover:ring-medigreen-100'
    : 'hover:border-mediblue-400 hover:ring-4 hover:ring-mediblue-100';

  return (
    <GlassCard
      interactive
      variant={variant}
      onClick={onClick}
      className={`group flex flex-col items-center justify-center p-8 md:p-12 w-full max-w-md md:max-w-lg min-h-[300px] md:min-h-[360px] text-center border-2 border-white transition-all duration-200 cursor-pointer ${hoverBorder}`}
    >
      {badgeText && (
        <span
          className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isGreen
              ? 'bg-medigreen-100 text-medigreen-700'
              : 'bg-mediblue-100 text-mediblue-700'
          }`}
        >
          {badgeText}
        </span>
      )}

      {/* Large Central Icon Badge */}
      <div
        className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center border-2 mb-6 shadow-sm group-hover:scale-105 transition-transform duration-200 ${iconBg}`}
      >
        <Icon className="w-12 h-12 md:w-14 md:h-14 stroke-[2]" />
      </div>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-extrabold text-navy-900 tracking-tight mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-base md:text-lg font-medium text-slate-600 max-w-xs md:max-w-sm leading-relaxed">
        {description}
      </p>
    </GlassCard>
  );
};
