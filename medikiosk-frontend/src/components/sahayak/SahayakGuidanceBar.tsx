import { Volume2, X, HelpCircle } from 'lucide-react';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';
import { useTranslation } from '@/i18n';

export function SahayakGuidanceBar() {
  const { 
    guidedAssistMode, 
    guidedStep, 
    totalSteps, 
    currentInstruction, 
    repeatInstruction, 
    exitGuidedAssist 
  } = useSahayakAssist();
  
  const { language } = useTranslation();

  if (!guidedAssistMode) {
    return null;
  }

  const repeatLabel = language === 'hi' 
    ? 'निर्देश दोहराएं' 
    : language === 'mr' 
    ? 'सूचना पुन्हा ऐका' 
    : 'Repeat Instruction';

  const exitLabel = language === 'hi' 
    ? 'असिस्ट बंद करें' 
    : language === 'mr' 
    ? 'मदत बंद करा' 
    : 'Exit Assist';

  return (
    <div className="relative z-40 w-full bg-teal-900 text-white border-t-2 border-teal-700 shadow-lg px-6 sm:px-10 py-3 flex flex-col md:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
      {/* Left: Badge & Step Indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-teal-800/90 text-teal-100 border border-teal-600/50 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-teal-300" />
          <span>Sahayak Assist</span>
        </div>
        <div className="text-xs font-semibold text-teal-200">
          Step {guidedStep} of {totalSteps}
        </div>
      </div>

      {/* Center: Instruction Text */}
      <div className="flex-1 text-center md:text-left px-2 min-w-0">
        <p className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
          "{currentInstruction}"
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={repeatInstruction}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-bold border border-teal-600/60 transition-colors shadow-2xs active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5 text-teal-300" />
          <span>{repeatLabel}</span>
        </button>

        <button
          type="button"
          onClick={exitGuidedAssist}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-950/70 hover:bg-teal-950 text-teal-200 hover:text-white rounded-lg text-xs font-semibold border border-teal-800 transition-colors active:scale-95"
        >
          <X className="w-3.5 h-3.5 text-teal-400" />
          <span>{exitLabel}</span>
        </button>
      </div>
    </div>
  );
}
