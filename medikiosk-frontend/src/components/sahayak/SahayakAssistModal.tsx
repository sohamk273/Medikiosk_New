import { HelpCircle, Volume2, Globe, Play, UserCheck, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';
import { useTranslation, type Language } from '@/i18n';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

export function SahayakAssistModal() {
  const { 
    isModalOpen, 
    closeSahayakModal, 
    startGuidedAssist, 
    callSahayak,
    hasSavedProgress,
  } = useSahayakAssist();

  const { language, setLanguage } = useTranslation();
  const { audioEnabled, setAudioEnabled } = usePatientSession();

  if (!isModalOpen) return null;

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  return (
    <Modal open={isModalOpen} onClose={closeSahayakModal} className="max-w-xl">
      <div className="p-1">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sahayak Assist</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                We’ll guide you through the registration step by step.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSahayakModal}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary & Secondary Action Choices */}
        <div className="py-5 space-y-3.5">
          {/* Primary Action: Start / Resume Guided Registration */}
          <div className="bg-teal-50/60 border-2 border-teal-700/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {hasSavedProgress ? 'Continue Guided Registration' : 'Start Guided Registration'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Visual pointer and voice instructions on every screen.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => startGuidedAssist(false)}
                className="flex-1 py-3 px-4 bg-teal-900 hover:bg-teal-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span>{hasSavedProgress ? 'Continue Where I Left Off' : 'Start Guided Registration'}</span>
              </button>

              {hasSavedProgress && (
                <button
                  type="button"
                  onClick={() => startGuidedAssist(true)}
                  className="py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
                >
                  Start From Beginning
                </button>
              )}
            </div>
          </div>

          {/* Secondary Action: Call Physical Sahayak */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Call Hospital Attendant</h4>
                <p className="text-xs text-slate-500">Request staff assistance to arrive at Kiosk #02</p>
              </div>
            </div>

            <button
              type="button"
              onClick={callSahayak}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs active:scale-95"
            >
              Call Sahayak
            </button>
          </div>

          {/* Language and Audio Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Language Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>Language / भाषा</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['en', 'hi', 'mr'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => handleLanguageSelect(l)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-colors text-center ${
                      language === l
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Guidance Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Audio Guidance</span>
              </div>
              <button
                type="button"
                onClick={toggleAudio}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-colors flex items-center justify-between ${
                  audioEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                <span>Voice Narration:</span>
                <span className="uppercase">{audioEnabled ? 'ON (Active)' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>You can exit guided mode at any time.</span>
          <button
            type="button"
            onClick={closeSahayakModal}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
