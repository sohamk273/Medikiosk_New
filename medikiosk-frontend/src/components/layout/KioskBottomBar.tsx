import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Volume2, HelpCircle } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { ttsService } from '@/services/voice/ttsService';
import { useTranslation } from '@/i18n';
import { useKioskScreenContext } from '@/context/KioskScreenContext';
import { SahayakHelpModal } from '@/components/kiosk/modals/SahayakHelpModal';

export function KioskBottomBar() {
  const location = useLocation();
  const { audioEnabled, language } = usePatientSession();
  const { t } = useTranslation();
  const { config, handleContinue, handleBack } = useKioskScreenContext();

  const [sahayakOpen, setSahayakOpen] = useState(false);
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

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-200 px-8 flex items-center justify-between shadow-lg z-40">
        {/* Left: Back Navigation Button */}
        <div>
          {!isCompletePage && (
            <button
              type="button"
              onClick={handleBack}
              disabled={config.isBackDisabled}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg border-2 transition-all ${
                config.isBackDisabled
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
              <span>{backLabel}</span>
            </button>
          )}
        </div>

        {/* Center: Sahayak & Repeat Audio Assistance */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSahayakOpen(true)}
            className="flex items-center gap-2 bg-[#E6FAF5] hover:bg-[#D1F4E8] text-[#0D9488] px-6 py-4 rounded-2xl font-bold text-lg border border-[#A7F3D0] transition-colors shadow-sm"
          >
            <HelpCircle className="w-6 h-6 text-[#0D9488]" />
            <span>{t('common.needHelp')}</span>
          </button>

          <button
            type="button"
            onClick={playScreenAudio}
            disabled={!audioEnabled || isPlayingAudio}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-lg border transition-colors shadow-sm ${
              !audioEnabled
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                : isPlayingAudio
                  ? 'bg-[#CCFBF1] text-[#0D9488] border-[#0D9488] animate-pulse'
                  : 'bg-white hover:bg-slate-50 text-primary border-slate-200'
            }`}
          >
            <Volume2 className={`w-6 h-6 ${isPlayingAudio ? 'text-[#0D9488]' : 'text-primary'}`} />
            <span>{isPlayingAudio ? t('common.speaking') || 'Speaking...' : t('common.repeatAudio')}</span>
          </button>
        </div>

        {/* Right: Continue Navigation Button */}
        <div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={config.isContinueDisabled}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-md ${
              config.isContinueDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#064E3B] hover:bg-[#064E3B]/90 text-white active:scale-98 shadow-emerald-900/10'
            }`}
          >
            <span>{continueLabel}</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </footer>

      {/* Sahayak Assistance Modal */}
      <SahayakHelpModal
        open={sahayakOpen}
        onClose={() => setSahayakOpen(false)}
      />
    </>
  );
}
