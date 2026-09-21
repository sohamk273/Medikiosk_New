import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Mic, FileText, Check, AlertCircle } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { apiFetch } from '@/services/api/client';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';

export default function Consent() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { setConsent, encounterId } = usePatientSession();
  const { guidedAssistMode, setCustomTarget } = useSahayakAssist();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [consents, setConsents] = useState({
    clinical: false,
    ayush: false,
    abdm: false,
    privacy: false
  });

  const toggleConsent = (key: keyof typeof consents) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allChecked = Object.values(consents).every(Boolean);

  // Dynamic Sahayak Assist target
  useEffect(() => {
    if (!guidedAssistMode) return;
    if (allChecked) {
      setCustomTarget(
        'sahayak-target-continue',
        {
          en: 'Consent recorded! Now tap Continue at the bottom right.',
          hi: 'सहमति दर्ज हो गई! अब नीचे दाईं ओर आगे बढ़ें (Continue) पर टैप करें।',
          mr: 'संमती नोंदवली गेली! आता खाली उजवीकडे पुढे जा (Continue) वर टॅप करा.',
        },
        undefined,
        'top'
      );
    } else {
      setCustomTarget(
        'sahayak-target-consent-cards',
        {
          en: 'Tap all 4 cards to give consent for your consultation.',
          hi: 'अपने परामर्श के लिए सहमति देने के लिए सभी 4 कार्ड पर टैप करें।',
          mr: 'आपल्या सल्ल्यासाठी संमती देण्यासाठी सर्व 4 कार्डवर टॅप करा.',
        },
        undefined,
        'top'
      );
    }
  }, [guidedAssistMode, allChecked, setCustomTarget]);

  const handleContinue = async () => {
    if (!allChecked) return;
    
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

  useKioskScreen({
    onContinue: handleContinue,
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: !allChecked || isSaving,
    audioPrompt: t('consent.audioGuidance') || 'We will ask you some simple questions that will be shown directly to your doctor.',
  });

  const CheckboxUI = ({ checked }: { checked: boolean }) => (
    <div className={`w-7 h-7 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
      checked 
        ? 'bg-medigreen-500 border-medigreen-500 shadow-sm' 
        : 'bg-slate-50 border-slate-300 shadow-inner group-hover:border-slate-400'
    }`}>
      {checked && <Check className="w-4 h-4 text-white font-extrabold" strokeWidth={3.5} />}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-2 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari mb-1">
          {t('consent.title')}
        </h2>
        <p className="text-sm text-slate-600 font-medium">
          {t('consent.subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Interactive Consent Cards */}
      <div id="sahayak-target-consent-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mb-2">
        {/* Card 1: Clinical Care & Diagnosis */}
        <GlassCard 
          className={`group p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all border-2 ${
            consents.clinical ? 'border-medigreen-500 bg-medigreen-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
          onClick={() => toggleConsent('clinical')}
        >
          <div className="w-12 h-12 rounded-2xl bg-medigreen-50 text-medigreen-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="text-base font-bold text-navy-900">
                {t('consent.card1Title') || 'Clinical Care & Diagnosis'}
              </h3>
              <CheckboxUI checked={consents.clinical} />
            </div>
            <p className="text-slate-600 text-sm leading-snug">{t('consent.card1Desc')}</p>
            {language !== 'en' && (
              <p className="text-slate-500 font-devanagari text-xs mt-1.5 opacity-80">
                {language === 'hi' ? 'आपकी लक्षणे और समस्याएं डॉक्टर तक पहुंचाई जाएंगी' : 'आपली लक्षणे आणि समस्या डॉक्टरांपर्यंत अचूक पोहोचवली जातील'}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Card 2: AYUSH Assessment */}
        <GlassCard 
          className={`group p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all border-2 ${
            consents.ayush ? 'border-medigreen-500 bg-medigreen-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
          onClick={() => toggleConsent('ayush')}
        >
          <div className="w-12 h-12 rounded-2xl bg-mediblue-50 text-mediblue-600 flex items-center justify-center shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="text-base font-bold text-navy-900">
                {t('consent.card2Title') || 'AYUSH Assessment'}
              </h3>
              <CheckboxUI checked={consents.ayush} />
            </div>
            <p className="text-slate-600 text-sm leading-snug">{t('consent.card2Desc')}</p>
            {language !== 'en' && (
              <p className="text-slate-500 font-devanagari text-xs mt-1.5 opacity-80">
                {language === 'hi' ? 'आप हिंदी, मराठी या अंग्रेजी में स्वाभाविक रूप से बोल सकते हैं' : 'आपण मराठी, हिंदी किंवा इंग्रजीत नैसर्गिकरीत्या बोलू शकता'}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Card 3: ABDM Health Records */}
        <GlassCard 
          className={`group p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all border-2 ${
            consents.abdm ? 'border-medigreen-500 bg-medigreen-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
          onClick={() => toggleConsent('abdm')}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="text-base font-bold text-navy-900">
                {t('consent.card3Title') || 'ABDM Health Records'}
              </h3>
              <CheckboxUI checked={consents.abdm} />
            </div>
            <p className="text-slate-600 text-sm leading-snug">{t('consent.card3Desc')}</p>
            {language !== 'en' && (
              <p className="text-slate-500 font-devanagari text-xs mt-1.5 opacity-80">
                {language === 'hi' ? 'पिछले पर्चे व लैब रिपोर्ट आसानी से स्कैन करें' : 'मागील प्रिस्क्रिप्शन व लॅब रिपोर्ट सहज स्कॅन करता येतात'}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Card 4: Privacy & Protection */}
        <GlassCard 
          className={`group p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all border-2 ${
            consents.privacy ? 'border-medigreen-500 bg-medigreen-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
          onClick={() => toggleConsent('privacy')}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="text-base font-bold text-navy-900">
                {t('consent.privacyTitle') || 'Privacy & Protection'}
              </h3>
              <CheckboxUI checked={consents.privacy} />
            </div>
            <p className="text-slate-600 text-sm leading-snug">
              Data is encrypted in transit and stored strictly in accordance with DISHA / ABDM security standards.
            </p>
            {language !== 'en' && (
              <p className="text-slate-500 font-devanagari text-xs mt-1.5 opacity-80">
                {language === 'hi' ? 'आपकी व्यक्तिगत जानकारी पूरी तरह सुरक्षित रखी जाती है' : 'आपली वैयक्तिक माहिती सुरक्षित ठेवली जाते'}
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}