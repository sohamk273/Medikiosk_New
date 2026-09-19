import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { VirtualNumpad } from '../components/ui/VirtualNumpad';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { abdmService } from '../services/abdmService';

export const PhoneInputPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, authMode, phoneNumber, setPhoneNumber, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isRegister = authMode === 'register';
  const backRoute = isRegister ? '/register' : '/login';

  const handleDigitPress = (digit: string) => {
    if (phoneNumber.length < 10) {
      setErrorMessage('');
      setPhoneNumber(phoneNumber + digit);
    }
  };

  const handleDeletePress = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
    setErrorMessage('');
  };

  const handleClearPress = () => {
    setPhoneNumber('');
    setErrorMessage('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phoneNumber.length !== 10) {
      setErrorMessage(t.invalidPhoneMsg);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    playClickSound();

    try {
      const res = isRegister
        ? await abdmService.registerWithPhone(phoneNumber)
        : await abdmService.loginWithPhone(phoneNumber);

      if (res.status === 1) {
        navigate('/otp');
      } else {
        setErrorMessage(res.message || 'Failed to dispatch OTP. Please try again.');
      }
    } catch {
      setErrorMessage('Network error communicating with hospital gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskLayout
      showBack={true}
      backTo={backRoute}
      audioText={`${t.enterPhoneTitle}. ${t.enterPhoneSubtitle}.`}
    >
      <ScreenTransition className="max-w-4xl mx-auto py-2">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.enterPhoneTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500">
            {t.enterPhoneSubtitle}
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Input Card & Send OTP button */}
          <GlassCard className="p-8 flex flex-col items-center justify-between min-h-[400px]">
            <div className="w-full flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  isRegister
                    ? 'bg-medigreen-50 text-medigreen-600 border border-medigreen-200'
                    : 'bg-mediblue-50 text-mediblue-600 border border-mediblue-200'
                }`}
              >
                <Smartphone className="w-8 h-8" />
              </div>

              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mobile Number (10 Digits)
              </label>

              {/* Large Touch Phone Display */}
              <div className="w-full py-4 px-5 rounded-2xl bg-white/95 border-2 border-mediblue-400/40 shadow-inner flex items-center justify-center gap-3">
                <span className="text-2xl md:text-3xl font-extrabold text-slate-400">
                  +91
                </span>
                <span className="text-3xl md:text-4xl font-extrabold text-navy-900 tracking-wider">
                  {phoneNumber ? (
                    phoneNumber.split('').map((ch, idx) => (
                      <span key={idx} className={idx === 5 ? 'mr-2' : ''}>
                        {ch}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-300">98765 43210</span>
                  )}
                </span>
              </div>

              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 text-sm text-rose-600 font-semibold bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ShieldCheck className="w-4 h-4 text-mediblue-600" />
                <span>Instant 6-digit SMS verification</span>
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              type="button"
              disabled={loading || phoneNumber.length !== 10}
              onClick={() => handleSubmit()}
              className={`w-full mt-6 py-4 md:py-5 px-6 rounded-2xl font-bold text-xl md:text-2xl flex items-center justify-center gap-3 shadow-lg transition-all min-h-[64px] ${
                phoneNumber.length === 10
                  ? isRegister
                    ? 'bg-medigreen-600 hover:bg-medigreen-700 text-white active:scale-98'
                    : 'bg-mediblue-600 hover:bg-mediblue-700 text-white active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>{t.sendOtpBtn}</span>
                  <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                </>
              )}
            </button>
          </GlassCard>

          {/* Right: Touchscreen Virtual Numpad */}
          <div className="flex flex-col items-center justify-center">
            <VirtualNumpad
              onDigitPress={handleDigitPress}
              onDeletePress={handleDeletePress}
              onClearPress={handleClearPress}
              maxLengthReached={phoneNumber.length >= 10}
            />
          </div>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
