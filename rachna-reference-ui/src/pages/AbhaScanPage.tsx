import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { abdmService } from '../services/abdmService';

export const AbhaScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, authMode, setVerifiedPatient, playClickSound, playSuccessSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [manualAbha, setManualAbha] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const isRegister = authMode === 'register';
  const backRoute = isRegister ? '/register' : '/login';

  const handleSimulateScan = async () => {
    playClickSound();
    setLoading(true);

    try {
      const res = isRegister
        ? await abdmService.registerWithABHA("91-8492-3847-1923")
        : await abdmService.loginWithABHA("91-8492-3847-1923");

      if (res.status === 1) {
        setScanSuccess(true);
        playSuccessSound();
        if (res.patient) {
          setVerifiedPatient(res.patient);
        }
        setTimeout(() => {
          if (isRegister) {
            navigate('/otp');
          } else {
            navigate('/dashboard');
          }
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAbha) return;

    playClickSound();
    setLoading(true);

    try {
      const res = isRegister
        ? await abdmService.registerWithABHA(manualAbha)
        : await abdmService.loginWithABHA(manualAbha);

      if (res.status === 1) {
        setScanSuccess(true);
        playSuccessSound();
        if (res.patient) {
          setVerifiedPatient(res.patient);
        }
        setTimeout(() => {
          navigate(isRegister ? '/otp' : '/dashboard');
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskLayout
      showBack={true}
      backTo={backRoute}
      audioText={`${t.scanAbhaTitle}. ${t.scanAbhaSubtitle}.`}
    >
      <ScreenTransition className="max-w-4xl mx-auto py-2">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.scanAbhaTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500">
            {t.scanAbhaSubtitle}
          </p>
        </div>

        {/* Tab Toggle: QR Scanner vs Manual ABHA */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex p-1.5 rounded-2xl bg-white/70 border border-white/80 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-base transition-all ${
                activeTab === 'scan'
                  ? 'bg-mediblue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>QR Code Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-base transition-all ${
                activeTab === 'manual'
                  ? 'bg-mediblue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Manual ABHA ID</span>
            </button>
          </div>
        </div>

        {activeTab === 'scan' ? (
          <GlassCard className="p-8 flex flex-col items-center justify-center max-w-xl mx-auto min-h-[380px]">
            {/* Viewfinder Frame */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl bg-slate-900/5 border-2 border-dashed border-mediblue-400/70 flex items-center justify-center overflow-hidden mb-6">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-mediblue-600 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-mediblue-600 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-mediblue-600 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-mediblue-600 rounded-br-lg" />

              {/* Laser scanning beam line */}
              <div className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-mediblue-500 to-transparent shadow-[0_0_12px_#2563eb] animate-[bounce_2.5s_infinite]" />

              {scanSuccess ? (
                <div className="flex flex-col items-center justify-center text-medigreen-600 animate-in zoom-in-95">
                  <CheckCircle2 className="w-20 h-20" />
                  <span className="font-bold text-lg mt-2">ABHA QR Verified</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <QrCode className="w-24 h-24 stroke-[1.2] text-mediblue-400/50" />
                  <span className="text-xs font-semibold text-slate-500 mt-3">
                    {t.cameraScanning}
                  </span>
                </div>
              )}
            </div>

            {/* Test Simulation Button */}
            <button
              type="button"
              disabled={loading || scanSuccess}
              onClick={handleSimulateScan}
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-lg shadow-md active:scale-98 transition-all min-h-[58px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
              <span>{t.simulateScanSuccess}</span>
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="p-8 flex flex-col items-center justify-center max-w-xl mx-auto min-h-[380px]">
            <form onSubmit={handleManualSubmit} className="w-full space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                  14-Digit ABHA ID / ABHA Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91-8492-3847-1923 or user@abdm"
                  value={manualAbha}
                  onChange={(e) => setManualAbha(e.target.value)}
                  className="w-full py-4 px-5 rounded-2xl bg-white/95 border-2 border-mediblue-400/40 text-xl font-bold text-navy-900 focus:outline-none focus:border-mediblue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !manualAbha}
                className="w-full py-4 px-6 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-xl flex items-center justify-center gap-3 shadow-md disabled:bg-slate-200 transition-all min-h-[60px]"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>Proceed with ABHA</span>
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-mediblue-600" />
          <span>Compliant with National Health Authority (NHA) ABDM Standards</span>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
