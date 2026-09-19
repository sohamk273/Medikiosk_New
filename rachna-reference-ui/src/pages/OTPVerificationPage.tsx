import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { OTPInput } from '../components/kiosk/OTPInput';
import { VirtualNumpad } from '../components/ui/VirtualNumpad';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { abdmService } from '../services/abdmService';

export const OTPVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    authMode,
    phoneNumber,
    setVerifiedPatient,
    playClickSound,
    playSuccessSound,
  } = useKiosk();
  const t = TRANSLATIONS[language];

  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const isRegister = authMode === 'register';
  const displayPhone = phoneNumber
    ? `+91 ${phoneNumber.slice(0, 2)}XXX ${phoneNumber.slice(-4)}`
    : '+91 98XXX 12345';

  // 30s Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !loading && !verifiedSuccess) {
      handleVerify(otp);
    }
  }, [otp]);

  const handleDigitPress = (digit: string) => {
    if (otp.length < 6) {
      setErrorMessage('');
      setOtp((prev) => prev + digit);
    }
  };

  const handleDeletePress = () => {
    setOtp((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClearPress = () => {
    setOtp('');
    setErrorMessage('');
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    playClickSound();
    setSecondsLeft(30);
    setOtp('');
    setErrorMessage('');
    await abdmService.resendOTP(phoneNumber || '9876512345');
  };

  const handleVerify = async (codeToVerify = otp) => {
    if (codeToVerify.length !== 6) {
      setErrorMessage(t.otpInvalid);
      return;
    }

    playClickSound();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await abdmService.verifyOTP(phoneNumber || '9876512345', codeToVerify);
      if (res.status === 1) {
        setVerifiedSuccess(true);
        playSuccessSound();
        if (res.patient) {
          setVerifiedPatient(res.patient);
        }

        // Trigger gentle healthcare celebration confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#10B981', '#93C5FD', '#A7F3D0'],
        });

        // Navigate to Patient Dashboard & OPD Token confirmation
        setTimeout(() => {
          if (isRegister && !phoneNumber) {
            navigate('/demographics');
          } else {
            navigate('/consent');
          }
        }, 1200);
      } else {
        setErrorMessage(res.message || t.otpInvalid);
      }
    } catch {
      setErrorMessage('Verification failed. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const formattedTimer = `00:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}`;

  return (
    <KioskLayout
      showBack={true}
      backTo="/auth"
      audioText={`${t.otpTitle}. ${t.otpSubtitle} ${displayPhone}.`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header Titles (Matching Exact Mockup) */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.otpTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500">
            {t.otpSubtitle} <span className="font-extrabold text-navy-900 tracking-wider">{displayPhone}</span>
          </p>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main OTP Input Area (Columns 1-7) */}
          <GlassCard className="lg:col-span-7 p-6 md:p-8 flex flex-col items-center justify-between min-h-[420px]">
            <div className="w-full flex flex-col items-center">
              {/* 6 Large OTP Boxes */}
              <OTPInput
                value={otp}
                onChange={setOtp}
                length={6}
                disabled={loading || verifiedSuccess}
                variant={isRegister ? 'green' : 'blue'}
                error={Boolean(errorMessage)}
              />

              {errorMessage && (
                <div className="mt-3 flex items-center gap-2 text-sm text-rose-600 font-semibold bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Resend OTP Bar (Matching Mockup: "Didn't receive OTP? Resend in 00:30") */}
              <div className="mt-6 flex items-center gap-2 text-base font-semibold text-slate-600">
                <span>{t.didntReceiveOtp}</span>
                {secondsLeft > 0 ? (
                  <span className="font-bold text-mediblue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {t.resendIn} {formattedTimer}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="flex items-center gap-1.5 font-bold text-mediblue-600 hover:text-mediblue-800 underline underline-offset-4"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.resendOtp}</span>
                  </button>
                )}
              </div>

              {/* Demo Hint */}
              <div className="mt-3 text-xs text-slate-400 font-medium">
                (Demo Mode: Enter any 6 digits like <span className="font-bold text-mediblue-600">123456</span>)
              </div>
            </div>

            {/* Bottom Row Actions */}
            <div className="w-full mt-6">
              {verifiedSuccess ? (
                <div className="w-full py-4 rounded-2xl bg-medigreen-500 text-white font-bold text-xl flex items-center justify-center gap-3 shadow-lg">
                  <CheckCircle2 className="w-7 h-7" />
                  <span>{t.verifiedSuccess}</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={loading || otp.length !== 6}
                  onClick={() => handleVerify()}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-md transition-all min-h-[60px] ${
                    otp.length === 6
                      ? isRegister
                        ? 'bg-medigreen-600 hover:bg-medigreen-700 text-white active:scale-98'
                        : 'bg-mediblue-600 hover:bg-mediblue-700 text-white active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>{t.verifyBtn}</span>
                      <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                    </>
                  )}
                </button>
              )}
            </div>
          </GlassCard>

          {/* Right Side: Virtual Numpad & "Your data is safe with us" Badge (Columns 8-12) */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            {/* "Your data is safe with us" Trust Badge (Matching Mockup) */}
            <GlassCard className="w-full max-w-sm p-4 flex items-center gap-3.5 bg-gradient-to-r from-blue-50/70 to-emerald-50/50 border border-white">
              <div className="w-12 h-12 rounded-2xl bg-white text-mediblue-600 flex items-center justify-center shadow-sm shrink-0 border border-blue-100">
                <ShieldCheck className="w-7 h-7 text-mediblue-600" />
              </div>
              <div>
                <p className="font-extrabold text-navy-900 text-base">
                  {t.dataSafeBadge}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  256-bit Encrypted Government Health Locker
                </p>
              </div>
            </GlassCard>

            {/* Virtual Numpad */}
            <VirtualNumpad
              onDigitPress={handleDigitPress}
              onDeletePress={handleDeletePress}
              onClearPress={handleClearPress}
              maxLengthReached={otp.length >= 6}
            />
          </div>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
