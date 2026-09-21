import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Volume2, HelpCircle } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { ttsService } from '@/services/voice/ttsService';
import { useTranslation } from '@/i18n';
import { useKioskScreenContext } from '@/context/KioskScreenContext';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';

export function KioskBottomBar() {
  const location = useLocation();
  const { audioEnabled, language } = usePatientSession();
  const { t } = useTranslation();
  const { config, handleContinue, handleBack } = useKioskScreenContext();
  const { openSahayakModal, guidedAssistMode } = useSahayakAssist();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isLanguagePage = location.pathname === '/patient/language' || location.pathname === '/';
  const isCompletePage = location.pathname === '/patient/complete';

  if (isLanguagePage) {
    return null;
  }

  const playScreenAudio = async () => {
    if (!audioEnabled) {
      console.warn('Audio is currently disabled by user.');
      return;
    }

    const textToSpeak = config.audioPrompt || t('common.defaultAudioPrompt') || 'Please review the information on the screen and tap Continue.';

    try {
      setIsPlayingAudio(true);
      await ttsService.speak(textToSpeak, language);
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const continueLabel = config.continueLabelKey 
    ? t(config.continueLabelKey) 
    : isCompletePage 
      ? t('common.finish') || 'Finish' 
      : t('common.continue');

  const backLabel = config.backLabelKey 
    ? t(config.backLabelKey) 
    : t('common.back');

  const sahayakLabel = 'Sahayak Assist';

  return (
    <footer className="relative w-full h-[88px] bg-white border-t border-slate-200 px-6 sm:px-10 flex items-center justify-between z-30 shrink-0">
      {/* Left: Back Navigation Button */}
      <div>
        {!isCompletePage && (
          <button
            type="button"
            onClick={handleBack}
            disabled={config.isBackDisabled}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] border transition-all active:scale-95 ${
              config.isBackDisabled
                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{backLabel}</span>
          </button>
        )}
      </div>

      {/* Center: Sahayak & Repeat Audio Assistance */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          id="sahayak-target-help"
          onClick={openSahayakModal}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] border transition-all active:scale-95 shadow-sm ${
            guidedAssistMode 
              ? 'bg-teal-50 text-teal-800 border-teal-300 ring-2 ring-teal-200' 
              : 'bg-white hover:bg-slate-50 text-teal-800 border-slate-300'
          }`}
        >
          <HelpCircle className="w-5 h-5 text-teal-700" />
          <span>{sahayakLabel}</span>
        </button>

        <button
          type="button"
          id="sahayak-target-repeat"
          onClick={playScreenAudio}
          disabled={!audioEnabled || isPlayingAudio}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] border transition-all active:scale-95 shadow-sm ${
            !audioEnabled
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              : isPlayingAudio
                ? 'bg-medigreen-50 text-medigreen-700 border-medigreen-400 ring-2 ring-medigreen-300 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-blue-600 border-slate-300'
          }`}
        >
          <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'text-medigreen-600 animate-bounce' : ''}`} />
          <span>{isPlayingAudio ? t('common.speaking') || 'Speaking...' : t('common.repeatAudio')}</span>
        </button>
      </div>

      {/* Right: Continue Navigation Button */}
      <div>
        <button
          type="button"
          id="sahayak-target-continue"
          onClick={handleContinue}
          disabled={config.isContinueDisabled}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-[16px] transition-all active:scale-95 ${
            config.isContinueDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#008f71] hover:bg-[#007a60] text-white shadow-lg'
          }`}
        >
          <span>{continueLabel}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
}