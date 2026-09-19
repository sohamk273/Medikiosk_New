import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, Volume2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStart = () => {
    navigate('/patient/language');
  };

  useKioskScreen({
    onContinue: handleStart,
    onBack: () => {},
    isBackDisabled: true,
    audioPrompt: t('welcome.audioGuidance') || 'Welcome to MediKiosk. Tap Start Registration to begin.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto pt-12 px-6 flex flex-col items-center text-center">
      {/* Hospital Logo & Badge */}
      <div className="w-28 h-28 bg-[#064E3B] text-white rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-950/10 border-4 border-emerald-100">
        <Stethoscope className="w-14 h-14" />
      </div>

      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Ayushman Bharat Digital Health Mission (ABDM) Enabled</span>
      </div>

      <h1 className="text-5xl font-black text-primary tracking-tight mb-4 max-w-3xl leading-tight">
        {t('welcome.title')}
      </h1>

      <p className="text-xl text-slate-600 mb-10 max-w-2xl font-medium">
        {t('welcome.subtitle')}
      </p>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={handleStart}
        className="w-full max-w-md bg-[#064E3B] hover:bg-[#064E3B]/90 text-white py-6 px-8 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-xl hover:shadow-2xl active:scale-98 shadow-emerald-950/20 mb-8"
      >
        <span>{t('welcome.startRegistration')}</span>
        <ArrowRight className="w-8 h-8" />
      </button>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-4xl mt-6 text-left">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base mb-1">Voice AI Enabled</h4>
            <p className="text-xs text-slate-500">Speak naturally in Hindi, Marathi, or English</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base mb-1">ABHA QR Scan</h4>
            <p className="text-xs text-slate-500">Instant registration with your health card</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base mb-1">Sahayak Assistance</h4>
            <p className="text-xs text-slate-500">Hospital volunteers ready to help at any step</p>
          </div>
        </div>
      </div>
    </div>
  );
}