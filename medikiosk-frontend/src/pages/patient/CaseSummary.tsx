import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, ArrowRight, Activity, FileText, HeartPulse } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function CaseSummary() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const {
    clinicalCaseState,
    persistedCaseRecord,
    voiceIntake,
    lastClinicalTurn,
    conversationHistory,
  } = usePatientSession();

  const isEmergency =
    voiceIntake.redFlagTriggered ||
    lastClinicalTurn?.requires_emergency_attention ||
    persistedCaseRecord?.is_emergency ||
    false;

  const chiefComplaint =
    clinicalCaseState?.chief_complaint ||
    persistedCaseRecord?.chief_complaint ||
    'Reported Symptoms Recorded';

  const symptoms = clinicalCaseState?.symptoms || persistedCaseRecord?.case_state?.symptoms || [];

  const handleContinue = () => {
    navigate('/patient/ayush');
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: () => navigate('/patient/voice'),
    audioPrompt: isEmergency
      ? 'Emergency priority alert recorded. A clinical assistant has been notified. You may continue to the next step.'
      : 'Your clinical intake answers have been saved. Tap Continue to proceed.',
  });

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={12}
        total={24}
        title={t('voiceConfirmation.title') || 'Clinical Intake Summary'}
        badge={isEmergency ? 'Priority Alert Recorded' : 'Intake Completed'}
      />

      <div className="max-w-4xl mx-auto px-6 pt-6 pb-32">
        {/* Header Banner */}
        <div className={`rounded-3xl p-6 border-2 shadow-sm mb-6 ${
          isEmergency ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isEmergency ? 'bg-red-600 text-white' : 'bg-[#E6FAF5] text-[#0D9488]'
            }`}>
              {isEmergency ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isEmergency ? 'text-red-700 bg-red-200' : 'text-teal-700 bg-teal-100'
              }`}>
                {isEmergency ? 'Urgent Clinical Priority' : 'Intake Verified & Attached'}
              </span>
              <h1 className="text-2xl font-bold text-slate-800 mt-1">
                {language === 'hi'
                  ? 'आपकी स्वास्थ्य जानकारी दर्ज हो गई है'
                  : language === 'mr'
                  ? 'आपली आरोग्य माहिती नोंदवली गेली आहे'
                  : 'Clinical Intake Recorded Successfully'}
              </h1>
            </div>
          </div>
        </div>

        <AudioGuidanceBanner
          englishText="Your symptoms and conversation have been securely attached to your hospital visit file for the doctor."
          regionalText={
            language === 'hi'
              ? 'आपके द्वारा बताए गए सभी लक्षण डॉक्टर के परामर्श के लिए सुरक्षित रूप से फाइल में जोड़ दिए गए हैं।'
              : language === 'mr'
              ? 'आपण सांगितलेली सर्व लक्षणे डॉक्टरांच्या तपासणीसाठी सुरक्षितपणे जोडली गेली आहेत.'
              : undefined
          }
        />

        {/* Structured Summary Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 mt-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Activity className="w-4 h-4 text-primary" /> Primary Reason for Visit
            </h2>
            <p className="text-xl font-bold text-slate-800">{chiefComplaint}</p>
          </div>

          {/* Extracted Symptoms */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
              <HeartPulse className="w-4 h-4 text-primary" /> Recorded Symptom Attributes
            </h3>
            {symptoms.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {symptoms.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="font-bold text-slate-800 text-base capitalize">{s.name}</p>
                    <div className="text-xs text-slate-500 mt-1 space-y-1">
                      {s.location && <p>Location: <span className="font-semibold text-slate-700">{s.location}</span></p>}
                      {s.duration && <p>Duration: <span className="font-semibold text-slate-700">{s.duration}</span></p>}
                      {s.severity && <p>Severity: <span className="font-semibold text-slate-700">{s.severity}</span></p>}
                      {s.character && <p>Quality: <span className="font-semibold text-slate-700">{s.character}</span></p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">General health symptoms recorded.</p>
            )}
          </div>

          {/* Conversational Turns Count */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-700" />
              <div>
                <p className="text-sm font-bold text-teal-900">
                  {conversationHistory.length || (persistedCaseRecord?.turns?.length ?? 1)} Conversational Turns Archived
                </p>
                <p className="text-xs text-teal-700">All original patient transcripts are preserved for doctor review.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-200 px-3 py-1 rounded-full uppercase">
              Permanent Record
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-colors"
          >
            <span>
              {language === 'hi'
                ? 'आगे बढ़ें / Continue'
                : language === 'mr'
                ? 'पुढे सुरू ठेवा / Continue'
                : 'Continue to Next Step'}
            </span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
