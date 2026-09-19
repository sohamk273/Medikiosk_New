import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { CheckCircle2, BellRing, HelpCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Complete() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { submission, tokenNumber, uhid, clearSession } = usePatientSession();
  const [sahayakNotified, setSahayakNotified] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleCallSahayak = () => {
    setSahayakNotified(true);
    setTimeout(() => setSahayakNotified(false), 4000);
  };

  const handleDone = () => {
    setIsDone(true);
  };

  const handleStartNewPatient = () => {
    clearSession();
    navigate('/patient/language');
  };

  useKioskScreen({
    onContinue: handleDone,
    onBack: () => {},
    isContinueDisabled: false,
    audioPrompt: t('complete.audioGuidance') || `Registration complete. Your OPD Token number is ${tokenNumber || 14}. Please proceed to Room number 4.`,
  });

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="bg-[#E6FAF5] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-[#0D9488]" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          {t('complete.allSet')}
        </h2>
        <p className="text-lg text-slate-500 mb-8">
          {t('complete.waitingAreaNotice')}
        </p>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleStartNewPatient}
            className="bg-[#0D9488] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#0B8070] transition-colors shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {t('complete.startNewSession')}
          </button>
        </div>
      </div>
    );
  }

  const displayToken = tokenNumber || 14;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-6 pb-32">
      {/* Success Notification Bar */}
      <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl p-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#059669] flex items-center justify-center text-white shrink-0">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {t('complete.title')}
          </h2>
          <p className="text-slate-600">
            {t('complete.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Big Token Box */}
        <div className="col-span-5 flex flex-col items-center justify-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
            {t('complete.opdTokenNumber')}
          </span>
          <div className="text-7xl font-mono font-black text-[#0D9488] tracking-tight mb-2">
            #{displayToken}
          </div>
          <span className="bg-[#E6FAF5] text-[#0D9488] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
            Room 4 ? Dr. Priya Sharma
          </span>

          <div className="w-full border-t border-slate-100 pt-6 text-sm text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span>UHID:</span>
              <span className="font-mono font-bold text-slate-700">{uhid || 'UHID-MH-449102'}</span>
            </div>
            <div className="flex justify-between">
              <span>Case Reference:</span>
              <span className="font-mono font-bold text-slate-700">{submission.caseId || `OPD-TOKEN-${displayToken}`}</span>
            </div>
          </div>
        </div>

        {/* Right: Next Steps Instructions */}
        <div className="col-span-7 flex flex-col justify-between bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {t('complete.whatNext')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-800">{t('complete.step1Title')}</h4>
                  <p className="text-sm text-slate-500">{t('complete.step1Desc')}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-800">{t('complete.step2Title')}</h4>
                  <p className="text-sm text-slate-500">{t('complete.step2Desc')}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-800">{t('complete.step3Title')}</h4>
                  <p className="text-sm text-slate-500">{t('complete.step3Desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {!sahayakNotified ? (
              <button
                type="button"
                onClick={handleCallSahayak}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm bg-slate-50 px-4 py-2 rounded-xl transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                {t('complete.callSahayak')}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[#059669] font-bold text-sm">
                <BellRing className="w-4 h-4" />
                {t('complete.sahayakAlerted')}
              </div>
            )}

            <button
              type="button"
              onClick={handleDone}
              className="bg-[#0D9488] hover:bg-[#0B8070] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md"
            >
              {t('complete.doneBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
