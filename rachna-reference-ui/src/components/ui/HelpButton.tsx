import React, { useState } from 'react';
import { HelpCircle, X, PhoneCall, UserCheck, CheckCircle2 } from 'lucide-react';
import { useKiosk } from '../../context/KioskContext';
import { TRANSLATIONS } from '../../utils/translations';
import { GlassCard } from './GlassCard';

export const HelpButton: React.FC = () => {
  const { language, isHelpOpen, setIsHelpOpen, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleClick = () => {
    playClickSound();
    setIsHelpOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={t.help}
        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl min-h-[58px] bg-white/80 hover:bg-white text-navy-900 border border-white/80 shadow-sm active:scale-95 transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-full bg-mediblue-50 flex items-center justify-center text-mediblue-600 border border-mediblue-100">
          <HelpCircle className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-800">
          {t.help}
        </span>
      </button>

      {isHelpOpen && <HelpModal />}
    </>
  );
};

export const HelpModal: React.FC = () => {
  const { language, setIsHelpOpen, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];
  const [attendantCalled, setAttendantCalled] = useState(false);

  const handleClose = () => {
    playClickSound();
    setIsHelpOpen(false);
  };

  const handleCallAttendant = () => {
    playClickSound();
    setAttendantCalled(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-900/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <GlassCard className="w-full max-w-xl p-8 bg-white/95 border-2 border-white shadow-2xl rounded-3xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-mediblue-100 text-mediblue-600 flex items-center justify-center">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-900">
                {t.hospitalHelpTitle}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                OPD Kiosk Floor Help Desk
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label={t.close}
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          <p className="text-lg text-slate-700 leading-relaxed">
            {t.hospitalHelpDesc}
          </p>

          <div className="bg-mediblue-50/70 border border-mediblue-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-mediblue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <p className="text-base text-slate-800">
                If you have an <strong>ABHA Card / QR Code</strong>, hold it steady in front of the scanner barcode camera.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-mediblue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <p className="text-base text-slate-800">
                If you do not have an ABHA Card, choose <strong>Phone Number</strong> to receive an instant SMS OTP.
              </p>
            </div>
          </div>

          {attendantCalled ? (
            <div className="flex items-center gap-3 p-4 bg-medigreen-50 border border-medigreen-200 rounded-2xl text-medigreen-700">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="text-base font-medium">
                {t.attendantNotification}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCallAttendant}
              className="w-full py-4 px-6 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md active:scale-98 transition-all min-h-[64px]"
            >
              <UserCheck className="w-6 h-6" />
              <span>{t.callAttendant}</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-mediblue-600" /> Helpline: 1075 / 1800-11-4477
            </span>
            <span>Hospital Attendant Desk: Ext. 204</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors"
          >
            {t.close}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
