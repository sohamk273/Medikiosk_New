import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileScan, QrCode, ArrowRight, Loader2 } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';

export default function OpdSlip() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setPatient, setPatientId, setUhid, setIdentificationMethod } = usePatientSession();
  const [tokenInput, setTokenInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleKeyPress = (num: string) => {
    if (tokenInput.length < 8) {
      setTokenInput(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setTokenInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setTokenInput('');
  };

  const handleLookup = () => {
    setIdentificationMethod('opd');
    setPatient({
      name: 'Rameshwar Patil',
      age: '62',
      gender: 'Male',
      mobile: '9823199011',
    });
    setPatientId('pat-opd-' + Date.now());
    setUhid('UHID-MH-449102');
    navigate('/patient/consent');
  };

  const handleScanBarcode = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setTokenInput('849201');
      handleLookup();
    }, 1200);
  };

  useKioskScreen({
    onContinue: handleLookup,
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: isScanning,
    audioPrompt: t('opdSlip.audioGuidance') || 'Please hold your OPD slip barcode under the scanner or type your slip number on the keypad.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-3 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {t('opdSlip.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {t('opdSlip.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Left: Barcode Scanner */}
        <GlassCard className="col-span-12 lg:col-span-7 p-5 flex flex-col items-center text-center border-medigreen-300/80">
          <div className="w-16 h-16 bg-medigreen-50 text-medigreen-600 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
            <FileScan className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-navy-900 mb-1">
            {t('opdSlip.scanBarcodeTitle')}
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            {t('opdSlip.scanBarcodeDesc')}
          </p>

          <button
            type="button"
            onClick={handleScanBarcode}
            disabled={isScanning}
            className="bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer mb-4"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('opdSlip.scanning')}</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>{t('opdSlip.simulateScan')}</span>
              </>
            )}
          </button>

          {/* Manual input preview */}
          <div className="w-full max-w-xs border-t border-slate-100 pt-3">
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Token Number:
            </label>
            <div className="w-full text-xl font-mono font-bold tracking-widest h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center justify-center text-navy-900">
              {tokenInput || 'XXXXXX'}
            </div>
          </div>
        </GlassCard>

        {/* Right: Numeric Keypad */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
          <GlassCard className="p-3.5">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-navy-900">
                Manual Token Entry
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">8 Digits Max</span>
            </div>

            <NumericKeypad 
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
            />

            <button
              type="button"
              onClick={handleLookup}
              disabled={tokenInput.length === 0 || isScanning}
              className="mt-3 w-full bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Look Up OPD Record</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}