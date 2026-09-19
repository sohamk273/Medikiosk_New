import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Smartphone, MapPin, Languages, Edit2, ShieldCheck, Lock } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Profile() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { patient, identificationMethod } = usePatientSession();
  const [abhaEditModalOpen, setAbhaEditModalOpen] = useState(false);

  const isAbha = identificationMethod === 'abha';

  const handleEditDemographics = () => {
    if (isAbha) {
      setAbhaEditModalOpen(true);
    } else {
      navigate('/patient/register');
    }
  };

  const handleEditLanguage = () => {
    navigate('/patient/language');
  };

  useKioskScreen({
    onContinue: () => navigate('/patient/chief-complaint'),
    onBack: () => navigate('/patient/consent'),
    audioPrompt: t('profile.audioGuidance') || 'Please review your details on the screen. Tap Continue if everything is correct.',
  });

  const patName = patient?.name || 'Rameshwar Patil';
  const patAge = patient?.age || '62';
  const patGender = patient?.gender || 'Male';
  const patMobile = patient?.mobile || '9823199011';
  const patDistrict = patient?.district || 'Pune';
  const patState = patient?.state || 'Maharashtra';

  return (
    <>
      <div className="w-full max-w-7xl mx-auto pt-6 px-4 pb-32">
        <div className="mb-4">
          <h2 className="text-4xl font-bold text-primary mb-2 font-devanagari">
            {t('profile.title')}
          </h2>
          <p className="text-lg text-slate-600">
            {t('profile.subtitle')}
          </p>
        </div>

        <AudioGuidanceBanner 
          englishText="Audio prompt: Please confirm that your details shown on the screen are correct."
          regionalText="सुनने के लिए टैप करें: कृपया पुष्टि करें कि स्क्रीन पर दिखाए गए आपके विवरण सही हैं।"
        />

        <div className="grid grid-cols-2 gap-6 mt-8">
          {/* Full Name & Age/Gender */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wide">
                <User className="w-5 h-5" /> {t('profile.patientName')}
              </div>
              <span className="bg-[#CCFBF1] text-[#0D9488] px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                ✓ Verified
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">
                {patName}
              </h3>
              <p className="text-slate-500 text-lg mt-1 font-devanagari">
                {patAge} {t('register.years')}, {patGender === 'Female' ? t('register.female') : patGender === 'Other' ? t('register.otherGender') : t('register.male')}
              </p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-slate-400 text-sm">Aadhaar verified demographic</span>
              <button
                type="button"
                onClick={handleEditDemographics}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                {isAbha ? <Lock className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {t('profile.edit')}
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wide">
                <Smartphone className="w-5 h-5" /> {t('profile.mobile')}
              </div>
              <span className="bg-[#CCFBF1] text-[#0D9488] px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                ✓ Verified
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">
                +91 {patMobile.length >= 10 ? `${patMobile.slice(0, 5)} ${patMobile.slice(5)}` : patMobile}
              </h3>
              <p className="text-slate-500 text-sm mt-1">SMS Slip &amp; WhatsApp Rx Active</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[#059669] font-bold text-sm flex items-center gap-1">
                SMS Alerts ON
              </span>
              <button
                type="button"
                onClick={handleEditDemographics}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                {isAbha ? <Lock className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {t('profile.edit')}
              </button>
            </div>
          </div>

          {/* District & State */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wide">
                <MapPin className="w-5 h-5" /> {t('profile.districtState')}
              </div>
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">PIN: 415001</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">
                {patDistrict}, {patState}
              </h3>
              <p className="text-slate-500 font-devanagari text-lg">सतारा, महाराष्ट्र (पश्चिम भाग)</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-slate-500 font-bold text-sm flex items-center gap-1">
                🏢 District Civil Hospital OPD
              </span>
              <button
                type="button"
                onClick={handleEditDemographics}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                {isAbha ? <Lock className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {t('profile.edit')}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wide">
                <Languages className="w-5 h-5" /> {t('profile.language')}
              </div>
              <span className="bg-[#CCFBF1] text-[#0D9488] px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                🎙️ Voice Active
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">
                {language === 'mr' ? 'मराठी (Marathi)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">Doctor consultation translation ready</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[#059669] font-bold text-sm flex items-center gap-1">
                🎙️ Voice Input Enabled
              </span>
              <button
                type="button"
                onClick={handleEditLanguage}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                🔄 {t('profile.changeLanguage')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom confirmation prompt */}
        <div className="mt-8 bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold">👍</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              {t('profile.confirmPrompt')}
            </h3>
            <p className="text-slate-600 font-devanagari">
              सब कुछ सही है? अपनी स्वास्थ्य समस्या के बारे में बताने के लिए 'आगे बढ़ें' दबाएं।
            </p>
          </div>
        </div>
      </div>

      {/* ABHA Edit Protection Modal */}
      <Modal
        open={abhaEditModalOpen}
        onClose={() => setAbhaEditModalOpen(false)}
        title={
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">
                ABHA Profile Linked
              </h3>
              <p className="text-slate-500 text-sm font-devanagari mt-0.5">
                ABHA प्रोफ़ाइल से जुड़ा हुआ
              </p>
            </div>
          </div>
        }
        footer={
          <button
            type="button"
            onClick={() => setAbhaEditModalOpen(false)}
            className="w-full bg-primary text-white py-4 rounded-2xl text-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Understood / समझ गया
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-700 text-lg leading-relaxed">
            Your ABHA-linked identity details are verified and <strong>cannot be changed here.</strong> Please update them through your ABHA profile.
          </p>
          <p className="text-slate-500 font-devanagari text-base leading-relaxed">
            आपकी ABHA से जुड़ी पहचान जानकारी सत्यापित है और यहाँ बदली नहीं जा सकती। कृपया अपनी ABHA प्रोफ़ाइल के माध्यम से इसे अपडेट करें।
          </p>
          <div className="bg-blue-50 rounded-2xl px-4 py-3 text-blue-700 text-sm flex items-start gap-2">
            <span className="mt-0.5 shrink-0">ℹ️</span>
            <span>
              Visit <strong>healthid.ndhm.gov.in</strong> or the ABHA app to update your core identity details.
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
}