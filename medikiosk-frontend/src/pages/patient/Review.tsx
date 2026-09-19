import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Activity, 
  HeartPulse, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Mic, 
  CheckCircle2, 
  Edit2
} from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AYUSH_QUESTIONS } from '@/services/ayush/MockAyushProvider';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Review() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      navigate('/patient/submit');
    }, 400);
  };

  const handleBack = () => {
    navigate('/patient/documents/review');
  };

  useKioskScreen({
    onContinue: handleConfirm,
    onBack: handleBack,
    continueLabelKey: 'review.confirmAndSubmit',
    isContinueDisabled: isSubmitting,
    audioPrompt: t('review.audioGuidance') || 'Please review your complete intake summary on the screen. Tap Confirm and Submit when ready.',
  });

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={17}
        total={24}
        title={t('review.title')}
      />

      <div className="max-w-4xl mx-auto px-6 pt-6 pb-32 space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-[#E6FAF5] border border-[#A7F3D0] rounded-3xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">
              {t('review.title')}
            </h2>
            <p className="text-slate-600 text-sm">
              {t('review.subtitle')}
            </p>
          </div>
          <span className="bg-white/80 text-[#0D9488] font-bold text-xs px-4 py-2 rounded-full border border-[#A7F3D0]">
            Ready for Final Verification
          </span>
        </div>

        {/* 1. Patient Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('review.patientProfile')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/profile')}
              className="flex items-center gap-1 text-sm font-bold text-[#0D9488] hover:underline"
            >
              <Edit2 className="w-4 h-4" /> {t('review.edit')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 block">{t('profile.fullName')}</span>
              <span className="font-bold text-slate-800">{patient?.name || 'Anonymous Patient'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('profile.age')} & {t('profile.gender')}</span>
              <span className="font-bold text-slate-800">
                {patient?.age ? `${patient.age} Yrs` : 'N/A'} ? {patient?.gender || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('profile.mobile')}</span>
              <span className="font-bold text-slate-800">{patient?.mobile || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ID Method / ABHA</span>
              <span className="font-mono text-slate-700">
                {abhaId ? abhaId : identificationMethod === 'opd' ? 'OPD Slip' : 'New Registration'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Symptoms & Voice Intake */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6FAF5] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0D9488]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('review.symptomsIntake')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/chief-complaint')}
              className="flex items-center gap-1 text-sm font-bold text-[#0D9488] hover:underline"
            >
              <Edit2 className="w-4 h-4" /> {t('review.edit')}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-400 block">PRIMARY CHIEF COMPLAINT</span>
              <p className="font-bold text-slate-800 text-base mt-0.5">
                {chiefComplaint.primaryComplaint || 'General health consultation'}
              </p>
            </div>

            {voiceIntake.responses.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">RECORDED RESPONSES</span>
                {voiceIntake.responses.map((resp, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-[#0D9488]" />
                      <span className="text-slate-700">{resp.transcript || resp.selectedOption}</span>
                    </div>
                    {resp.isRedFlag && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">Alert</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. AYUSH Assessment */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('review.ayushAssessment')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/ayush')}
              className="flex items-center gap-1 text-sm font-bold text-[#0D9488] hover:underline"
            >
              <Edit2 className="w-4 h-4" /> {t('review.edit')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {ayushIntake.responses.length > 0 ? (
              ayushIntake.responses.map((r, i) => {
                const q = AYUSH_QUESTIONS.find(q => q.id === r.questionId);
                return (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-xs text-slate-400 block truncate">{q?.question || r.question}</span>
                    <span className="font-bold text-slate-800">{r.answerHindi || r.answer}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 col-span-2 text-sm">No assessment responses provided</p>
            )}
          </div>
        </div>

        {/* 4. Medications & Allergies */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">{t('review.medications')}</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/medications')}
                className="text-xs font-bold text-[#0D9488] hover:underline"
              >
                {t('review.edit')}
              </button>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 block">Taking Medicines:</span>
              <span className="font-bold text-slate-800 capitalize">
                {medicationHistory.takingMedicines?.replace('_', ' ') || 'None reported'}
              </span>
              {medicationHistory.medicines && (
                <p className="text-xs bg-slate-50 p-2 rounded-lg mt-2 text-slate-700">
                  {medicationHistory.medicines}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800">{t('review.allergies')}</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/allergies')}
                className="text-xs font-bold text-[#0D9488] hover:underline"
              >
                {t('review.edit')}
              </button>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 block">Has Allergies:</span>
              <span className="font-bold text-slate-800 capitalize">
                {allergyHistory.hasAllergy || 'None reported'}
              </span>
              {allergyHistory.allergyType && (
                <p className="text-xs bg-slate-50 p-2 rounded-lg mt-2 text-slate-700">
                  {allergyHistory.allergyType} - {allergyHistory.reaction}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 5. Documents */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0D9488]" />
              <h3 className="font-bold text-slate-800">{t('review.documentsAttached')}</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/documents/review')}
              className="text-xs font-bold text-[#0D9488] hover:underline"
            >
              {t('review.edit')}
            </button>
          </div>
          <p className="text-sm text-slate-600">
            {documentIntake.documents.length > 0 
              ? `${documentIntake.documents.length} document(s) uploaded and ready for doctor review.` 
              : 'No documents attached.'}
          </p>
        </div>

        {/* Bottom CTA Card */}
        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-10 h-10 text-[#059669] shrink-0" />
            <div>
              <h4 className="text-xl font-bold text-primary">
                {t('review.readyToSubmit')}
              </h4>
              <p className="text-slate-600 text-sm">
                {t('review.readySub')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="bg-[#064E3B] hover:bg-[#064E3B]/90 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center gap-3 transition-colors shadow-lg"
          >
            <span>{t('review.confirmAndSubmit')}</span>
            <span>?</span>
          </button>
        </div>
      </div>
    </div>
  );
}
