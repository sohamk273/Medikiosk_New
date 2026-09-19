import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileScan, Wand2, QrCode, ArrowRight } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

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
      district: 'Pune',
      state: 'Maharashtra',
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
    <div className="w-full max-w-6xl mx-auto pt-6 px-4 pb-32">
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-primary mb-2 font-devanagari">
          {t('opdSlip.title')}
        </h2>
        <p className="text-lg text-slate-600">
          {t('opdSlip.subtitle')}
        </p>
      </div>

      <AudioGuidanceBanner 
        englishText="Please hold your OPD slip under the scanner or type your token number."
        regionalText="कृपया अपनी पर्ची को स्कैनर के नीचे रखें या अपना टोकन नंबर दर्ज करें।"
      />

      <div className="grid grid-cols-12 gap-8 mt-8">
        {/* Left: Scan Area */}
        <div className="col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-[#A7F3D0] text-primary rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <FileScan className="w-12 h-12" />
            </div>

            <h3 className="text-2xl font-bold text-primary mb-2">
              {t('opdSlip.scanBarcodeTitle')}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md">
              {t('opdSlip.scanBarcodeDesc')}
            </p>

            <button
              type="button"
              onClick={handleScanBarcode}
              disabled={isScanning}
              className="bg-[#064E3B] hover:bg-[#064E3B]/90 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-colors shadow-md"
            >
              <QrCode className="w-6 h-6" />
              {isScanning ? t('opdSlip.scanning') : t('opdSlip.simulateScan')}
            </button>
          </div>

          <div className="bg-[#F0FDF4] rounded-3xl p-6 border border-[#DCFCE7] shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold text-primary text-lg">Quick Demo Patient Slip</h4>
              <p className="text-slate-600 text-sm">Load pre-registered hospital slip for testing</p>
            </div>
            <button
              type="button"
              onClick={handleLookup}
              className="bg-[#059669] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#047857] transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Load Demo Slip
            </button>
          </div>
        </div>

        {/* Right: Keypad Area */}
        <div className="col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-4">
              <label className="text-lg font-bold text-primary block mb-2">
                {t('opdSlip.manualToken')}
              </label>
              <div className="w-full text-3xl font-mono font-bold tracking-widest h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 flex items-center justify-center text-primary">
                {tokenInput || '______'}
              </div>
            </div>

            <NumericKeypad 
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
            />

            <button
              type="button"
              onClick={handleLookup}
              disabled={tokenInput.length === 0}
              className="w-full mt-4 bg-primary text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('opdSlip.verifyToken')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}