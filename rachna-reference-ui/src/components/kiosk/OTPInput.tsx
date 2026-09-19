import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  disabled?: boolean;
  variant?: 'blue' | 'green';
  error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  variant = 'blue',
  error = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first empty box
    const firstEmptyIndex = digits.findIndex((d) => !d);
    const targetIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    inputRefs.current[targetIndex]?.focus();
  }, []);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = value.slice(0, index) + value.slice(index + 1);
      onChange(newOtp);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const valArray = value.split('');
    valArray[index] = char;
    const newOtp = valArray.join('').slice(0, length);
    onChange(newOtp);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBoxClick = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const getBorderColor = (digit: string) => {
    if (error) return 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-200';
    if (!digit) return 'border-white/90 bg-white/75';
    if (variant === 'green') return 'border-medigreen-500 bg-emerald-50/60 ring-2 ring-medigreen-300';
    return 'border-mediblue-500 bg-blue-50/60 ring-2 ring-mediblue-300';
  };

  return (
    <div className="flex items-center justify-center gap-3 md:gap-5 w-full max-w-xl mx-auto py-2">
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index];
        const isCurrent = index === (value.length < length ? value.length : length - 1);

        return (
          <div
            key={index}
            onClick={() => handleBoxClick(index)}
            className={`w-14 h-18 md:w-20 md:h-24 rounded-2xl flex items-center justify-center border-2 text-3xl md:text-4xl font-extrabold text-navy-900 transition-all duration-200 shadow-sm cursor-pointer ${getBorderColor(
              digit
            )} ${isCurrent ? 'scale-105 shadow-md' : ''}`}
          >
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-full h-full text-center bg-transparent outline-none cursor-pointer"
              aria-label={`Digit ${index + 1}`}
            />
          </div>
        );
      })}
    </div>
  );
};
