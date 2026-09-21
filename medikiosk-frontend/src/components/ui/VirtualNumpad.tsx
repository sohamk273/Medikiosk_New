import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';

interface VirtualNumpadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear?: () => void;
  className?: string;
}

export const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  onDigit,
  onDelete,
  onClear,
  className = '',
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className={`grid grid-cols-3 gap-2.5 md:gap-3 w-full max-w-xs md:max-w-sm mx-auto select-none ${className}`}>
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className="h-14 md:h-16 rounded-2xl bg-white/90 hover:bg-white text-navy-900 font-extrabold text-2xl md:text-3xl shadow-sm border border-slate-200/90 active:scale-95 active:bg-blue-50 transition-all flex items-center justify-center cursor-pointer"
        >
          {digit}
        </button>
      ))}

      {/* Bottom Row: Clear / 0 / Delete */}
      <button
        type="button"
        onClick={onClear || onDelete}
        className="h-14 md:h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm shadow-sm border border-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        title="Clear"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => onDigit('0')}
        className="h-14 md:h-16 rounded-2xl bg-white/90 hover:bg-white text-navy-900 font-extrabold text-2xl md:text-3xl shadow-sm border border-slate-200/90 active:scale-95 active:bg-blue-50 transition-all flex items-center justify-center cursor-pointer"
      >
        0
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="h-14 md:h-16 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm shadow-sm border border-red-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        title="Delete"
      >
        <Delete className="w-6 h-6" />
      </button>
    </div>
  );
};
