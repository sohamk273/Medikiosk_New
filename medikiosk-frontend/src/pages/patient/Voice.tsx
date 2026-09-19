import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  AlertCircle,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useAudioRecorder } from '@/services/voice/useAudioRecorder';
import { VOICE_QUESTIONS } from '@/services/voice/MockVoiceProvider';
import type { TouchOption } from '@/services/voice/MockVoiceProvider';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

const INITIAL_QUESTION = {
  id: 'q1_chief_complaint',
  question: 'What brings you to the clinic today? Please describe your symptoms.',
  questionHindi: 'आज आप अस्पताल किस तकलीफ़ के लिए आए हैं? कृपया अपने लक्षण बताएं।',
  questionMarathi: 'आज आपण दवाखान्यात कोणत्या त्रासासाठी आला आहात? कृपया आपली लक्षणे सांगा.',
  audioPromptEnglish: 'Please describe what health issues you are experiencing today.',
  audioPromptHindi: 'कृपया बताएं कि आपको आज क्या तकलीफ़ या समस्या हो रही है।',
  audioPromptMarathi: 'कृपया सांगा की आपल्याला आज काय त्रास किंवा समस्या होत आहे.',
  touchOptions: [
    { id: 'fever', label: 'Fever / High Temperature', labelHindi: 'बुखार / तेज ताप', labelMarathi: 'ताप / अंग गरम', isRedFlag: false },
    { id: 'stomach_pain', label: 'Stomach / Abdominal Pain', labelHindi: 'पेट दर्द / मरोड़', labelMarathi: 'पोटदुखी / पोटात दुखणे', isRedFlag: false },
    { id: 'chest_pain', label: 'Chest Pain / Tightness', labelHindi: 'सीने में दर्द / भारीपन', labelMarathi: 'छातीत दुखणे / कळ', isRedFlag: true },
    { id: 'headache', label: 'Severe Headache / Dizziness', labelHindi: 'सिर दर्द / चक्कर', labelMarathi: 'डोकेदुखी / चक्कर', isRedFlag: false },
    { id: 'cough', label: 'Cough / Cold / Throat Pain', labelHindi: 'खांसी / जुकाम / गला दर्द', labelMarathi: 'खोकला / सर्दी / घसा दुखणे', isRedFlag: false },
    { id: 'vomiting', label: 'Vomiting / Loose Motion', labelHindi: 'उल्टी / दस्त', labelMarathi: 'उलटी / जुलाब', isRedFlag: false },
  ],
};

export default function Voice() {
  const navigate = useNavigate();
  const {
    language,
    voiceIntake,
    lastClinicalTurn,
    currentConversationTurn,
    setActiveVoiceInput,
    setActiveTranscript,
    setActiveSelectedOption,
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

  const [selectedTouchOption, setSelectedTouchOption] = useState<TouchOption | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stopRequestedRef = useRef(false);

  // Dynamic clinical question selection from Stage 4/5 orchestrator
  const turnNumber = currentConversationTurn || 1;
  const hasPriorTurn = lastClinicalTurn !== null && turnNumber > 1;

  const currentQuestionText = hasPriorTurn
    ? (language === 'hi' || language === 'mr'
        ? (lastClinicalTurn.next_question_regional || lastClinicalTurn.next_question)
        : lastClinicalTurn.next_question)
    : (language === 'hi'
        ? INITIAL_QUESTION.questionHindi
        : language === 'mr'
        ? INITIAL_QUESTION.questionMarathi
        : INITIAL_QUESTION.question);

  const currentQuestionHindi = hasPriorTurn
    ? (lastClinicalTurn.next_question_regional || lastClinicalTurn.next_question)
    : INITIAL_QUESTION.questionHindi;

  const currentQuestionMarathi = hasPriorTurn
    ? (lastClinicalTurn.next_question_regional || lastClinicalTurn.next_question)
    : INITIAL_QUESTION.questionMarathi;

  const currentQuestionEnglish = hasPriorTurn
    ? lastClinicalTurn.next_question
    : INITIAL_QUESTION.question;

  const currentQuestionId = hasPriorTurn
    ? `q_${lastClinicalTurn.next_question_type.toLowerCase()}`
    : INITIAL_QUESTION.id;

  // Touch options fallback
  const fallbackIndex = Math.min(voiceIntake.currentQuestionIndex, VOICE_QUESTIONS.length - 1);
  const touchOptions = hasPriorTurn
    ? (VOICE_QUESTIONS[fallbackIndex]?.touchOptions || INITIAL_QUESTION.touchOptions)
    : INITIAL_QUESTION.touchOptions;

  const handleStartListening = async () => {
    setSelectedTouchOption(null);
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
      if (audioBlob && audioBlob.size > 0) {
        setIsTransitioning(true);
        navigate('/patient/voice/processing', {
          state: {
            questionId: currentQuestionId,
            questionIndex: turnNumber - 1,
            method: 'voice',
            audioBlob,
            questionPrompt: currentQuestionText,
          },
        });
      } else {
        // Fallback transition
        setIsTransitioning(true);
        navigate('/patient/voice/processing', {
          state: {
            questionId: currentQuestionId,
            questionIndex: turnNumber - 1,
            method: 'voice',
            questionPrompt: currentQuestionText,
          },
        });
      }
    } catch (err) {
      console.warn('Microphone stop error:', err);
      setIsTransitioning(true);
      navigate('/patient/voice/processing', {
        state: {
          questionId: currentQuestionId,
          questionIndex: turnNumber - 1,
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

  const handleTouchContinue = () => {
    if (!selectedTouchOption) return;

    const chosenText =
      language === 'hi'
        ? selectedTouchOption.labelHindi
        : language === 'mr'
        ? selectedTouchOption.labelMarathi
        : selectedTouchOption.label;

    setActiveVoiceInput('touch');
    setActiveTranscript(chosenText, selectedTouchOption.isRedFlag);
    setActiveSelectedOption(selectedTouchOption.id, selectedTouchOption.isRedFlag);

    navigate('/patient/voice/processing', {
      state: {
        questionId: currentQuestionId,
        questionIndex: turnNumber - 1,
        method: 'touch',
        touchText: chosenText,
        touchOptionId: selectedTouchOption.id,
        isRedFlag: selectedTouchOption.isRedFlag,
        questionPrompt: currentQuestionText,
      },
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const globalStep = 10;

  useKioskScreen({
    onBack: () => navigate('/patient/chief-complaint'),
    audioPrompt:
      language === 'hi'
        ? currentQuestionHindi
        : language === 'mr'
        ? currentQuestionMarathi
        : currentQuestionEnglish,
  });

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={globalStep}
        total={24}
        title={t('voice.title')}
        badge={`Question ${turnNumber} of assessment`}
      />

      <div className="max-w-7xl mx-auto px-6 pt-4 pb-32">
        {/* Dynamic Question Header Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-xl font-bold">Q{turnNumber}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                ACTIVE PATIENT SYMPTOM INTAKE
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Conversational Turn {turnNumber}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 font-devanagari leading-snug">
              {currentQuestionText}
            </h2>
            {language !== 'en' && (
              <p className="text-sm text-slate-500 mt-1 italic">
                {currentQuestionEnglish}
              </p>
            )}
          </div>
        </div>

        <AudioGuidanceBanner
          englishText="Speak your answer clearly into the microphone or tap an answer option on the right."
          regionalText={
            language === 'hi'
              ? 'कृपया अपना उत्तर माइक में स्पष्ट बोलें या दाईं ओर दिए गए विकल्पों में से चुनें।'
              : language === 'mr'
              ? 'कृपया आपले उत्तर माईकमध्ये स्पष्ट बोला किंवा उजवीकडील पर्यायांपैकी एक निवडा.'
              : undefined
          }
        />

        {/* Dual Input Area: Voice vs Touch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Voice Input Card (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#F0FDF9] to-white rounded-3xl p-8 border-2 border-[#0D9488]/30 shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden">
            {!isRecording && !isRequesting ? (
              <>
                <div
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#064E3B] to-[#0D9488] text-white flex items-center justify-center mb-6 shadow-xl shadow-teal-900/20 hover:scale-105 transition-transform cursor-pointer"
                  onClick={handleStartListening}
                >
                  <Mic className="w-12 h-12 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 font-devanagari">
                  {language === 'hi' ? 'बोलने के लिए यहाँ दबाएं' : language === 'mr' ? 'बोलण्यासाठी येथे दाबा' : 'Tap to Speak'}
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs">
                  {language === 'hi' ? 'अपनी भाषा (हिंदी/मराठी/अंग्रेजी) में स्पष्ट बोलें' : language === 'mr' ? 'आपल्या भाषेत (मराठी/हिंदी/इंग्रजी) स्पष्ट बोला' : 'Speak naturally in Hindi, Marathi, or English'}
                </p>

                <button
                  type="button"
                  onClick={handleStartListening}
                  className="bg-[#064E3B] hover:bg-[#053F30] text-white font-bold text-base px-8 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 mb-4"
                >
                  <Sparkles className="w-5 h-5 text-teal-300" />
                  <span>{t('voice.tapToSpeak')}</span>
                </button>

                {recordError && (
                  <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4 flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Microphone Notice</p>
                      <p className="mt-0.5">{recordError}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <span className="text-[#0D9488] font-bold">●</span>
                  <span>Hindi • Marathi • English</span>
                </div>
              </>
            ) : isRequesting ? (
              <>
                <div className="w-28 h-28 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse mb-4 shadow-xl shadow-amber-500/30">
                  <Volume2 className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Requesting Microphone...
                </h3>
                <p className="text-xs text-slate-500">
                  Please grant browser microphone permission if prompted.
                </p>
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-full bg-red-500 animate-pulse flex items-center justify-center shadow-xl shadow-red-500/30">
                    <Mic className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>RECORDING • {formatDuration(duration)}</span>
                </div>
                <p className="text-slate-600 text-xs mb-4 font-medium">
                  {language === 'hi' ? 'कृपया स्पष्ट बोलें...' : language === 'mr' ? 'कृपया स्पष्ट बोला...' : 'Please speak naturally...'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStopListening}
                    disabled={isStopping || isTransitioning}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
                  >
                    <MicOff className="w-5 h-5" />
                    <span>{isStopping || isTransitioning ? 'Processing...' : t('voice.doneSpeaking')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-3 rounded-2xl transition-all"
                    title="Cancel recording"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Touch Options Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('voice.orTapAnswer')}
                </span>
                <span className="text-xs text-slate-400">
                  {touchOptions.length} options available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {touchOptions.map((option: TouchOption) => {
                  const isSelected = selectedTouchOption?.id === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleTouchSelect(option)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between min-h-[90px] ${
                        isSelected
                          ? 'border-[#064E3B] bg-emerald-50/60 shadow-sm'
                          : option.isRedFlag
                          ? 'border-red-100 bg-red-50/30 hover:border-red-300'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-sm font-bold font-devanagari ${
                          isSelected ? 'text-[#064E3B]' : option.isRedFlag ? 'text-red-700' : 'text-slate-800'
                        }`}>
                          {language === 'hi'
                            ? option.labelHindi
                            : language === 'mr'
                            ? option.labelMarathi
                            : option.label}
                        </span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#064E3B] text-white'
                            : option.isRedFlag
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : option.isRedFlag ? <AlertCircle className="w-3.5 h-3.5" /> : '+'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {language !== 'en' ? option.label : option.labelHindi}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedTouchOption && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-[#064E3B]">{t('voice.confirmSelection')}:</span>{' '}
                  {language === 'hi' ? selectedTouchOption.labelHindi : selectedTouchOption.label}
                </div>
                <button
                  type="button"
                  onClick={handleTouchContinue}
                  className="bg-[#064E3B] hover:bg-[#053F30] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <span>{t('common.continue')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
