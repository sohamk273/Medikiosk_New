import { useNavigate } from 'react-router-dom';
import { QrCode, FilePlus2, FileScan, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Identify() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setIdentificationMethod } = usePatientSession();

  const handleSelectMethod = (method: 'abha' | 'new' | 'opd', path: string) => {
    setIdentificationMethod(method);
    navigate(path);
  };

  useKioskScreen({
    onContinue: () => handleSelectMethod('abha', '/patient/abha'),
    onBack: () => navigate('/patient/language'),
    audioPrompt: t('identify.audioGuidance') || 'Choose how you want to start: Scan your ABHA card, register as a new patient, or scan your OPD slip.',
  });

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4 pb-32">
      <div className="mb-4">
        <h2 className="text-4xl font-bold text-primary mb-2 font-devanagari">
          {t('identify.title')}
        </h2>
        <p className="text-lg text-slate-600">
          {t('identify.subtitle')}
        </p>
      </div>

      <AudioGuidanceBanner 
        englishText="Audio prompt: Please choose how you want to identify yourself."
        regionalText="सुनने के लिए टैप करें: कृपया पहचान का तरीका चुनें।"
      />

      {/* 3 Large Action Cards */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        {/* Card 1: ABHA QR */}
        <button
          type="button"
          onClick={() => handleSelectMethod('abha', '/patient/abha')}
          className="relative bg-white rounded-3xl p-8 border-2 border-[#A7F3D0] hover:border-[#0D9488] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between text-left h-[420px] group cursor-pointer"
        >
          <span className="absolute top-4 right-4 bg-[#CCFBF1] text-[#0D9488] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {t('identify.fastest')}
          </span>

          <div className="w-20 h-20 rounded-2xl bg-[#E6FAF5] text-[#0D9488] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            <QrCode className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-primary mb-2 font-devanagari">
              {t('identify.abhaCard')}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {t('identify.abhaCardDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[#0D9488] font-bold text-lg pt-4 border-t border-slate-100">
            <span>{t('identify.scanAbhaQr')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 2: New Registration */}
        <button
          type="button"
          onClick={() => handleSelectMethod('new', '/patient/register')}
          className="relative bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-[#0D9488] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between text-left h-[420px] group cursor-pointer"
        >
          <span className="absolute top-4 right-4 bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Direct Form
          </span>

          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            <FilePlus2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-primary mb-2 font-devanagari">
              {t('identify.newRegistration')}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {t('identify.newRegistrationDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-primary font-bold text-lg pt-4 border-t border-slate-100">
            <span>{t('identify.enterDetails')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 3: OPD Slip */}
        <button
          type="button"
          onClick={() => handleSelectMethod('opd', '/patient/opd-slip')}
          className="relative bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-[#0D9488] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between text-left h-[420px] group cursor-pointer"
        >
          <span className="absolute top-4 right-4 bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Existing Token
          </span>

          <div className="w-20 h-20 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            <FileScan className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-primary mb-2 font-devanagari">
              {t('identify.opdSlip')}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {t('identify.opdSlipDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-purple-700 font-bold text-lg pt-4 border-t border-slate-100">
            <span>{t('identify.scanSlip')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* ABDM & Sahayak Assistance Banner */}
      <div className="mt-8 bg-[#EFF6FF] border border-[#BFDBFE] rounded-3xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-[#2563EB]" />
          <div>
            <h4 className="font-bold text-primary text-base">
              National Health Authority (NHA) ABDM Compliant
            </h4>
            <p className="text-slate-600 text-sm">
              Your demographic data is encrypted and transferred only to your attending OPD physician.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#2563EB] font-bold text-sm bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
          <HeartHandshake className="w-4 h-4" />
          <span>Sahayak Staff on Duty</span>
        </div>
      </div>
    </div>
  );
}