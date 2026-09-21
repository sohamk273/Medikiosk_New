import { useNavigate } from 'react-router-dom';
import { ArrowRight, Volume2, ShieldCheck, HeartHandshake } from 'lucide-react';
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
    onBack: () => { },
    isBackDisabled: true,
    audioPrompt: t('welcome.audioGuidance') || 'Welcome to Swasthya Sahayak. Tap Start Registration to begin.',
  });

  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-center text-center relative overflow-y-auto overflow-x-hidden bg-cover bg-center bg-no-repeat px-4 py-2"
      style={{ backgroundImage: "url('/landing-page.png')" }}
    >
      <div className="w-full max-w-[1000px] mx-auto flex flex-col items-center justify-center text-center z-10 bg-transparent pt-4 pb-6">
        {/* ABDM Trust Badge */}
        <div className="inline-flex items-center gap-2 bg-white text-medigreen-800 border border-medigreen-200/80 px-4 py-2 rounded-full text-[13px] font-bold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-medigreen-600" />
          <span>Ayushman Bharat Digital Health Mission (ABDM) Compliant</span>
        </div>

        {/* Center Logo Mark */}
        <div className="mb-5 flex justify-center w-full">
          <img
            src="/logo.png"
            alt="Swasthya Sahayak Logo"
            className="h-[100px] w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Main Title & Subtitle */}
        <h1 className="text-4xl sm:text-[48px] font-black text-navy-900 tracking-tight mb-2 leading-tight">
          Welcome to <span className="text-[#008f71]">Swasthya Sahayak</span>
        </h1>

        <p className="text-xl sm:text-[24px] text-slate-600 mb-3 font-bold">
          Your Smart Digital OPD Companion
        </p>

        <p className="text-sm sm:text-[14px] text-slate-500 font-medium mb-8 flex items-center gap-3">
          <span>Guided by Tradition</span>
          <span className="w-1 h-3.5 bg-slate-300 rounded-full"></span>
          <span>Powered by Technology</span>
          <span className="w-1 h-3.5 bg-slate-300 rounded-full"></span>
          <span>Caring for Every Indian</span>
        </p>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full max-w-[360px] bg-[#008f71] hover:bg-[#007a60] text-white py-4 px-8 rounded-full font-bold text-[20px] flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl active:scale-95 mb-8 cursor-pointer"
        >
          <span>Start Your Health Journey</span>
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left max-w-[920px]">
          <div className="p-5 flex items-center gap-4 bg-white/95 backdrop-blur-sm shadow-sm rounded-[24px] border border-slate-100">
            <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center bg-[#f0f4ff] text-[#3b82f6] rounded-full">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-navy-900 text-[15px] mb-1 leading-snug">Voice AI Enabled</h4>
              <p className="text-[13px] text-slate-500 leading-tight">Speak naturally in Hindi,<br />Marathi, or English</p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4 bg-white/95 backdrop-blur-sm shadow-sm rounded-[24px] border border-slate-100">
            <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center bg-[#f0fdf4] text-[#22c55e] rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-navy-900 text-[15px] mb-1 leading-snug">ABHA QR Scan</h4>
              <p className="text-[13px] text-slate-500 leading-tight">Instant registration with<br />your health ID card</p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4 bg-white/95 backdrop-blur-sm shadow-sm rounded-[24px] border border-slate-100">
            <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center bg-[#f0fdfa] text-[#14b8a6] rounded-full">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-navy-900 text-[15px] mb-1 leading-snug">Sahayak Help</h4>
              <p className="text-[13px] text-slate-500 leading-tight">Hospital staff ready to<br />assist at any point</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}