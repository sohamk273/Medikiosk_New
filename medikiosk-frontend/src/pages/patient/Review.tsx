import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Activity,
  HeartPulse,
  Pill,
  Mic,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { CompletenessMeter } from '@/demo/components/CompletenessMeter';
import { QuickClarifyModal } from '@/demo/components/QuickClarifyModal';
import { EvidenceDrawer } from '@/demo/components/EvidenceDrawer';

export default function Review() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const {
    patient,
    abhaId,
    identificationMethod,
    chiefComplaint,
    voiceIntake,
    ayushIntake,
    medicationHistory,
    allergyHistory,
    documentIntake,
    setReviewConfirmed,
  } = usePatientSession();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    setReviewConfirmed(true);
    setTimeout(() => {
      navigate('/patient/appointment');
    }, 300);
  };

  const handleBack = () => {
    navigate('/patient/documents/review');
  };

  useKioskScreen({
    onContinue: handleConfirm,
    onBack: handleBack,
    continueLabelKey: 'Schedule Appointment',
    isContinueDisabled: isSubmitting,
    audioPrompt: 'Please review your complete intake summary on the screen. Tap Schedule Appointment to select your consultation time slot.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-2 flex flex-col justify-between">
      {/* Header Banner */}
      <GlassCard className="p-3.5 mb-2 flex items-center justify-between border-medigreen-200/80 bg-gradient-to-r from-medigreen-50/50 via-white/90 to-teal-50/50">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-900 mb-0.5 font-devanagari">
            {t('review.title')}
          </h2>
          <p className="text-slate-600 text-xs">
            {t('review.subtitle')}
          </p>
        </div>
        <span className="bg-medigreen-100 text-medigreen-800 font-extrabold text-xs px-3 py-1 rounded-full border border-medigreen-300">
          Ready for Final Verification
        </span>
      </GlassCard>

      {/* Case Completeness Gauge & Quick-Clarify (Module 4 USP) */}
      <div className="mb-3">
        <CompletenessMeter />
      </div>

      <QuickClarifyModal />
      <EvidenceDrawer />

      {/* 2-Column Summary Cards Grid */}
      <div id="sahayak-target-review-summary" className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        {/* 1. Patient Profile Card */}
        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-mediblue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-mediblue-600" />
              </div>
              <h3 className="text-xs font-bold text-navy-900">
                {t('review.patientProfile')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/profile')}
              className="flex items-center gap-1 text-[11px] font-bold text-medigreen-700 hover:underline cursor-pointer"
            >
              <Edit2 className="w-3 h-3" /> {t('review.edit')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{t('profile.fullName')}</span>
              <span className="font-bold text-navy-900">{patient?.name || 'Anonymous Patient'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{t('profile.age')} &amp; {t('profile.gender')}</span>
              <span className="font-bold text-navy-900">
                {patient?.age ? `${patient.age} Yrs` : 'N/A'} · {patient?.gender || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{t('profile.mobile')}</span>
              <span className="font-bold text-navy-900">{patient?.mobile || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ID Method / ABHA</span>
              <span className="font-mono text-slate-700 text-[11px]">
                {abhaId ? abhaId : identificationMethod === 'opd' ? 'OPD Slip' : 'New Registration'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* 2. Chief Complaint & Symptoms */}
        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-medigreen-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-medigreen-600" />
              </div>
              <h3 className="text-xs font-bold text-navy-900">
                {t('review.symptomsIntake')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/chief-complaint')}
              className="flex items-center gap-1 text-[11px] font-bold text-medigreen-700 hover:underline cursor-pointer"
            >
              <Edit2 className="w-3 h-3" /> {t('review.edit')}
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">PRIMARY COMPLAINT</span>
              <p className="font-bold text-navy-900 font-devanagari">
                {chiefComplaint.primaryComplaint || 'General health consultation'}
              </p>
            </div>

            {voiceIntake.responses.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                <Mic className="w-3 h-3 text-medigreen-600 shrink-0" />
                <span className="truncate">{voiceIntake.responses[0]?.transcript || 'Voice intake saved'}</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 3. AYUSH Assessment */}
        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="text-xs font-bold text-navy-900">
                {t('review.ayushAssessment')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/ayush')}
              className="flex items-center gap-1 text-[11px] font-bold text-medigreen-700 hover:underline cursor-pointer"
            >
              <Edit2 className="w-3 h-3" /> {t('review.edit')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {ayushIntake.responses.length > 0 ? (
              ayushIntake.responses.map((r, i) => (
                <div key={i} className="bg-slate-50 px-2 py-1 rounded-lg">
                  <span className="text-[10px] text-slate-400 block truncate">{r.question}</span>
                  <span className="font-bold text-navy-900">
                    {language === 'hi' ? (r.answerHindi || r.answer) : (r.answer || r.answerHindi)}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-slate-400 italic text-[11px]">No AYUSH responses recorded</span>
            )}
          </div>
        </GlassCard>

        {/* 4. Medications & Allergies & Documents */}
        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Pill className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-xs font-bold text-navy-900">
                History &amp; Documents
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/medications')}
              className="flex items-center gap-1 text-[11px] font-bold text-medigreen-700 hover:underline cursor-pointer"
            >
              <Edit2 className="w-3 h-3" /> {t('review.edit')}
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Regular Medicines</span>
              <span className="font-bold text-navy-900">
                {medicationHistory.takingMedicines === 'yes_daily' ? 'Yes (Daily)' : medicationHistory.takingMedicines === 'yes_sometimes' ? 'Yes (Sometimes)' : 'No / None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Known Allergies</span>
              <span className="font-bold text-navy-900">
                {allergyHistory.hasAllergy === 'yes' ? `${allergyHistory.allergyType || 'Yes'}` : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Attached Documents</span>
              <span className="font-bold text-medigreen-700">
                {documentIntake.documents.length} File(s)
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Confirmation Box */}
      <GlassCard className="p-3 flex items-center justify-between border-medigreen-300/80 bg-gradient-to-r from-medigreen-50/60 via-white/80 to-teal-50/60">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-medigreen-600 shrink-0" />
          <p className="text-xs font-bold text-navy-900 font-devanagari">
            {language === 'en'
              ? 'All information has been verified. Tap Confirm and Submit to proceed.'
              : language === 'hi'
                ? 'सभी जानकारी की जांच कर ली गई है। \'पुष्टि करें और सबमिट करें\' दबाएं।'
                : 'सर्व माहिती तपासून झाली आहे. \'पुष्टी करा आणि सबमिट करा\' दाबा.'}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}