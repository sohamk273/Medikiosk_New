import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Bell, ArrowRight, ShieldAlert, PhoneCall } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const RedFlagTriagePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, redFlag, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const alertMsg = `${t.redFlagTitle}. ${t.redFlagWarningText} ${t.redFlagTriageNotice}`;
    speakText(alertMsg);
  }, []);

  const handleProceedToTriage = () => {
    playClickSound();
    speakText('Proceeding to Emergency Triage Desk.');
    setTimeout(() => {
      navigate('/complete');
    }, 400);
  };

  return (
    <KioskLayout
      showBack={false}
      audioText={`${t.redFlagTitle}. ${t.redFlagWarningText}`}
    >
      <ScreenTransition className="max-w-4xl mx-auto py-4">
        {/* Pulsing Emergency Card */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 blur-lg opacity-75 animate-pulse" />

          <GlassCard className="relative p-8 md:p-10 bg-white/95 border-4 border-rose-600 text-center flex flex-col items-center">
            {/* Alert Icon */}
            <div className="w-24 h-24 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-6 shadow-xl animate-bounce border-4 border-rose-300">
              <AlertOctagon className="w-14 h-14" />
            </div>

            <span className="bg-rose-600 text-white font-black text-xs uppercase px-4 py-1.5 rounded-full tracking-widest mb-3">
              CRITICAL SAFETY TRIAGE INTERCEPT
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-navy-900 mb-4 tracking-tight">
              {t.redFlagTitle}
            </h1>

            <p className="text-xl md:text-2xl font-extrabold text-rose-700 mb-6 max-w-2xl leading-relaxed">
              "{redFlag?.symptom || 'High Priority Emergency Symptom Detected'}"
            </p>

            <p className="text-lg font-semibold text-slate-700 mb-8 max-w-xl">
              {t.redFlagWarningText}
            </p>

            {/* Triage Room Notice */}
            <div className="w-full max-w-xl p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center gap-4 text-left mb-8 shadow-sm">
              <ShieldAlert className="w-10 h-10 text-amber-600 shrink-0" />
              <div>
                <p className="font-black text-amber-950 text-lg">
                  {t.redFlagTriageNotice}
                </p>
                <p className="text-xs font-bold text-amber-800">
                  Target Location: {redFlag?.triageRoom || 'Room 102 Emergency Triage'}
                </p>
              </div>
            </div>

            {/* Nurse Alerted Notification */}
            <div className="w-full max-w-xl p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900 mb-8">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-emerald-600 animate-pulse" />
                <span className="font-bold text-sm">{t.redFlagNurseAlerted}</span>
              </div>
              <span className="text-xs font-extrabold bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full">
                ACTIVE ALERT
              </span>
            </div>

            {/* Proceed Action */}
            <button
              type="button"
              onClick={handleProceedToTriage}
              className="w-full max-w-xl py-5 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-2xl shadow-xl shadow-rose-600/40 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
            >
              <span>{t.redFlagProceedBtn}</span>
              <ArrowRight className="w-7 h-7 stroke-[2.5]" />
            </button>
          </GlassCard>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
