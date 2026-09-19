import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Printer, User, Clock, Stethoscope, QrCode, RotateCcw, ShieldCheck } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const PatientDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, verifiedPatient, resetKiosk, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const [isPrinting, setIsPrinting] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Fallback profile if navigated directly
  const patient = verifiedPatient || {
    status: 1,
    firstName: "Aarav",
    lastName: "Sharma",
    phone: "******1234",
    abhaId: "91-8492-3847-1923",
    department: "General Medicine (OPD)",
    tokenNumber: "OPD-A42",
    queuePosition: 3,
    slotTime: "11:30 AM",
    gender: "Male",
    age: 38
  };

  // Auto-reset kiosk after 60s of inactivity to protect patient privacy
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          resetKiosk();
          navigate('/language');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, resetKiosk]);

  const handlePrint = () => {
    playClickSound();
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      window.print();
    }, 600);
  };

  const handleFinish = () => {
    playClickSound();
    resetKiosk();
    navigate('/language');
  };

  return (
    <KioskLayout
      showBack={false}
      audioText={`${t.verifiedSuccess}. ${t.tokenGenerated}: ${patient.tokenNumber}.`}
    >
      <ScreenTransition className="max-w-4xl mx-auto py-2">
        {/* Success Header Banner */}
        <div className="flex items-center gap-3 bg-medigreen-50/80 border border-medigreen-200 px-6 py-3 rounded-2xl mb-6 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-medigreen-600 shrink-0" />
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-medigreen-700">
              {t.verifiedSuccess}
            </h2>
            <p className="text-xs md:text-sm font-semibold text-slate-600">
              {t.tokenGenerated}
            </p>
          </div>
        </div>

        {/* OPD Token Card */}
        <GlassCard className="w-full p-8 md:p-10 border-2 border-white shadow-2xl relative overflow-hidden">
          {/* Top Decorative Hospital Stamp */}
          <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-mediblue-100/80 text-mediblue-700 flex items-center justify-center font-bold text-2xl border border-mediblue-200">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-navy-900">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  ABHA ID: <span className="font-mono text-mediblue-700">{patient.abhaId}</span>
                </p>
              </div>
            </div>

            {/* Token Highlight Box */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-mediblue-600 to-mediblue-800 text-white px-8 py-3 rounded-2xl shadow-md min-w-[200px]">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                {t.tokenNumber}
              </span>
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {patient.tokenNumber}
              </span>
            </div>
          </div>

          {/* OPD Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-mediblue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {t.department}
                </span>
                <span className="text-lg font-bold text-navy-900">
                  {patient.department}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-mediblue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Estimated Time
                </span>
                <span className="text-lg font-bold text-navy-900">
                  {patient.slotTime} ({t.queueEst})
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-medigreen-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Queue Position
                </span>
                <span className="text-lg font-bold text-medigreen-700">
                  {patient.queuePosition} Patients Ahead
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Print Slip & Finish */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-lg shadow-md active:scale-98 transition-all min-h-[58px]"
            >
              <Printer className="w-5 h-5" />
              <span>{isPrinting ? 'Printing Slip...' : t.printReceipt}</span>
            </button>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Auto-reset in {countdown}s
              </span>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg active:scale-98 transition-all min-h-[58px]"
              >
                <RotateCcw className="w-5 h-5 text-slate-600" />
                <span>{t.finishDone}</span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Security & Privacy Reminder */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-mediblue-600" />
          <span>Please collect your printed slip and proceed to Room 104</span>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
