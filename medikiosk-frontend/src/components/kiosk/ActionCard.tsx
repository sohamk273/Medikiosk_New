import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface ActionCardProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'blue' | 'green';
  onClick: () => void;
  badgeText?: string;
  className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  id,
  icon: Icon,
  title,
  description,
  variant = 'blue',
  onClick,
  badgeText,
  className = '',
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
      id={id}
      interactive
      variant={variant}
      onClick={onClick}
      className={`group flex flex-col items-center justify-center p-6 md:p-8 w-full min-h-[220px] md:min-h-[260px] text-center border-2 border-white transition-all duration-200 cursor-pointer ${hoverBorder} ${className}`}
    >
      {badgeText && (
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
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
        className={`w-18 h-18 md:w-22 md:h-22 rounded-3xl flex items-center justify-center border-2 mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200 ${iconBg}`}
      >
        <Icon className="w-9 h-9 md:w-11 md:h-11 stroke-[2]" />
      </div>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm md:text-base font-medium text-slate-600 max-w-xs md:max-w-sm leading-relaxed">
        {description}
      </p>
    </GlassCard>
  );
};
