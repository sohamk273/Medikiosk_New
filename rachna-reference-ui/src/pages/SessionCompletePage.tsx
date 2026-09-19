import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Printer, RotateCcw, Clock, MapPin, UserCheck, QrCode, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const SessionCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, opdToken, verifiedPatient, resetKiosk, playClickSound, playSuccessSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const tokenNum = opdToken?.tokenNumber || 'OPD-408';
  const doctorName = opdToken?.doctorName || 'Dr. Ananya Sharma (MD)';
  const roomNum = opdToken?.roomNumber || 'Room 204 (First Floor)';
  const dept = opdToken?.department || 'General Medicine & OPD';
  const waitTime = opdToken?.estimatedWaitMinutes || 12;

  useEffect(() => {
    playSuccessSound();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563EB', '#10B981', '#6366F1', '#34D399'],
    });

    const announcementText = `${t.completeTitle}. ${t.completeTokenBadge}: ${tokenNum}. ${t.completeDoctor}: ${doctorName}. ${t.completeRoom}: ${roomNum}.`;
    speakText(announcementText);
  }, []);

  const handlePrint = () => {
    playClickSound();
    speakText(t.completePrintSlip);
    window.print();
  };

  const handleNewSession = () => {
    playClickSound();
    resetKiosk();
    navigate('/language');
  };

  return (
    <KioskLayout
      showBack={false}
      audioText={`${t.completeTitle}. ${t.completeTokenBadge}: ${tokenNum}`}
    >
      <ScreenTransition className="max-w-4xl mx-auto py-4">
        <GlassCard className="p-8 md:p-10 text-center relative overflow-hidden bg-white/95 border-2 border-mediblue-200">
          {/* Confetti & Success Badge */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-emerald-300">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-navy-900 tracking-tight mb-2">
            {t.completeTitle}
          </h1>

          <p className="text-lg font-semibold text-slate-500 mb-8 max-w-lg mx-auto">
            {t.completeSubtitle}
          </p>

          {/* Main OPD Token Badge */}
          <div className="w-full max-w-lg mx-auto p-6 rounded-3xl bg-gradient-to-br from-mediblue-600 to-indigo-700 text-white shadow-2xl mb-8 relative">
            <p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-1">
              {t.completeTokenBadge}
            </p>
            <p className="text-6xl font-black tracking-wider my-2">
              {tokenNum}
            </p>
            <div className="mt-3 pt-3 border-t border-blue-400/40 flex items-center justify-center gap-2 text-sm font-bold text-blue-100">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Transmitted to Doctor's Dashboard</span>
            </div>
          </div>

          {/* Details Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-mediblue-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">{t.completeDoctor}</p>
                <p className="font-extrabold text-navy-900 text-base">{doctorName}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">{t.completeRoom}</p>
                <p className="font-extrabold text-navy-900 text-base">{roomNum}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">{t.completeWaitTime}</p>
                <p className="font-extrabold text-navy-900 text-base">~{waitTime} Minutes (Position #3)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">ABDM Token Badge</p>
                <p className="font-extrabold text-navy-900 text-base">{dept}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold text-lg flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-5 h-5 text-mediblue-600" />
              <span>{t.completePrintSlip}</span>
            </button>

            <button
              type="button"
              onClick={handleNewSession}
              className="w-full sm:w-auto flex-1 py-4.5 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-xl shadow-lg shadow-mediblue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[60px]"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{t.completeNewPatient}</span>
            </button>
          </div>
        </GlassCard>
      </ScreenTransition>
    </KioskLayout>
  );
};
