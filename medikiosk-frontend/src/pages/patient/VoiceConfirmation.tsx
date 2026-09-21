import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Phone, BellRing, ArrowRight, ShieldAlert, Loader2, RotateCcw } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { TranscriptCard } from '@/components/kiosk/TranscriptCard';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';

export default function VoiceConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const {
    voiceIntake,
    lastClinicalTurn,
    advanceVoiceQuestion,
    resetActiveVoiceResponse,
    setRedFlagTriggered,
    setStaffNotified,
    setVoiceIntakeCompleted,
    finalizeEncounter,
  } = usePatientSession();

  const [confirming, setConfirming] = useState(false);
  const [staffCalled, setStaffCalled] = useState(false);

  const state = location.state as {
    questionId?: string;
    questionIndex?: number;
    method?: 'voice' | 'touch';
    nextQuestion?: string;
    nextQuestionRegional?: string;
    nextQuestionType?: string;
    isCaseComplete?: boolean;
    requiresEmergency?: boolean;
    audioBlob?: Blob;
  } | null;

  const isEmergency = state?.requiresEmergency || lastClinicalTurn?.requires_emergency_attention || voiceIntake.activeIsRedFlag || false;

  const {
    activeInputMethod,
    activeTranscript,
    activeSelectedOption,
  } = voiceIntake;

  const isVoice = activeInputMethod === 'voice';

  const questionIdx = state?.questionIndex ?? (voiceIntake.currentQuestionIndex || 0);
  const isLastQuestion = questionIdx >= 7;

  const handleSpeakAgain = () => {
    resetActiveVoiceResponse();
    navigate('/patient/voice');
  };

  const handleCallSahayak = () => {
    setStaffCalled(true);
    setStaffNotified(true);
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);

    if (isEmergency) {
      setRedFlagTriggered(true);
    }

    try {
      if (isLastQuestion) {
        await finalizeEncounter();
        setVoiceIntakeCompleted(true);
        navigate('/patient/case-summary');
      } else {
        advanceVoiceQuestion();
        navigate('/patient/voice');
      }
    } catch (err) {
      console.error('Finalize encounter error in confirmation:', err);
      if (isLastQuestion) {
        setVoiceIntakeCompleted(true);
        navigate('/patient/case-summary');
      } else {
        advanceVoiceQuestion();
        navigate('/patient/voice');
      }
    } finally {
      setConfirming(false);
    }
  };

  useKioskScreen({
    onContinue: handleConfirm,
    onBack: handleSpeakAgain,
    audioPrompt: isVoice
      ? (t('voiceConfirmation.audioPromptVoice') || 'Please check your recorded words on the screen and tap Looks Correct to proceed.')
      : (t('voiceConfirmation.audioPromptTouch') || 'Please check your selected answer and tap Looks Correct to proceed.'),
  });

  if (isEmergency) {
    return (
      <div className="w-full max-w-3xl mx-auto py-4 flex flex-col justify-between">
        <GlassCard className="p-6 bg-rose-50/90 border-2 border-rose-400 shadow-xl">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-200 px-2.5 py-0.5 rounded-full">
                Priority Clinical Alert
              </span>
              <h2 className="text-xl font-black text-rose-900 mt-0.5">
                {language === 'hi'
                  ? 'तुरंत डॉक्टर या सहायक का ध्यान आवश्यक'
                  : language === 'mr'
                  ? 'त्वरित वैद्यकीय सहाय्याची आवश्यकता'
                  : 'Urgent Medical Attention Advised'}
              </h2>
            </div>
          </div>

          <p className="text-rose-800 text-xs sm:text-sm leading-relaxed mb-4">
            {language === 'hi'
              ? 'आपके बताए गए लक्षणों के आधार पर तत्काल डॉक्टर को सूचित किया गया है।'
              : language === 'mr'
              ? 'आपल्या लक्षणांनुसार आपत्कालीन सहाय्य तत्पर करण्यात आले आहे.'
              : 'Based on the symptoms described, priority triage has been assigned.'}
          </p>

          <TranscriptCard
            inputMethod={activeInputMethod ?? 'voice'}
            transcript={activeTranscript}
            selectedOption={activeSelectedOption}
            isRedFlag={true}
            audioBlob={state?.audioBlob}
          />

          <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
            {!staffCalled ? (
              <button
                type="button"
                onClick={handleCallSahayak}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {language === 'en'
                    ? 'Call Sahayak Staff'
                    : language === 'hi'
                      ? 'सहायक बुलाएं'
                      : 'Call Sahayak Staff / सहायक बोलवा'}
                </span>
              </button>
            ) : (
              <div className="flex-1 bg-medigreen-50 border border-medigreen-300 rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm text-medigreen-800 shadow-xs">
                <BellRing className="w-4 h-4 text-medigreen-600" />
                <span>
                  {language === 'en'
                    ? 'Staff Notified'
                    : language === 'hi'
                      ? 'सहायक को सूचित किया गया'
                      : 'Staff Notified (सहायक सूचित झाले)'}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 bg-white hover:bg-slate-50 text-navy-800 rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm transition-all border border-slate-200 active:scale-95 cursor-pointer"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Continue to Assessment</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-3 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {language === 'en' ? 'Review Your Response' : t('voiceConfirmation.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {language === 'en'
            ? 'Please check that we captured what you said correctly.'
            : isVoice 
              ? 'Please verify that we correctly understood your spoken words'
              : 'Please confirm your selected answer below'}
        </p>
      </div>

      {/* Transcript Card with Entities */}
      <div className="mb-3">
        <TranscriptCard
          inputMethod={activeInputMethod ?? 'voice'}
          transcript={activeTranscript}
          selectedOption={activeSelectedOption}
          isRedFlag={false}
          audioBlob={state?.audioBlob}
        />
      </div>


      {/* Verification Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleSpeakAgain}
          className="bg-white hover:bg-slate-50 text-navy-800 border-2 border-slate-300 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>{language === 'en' ? 'Change Response' : isVoice ? 'Re-speak / पुन्हा बोला' : 'Change Choice / पर्याय बदला'}</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {confirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{language === 'en' ? 'Saving...' : 'Saving Assessment...'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{language === 'en' ? 'Confirm Response' : 'Looks Correct / बरोबर आहे'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}