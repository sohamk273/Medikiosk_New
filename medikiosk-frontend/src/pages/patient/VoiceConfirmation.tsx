import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, MicOff, Phone, BellRing, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { TranscriptCard } from '@/components/kiosk/TranscriptCard';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function VoiceConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const {
    voiceIntake,
    lastClinicalTurn,
    currentConversationTurn,
    advanceConversationTurn,
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
  } | null;

  const turnNum = currentConversationTurn || 1;
  const isEmergency = state?.requiresEmergency || lastClinicalTurn?.requires_emergency_attention || voiceIntake.activeIsRedFlag || false;

  const {
    activeInputMethod,
    activeTranscript,
    activeSelectedOption,
  } = voiceIntake;

  const isVoice = activeInputMethod === 'voice';

  const handleSpeakAgain = () => {
    resetActiveVoiceResponse();
    navigate('/patient/voice');
  };

  const handleCallSahayak = () => {
    setStaffCalled(true);
    setStaffNotified(true);
  };

  const handleContinueAfterRedFlag = () => {
    handleConfirm();
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);

    if (isEmergency) {
      setRedFlagTriggered(true);
    }

    // Determine completion: either clinical engine marked complete or turn threshold reached
    const isComplete = (lastClinicalTurn && lastClinicalTurn.is_case_complete) || state?.isCaseComplete || turnNum >= 5;

    try {
      if (isComplete || isEmergency) {
        // Stage 6: Persist structured encounter, turns, and generate doctor summary
        await finalizeEncounter();
        setVoiceIntakeCompleted(true);
        navigate('/patient/case-summary');
      } else {
        advanceConversationTurn();
        navigate('/patient/voice');
      }
    } catch (err) {
      console.error('Finalize encounter error in confirmation:', err);
      // Fallback navigation
      setVoiceIntakeCompleted(true);
      navigate('/patient/case-summary');
    } finally {
      setConfirming(false);
    }
  };

  const globalStep = 11;

  useKioskScreen({
    onContinue: handleConfirm,
    onBack: handleSpeakAgain,
    audioPrompt: isVoice
      ? (t('voiceConfirmation.audioPromptVoice') || 'Please check your recorded words on the screen and tap Looks Correct to proceed.')
      : (t('voiceConfirmation.audioPromptTouch') || 'Please check your selected answer and tap Looks Correct to proceed.'),
  });

  if (isEmergency) {
    return (
      <div className="w-full">
        <StepProgressIndicator
          current={globalStep}
          total={24}
          title={t('voiceConfirmation.title')}
          badge="Priority Clinical Alert"
        />
        <div className="max-w-3xl mx-auto px-6 pt-6 pb-32">
          <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-200 px-3 py-1 rounded-full">
                  Priority Clinical Alert
                </span>
                <h2 className="text-2xl font-bold text-red-800 mt-1">
                  {language === 'hi'
                    ? 'विशेष चिकित्सा ध्यान आवश्यक'
                    : language === 'mr'
                    ? 'तातडीने वैद्यकीय लक्ष आवश्यक'
                    : 'Urgent Medical Attention Advised'}
                </h2>
              </div>
            </div>

            <p className="text-red-700 text-base leading-relaxed mb-4">
              {language === 'hi'
                ? 'आपके बताए लक्षण के अनुसार तुरंत डॉक्टर से परामर्श की सलाह दी जाती है।'
                : language === 'mr'
                ? 'आपल्या लक्षणांनुसार तातडीने डॉक्टरांचा सल्ला घेण्याची आवश्यकता आहे.'
                : 'Based on the symptom you described, immediate clinical assessment is advised.'}
            </p>

            <TranscriptCard
              inputMethod={activeInputMethod ?? 'voice'}
              transcript={activeTranscript}
              selectedOption={activeSelectedOption}
              isRedFlag={true}
            />

            <div className="flex flex-col gap-3 mt-6">
              {!staffCalled ? (
                <button
                  type="button"
                  onClick={handleCallSahayak}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-xl transition-colors shadow-md"
                >
                  <Phone className="w-6 h-6" />
                  <span>
                    {language === 'hi'
                      ? 'सहायक को बुलाएं / Call Sahayak Now'
                      : 'Call Sahayak Now / सहायक को बुलाएं'}
                  </span>
                </button>
              ) : (
                <div className="w-full bg-[#F0FDF4] border-2 border-[#0D9488] rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-xl text-[#0D9488]">
                  <BellRing className="w-6 h-6" />
                  <span>
                    {language === 'hi'
                      ? 'सहायक को सूचित कर दिया गया है'
                      : 'Staff has been notified.'}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleContinueAfterRedFlag}
                disabled={confirming}
                className="w-full bg-slate-100 text-slate-700 rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base hover:bg-slate-200 transition-colors border border-slate-200"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    <span>Saving intake...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    <span>
                      {language === 'hi' ? 'पंजीकरण जारी रखें' : 'Continue with intake'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={globalStep}
        total={24}
        title={t('voiceConfirmation.title')}
        badge={`Turn ${turnNum} Confirmed`}
      />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-32">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6FAF5] flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold">🩺</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary">
              {t('voiceConfirmation.confirmPrompt')}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {t('voiceConfirmation.confirmSub')}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[#0D9488] text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isVoice ? 'Voice Captured' : 'Touch Selected'}</span>
          </div>
        </div>

        <AudioGuidanceBanner
          englishText="Review your answer below. Tap Looks Correct if it is right, or Speak Again to redo it."
          regionalText={
            language === 'hi'
              ? "नीचे दर्ज उत्तर देखें। यदि सही है तो 'सही है' दबाएं, या फिर से बोलने के लिए 'फिर से बोलें' चुनें।"
              : language === 'mr'
              ? "खालील उत्तर तपासा. बरोबर असल्यास 'बरोबर आहे' दाबा, किंवा पुन्हा बोलण्यासाठी 'पुन्हा बोला' निवडा."
              : undefined
          }
        />

        <div className="bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100 mb-4 flex items-center gap-3">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">
            Turn {turnNum} Answer
          </span>
        </div>

        <TranscriptCard
          inputMethod={activeInputMethod ?? 'voice'}
          transcript={activeTranscript}
          selectedOption={activeSelectedOption}
          isRedFlag={false}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          <button
            type="button"
            onClick={handleSpeakAgain}
            disabled={confirming}
            className="flex flex-col items-center gap-2 bg-white border-2 border-slate-200 rounded-2xl py-5 px-4 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <MicOff className="w-7 h-7 text-slate-500" />
            <span className="font-bold text-slate-700 text-base">
              {t('voiceConfirmation.speakAgain')}
            </span>
            <span className="text-slate-400 text-sm font-devanagari">फिर से बोलें</span>
          </button>

          <button
            type="button"
            onClick={handleSpeakAgain}
            disabled={confirming}
            className="hidden sm:flex flex-col items-center gap-2 bg-white border-2 border-slate-200 rounded-2xl py-5 px-4 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <span className="text-slate-500 text-3xl font-bold">👆</span>
            <span className="font-bold text-slate-700 text-base">
              {t('voiceConfirmation.editOnScreen')}
            </span>
            <span className="text-slate-400 text-sm font-devanagari">स्क्रीन पर चुनें</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className={`flex flex-col items-center gap-2 rounded-2xl py-5 px-4 transition-colors font-bold shadow-md border-2 ${
              confirming
                ? 'bg-slate-300 border-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary border-primary text-white hover:bg-primary/90'
            }`}
          >
            {confirming ? (
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-white" />
            )}
            <span className="text-xl">
              {confirming ? 'Saving Case...' : t('voiceConfirmation.looksCorrect')}
            </span>
            <span className="font-devanagari text-lg">सही है / बरोबर आहे</span>
          </button>
        </div>
      </div>
    </div>
  );
}
