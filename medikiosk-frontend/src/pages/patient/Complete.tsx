import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import {
  CheckCircle2,
  BellRing,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';
import confetti from 'canvas-confetti';

export default function Complete() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    submission,
    tokenNumber,
    uhid,
    patient,
    chiefComplaint,
    appointment,
    clearSession
  } = usePatientSession();
  const [sahayakNotified, setSahayakNotified] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#10B981', '#064E3B', '#38BDF8'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const handleCallSahayak = () => {
    setSahayakNotified(true);
    setTimeout(() => setSahayakNotified(false), 4000);
  };

  const handleDone = () => {
    setIsDone(true);
  };

  const handleStartNewPatient = () => {
    clearSession();
    navigate('/patient/language');
  };

  // Format token as A-042 or from tokenNumber
  const formattedToken = tokenNumber ? `A-0${tokenNumber}` : 'A-042';
  const patientName = patient?.name || 'Rajesh Sharma';
  const appointmentTime = `Today, ${appointment?.timeSlot || '03:30 PM'}`;
  const primaryConcern = chiefComplaint?.primaryComplaint || 'Upper abdominal burning';

  useKioskScreen({
    onContinue: handleDone,
    onBack: () => { },
    isContinueDisabled: false,
    audioPrompt: `Appointment confirmed. Your Token number is ${formattedToken} for ${appointmentTime}. Please proceed to Room number 4.`,
  });

  if (isDone) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <GlassCard className="p-8 border-medigreen-300 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-medigreen-50 text-medigreen-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-navy-900 mb-2 font-devanagari">
            {t('complete.allSet') || 'You Are All Set!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            {t('complete.waitingAreaNotice') || 'Please take a seat in the waiting area. Your token number will be called on the display screen.'}
          </p>
          <button
            type="button"
            onClick={handleStartNewPatient}
            className="bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('complete.startNewSession') || 'Start New Session'}</span>
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-2 flex flex-col justify-between">
      {/* Success Notification Bar */}
      <GlassCard className="p-3 mb-2 flex items-center justify-between border-medigreen-200/80 bg-gradient-to-r from-medigreen-50/50 via-white/95 to-teal-50/50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-medigreen-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-navy-900 leading-tight font-devanagari">
                Appointment Confirmed
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Token Generated
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-0.5">
              Your OPD clinical case and consultation token have been securely registered
            </p>
          </div>
        </div>

        {/* Stage complete indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>FLOW COMPLETE</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2">
        {/* Left: Big Token & Appointment Details Box (5 cols) */}
        <GlassCard id="sahayak-target-token-card" className="md:col-span-5 p-4 flex flex-col items-center justify-between text-center border-2 border-medigreen-300 bg-gradient-to-b from-white via-medigreen-50/20 to-teal-50/30 shadow-md">
          <div className="w-full">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-0.5 block">
              Token Number
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-medigreen-700 tracking-tight my-1">
              {formattedToken}
            </div>
            <div className="inline-flex items-center gap-1 bg-medigreen-100 text-medigreen-900 text-[11px] font-extrabold px-3 py-1 rounded-full border border-medigreen-300 mb-3 shadow-2xs">
              <Stethoscope className="w-3.5 h-3.5 text-medigreen-700" />
              <span>Room 4 · Dr. Priya Sharma</span>
            </div>

            {/* Structured Appointment & Patient Information */}
            <div className="w-full border-t border-slate-200 pt-2.5 space-y-2 text-left text-xs">
              {/* Appointment Slot */}
              <div className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-100">
                <Calendar className="w-3.5 h-3.5 text-medigreen-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Appointment</span>
                  <span className="font-extrabold text-navy-900">{appointmentTime}</span>
                </div>
              </div>

              {/* Patient Name */}
              <div className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-100">
                <User className="w-3.5 h-3.5 text-mediblue-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Patient</span>
                  <span className="font-bold text-navy-900">{patientName}</span>
                </div>
              </div>

              {/* Primary Concern */}
              <div className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-100">
                <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Primary Concern</span>
                  <span className="font-bold text-navy-900 truncate block">{primaryConcern}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 pt-2 mt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>UHID: <strong className="font-mono text-navy-900">{uhid || 'UHID-2026-DL-8834'}</strong></span>
            <span>Ref: <strong className="font-mono text-navy-900">{submission?.caseId || `OPD-${formattedToken}`}</strong></span>
          </div>
        </GlassCard>

        {/* Right: Next Steps Instructions (7 cols) */}
        <GlassCard className="md:col-span-7 p-4 flex flex-col justify-between border-slate-200/90 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-medigreen-600" />
              <span>What Happens Next?</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex gap-2.5 bg-mediblue-50/50 p-2.5 rounded-xl border border-mediblue-100">
                <div className="w-6 h-6 rounded-lg bg-mediblue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</div>
                <div>
                  <h4 className="font-bold text-navy-900">Proceed to Waiting Area 4</h4>
                  <p className="text-[11px] text-slate-500">Wait outside Room 4. Live token display shows real-time queue position.</p>
                </div>
              </div>

              <div className="flex gap-2.5 bg-medigreen-50/50 p-2.5 rounded-xl border border-medigreen-100">
                <div className="w-6 h-6 rounded-lg bg-medigreen-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</div>
                <div>
                  <h4 className="font-bold text-navy-900">Doctor Reviews AI &amp; AYUSH Dossier</h4>
                  <p className="text-[11px] text-slate-500">Dr. Priya Sharma receives your structured case summary in the 30-Second Doctor View.</p>
                </div>
              </div>

              <div className="flex gap-2.5 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                <div className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</div>
                <div>
                  <h4 className="font-bold text-navy-900">Collect Physical E-Prescription</h4>
                  <p className="text-[11px] text-slate-500">After consultation, collect your printed Rx or view it instantly via your ABHA health locker.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {!sahayakNotified ? (
              <button
                type="button"
                onClick={handleCallSahayak}
                className="flex items-center gap-1.5 text-slate-600 hover:text-navy-900 font-bold text-xs bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Call Sahayak (Volunteer)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-medigreen-700 font-bold text-xs">
                <BellRing className="w-3.5 h-3.5 text-medigreen-600" />
                <span>Sahayak has been alerted</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDone}
              className="bg-gradient-to-r from-medigreen-600 to-teal-700 hover:from-medigreen-700 hover:to-teal-800 text-white px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>Finish &amp; Print Slip</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}