import React from 'react';
import { Delete, XCircle } from 'lucide-react';
import { useKiosk } from '../../context/KioskContext';

interface VirtualNumpadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  onClearPress?: () => void;
  maxLengthReached?: boolean;
}

export const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  onDigitPress,
  onDeletePress,
  onClearPress,
  maxLengthReached = false,
}) => {
  const { playClickSound } = useKiosk();

  const handleDigit = (d: string) => {
    playClickSound();
    if (!maxLengthReached) {
      onDigitPress(d);
    }
  };

  const handleDelete = () => {
    playClickSound();
    onDeletePress();
  };

  const handleClear = () => {
    playClickSound();
    if (onClearPress) onClearPress();
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-3 md:gap-4 p-2 select-none">
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => handleDigit(digit)}
          className="h-16 md:h-18 rounded-2xl bg-white/90 hover:bg-white text-navy-900 border border-white/90 shadow-sm font-bold text-2xl md:text-3xl flex items-center justify-center active:scale-95 transition-all"
        >
          {digit}
        </button>
      ))}

      {/* Clear Button */}
      <button
        type="button"
        onClick={handleClear}
        className="h-16 md:h-18 rounded-2xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 border border-slate-200/60 shadow-sm font-semibold text-sm md:text-base flex items-center justify-center active:scale-95 transition-all"
        title="Clear All"
      >
        <span className="flex items-center gap-1">
          <XCircle className="w-5 h-5 text-slate-500" />
          <span>Clear</span>
        </span>
      </button>

      {/* Zero */}
      <button
        type="button"
        onClick={() => handleDigit('0')}
        className="h-16 md:h-18 rounded-2xl bg-white/90 hover:bg-white text-navy-900 border border-white/90 shadow-sm font-bold text-2xl md:text-3xl flex items-center justify-center active:scale-95 transition-all"
      >
        0
      </button>

      {/* Delete / Backspace */}
      <button
        type="button"
        onClick={handleDelete}
        className="h-16 md:h-18 rounded-2xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 border border-slate-200/60 shadow-sm font-semibold flex items-center justify-center active:scale-95 transition-all"
        title="Backspace"
      >
        <Delete className="w-7 h-7 text-slate-600" />
      </button>
    </div>
  );
};
