import { Volume2, RefreshCw } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

interface AudioGuidanceBannerProps {
  englishText: string;
  regionalText?: string;
  onReplay?: () => void;
}

export function AudioGuidanceBanner({ englishText, regionalText, onReplay }: AudioGuidanceBannerProps) {
  const { audioEnabled } = usePatientSession();

  if (!audioEnabled) return null;

  return (
    <div className="w-full bg-gradient-to-r from-mediblue-50/90 via-sky-50/70 to-emerald-50/60 rounded-2xl p-3.5 md:p-4 flex items-center justify-between border border-mediblue-100/80 shadow-sm mb-4 md:mb-5">
      <div className="flex items-center gap-3 md:gap-4 text-navy-900">
        <div className="w-10 h-10 md:w-11 md:h-11 bg-white text-mediblue-600 rounded-xl flex items-center justify-center shadow-sm border border-mediblue-100 shrink-0">
          <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-sm md:text-base font-devanagari text-navy-900">
            {regionalText || englishText}
          </span>
          {regionalText && (
            <span className="text-xs md:text-sm font-medium text-slate-500">{englishText}</span>
          )}
        </div>
      </div>
      
      {onReplay && (
        <button 
          type="button"
          onClick={onReplay}
          className="bg-white hover:bg-slate-50 text-mediblue-700 border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-mediblue-600" />
          <span>Replay</span>
        </button>
      )}
    </div>
  );
}
