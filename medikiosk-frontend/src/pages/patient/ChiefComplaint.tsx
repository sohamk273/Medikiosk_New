import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Thermometer, Wind, Zap, Droplets, HeartPulse, Sparkles, CheckCircle2, PlusCircle, Activity, Square, Loader2, RefreshCcw, Check } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAudioRecorder } from '@/services/voice/useAudioRecorder';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';

interface Symptom {
  id: string;
  icon: React.ReactNode;
  hi: string;
  en: string;
  mr: string;
}

const SYMPTOMS: Symptom[] = [
  { id: 'pain', icon: <Activity className="w-6 h-6" />, hi: 'दर्द / वेदना', en: 'Body Pain / Headache', mr: 'अंगदुखी / डोकेदुखी' },
  { id: 'fever', icon: <Thermometer className="w-6 h-6" />, hi: 'बुखार / ताप', en: 'Fever & Chills', mr: 'ताप / थंडी' },
  { id: 'cough', icon: <Wind className="w-6 h-6" />, hi: 'खांसी / खोकला', en: 'Cough, Cold & Flu', mr: 'खोकला / सर्दी' },
  { id: 'stomach', icon: <Droplets className="w-6 h-6" />, hi: 'पेट / पचन', en: 'Stomach & Digestion', mr: 'पोटदुखी / पचन' },
  { id: 'weakness', icon: <Zap className="w-6 h-6" />, hi: 'कमजोरी / थकवा', en: 'Weakness / Fatigue', mr: 'थकवा / अशक्तपणा' },
  { id: 'skin', icon: <Sparkles className="w-6 h-6" />, hi: 'त्वचा / ऍलर्जी', en: 'Skin Rash & Allergy', mr: 'त्वचा / ऍलर्जी' },
  { id: 'breathing', icon: <HeartPulse className="w-6 h-6" />, hi: 'श्वास / छातीत त्रास', en: 'Breathing / Chest', mr: 'श्वास / छातीत त्रास' },
  { id: 'other', icon: <Activity className="w-6 h-6" />, hi: 'अन्य लक्षणे', en: 'Other Symptoms', mr: 'इतर लक्षणे' },
];

export default function ChiefComplaint() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { chiefComplaint, setChiefComplaint } = usePatientSession();
  const { guidedAssistMode, setCustomTarget } = useSahayakAssist();

  const { duration, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (chiefComplaint.primaryComplaint) {
      return chiefComplaint.primaryComplaint.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  });

  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing' | 'confirm'>('idle');
  const [transcribedText, setTranscribedText] = useState('');

  // Dynamic Sahayak Assist target
  useEffect(() => {
    if (!guidedAssistMode) return;
    if (selectedIds.length > 0 || chiefComplaint.voiceTranscript) {
      setCustomTarget(
        'sahayak-target-continue',
        {
          en: 'Symptom selected! Now tap Continue at the bottom right.',
          hi: 'लक्षण चुना गया! अब नीचे दाईं ओर आगे बढ़ें (Continue) पर टैप करें।',
          mr: 'लक्षण निवडले गेले! आता खाली उजवीकडे पुढे जा (Continue) वर टॅप करा.',
        },
        undefined,
        'top'
      );
    } else {
      setCustomTarget(
        'sahayak-target-symptoms',
        {
          en: 'Select what is troubling you today, or tap the microphone to speak.',
          hi: 'अपनी मुख्य स्वास्थ्य समस्या चुनें, या बोलने के लिए माइक पर टैप करें।',
          mr: 'आपली मुख्य आरोग्य समस्या निवडा, किंवा बोलण्यासाठी मायक्रोफोनवर टॅप करा.',
        },
        undefined,
        'top'
      );
    }
  }, [guidedAssistMode, selectedIds.length, chiefComplaint.voiceTranscript, setCustomTarget]);

  const toggleSymptom = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(s => s !== id)
      : [...selectedIds, id];
    setSelectedIds(next);

    // Save state to context but DO NOT navigate
    const labels = next.map(sid => {
      const s = SYMPTOMS.find(sy => sy.id === sid);
      return s ? s.en : sid; // Use EN as the canonical backend value
    });
    setChiefComplaint({ ...chiefComplaint, primaryComplaint: labels.join(', ') });
  };

  const handleStartVoice = async () => {
    setVoiceState('recording');
    await startRecording();
  };

  const handleStopVoice = async () => {
    setVoiceState('processing');
    await stopRecording();

    // Simulate API delay for transcription
    setTimeout(() => {
      setTranscribedText(
        language === 'hi' ? 'मुझे ५ दिन से पेट में जलन हो रही है और खाना खाने के बाद ज्यादा होती है।'
          : language === 'mr' ? 'मला ५ दिवसांपासून पोटात जळजळ होत आहे आणि जेवणानंतर जास्त होते.'
            : 'I have had a burning sensation in my stomach for 5 days, and it gets worse after eating.'
      );
      setVoiceState('confirm');
    }, 1500);
  };

  const handleAcceptVoice = () => {
    setChiefComplaint({ ...chiefComplaint, voiceTranscript: transcribedText });
    setVoiceState('idle'); // Return to idle so it's clean, or leave as confirmed
  };

  const handleRetryVoice = () => {
    resetRecording();
    setVoiceState('idle');
    setTranscribedText('');
  };

  const handleContinue = () => {
    // Only navigate to Question 1 when Continue is explicitly pressed
    navigate('/patient/voice');
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: () => navigate('/patient/profile'),
    audioPrompt: t('chiefComplaint.audioGuidance') || 'Tap the microphone to speak, or select a common symptom card below.',
  });

  const getPrimaryLabel = (symptom: Symptom) => {
    if (language === 'hi') return symptom.hi;
    if (language === 'mr') return symptom.mr;
    return symptom.en;
  };

  const getSecondaryLabel = (symptom: Symptom) => {
    if (language === 'hi') return symptom.en;
    if (language === 'mr') return symptom.en;
    return '';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-3 flex flex-col justify-between">
      {/* Page Header */}
      <div className="mb-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {t('chiefComplaint.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          {t('chiefComplaint.subtitle')}
        </p>
      </div>

      {/* Two-column layout: Left Voice AI, Right 8 Symptoms */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* LEFT: Voice AI Mic Panel */}
        <div className="col-span-12 lg:col-span-4 h-full">
          <div className="w-full h-full relative bg-gradient-to-b from-medigreen-500/10 via-white/90 to-teal-500/10 rounded-2xl p-5 flex flex-col items-center justify-between border-2 border-medigreen-300 transition-all duration-300 shadow-md text-left min-h-[380px]">
            {/* Top Badges */}
            <div className="w-full flex items-center justify-between">
              <span className="bg-white/90 backdrop-blur-sm text-medigreen-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-medigreen-200 shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-medigreen-600" />
                VOICE AI ASSISTANT
              </span>
              <span className="text-mediblue-700 font-bold text-xs bg-mediblue-50 px-2 py-0.5 rounded border border-mediblue-100">
                {language === 'en' ? 'EN' : 'अ/A'}
              </span>
            </div>

            {/* Voice States */}
            <div className="flex-1 flex flex-col items-center justify-center w-full py-4">

              {/* Idle State */}
              {voiceState === 'idle' && (
                <>
                  <button type="button" id="sahayak-target-mic" onClick={handleStartVoice} className="relative cursor-pointer group mb-4">
                    <div className="w-32 h-32 rounded-full bg-medigreen-200/50 flex items-center justify-center animate-pulse">
                      <div className="w-24 h-24 rounded-full bg-medigreen-400/40 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-medigreen-600 to-teal-600 flex items-center justify-center shadow-lg shadow-medigreen-600/30 group-hover:scale-110 transition-transform">
                          <Mic className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="text-center">
                    <p className="text-lg font-black text-navy-900 font-devanagari">{t('chiefComplaint.tapToSpeak')}</p>
                    <p className="text-slate-500 text-xs font-medium mt-1">{t('chiefComplaint.tapToSpeakSub')}</p>
                  </div>
                </>
              )}

              {/* Recording State */}
              {voiceState === 'recording' && (
                <>
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center animate-ping opacity-60 absolute inset-0 mx-auto my-auto" />
                    <div className="w-24 h-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 relative z-10">
                      <Mic className="w-10 h-10 animate-bounce" />
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5 justify-center mb-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Listening ({formatDuration(duration)})
                    </span>
                    <p className="text-slate-500 text-xs font-medium">Please speak your symptoms clearly...</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopVoice}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Done Speaking</span>
                  </button>
                </>
              )}

              {/* Processing State */}
              {voiceState === 'processing' && (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-medigreen-600 animate-spin mb-4" />
                  <p className="text-navy-900 font-bold text-sm">Processing Audio...</p>
                  <p className="text-slate-500 text-xs mt-1">Transcribing your symptoms</p>
                </div>
              )}

              {/* Confirm State */}
              {voiceState === 'confirm' && (
                <div className="flex flex-col w-full">
                  <span className="text-xs font-bold text-medigreen-700 uppercase tracking-wider mb-2">Captured Text</span>
                  <div className="bg-white border border-medigreen-200 rounded-xl p-4 shadow-inner mb-4 min-h-[80px] flex items-center justify-center">
                    <p className="text-sm font-bold text-navy-900 text-center leading-relaxed font-devanagari">
                      "{transcribedText}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetryVoice}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptVoice}
                      className="flex-1 bg-medigreen-600 hover:bg-medigreen-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Language Hint & Wave */}
            {voiceState === 'idle' && (
              <div className="w-full bg-white/80 rounded-xl p-2.5 border border-medigreen-200/80">
                <p className="text-slate-600 text-[11px] font-semibold flex items-center justify-between">
                  <span>{language === 'en' ? 'Voice & Touch AI' : 'Hindi · Marathi · English'}</span>
                  <span className="text-medigreen-700 font-bold">Live AI</span>
                </p>
                <div className="mt-2 flex items-end justify-center gap-1 h-3">
                  {[4, 8, 12, 16, 10, 14, 8, 12, 6, 10, 15, 7, 11, 5, 9].map((h, i) => (
                    <div key={i} className="w-1 bg-medigreen-600 rounded-full opacity-70" style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>
            )}

            {chiefComplaint.voiceTranscript && voiceState === 'idle' && (
              <div className="w-full bg-medigreen-50 rounded-xl p-3 border border-medigreen-200/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-medigreen-600 shrink-0" />
                <p className="text-xs text-medigreen-900 font-bold truncate">Voice complaint saved</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: 8 Symptom Cards */}
        <div className="col-span-12 lg:col-span-8 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-medigreen-600 inline-block" />
              <span>{t('chiefComplaint.orChoose')}</span>
            </p>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Touch Option Selection
            </span>
          </div>

          <div id="sahayak-target-symptoms" className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            {SYMPTOMS.map(symptom => {
              const isSelected = selectedIds.includes(symptom.id);
              const primaryLabel = getPrimaryLabel(symptom);
              const secondaryLabel = getSecondaryLabel(symptom);

              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`relative rounded-[16px] p-3 text-left border-2 transition-all flex flex-col justify-between h-[120px] active:scale-95 cursor-pointer shadow-sm ${isSelected
                      ? 'border-medigreen-500 bg-medigreen-50/90 ring-1 ring-medigreen-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)] -translate-y-0.5'
                      : 'border-slate-200/80 bg-white hover:border-medigreen-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-medigreen-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {symptom.icon}
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-medigreen-600 fill-medigreen-100 drop-shadow-sm" />
                    ) : (
                      <PlusCircle className="w-5 h-5 text-slate-300 hover:text-medigreen-400 transition-colors" />
                    )}
                  </div>

                  <div className="mt-auto">
                    <p className={`text-xs font-extrabold leading-tight font-devanagari transition-colors ${isSelected ? 'text-medigreen-900' : 'text-navy-900'
                      }`}>
                      {primaryLabel}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-1 leading-tight font-medium">
                      {secondaryLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selection summary bar */}
          <div className="mt-4 min-h-[44px]">
            {selectedIds.length > 0 && (
              <GlassCard className="p-3 flex items-center justify-between border-medigreen-300/80 bg-medigreen-50/60 shadow-sm rounded-xl animate-in slide-in-from-bottom-2 fade-in">
                <div className="flex items-center gap-2 text-medigreen-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-medigreen-600 shrink-0" />
                  <span>
                    {selectedIds.length === 1 ? '1 symptom selected' : `${selectedIds.length} symptoms selected`}
                  </span>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}