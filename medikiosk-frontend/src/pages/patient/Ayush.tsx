import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { VoiceOrb } from '@/components/kiosk/VoiceOrb';
import { VoiceWaveform } from '@/components/kiosk/VoiceWaveform';
import { AYUSH_QUESTIONS } from '@/services/ayush/MockAyushProvider';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { CheckCircle2 } from 'lucide-react';

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
      navigate('/patient/case-summary');
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
    <div className="w-full max-w-5xl mx-auto py-2 flex flex-col justify-between">
      {/* Question Header */}
      <GlassCard className="p-3.5 mb-2 border-medigreen-200/80 bg-gradient-to-r from-medigreen-50/50 via-white/90 to-teal-50/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-medigreen-100 text-medigreen-800 border border-medigreen-300">
            {t('ayush.questionBadge', { current: currentIndex + 1, total: AYUSH_QUESTIONS.length })}
          </span>
          <span className="text-xs font-bold text-mediblue-700">
            AYUSH Prakriti Assessment
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 font-devanagari">
          {language === 'hi' ? currentQuestion.questionHindi : currentQuestion.question}
        </h2>
        {language !== 'en' && (
          <p className="text-slate-500 text-xs mt-0.5">
            {language === 'hi' ? currentQuestion.question : currentQuestion.questionHindi}
          </p>
        )}
      </GlassCard>

      {/* Audio Banner Removed */}
      {/* Main Grid: Left Voice AI / Right Touch Option Cards */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* LEFT: Voice Area (5 cols) */}
        <div className="col-span-12 lg:col-span-5">
          {pageState === 'idle' ? (
            <GlassCard
              onClick={handleStartListening}
              className="p-5 flex flex-col items-center justify-between text-center border-medigreen-300/80 h-[320px] cursor-pointer hover:border-medigreen-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-medigreen-50 text-medigreen-800 border border-medigreen-200">
                  VOICE AI MODE
                </span>
                <span className="text-slate-400 text-xs font-bold">{language === 'en' ? 'EN' : 'अ/A'}</span>
              </div>
              <div className="flex flex-col items-center gap-2 my-auto">
                <VoiceOrb state="idle" />
                <div className="text-center mt-2">
                  <p className="text-base font-extrabold text-navy-900 font-devanagari">
                    {t('ayush.tapToSpeak')}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {t('ayush.tapToSpeakSub')}
                  </p>
                </div>
              </div>
              <div className="w-full bg-medigreen-50/70 border border-medigreen-200 py-1.5 px-3 rounded-lg text-[11px] text-medigreen-800 font-medium">
                Tap anywhere on this card to speak your answer
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-5 flex flex-col items-center justify-between text-center border-medigreen-500 bg-medigreen-50/30 h-[320px]">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-rose-600 uppercase">
                    {pageState === 'listening' ? 'Listening' : 'Processing'}
                  </span>
                </div>
                {pageState === 'listening' && (
                  <span className="text-xs font-mono font-bold text-navy-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formatTime(timer)}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 my-auto">
                {pageState === 'listening' ? (
                  <>
                    <VoiceOrb state="listening" />
                    <VoiceWaveform active={true} />
                  </>
                ) : (
                  <VoiceOrb state="processing" />
                )}
              </div>

              <button
                type="button"
                onClick={handleStopListening}
                className="w-full bg-gradient-to-r from-medigreen-600 to-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md cursor-pointer"
              >
                Done Speaking (Save)
              </button>
            </GlassCard>
          )}
        </div>

        {/* RIGHT: Touch Options (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-between h-[320px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-medigreen-600" />
              <span>Touch Options</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Select one option
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {currentQuestion.touchOptions.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTouchSelect(opt.id, opt.labelHindi)}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all active:scale-95 cursor-pointer ${isSelected
                      ? 'border-medigreen-500 bg-medigreen-50/90 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-medigreen-200'
                    }`}
                >
                  <div className="flex-1">
                    <p className={`text-xs sm:text-sm font-bold font-devanagari ${isSelected ? 'text-medigreen-900' : 'text-navy-900'
                      }`}>
                      {language === 'hi' ? opt.labelHindi : opt.label}
                    </p>
                    {language !== 'en' && (
                      <p className="text-slate-500 text-[11px]">
                        {language === 'hi' ? opt.label : opt.labelHindi}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-medigreen-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}