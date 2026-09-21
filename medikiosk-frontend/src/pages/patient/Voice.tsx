import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Square,
  Flame,
} from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useAudioRecorder } from '@/services/voice/useAudioRecorder';
import {
  STOMACH_QUESTIONS,
  getContextualDemoTranscript,
} from '@/services/voice/MockVoiceProvider';
import type { TouchOption } from '@/services/voice/MockVoiceProvider';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { SmartOptionCard } from '@/components/kiosk/SmartOptionCard';

export default function Voice() {
  const navigate = useNavigate();
  const {
    language,
    voiceIntake,
    setActiveVoiceInput,
    setActiveTranscript,
    setActiveSelectedOption,
    setActiveSelectedOptions,
    setVoiceQuestionIndex,
    chiefComplaint,
  } = usePatientSession();
  const { t } = useTranslation();

  const {
    state: recordState,
    duration,
    error: recordError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const isRecording = recordState === 'recording';
  const isRequesting = recordState === 'requesting_permission';

  const questionIndex = Math.min(Math.max(voiceIntake.currentQuestionIndex ?? 0, 0), STOMACH_QUESTIONS.length - 1);
  const currentQuestion = STOMACH_QUESTIONS[questionIndex] || STOMACH_QUESTIONS[0];
  const turnNumber = questionIndex + 1;

  const [selectedTouchOption, setSelectedTouchOption] = useState<TouchOption | null>(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stopRequestedRef = useRef(false);

  // Sync state when question changes or on initial mount
  useEffect(() => {
    setSelectedTouchOption(null);
    setSelectedMultiOptions([]);
    setSelectedSeverity(null);
    setIsStopping(false);
    setIsTransitioning(false);
    stopRequestedRef.current = false;

    // Check if we have a saved response for this question
    const existing = voiceIntake.responses.find(r => r.questionId === currentQuestion.id);
    if (existing) {
      if (currentQuestion.isMultiSelect && existing.selectedOptions) {
        setSelectedMultiOptions(existing.selectedOptions);
      } else if (currentQuestion.isScale && existing.selectedOption) {
        const num = parseInt(existing.selectedOption.replace(/\D/g, ''), 10);
        if (!isNaN(num)) setSelectedSeverity(num);
      } else if (existing.selectedOption) {
        const matched = currentQuestion.touchOptions.find(o => o.id === existing.selectedOption || o.label === existing.selectedOption);
        if (matched) setSelectedTouchOption(matched);
      }
    }
  }, [questionIndex, currentQuestion.id]);

  const currentQuestionText =
    language === 'hi'
      ? currentQuestion.questionHindi
      : language === 'mr'
        ? currentQuestion.questionMarathi
        : currentQuestion.question;

  const currentQuestionEnglish = currentQuestion.question;
  const currentQuestionId = currentQuestion.id;
  const touchOptions: TouchOption[] = currentQuestion.touchOptions;

  const handleStartListening = async () => {
    setSelectedTouchOption(null);
    setSelectedMultiOptions([]);
    setSelectedSeverity(null);
    stopRequestedRef.current = false;
    setIsStopping(false);
    setIsTransitioning(false);
    await startRecording();
  };

  const handleStopListening = async () => {
    if (stopRequestedRef.current || isStopping || isTransitioning) return;
    stopRequestedRef.current = true;
    setIsStopping(true);

    try {
      const audioBlob = await stopRecording();
      setIsTransitioning(true);
      navigate('/patient/voice/processing', {
        state: {
          questionId: currentQuestionId,
          questionIndex,
          method: 'voice',
          audioBlob: audioBlob && audioBlob.size > 0 ? audioBlob : undefined,
          questionPrompt: currentQuestionText,
        },
      });
    } catch (err) {
      console.warn('Microphone stop error:', err);
      setIsTransitioning(true);
      navigate('/patient/voice/processing', {
        state: {
          questionId: currentQuestionId,
          questionIndex,
          method: 'voice',
          questionPrompt: currentQuestionText,
        },
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleTouchSelect = (option: TouchOption) => {
    if (isRecording) {
      resetRecording();
    }
    setSelectedTouchOption(option);
  };

  const handleMultiSelectToggle = (option: TouchOption) => {
    if (isRecording) {
      resetRecording();
    }

    if (option.id === 'none_of_these_assoc' || option.id === 'none_of_these_flags') {
      setSelectedMultiOptions([option.id]);
      return;
    }

    const withoutNone = selectedMultiOptions.filter(id => id !== 'none_of_these_assoc' && id !== 'none_of_these_flags');
    if (withoutNone.includes(option.id)) {
      setSelectedMultiOptions(withoutNone.filter(id => id !== option.id));
    } else {
      setSelectedMultiOptions([...withoutNone, option.id]);
    }
  };

  const handleSeveritySelect = (level: number) => {
    if (isRecording) {
      resetRecording();
    }
    setSelectedSeverity(level);
  };

  // Demo simulation button handler
  const handleSimulateDemoVoice = () => {
    if (isRecording) resetRecording();

    const demoStatement = getContextualDemoTranscript({
      language,
      primaryComplaint: chiefComplaint?.primaryComplaint || '',
      questionId: currentQuestionId,
    });

    // Auto-select corresponding option(s) based on current question
    let autoOptionId = currentQuestion.demoSelectedOptionIds?.[0] || currentQuestion.touchOptions[0]?.id;
    let autoOptionLabel = '';
    let isRedFlag = false;

    if (currentQuestion.isMultiSelect) {
      const defaultIds = currentQuestion.demoSelectedOptionIds || ['bloating', 'burping'];
      const labels = defaultIds.map(id => {
        const found = currentQuestion.touchOptions.find(o => o.id === id);
        return found ? (language === 'hi' ? found.labelHindi : language === 'mr' ? found.labelMarathi : found.label) : id;
      });
      autoOptionLabel = labels.join(', ');
      setActiveVoiceInput('voice');
      setActiveTranscript(demoStatement, false);
      setActiveSelectedOptions(labels, false);
    } else if (currentQuestion.isScale) {
      const scaleOption = currentQuestion.touchOptions.find(o => o.id === 'sev_6') || currentQuestion.touchOptions[5];
      autoOptionId = scaleOption.id;
      autoOptionLabel = language === 'hi' ? scaleOption.labelHindi : language === 'mr' ? scaleOption.labelMarathi : scaleOption.label;
      setActiveVoiceInput('voice');
      setActiveTranscript(demoStatement, false);
      setActiveSelectedOption(autoOptionLabel, false);
    } else {
      const targetOpt = currentQuestion.touchOptions.find(o => o.id === autoOptionId) || currentQuestion.touchOptions[0];
      autoOptionLabel = language === 'hi' ? targetOpt.labelHindi : language === 'mr' ? targetOpt.labelMarathi : targetOpt.label;
      isRedFlag = targetOpt.isRedFlag;
      setActiveVoiceInput('voice');
      setActiveTranscript(demoStatement, isRedFlag);
      setActiveSelectedOption(autoOptionLabel, isRedFlag);
    }

    navigate('/patient/voice/processing', {
      state: {
        questionId: currentQuestionId,
        questionIndex,
        method: 'voice',
        touchText: demoStatement,
        touchOptionId: autoOptionId,
        isRedFlag,
        questionPrompt: currentQuestionText,
      },
    });
  };

  const handleTouchContinue = () => {
    if (currentQuestion.isMultiSelect) {
      if (selectedMultiOptions.length === 0) return;
      const chosenLabels = selectedMultiOptions.map(id => {
        const opt = currentQuestion.touchOptions.find(o => o.id === id);
        return opt ? (language === 'hi' ? opt.labelHindi : language === 'mr' ? opt.labelMarathi : opt.label) : id;
      });
      const isRedFlag = selectedMultiOptions.some(id => {
        const opt = currentQuestion.touchOptions.find(o => o.id === id);
        return opt?.isRedFlag;
      });

      const joinedText = chosenLabels.join(', ');
      setActiveVoiceInput('touch');
      setActiveTranscript(joinedText, isRedFlag);
      setActiveSelectedOptions(chosenLabels, isRedFlag);

      navigate('/patient/voice/processing', {
        state: {
          questionId: currentQuestionId,
          questionIndex,
          method: 'touch',
          touchText: joinedText,
          touchOptionId: selectedMultiOptions.join(','),
          isRedFlag,
          questionPrompt: currentQuestionText,
        },
      });
    } else if (currentQuestion.isScale) {
      if (selectedSeverity === null) return;
      const opt = currentQuestion.touchOptions.find(o => o.id === `sev_${selectedSeverity}`) || currentQuestion.touchOptions[selectedSeverity - 1];
      const chosenText = opt ? (language === 'hi' ? opt.labelHindi : language === 'mr' ? opt.labelMarathi : opt.label) : `${selectedSeverity}/10`;
      const isRedFlag = selectedSeverity >= 9;

      setActiveVoiceInput('touch');
      setActiveTranscript(chosenText, isRedFlag);
      setActiveSelectedOption(chosenText, isRedFlag);

      navigate('/patient/voice/processing', {
        state: {
          questionId: currentQuestionId,
          questionIndex,
          method: 'touch',
          touchText: chosenText,
          touchOptionId: `sev_${selectedSeverity}`,
          isRedFlag,
          questionPrompt: currentQuestionText,
        },
      });
    } else {
      if (!selectedTouchOption) return;
      const chosenText =
        language === 'hi'
          ? selectedTouchOption.labelHindi
          : language === 'mr'
            ? selectedTouchOption.labelMarathi
            : selectedTouchOption.label;

      setActiveVoiceInput('touch');
      setActiveTranscript(chosenText, selectedTouchOption.isRedFlag);
      setActiveSelectedOption(selectedTouchOption.label, selectedTouchOption.isRedFlag);

      navigate('/patient/voice/processing', {
        state: {
          questionId: currentQuestionId,
          questionIndex,
          method: 'touch',
          touchText: chosenText,
          touchOptionId: selectedTouchOption.id,
          isRedFlag: selectedTouchOption.isRedFlag,
          questionPrompt: currentQuestionText,
        },
      });
    }
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      setVoiceQuestionIndex(questionIndex - 1);
    } else {
      navigate('/patient/chief-complaint');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useKioskScreen({
    onBack: handleBack,
    audioPrompt: currentQuestionEnglish,
  });

  const hasSelection =
    currentQuestion.isMultiSelect
      ? selectedMultiOptions.length > 0
      : currentQuestion.isScale
        ? selectedSeverity !== null
        : selectedTouchOption !== null;

  return (
    <div className="w-full max-w-5xl mx-auto py-1 flex flex-col justify-between">
      {/* Question Header Card */}
      <GlassCard className="p-3 mb-2 flex items-start gap-3 border-medigreen-200/80 bg-gradient-to-r from-medigreen-50/50 via-white/90 to-teal-50/50 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medigreen-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-sm">
          Q{turnNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-medigreen-800 bg-medigreen-100/70 px-2 py-0.5 rounded-full border border-medigreen-300">
              CLINICAL CASE-TAKING AI
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              Question {turnNumber} of {STOMACH_QUESTIONS.length}
            </span>
            {currentQuestion.isMultiSelect && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-mediblue-700 bg-mediblue-50 px-2 py-0.5 rounded-full border border-mediblue-200">
                Multi-Select
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-navy-900 font-devanagari leading-snug">
            {currentQuestionText}
          </h2>
          {language !== 'en' && (
            <p className="text-xs text-slate-500 mt-0.5 italic">
              {currentQuestionEnglish}
            </p>
          )}
        </div>
      </GlassCard>

      {/* Dual Input Area: Voice (Left) vs Touch Options (Right) */}
      <div className="grid grid-cols-12 gap-3.5 items-start">
        {/* Voice Input Card (5 cols) */}
        <GlassCard className="col-span-12 lg:col-span-5 p-4 flex flex-col items-center justify-between text-center border-medigreen-300/80 h-[340px] shadow-sm">
          {!isRecording && !isRequesting ? (
            <>
              <div
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-medigreen-600 to-teal-600 text-white flex items-center justify-center my-auto shadow-lg shadow-medigreen-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                onClick={handleStartListening}
              >
                <Mic className="w-9 h-9 group-hover:animate-pulse" />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-navy-900 font-devanagari mb-0.5">
                  {language === 'hi' ? 'बोलने के लिए माइक दबाएं' : language === 'mr' ? 'बोलण्यासाठी येथे दाबा' : 'Tap to Speak'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'अपनी भाषा में खुलकर बताएं' : language === 'mr' ? 'आपल्या भाषेत सहज बोला' : 'Speak clearly in your preferred language'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartListening}
                className="w-full bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{t('voice.tapToSpeak')}</span>
              </button>

              {/* Demo Mode: Context-aware simulation button */}
              <button
                type="button"
                onClick={handleSimulateDemoVoice}
                className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                <span>Simulate Demo Voice Statement</span>
              </button>

              {recordError && (
                <div className="w-full bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2 rounded-xl mt-2 flex items-center gap-2 text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{recordError}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Active Recording State */}
              <div className="flex flex-col items-center justify-center my-auto">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center animate-ping opacity-50 absolute inset-0" />
                  <div className="w-24 h-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 relative">
                    <Mic className="w-10 h-10 animate-bounce" />
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5 justify-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Listening ({formatDuration(duration)})
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">Please speak your symptoms clearly</p>
                </div>
              </div>

              {/* Stop / Analyze Button */}
              <button
                type="button"
                onClick={handleStopListening}
                disabled={isStopping}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{isStopping ? 'Processing...' : 'Done Speaking (Analyze)'}</span>
              </button>
            </>
          )}
        </GlassCard>

        {/* Touch Options Card (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-between h-[340px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-mediblue-600" />
              <span>
                {currentQuestion.isMultiSelect
                  ? 'Select all symptoms that apply:'
                  : currentQuestion.isScale
                    ? 'Select severity level (1 to 10):'
                    : 'Or Select Option Below:'}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {currentQuestion.isMultiSelect ? 'Multi-Select' : 'Quick Touch Selection'}
            </span>
          </div>

          {/* Render Severity Scale (Q5) */}
          {currentQuestion.isScale ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2">
                {touchOptions.map((opt, idx) => {
                  const num = idx + 1;
                  const isSelected = selectedSeverity === num;
                  const label = language === 'hi' ? opt.labelHindi : language === 'mr' ? opt.labelMarathi : opt.label;
                  const isSevere = num >= 7;
                  const isModerate = num >= 4 && num < 7;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSeveritySelect(num)}
                      className={`p-2 rounded-xl border-2 text-center transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center min-h-[58px] ${
                        isSelected
                          ? isSevere
                            ? 'border-rose-500 bg-rose-500 text-white shadow-md'
                            : isModerate
                              ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                              : 'border-medigreen-600 bg-medigreen-600 text-white shadow-md'
                          : isSevere
                            ? 'border-rose-200 bg-rose-50/40 text-rose-900 hover:border-rose-300'
                            : isModerate
                              ? 'border-amber-200 bg-amber-50/40 text-amber-900 hover:border-amber-300'
                              : 'border-slate-200 bg-white text-navy-900 hover:border-medigreen-300'
                      }`}
                    >
                      <span className="text-sm font-black font-mono leading-none block">{num}</span>
                      <span className={`text-[9px] font-bold mt-1 line-clamp-1 leading-tight ${
                        isSelected ? 'text-white' : 'text-slate-500'
                      }`}>
                        {label.split('—')[1]?.trim() || label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Intensity Indicator Card */}
              {selectedSeverity !== null && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${
                      selectedSeverity >= 7 ? 'text-rose-500' : selectedSeverity >= 4 ? 'text-amber-500' : 'text-medigreen-600'
                    }`} />
                    <span className="text-xs font-bold text-navy-900">
                      Selected Severity: {selectedSeverity}/10 — {touchOptions[selectedSeverity - 1]?.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : currentQuestion.isMultiSelect ? (
            /* Render Multi-Select Options (Q4) */
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto content-start pr-1">
              {touchOptions.map((option) => {
                const isSelected = selectedMultiOptions.includes(option.id);
                const label = language === 'hi' ? option.labelHindi : language === 'mr' ? option.labelMarathi : option.label;
                const sublabel = language === 'hi' ? (option.sublabelHindi || option.sublabel) : language === 'mr' ? (option.sublabelMarathi || option.sublabel) : option.sublabel;

                return (
                  <SmartOptionCard
                    key={option.id}
                    id={`option-${option.id}`}
                    label={label}
                    sublabel={sublabel}
                    isSelected={isSelected}
                    isMultiSelect={true}
                    isRedFlag={option.isRedFlag}
                    onClick={() => handleMultiSelectToggle(option)}
                  />
                );
              })}
            </div>
          ) : (
            /* Render Single Select Options (Q1, Q2, Q3, Q6, Q7, Q8) */
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto content-start pr-1">
              {touchOptions.map((option) => {
                const isSelected = selectedTouchOption?.id === option.id;
                const label = language === 'hi' ? option.labelHindi : language === 'mr' ? option.labelMarathi : option.label;
                const sublabel = language === 'hi' ? (option.sublabelHindi || option.sublabel) : language === 'mr' ? (option.sublabelMarathi || option.sublabel) : option.sublabel;

                return (
                  <SmartOptionCard
                    key={option.id}
                    id={`option-${option.id}`}
                    label={label}
                    sublabel={sublabel}
                    isSelected={isSelected}
                    isRedFlag={option.isRedFlag}
                    onClick={() => handleTouchSelect(option)}
                  />
                );
              })}
            </div>
          )}

          {/* Continue Button when selection exists */}
          {hasSelection && (
            <button
              type="button"
              onClick={handleTouchContinue}
              className="mt-2 w-full bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>
                {currentQuestion.isMultiSelect
                  ? `Continue with ${selectedMultiOptions.length} Selected Symptom${selectedMultiOptions.length > 1 ? 's' : ''}`
                  : 'Continue with Selected Option'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}