import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, FileText, Activity, Stethoscope, Mic, XCircle, AlertCircle } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { apiFetch } from '@/services/api/client';

export default function Consent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { consent, setConsent, encounterId } = usePatientSession();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleConsent = async (accepted: boolean) => {
    if (!accepted) {
      setConsent({ accepted: false, timestamp: new Date().toISOString() });
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (encounterId) {
        await apiFetch(`/encounters/${encounterId}/consent`, {
          method: 'POST',
          body: JSON.stringify({ accepted: true }),
        });
      }
      setConsent({ accepted: true, timestamp: new Date().toISOString() });
      navigate('/patient/profile');
    } catch (err: any) {
      console.warn('Backend consent sync skipped (running offline/mock):', err);
      setConsent({ accepted: true, timestamp: new Date().toISOString() });
      navigate('/patient/profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    if (!consent.accepted) {
      toggleConsent(true);
    } else {
      navigate('/patient/profile');
    }
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: isSaving,
    audioPrompt: t('consent.audioGuidance') || 'We will ask you some simple questions that will be shown directly to your doctor.',
  });

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4 pb-32">
      <div className="mb-4">
        <h2 className="text-4xl font-bold text-primary mb-2 font-devanagari">
          {t('consent.title')}
        </h2>
        <p className="text-lg text-slate-600">
          {t('consent.subtitle')}
        </p>
      </div>

      <AudioGuidanceBanner 
        englishText="Audio prompt: We will ask you some simple questions that will be shown directly to your doctor."
        regionalText="सुनने के लिए टैप करें: हम आपसे कुछ सरल प्रश्न पूछेंगे जो सीधे आपके डॉक्टर को दिखाए जाएंगे।"
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
            <Activity className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-primary">
                {t('consent.card1Title')}
              </h3>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-700 text-sm mb-1">{t('consent.card1Desc')}</p>
            <p className="text-slate-500 font-devanagari text-sm">हम आपके वर्तमान लक्षणों, दर्द की जगह, खानपान और पुरानी दवाओं के बारे में पूछेंगे।</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Mic className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-primary">
                {t('consent.card2Title')}
              </h3>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-700 text-sm mb-1">{t('consent.card2Desc')}</p>
            <p className="text-slate-500 font-devanagari text-sm">आप हिन्दी, मराठी या अंग्रेज़ी में बोल सकते हैं, या स्क्रीन पर छूकर उत्तर दे सकते हैं।</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-primary">
                {t('consent.card3Title')}
              </h3>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-700 text-sm mb-1">{t('consent.card3Desc')}</p>
            <p className="text-slate-500 font-devanagari text-sm">आप अपने पुराने पर्चे या रिपोर्ट को कैमरे के सामने रखकर आसानी से जोड़ सकते हैं।</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center shrink-0">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-primary">
                {t('consent.card4Title')}
              </h3>
              <span className="bg-[#DBEAFE] text-[#1E40AF] px-3 py-1 rounded-full text-xs font-bold">Room 4</span>
            </div>
            <p className="text-slate-700 text-sm mb-1">{t('consent.card4Desc')}</p>
            <p className="text-slate-500 font-devanagari text-sm">आपके डॉक्टर परामर्श कक्ष में आपके पहुंचने से पहले इस जानकारी की समीक्षा करेंगे।</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border-2 border-red-400 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span className="font-bold text-base">{error}</span>
        </div>
      )}

      <div className="mt-8 bg-[#EFF6FF] rounded-3xl p-6 flex items-center justify-between border border-[#BFDBFE]">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-10 h-10 text-[#2563EB]" />
          <div>
            <h3 className="text-xl font-bold text-primary">
              {t('consent.privacyTitle')}
            </h3>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => toggleConsent(false)}
            className={`px-6 py-4 rounded-xl border-2 flex items-center gap-2 font-bold text-lg transition-colors ${
              consent.accepted === false 
                ? 'border-red-500 bg-red-50 text-red-700' 
                : 'border-white bg-white text-red-500 hover:bg-red-50'
            }`}
          >
            <XCircle className="w-6 h-6" />
            {t('consent.declineBtn')}
          </button>

          <button 
            type="button"
            disabled={isSaving}
            onClick={() => toggleConsent(true)}
            className={`px-6 py-4 rounded-xl border-2 flex items-center gap-2 font-bold text-lg transition-colors ${
              isSaving ? 'opacity-70 cursor-wait' : ''
            } ${
              consent.accepted === true 
                ? 'border-[#064E3B] bg-[#064E3B] text-white' 
                : 'border-[#064E3B] bg-[#064E3B]/90 text-white hover:bg-[#064E3B]'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 ${consent.accepted ? 'text-white' : 'text-white/80'}`} />
            {isSaving ? 'Recording Consent...' : t('consent.acceptBtn')} 
            <span className="ml-2">→</span>
          </button>
        </div>
      </div>

    </div>
  );
}
