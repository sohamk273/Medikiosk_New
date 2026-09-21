import { useNavigate } from 'react-router-dom';
import { User, Smartphone, MapPin, Languages, CheckCircle2 } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';

export default function Profile() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { patient, identificationMethod } = usePatientSession();

  const isAbha = identificationMethod === 'abha';

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
    <div className="w-full max-w-5xl mx-auto py-4 flex flex-col justify-center min-h-[calc(100vh-180px)]">
      {/* Title Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari mb-2">
          {t('profile.title')}
        </h2>
        <p className="text-sm text-slate-600 font-medium">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* 4 Demographics Cards Grid */}
      <div id="sahayak-target-profile-cards" className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2 max-w-4xl mx-auto w-full">
        {/* Full Name & Age/Gender */}
        <GlassCard className="p-5 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-wide">
              <User className="w-4 h-4 text-mediblue-600" /> 
              <span>{t('profile.fullName')}</span>
            </div>
            <span className="bg-medigreen-50 text-medigreen-700 border border-medigreen-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-medigreen-600" />
              {isAbha ? 'ABHA Linked' : 'Registered'}
            </span>
          </div>
          <div className="mb-auto">
            <h3 className="text-xl sm:text-2xl font-black text-navy-900">
              {patName}
            </h3>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {patAge} {t('register.years')} · {patGender}
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-medigreen-700 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Demographics Verified
            </span>
          </div>
        </GlassCard>

        {/* Mobile Number */}
        <GlassCard className="p-5 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-wide">
              <Smartphone className="w-4 h-4 text-mediblue-600" /> 
              <span>{t('profile.mobile')}</span>
            </div>
            <span className="bg-medigreen-50 text-medigreen-700 border border-medigreen-200 px-2 py-0.5 rounded text-[10px] font-bold">
              SMS Active
            </span>
          </div>
          <div className="mb-auto">
            <h3 className="text-xl sm:text-2xl font-mono font-bold text-navy-900 tracking-wider">
              +91 {patMobile.length >= 10 ? `${patMobile.slice(0, 5)} ${patMobile.slice(5)}` : patMobile}
            </h3>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-medigreen-700 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SMS Alerts ON
            </span>
          </div>
        </GlassCard>

        {/* District & State */}
        <GlassCard className="p-5 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-wide">
              <MapPin className="w-4 h-4 text-mediblue-600" /> 
              <span>{t('profile.districtState')}</span>
            </div>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
              PIN: 415001
            </span>
          </div>
          <div className="mb-auto">
            <h3 className="text-xl sm:text-2xl font-black text-navy-900 truncate">
              {patDistrict}, {patState}
            </h3>
            {language !== 'en' && (
              <p className="text-slate-500 font-devanagari text-xs mt-1">
                {language === 'hi' ? 'पुणे, महाराष्ट्र (पश्चिमी क्षेत्र)' : 'पुणे, महाराष्ट्र (पश्चिम विभाग)'}
              </p>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-bold text-xs">
              Civil Hospital OPD
            </span>
          </div>
        </GlassCard>

        {/* Language */}
        <GlassCard className="p-5 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-wide">
              <Languages className="w-4 h-4 text-mediblue-600" /> 
              <span>{t('profile.language')}</span>
            </div>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">
              Voice Ready
            </span>
          </div>
          <div className="mb-auto">
            <h3 className="text-xl sm:text-2xl font-black text-navy-900">
              {language === 'mr' ? 'मराठी (Marathi)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
            </h3>
            <p className="text-slate-500 text-xs mt-1">Doctor consultation translation ready</p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-medigreen-700 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Voice Input Enabled
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}