import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { VoiceOrb } from '@/components/kiosk/VoiceOrb';
import { VoiceWaveform } from '@/components/kiosk/VoiceWaveform';
import { AYUSH_QUESTIONS } from '@/services/ayush/MockAyushProvider';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

type PageState = 'idle' | 'listening' | 'processing';

export default function Ayush() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    language,
    ayushIntake,
    addAyushResponse,
    advanceAyushQuestion,
    setAyushIntake,
  } = usePatientSession();

  const [pageState, setPageState] = useState<PageState>('idle');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentIndex = ayushIntake.currentQuestionIndex || 0;
  const currentQuestion = AYUSH_QUESTIONS[currentIndex] || AYUSH_QUESTIONS[0];
  const existingResponse = ayushIntake.responses.find(
    (r) => r.questionId === currentQuestion.id
  );
  const selectedOptionId = existingResponse?.answer || null;

  useEffect(() => {
    setPageState('idle');
    setTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [currentIndex]);

  const handleStartListening = () => {
    setPageState('listening');
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  const handleStopListening = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPageState('processing');

    setTimeout(() => {
      if (currentQuestion) {
        const option = currentQuestion.touchOptions[0];
        if (option) {
          addAyushResponse({
            questionId: currentQuestion.id,
            question: currentQuestion.question,
            questionHindi: currentQuestion.questionHindi,
            answer: option.id,
            answerHindi: option.labelHindi,
            ayushField: currentQuestion.internalField,
            timestamp: new Date().toISOString(),
          });
        }
      }
      setPageState('idle');
    }, 1500);
  };

  const handleTouchSelect = (optionId: string, labelHindi: string) => {
    if (!currentQuestion) return;
    addAyushResponse({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      questionHindi: currentQuestion.questionHindi,
      answer: optionId,
      answerHindi: labelHindi,
      ayushField: currentQuestion.internalField,
      timestamp: new Date().toISOString(),
    });
  };

  const handleContinue = () => {
    if (pageState === 'listening') {
      handleStopListening();
      return;
    }

    if (currentIndex < AYUSH_QUESTIONS.length - 1) {
      advanceAyushQuestion(currentIndex + 1);
    } else {
      setAyushIntake({ ...ayushIntake, completed: true });
      navigate('/patient/medications');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      advanceAyushQuestion(currentIndex - 1);
    } else {
      navigate('/patient/voice-confirmation');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: handleBack,
    continueLabelKey: pageState === 'listening' ? 'voice.doneSpeaking' : selectedOptionId ? 'voice.confirmSelection' : 'common.continue',
    audioPrompt: language === 'hi' ? currentQuestion.questionHindi : currentQuestion.question,
  });

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={12 + currentIndex}
        total={24}
        title={t('ayush.title')}
      />

      <div className="max-w-5xl mx-auto px-6 pt-6 pb-32">
        {/* Question Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E6FAF5] text-[#0D9488]">
              {t('ayush.questionBadge', { current: currentIndex + 1, total: AYUSH_QUESTIONS.length })}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 font-devanagari">
            {language === 'hi' ? currentQuestion.questionHindi : currentQuestion.question}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {language === 'hi' ? currentQuestion.question : currentQuestion.questionHindi}
          </p>
        </div>

        {/* Audio Banner */}
        {pageState === 'idle' && (
          <AudioGuidanceBanner
            englishText={currentQuestion.question}
            regionalText={language === 'hi' ? currentQuestion.questionHindi : undefined}
          />
        )}

        <div className="grid grid-cols-[280px_1fr] gap-6 mt-4">
          {/* LEFT: Voice Area */}
          {pageState === 'idle' ? (
            <button
              type="button"
              onClick={handleStartListening}
              className="rounded-3xl flex flex-col items-center justify-between p-6 min-h-[380px] border transition-all duration-300 bg-[#E6FAF5] border-[#A7F3D0] hover:bg-[#D1F4E8] hover:border-[#0D9488] cursor-pointer w-full focus:outline-none shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-[#0D9488] border border-slate-200 shadow-sm">
                  VOICE AI MODE
                </span>
                <span className="text-slate-400 text-sm font-bold">A</span>
              </div>
              <div className="flex flex-col items-center gap-4 w-full">
                <VoiceOrb state="idle" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0D9488] font-devanagari">
                    {t('ayush.tapToSpeak')}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {t('ayush.tapToSpeakSub')}
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-3xl flex flex-col items-center justify-between p-6 min-h-[380px] border transition-all duration-500 bg-[#F0FDF9] border-[#0D9488] shadow-sm">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    {pageState === 'listening' ? 'Recording' : 'Processing'}
                  </span>
                </div>
                {pageState === 'listening' && (
                  <span className="text-sm font-mono font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {formatTime(timer)}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-6 w-full">
                {pageState === 'listening' ? (
                  <>
                    <VoiceOrb state="listening" />
                    <div className="h-12 w-full flex items-center justify-center opacity-70">
                      <VoiceWaveform />
                    </div>
                    <div className="text-center animate-pulse">
                      <p className="text-xl font-bold text-slate-700">
                        {t('voice.listening')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <VoiceOrb state="processing" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-4 border-[#0D9488] border-t-transparent animate-spin opacity-50" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-700">
                        {t('voiceProcessing.analyzing')}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">Please wait</p>
                    </div>
                  </>
                )}
              </div>

              {pageState === 'listening' && (
                <button
                  type="button"
                  onClick={handleStopListening}
                  className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="w-3 h-3 bg-white rounded-sm" />
                  {t('voice.doneSpeaking')}
                </button>
              )}
            </div>
          )}

          {/* RIGHT: Touch Options */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-500 text-sm">?</span>
              <h3 className="text-lg font-bold text-slate-700">
                {t('ayush.orChoose')}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.touchOptions.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleTouchSelect(option.id, option.labelHindi)}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 text-center min-h-[100px]
                      ${isSelected 
                        ? 'border-[#0D9488] bg-[#F0FDF9]' 
                        : 'border-slate-200 bg-slate-50 hover:border-[#0D9488]/30 hover:bg-slate-100'}
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#0D9488] rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <span className={`text-lg font-bold mb-1 ${isSelected ? 'text-[#0D9488]' : 'text-slate-700'}`}>
                      {language === 'hi' ? option.labelHindi : option.label}
                    </span>
                    <span className={`text-sm ${isSelected ? 'text-[#0D9488]/80' : 'text-slate-500'}`}>
                      {language === 'hi' ? option.label : option.labelHindi}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-auto pt-4">
              {selectedOptionId ? (
                <div className="flex items-center gap-2 text-[#0D9488] bg-[#F0FDF9] p-3 rounded-xl border border-[#A7F3D0]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-sm">
                    {t('ayush.answerSelected')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 p-3">
                  <span className="font-medium text-sm">
                    {t('ayush.noOptionSelected')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
