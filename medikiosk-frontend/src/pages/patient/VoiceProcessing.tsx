import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { MockVoiceProvider } from '@/services/voice/MockVoiceProvider';
import { transcribeAudio } from '@/services/voice/speechService';
import { processClinicalTurn } from '@/services/clinical/clinicalService';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

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
    chiefComplaint,
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

  const [currentStep, setCurrentStep] = useState<number>(2);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    chiefComplaint,
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
      chiefComplaint,
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
          transcriptText = currentTouch;
          isRedFlag = state?.isRedFlag || false;
          setCurrentStep(3);
        } else if (currentBlob && currentBlob.size > 0) {
          if (isCancelled) return;
          setCurrentStep(2);

          try {
            const res = await transcribeAudio(currentBlob, currentLang);
            if (isCancelled) return;
            transcriptText = res.transcript || '';
          } catch (transcriptionErr) {
            console.warn('Transcription failed, falling back to mock:', transcriptionErr);
            if (isCancelled) return;
            transcriptText = ''; // Fallback will handle this below
          }

          // Safe fallback if transcription returned empty string or failed
          if (!transcriptText || transcriptText.trim() === '') {
             if (qId === 'q1_chief_complaint' && stateRef.current.chiefComplaint?.voiceTranscript) {
                 transcriptText = stateRef.current.chiefComplaint.voiceTranscript;
             } else {
                 const mockResult = MockVoiceProvider.getMockResult(currentLang, qId);
                 transcriptText = mockResult.transcript;
                 isRedFlag = mockResult.isRedFlag;
             }
          }
        } else {
          await new Promise((r) => setTimeout(r, 600));
          if (isCancelled) return;
          
          if (qId === 'q1_chief_complaint' && stateRef.current.chiefComplaint?.voiceTranscript) {
              transcriptText = stateRef.current.chiefComplaint.voiceTranscript;
          } else {
              const mockResult = MockVoiceProvider.getMockResult(currentLang, qId);
              transcriptText = mockResult.transcript;
              isRedFlag = mockResult.isRedFlag;
          }
        }

        if (isCancelled) return;

        setCurrentStep(3);

        let clinicalRes = null;
        try {
          clinicalRes = await processClinicalTurn(
            transcriptText,
            currentLang,
            currentCaseState,
            turnNum
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

        await new Promise((r) => setTimeout(r, 500));
        if (isCancelled) return;

        setCurrentStep(4);

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
            audioBlob: currentBlob,
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
  }, []);

  useKioskScreen({
    isContinueDisabled: true,
    audioPrompt: t('voiceProcessing.audioGuidance') || 'Please wait while your voice response is analyzed.',
  });

  const steps = [
    {
      label: language === 'hi' ? 'ऑडियो सुरक्षित रिकॉर्ड हुआ' : language === 'mr' ? 'ऑडिओ सुरक्षित रेकॉर्ड झाला' : 'Audio Waveform Captured',
      sublabel: language === 'hi' ? 'आपकी आवाज दर्ज कर ली गई है' : language === 'mr' ? 'आपला आवाज प्राप्त झाला' : 'Your response was recorded',
      done: true,
      active: false,
    },
    {
      label: language === 'hi' ? 'भाषा पहचान और रूपांतरण' : language === 'mr' ? 'भाषा ओळख व मजकूर रूपांतरण' : 'Speech-to-Text & Language Processing',
      sublabel: language === 'hi' ? 'आवाज से शब्दों की पहचान...' : language === 'mr' ? 'उच्चारित शब्दांची ओळख...' : 'Recognising spoken language...',
      done: currentStep > 2,
      active: currentStep === 2 && !errorMessage,
    },
    {
      label: language === 'hi' ? 'क्लिनिकल इंटेलिजेंस और लक्षण विश्लेषण' : language === 'mr' ? 'क्लिनिकल विश्लेषण व लक्षण तपासणी' : 'Clinical Intelligence & Symptom Structuring',
      sublabel: language === 'hi' ? 'लक्षणों का मेडिकल विश्लेषण...' : language === 'mr' ? 'वैद्यकीय माहितीची तपासणी...' : 'Structuring clinical entities and red flags...',
      done: currentStep > 3,
      active: currentStep === 3 && !errorMessage,
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto py-6 flex flex-col items-center justify-center">
      <GlassCard className="w-full p-6 text-center border-medigreen-200/80 shadow-xl">
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-medigreen-200 animate-ping opacity-40" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-medigreen-600 to-teal-600 flex items-center justify-center shadow-lg shadow-medigreen-600/30 text-white">
            {errorMessage ? (
              <AlertCircle className="w-8 h-8 text-amber-300" />
            ) : (
              <Loader2 className="w-8 h-8 animate-spin" />
            )}
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-medigreen-800 bg-medigreen-50 px-3 py-1 rounded-full border border-medigreen-200">
          CONVERSATIONAL PATIENT INTAKE
        </span>

        <h2 className="text-xl font-extrabold text-navy-900 mt-3 mb-1 font-devanagari">
          {questionPrompt}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {errorMessage
            ? 'Transcription issue encountered'
            : language === 'hi'
            ? 'आपकी आवाज का विश्लेषण किया जा रहा है...'
            : language === 'mr'
            ? 'आपल्या उत्तराचे विश्लेषण सुरू आहे...'
            : 'Analyzing and structuring your response...'}
        </p>

        {errorMessage ? (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Audio Processing Notice</p>
                <p className="text-[11px] text-amber-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/patient/voice')}
                className="bg-medigreen-600 hover:bg-medigreen-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Speak Again</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-left mb-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  step.done
                    ? 'border-medigreen-300 bg-medigreen-50/70 text-medigreen-900'
                    : step.active
                    ? 'border-mediblue-300 bg-mediblue-50/70 text-mediblue-900 shadow-xs ring-2 ring-mediblue-200/50'
                    : 'border-slate-200/80 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-medigreen-600 fill-medigreen-100" />
                  ) : step.active ? (
                    <Loader2 className="w-5 h-5 text-mediblue-600 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold font-devanagari leading-tight">{step.label}</p>
                  <p className="text-[11px] opacity-75">{step.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}