import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { MockVoiceProvider } from '@/services/voice/MockVoiceProvider';
import { transcribeAudio } from '@/services/voice/speechService';
import { processClinicalTurn } from '@/services/clinical/clinicalService';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { Loader2, CheckCircle2, Mic, AlertCircle, RefreshCw } from 'lucide-react';

export default function VoiceProcessing() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    language,
    addVoiceResponse,
    setActiveVoiceInput,
    setActiveTranscript,
    clinicalCaseState,
    updateClinicalCase,
    addConversationTurn,
    currentConversationTurn,
  } = usePatientSession();
  const { t } = useTranslation();

  const state = location.state as {
    questionId?: string;
    questionIndex?: number;
    method?: 'voice' | 'touch';
    audioBlob?: Blob;
    touchText?: string;
    touchOptionId?: string;
    isRedFlag?: boolean;
    questionPrompt?: string;
  } | null;

  const questionId = state?.questionId || 'q1_chief_complaint';
  const questionIndex = state?.questionIndex ?? 0;
  const audioBlob = state?.audioBlob;
  const touchText = state?.touchText;
  const questionPrompt = state?.questionPrompt || 'Please describe your symptoms';
  const turnNum = (currentConversationTurn || 1);

  // Steps: 1 = Waveform captured, 2 = STT, 3 = Entity Extraction & Orchestration, 4 = Complete
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store latest state and action functions in a ref so the effect never restarts on re-renders
  const stateRef = useRef({
    language,
    audioBlob,
    touchText,
    questionId,
    questionIndex,
    questionPrompt,
    turnNum,
    clinicalCaseState,
    navigate,
    addVoiceResponse,
    setActiveVoiceInput,
    setActiveTranscript,
    updateClinicalCase,
    addConversationTurn,
  });

  useEffect(() => {
    stateRef.current = {
      language,
      audioBlob,
      touchText,
      questionId,
      questionIndex,
      questionPrompt,
      turnNum,
      clinicalCaseState,
      navigate,
      addVoiceResponse,
      setActiveVoiceInput,
      setActiveTranscript,
      updateClinicalCase,
      addConversationTurn,
    };
  });

  useEffect(() => {
    let isCancelled = false;

    async function process() {
      const {
        language: currentLang,
        audioBlob: currentBlob,
        touchText: currentTouch,
        questionId: qId,
        questionIndex: qIdx,
        questionPrompt: qPrompt,
        turnNum: cTurn,
        clinicalCaseState: currentCaseState,
        navigate: nav,
        addVoiceResponse: addResp,
        setActiveVoiceInput: setVoiceInput,
        setActiveTranscript: setTranscript,
        updateClinicalCase: updateCase,
        addConversationTurn: addTurn,
      } = stateRef.current;

      try {
        let transcriptText = '';
        let isRedFlag = false;

        if (currentTouch) {
          // Touch input method
          transcriptText = currentTouch;
          isRedFlag = state?.isRedFlag || false;
          setCurrentStep(3);
        } else if (currentBlob && currentBlob.size > 0) {
          // 1. Transcription step via backend API
          if (isCancelled) return;
          setCurrentStep(2);

          const res = await transcribeAudio(currentBlob, currentLang);
          if (isCancelled) return;

          transcriptText = res.transcript || '';
        } else {
          // Fallback mock progression
          await new Promise((r) => setTimeout(r, 600));
          if (isCancelled) return;
          const mockResult = MockVoiceProvider.getMockResult(currentLang, qId);
          transcriptText = mockResult.transcript;
          isRedFlag = mockResult.isRedFlag;
        }

        if (isCancelled) return;

        // 2. STT completed -> Activate Clinical Entity Extraction & Orchestration (Stage 4 & 5)
        setCurrentStep(3);

        let clinicalRes = null;
        try {
          clinicalRes = await processClinicalTurn(
            transcriptText,
            currentLang,
            currentCaseState
          );
          if (clinicalRes && updateCase) {
            updateCase(clinicalRes);
            if (clinicalRes.requires_emergency_attention) {
              isRedFlag = true;
            }
          }
        } catch (clinicalErr) {
          console.warn('Clinical turn orchestrator warning:', clinicalErr);
        }

        if (isCancelled) return;

        // Record conversational turn in session
        if (addTurn) {
          addTurn({
            turn: cTurn,
            question: qPrompt,
            question_type: clinicalRes?.next_question_type || 'GENERAL',
            patient_transcript: transcriptText,
            language: currentLang,
            timestamp: new Date().toISOString(),
          });
        }

        // Update central session context state
        setVoiceInput(currentTouch ? 'touch' : 'voice');
        setTranscript(transcriptText, isRedFlag);
        addResp({
          questionId: qId,
          question: qPrompt,
          questionHindi: qPrompt,
          inputMethod: currentTouch ? 'touch' : 'voice',
          transcript: transcriptText,
          confirmed: true,
          timestamp: new Date().toISOString(),
          isRedFlag,
        });

        // 3. Entity Extraction visual progress
        await new Promise((r) => setTimeout(r, 500));
        if (isCancelled) return;

        setCurrentStep(4);

        // 4. Smooth transition to VoiceConfirmation
        await new Promise((r) => setTimeout(r, 300));
        if (isCancelled) return;

        nav('/patient/voice/confirmation', {
          state: {
            questionId: qId,
            questionIndex: qIdx,
            method: currentTouch ? 'touch' : 'voice',
            nextQuestion: clinicalRes?.next_question,
            nextQuestionRegional: clinicalRes?.next_question_regional,
            nextQuestionType: clinicalRes?.next_question_type,
            isCaseComplete: clinicalRes?.is_case_complete,
            requiresEmergency: isRedFlag,
          },
          replace: true,
        });
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Voice processing pipeline error:', err);
        setErrorMessage(
          err?.message || 'Failed to process audio. You may re-record or use touch fallback.'
        );
      }
    }

    process();

    return () => {
      isCancelled = true;
    };
  }, []); // Run EXACTLY ONCE on component mount

  useKioskScreen({
    isContinueDisabled: true,
    audioPrompt: t('voiceProcessing.audioGuidance') || 'Please wait while your voice response is analyzed.',
  });

  const steps = [
    {
      label: language === 'hi' ? 'ऑडियो रिकॉर्डिंग प्राप्त हुई' : language === 'mr' ? 'ऑडिओ रेकॉर्डिंग प्राप्त झाली' : 'Audio Waveform Captured',
      sublabel: language === 'hi' ? 'आपकी आवाज दर्ज कर ली गई है' : language === 'mr' ? 'तुमचा आवाज रेकॉर्ड झाला आहे' : 'Your response was recorded',
      done: true,
      active: false,
    },
    {
      label: language === 'hi' ? 'वाणी पहचान और भाषा विश्लेषण' : language === 'mr' ? 'भाषण-ते-मजकूर आणि भाषा ओळख' : 'Speech-to-Text & Language Detection',
      sublabel: language === 'hi' ? 'भाषा पहचान की जा रही है...' : language === 'mr' ? 'भाषा ओळखली जात आहे...' : 'Recognising spoken language...',
      done: currentStep > 2,
      active: currentStep === 2 && !errorMessage,
    },
    {
      label: language === 'hi' ? 'नैदानिक बुद्धिमत्ता व लक्षण संरचना' : language === 'mr' ? 'वैद्यकीय माहिती व लक्षण रचना' : 'Clinical Intelligence & Case Structuring',
      sublabel: language === 'hi' ? 'लक्षण एवं रेड-फ्लैग विश्लेषण...' : language === 'mr' ? 'लक्षणे आणि तातडीचे विश्लेषण...' : 'Structuring clinical entities and red flags...',
      done: currentStep > 3,
      active: currentStep === 3 && !errorMessage,
    },
  ];

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
        {/* Animated Processing Header */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-50" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#064E3B] to-[#0D9488] flex items-center justify-center shadow-lg text-white">
            {errorMessage ? (
              <AlertCircle className="w-10 h-10 text-amber-300" />
            ) : (
              <Loader2 className="w-10 h-10 animate-spin" />
            )}
          </div>
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          CONVERSATIONAL PATIENT INTAKE
        </span>

        <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-1 font-devanagari">
          {questionPrompt}
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          {errorMessage
            ? 'Transcription issue encountered'
            : language === 'hi'
            ? 'आपके उत्तर का विश्लेषण किया जा रहा है...'
            : language === 'mr'
            ? 'तुमच्या उत्तराचे विश्लेषण केले जात आहे...'
            : 'Understanding your response...'}
        </p>

        {errorMessage ? (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Audio Processing Notice</p>
                <p className="text-xs text-amber-700 mt-1">{errorMessage}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/patient/voice')}
                className="bg-[#064E3B] hover:bg-[#053F30] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Speak Again</span>
              </button>
            </div>
          </div>
        ) : (
          /* Processing Steps Timeline */
          <div className="space-y-4 text-left mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              PROCESSING STEPS
            </div>
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  step.done
                    ? 'border-[#0D9488] bg-[#F0FDF9]'
                    : step.active
                    ? 'border-[#2563EB] bg-[#EFF6FF]'
                    : 'border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    step.done ? 'bg-[#0D9488]' : step.active ? 'bg-[#2563EB]' : 'bg-slate-200'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : step.active ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-xs font-bold text-slate-500">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <p className={`font-bold text-sm ${step.done ? 'text-[#0D9488]' : step.active ? 'text-[#1E40AF]' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs ${step.done || step.active ? 'text-slate-600' : 'text-slate-300'}`}>
                    {step.sublabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audio Wave Badge */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-center gap-3 text-xs text-slate-500">
          <Mic className="w-4 h-4 text-[#0D9488]" />
          <span>Live Audio Capture • {audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : 'Direct Input'}</span>
        </div>
      </div>
    </div>
  );
}
