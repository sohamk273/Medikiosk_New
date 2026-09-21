import { Check } from 'lucide-react';

interface SmartOptionCardProps {
  id: string;
  label: string;
  sublabel?: string;
  isSelected: boolean;
  isRedFlag?: boolean;
  isMultiSelect?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Reusable large-touch-target option card for kiosk questionnaires.
 * Meets accessibility and kiosk UX requirements:
 * - Min 64px height
 * - Clear selected state (border + background + checkmark)
 * - Hover, focus, and pressed states
 * - Optional supporting microcopy (sublabel)
 * - Full card is clickable
 * - Checkbox indicator for multi-select, Radio indicator for single-select
 */
export function SmartOptionCard({
  id,
  label,
  sublabel,
  isSelected,
  isRedFlag = false,
  isMultiSelect = false,
  onClick,
  disabled = false,
}: SmartOptionCardProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      className={`
        w-full min-h-[64px] p-3 rounded-xl border-2 text-left
        flex items-center gap-3 transition-all duration-150
        active:scale-[0.98] cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSelected
          ? isRedFlag
            ? 'border-rose-500 bg-rose-50/90 shadow-sm focus-visible:ring-rose-400'
            : 'border-medigreen-500 bg-medigreen-50/90 shadow-sm focus-visible:ring-medigreen-400'
          : isRedFlag
            ? 'border-rose-200/80 bg-rose-50/30 hover:border-rose-300 hover:bg-rose-50/60 focus-visible:ring-rose-300'
            : 'border-slate-200/80 bg-white hover:border-medigreen-300 hover:bg-medigreen-50/20 focus-visible:ring-medigreen-200'
        }
        shadow-2xs hover:shadow-xs
      `}
    >
      {/* Selection indicator: Checkbox for multi-select, Circle for single-select */}
      <div
        className={`
          shrink-0 w-5 h-5 ${isMultiSelect ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center
          transition-all duration-150
          ${isSelected
            ? isRedFlag
              ? 'border-rose-500 bg-rose-500 text-white'
              : 'border-medigreen-500 bg-medigreen-500 text-white'
            : isRedFlag
              ? 'border-rose-300 bg-white'
              : 'border-slate-300 bg-white'
          }
        `}
      >
        {isSelected ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : !isMultiSelect ? (
          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
        ) : null}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <span
          className={`
            block text-xs sm:text-sm font-bold leading-snug
            ${isSelected
              ? isRedFlag ? 'text-rose-900' : 'text-medigreen-900'
              : isRedFlag ? 'text-rose-800' : 'text-navy-900'
            }
          `}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className={`
              block text-[11px] mt-0.5 leading-tight
              ${isSelected
                ? isRedFlag ? 'text-rose-600' : 'text-medigreen-700'
                : 'text-slate-500'
              }
            `}
          >
            {sublabel}
          </span>
        )}
      </div>

      {/* Red flag warning indicator */}
      {isRedFlag && (
        <div className="shrink-0">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full">
            Alert
          </span>
        </div>
      )}
    </button>
  );
}

