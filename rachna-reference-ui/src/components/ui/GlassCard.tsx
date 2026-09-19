import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  selected?: boolean;
  variant?: 'blue' | 'green' | 'default';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  interactive = false,
  selected = false,
  variant = 'default',
  onClick,
  ...props
}) => {
  const getSelectedBorder = () => {
    if (!selected) return 'border-white/80 hover:border-blue-200';
    if (variant === 'green') return 'border-medigreen-500 shadow-card-green-selected';
    return 'border-mediblue-600 shadow-card-selected ring-2 ring-mediblue-400/30';
  };

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'relative rounded-3xl bg-white/75 backdrop-blur-xl border transition-all duration-200',
          'shadow-glass',
          interactive && 'cursor-pointer select-none active:scale-[0.985] hover:bg-white/90 hover:shadow-glass-hover',
          getSelectedBorder(),
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
