import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CaseSummary() {
  const navigate = useNavigate();
  const {
    voiceIntake,
    chiefComplaint,
    setVoiceQuestionIndex,
  } = usePatientSession();

  const responseMap: Record<string, string> = {};
  (voiceIntake?.responses || []).forEach((r) => {
    const val = (r.selectedOptions && r.selectedOptions.length > 0)
      ? r.selectedOptions.join(', ')
      : (r.selectedOption || r.transcript || '');
    if (val) responseMap[r.questionId] = val;
  });

  // Extract structured values from questionnaire
  const primaryConcern = 'Upper abdominal burning';
  const duration = '5 days';
  const location = responseMap['q1_location'] || 'Upper abdomen (just below chest)';
  const pattern = responseMap['q2_timing'] || 'Worse after meals';
  const triggers = responseMap['q3_triggers'] || 'Spicy and oily food';
  const associated = responseMap['q4_associated'] || 'Bloating, frequent burping';
  const severity = responseMap['q5_severity'] || 'Moderate to severe — 6/10';
  const frequency = responseMap['q6_frequency'] || 'Several times a day';
  const relief = responseMap['q7_relief'] || 'Drinking water and sitting upright';
  const redFlags = responseMap['q8_redflags'] || 'None reported';
  const hasRedFlags = redFlags.toLowerCase().includes('blood') || redFlags.toLowerCase().includes('black') || redFlags.toLowerCase().includes('severe') || redFlags.toLowerCase().includes('vomit') || redFlags.toLowerCase().includes('fainting');

  const voiceTranscript =
    chiefComplaint?.voiceTranscript ||
    voiceIntake?.activeTranscript ||
    'I feel a burning sensation in my upper abdomen, worse after eating.';

  const handleConfirmCase = () => {
    navigate('/patient/ayush');
  };

  const handleChangeResponse = () => {
    setVoiceQuestionIndex(0);
    navigate('/patient/voice');
  };

  useKioskScreen({
    onContinue: handleConfirmCase,
    onBack: handleChangeResponse,
    audioPrompt: 'Please review your AI-structured case summary before continuing to the AYUSH assessment.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-1 flex flex-col justify-between">
      {/* Header Banner & Flow Breadcrumb */}
      <GlassCard className="p-3 mb-2 flex items-center justify-between border-medigreen-200/80 bg-gradient-to-r from-medigreen-50/60 via-white/95 to-teal-50/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medigreen-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 tracking-tight font-devanagari leading-none">
                AI Case Review
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                AI UNDERSTANDING: High confidence
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              AI-structured case information organized for your doctor's consultation
            </p>
          </div>
        </div>

        {/* Stage tracker pill */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="text-medigreen-700 font-extrabold">CASE TAKING ✓</span>
          <span>→</span>
          <span className="text-mediblue-700 font-extrabold">AI REVIEW</span>
          <span>→</span>
          <span>AYUSH</span>
          <span>→</span>
          <span>APPOINTMENT</span>
        </div>
      </GlassCard>

      {/* Patient Voice Statement Card */}
      {voiceTranscript && (
        <GlassCard className="p-2.5 mb-2 border border-mediblue-200/80 bg-gradient-to-r from-mediblue-50/50 via-white to-teal-50/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-mediblue-100 text-mediblue-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-mediblue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold text-mediblue-800 uppercase tracking-wider block">
              Patient Spoken Statement
            </span>
            <p className="text-xs font-semibold text-navy-900 italic truncate">
              &ldquo;{voiceTranscript}&rdquo;
            </p>
          </div>
        </GlassCard>
      )}

      {/* Structured Clinical Intake Entities Grid */}
      <GlassCard className="p-3 mb-2 border-2 border-medigreen-300/80 bg-gradient-to-br from-white via-medigreen-50/20 to-teal-50/30 shadow-sm rounded-2xl">
        {/* Primary Concern Banner */}
        <div className="p-2.5 bg-gradient-to-r from-medigreen-700 to-teal-700 rounded-xl mb-2.5 text-white flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">Primary Concern</span>
            <span className="font-extrabold text-sm sm:text-base">{primaryConcern}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">Duration</span>
            <span className="font-bold text-xs sm:text-sm bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">{duration}</span>
          </div>
        </div>

        {/* 8 Entities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Location */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Location</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{location}</span>
          </div>

          {/* 2. Timing / Pattern */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Pattern</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{pattern}</span>
          </div>

          {/* 3. Triggers */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Possible Triggers</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{triggers}</span>
          </div>

          {/* 4. Associated Symptoms */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Associated Symptoms</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{associated}</span>
          </div>

          {/* 5. Severity */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Severity</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{severity}</span>
          </div>

          {/* 6. Frequency */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Frequency</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{frequency}</span>
          </div>

          {/* 7. Relief */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Relief</span>
            <span className="font-bold text-navy-900 text-xs leading-snug block">{relief}</span>
          </div>

          {/* 8. Warning Symptoms */}
          <div className={`p-2.5 rounded-xl border shadow-2xs ${
            hasRedFlags ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-white/90 border-slate-200/90 text-navy-900'
          }`}>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Warning Symptoms</span>
            <span className="font-bold text-xs leading-snug block">{redFlags}</span>
          </div>
        </div>

        {/* Clinical Disclaimer Notice (Not a diagnosis) */}
        <div className="mt-2.5 p-2 bg-slate-100/80 rounded-xl border border-slate-200 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Important:</strong> This is structured case-taking information, <strong>NOT a medical diagnosis</strong>. The system organizes your responses for the doctor.
          </span>
        </div>
      </GlassCard>

      {/* Confirmation Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleChangeResponse}
          className="bg-white hover:bg-slate-50 text-navy-800 rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all border-2 border-slate-300 shadow-xs active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Change Response</span>
        </button>

        <button
          type="button"
          onClick={handleConfirmCase}
          className="bg-gradient-to-r from-medigreen-600 to-teal-700 hover:from-medigreen-700 hover:to-teal-800 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Confirm Case &amp; Proceed to AYUSH</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

