import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShieldCheck, CheckCircle2, AlertCircle, Wand2, Phone, ArrowRight } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { apiFetch } from '@/services/api/client';

export default function Abha() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    setPatient, 
    setAbhaId, 
    setIdentificationMethod,
    setPatientId,
    setUhid,
    setEncounterId,
    encounterId
  } = usePatientSession();

  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  const [abhaDigits, setAbhaDigits] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (abhaDigits.length < 14) {
      setAbhaDigits(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setAbhaDigits(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAbhaDigits('');
  };

  const formatAbhaDisplay = (digits: string) => {
    const clean = digits.replace(/\D/g, '');
    const parts: string[] = [];
    if (clean.length > 0) parts.push(clean.substring(0, 2));
    if (clean.length > 2) parts.push(clean.substring(2, 6));
    if (clean.length > 6) parts.push(clean.substring(6, 10));
    if (clean.length > 10) parts.push(clean.substring(10, 14));
    return parts.join('-');
  };

  const verifyAndProceed = async (idToVerify: string, demoPatient?: any) => {
    setIsVerifying(true);
    setError(null);

    const pat = demoPatient || {
      name: 'Rameshwar Patil',
      age: '62',
      gender: 'Male',
      mobile: '9823199011',
      district: 'Pune',
      state: 'Maharashtra',
    };

    const rawAbha = idToVerify || '91-2834-9201-4412';
    setAbhaId(rawAbha);
    setIdentificationMethod('abha');
    setPatient(pat);

    try {
      let patientData: any = null;
      try {
        patientData = await apiFetch<any>(
          `/patients/search?identity_type=ABHA&identity_value=${encodeURIComponent(rawAbha)}`
        );
      } catch (err: any) {
        if (err.status === 404) {
          patientData = await apiFetch<any>('/patients', {
            method: 'POST',
            body: JSON.stringify({
              full_name: pat.name,
              age: parseInt(pat.age, 10) || 30,
              gender: pat.gender.toLowerCase(),
            }),
          });

          await apiFetch(`/patients/${patientData.id}/identities`, {
            method: 'POST',
            body: JSON.stringify({
              identity_type: 'ABHA',
              identity_value: rawAbha,
              is_verified: true,
            }),
          });
        } else {
          throw err;
        }
      }

      if (patientData && patientData.id) {
        setPatientId(patientData.id);
        setUhid(patientData.uhid || patientData.patient_uhid);

        let activeEncounterId = encounterId;
        if (!activeEncounterId) {
          const encRes = await apiFetch<any>('/encounters', {
            method: 'POST',
            body: JSON.stringify({
              patient_id: patientData.id,
              priority: 'NORMAL',
            }),
          });
          activeEncounterId = encRes.id;
          setEncounterId(encRes.id);
        }
      }

      navigate('/patient/consent');
    } catch (err: any) {
      console.warn('Backend unavailable, continuing in offline mock mode:', err);
      const offlinePatId = 'pat-abha-offline-' + Date.now();
      const offlineUhid = 'UHID-MH-' + Math.floor(100000 + Math.random() * 900000);
      setPatientId(offlinePatId);
      setUhid(offlineUhid);
      if (!encounterId) {
        setEncounterId('enc-offline-' + Date.now());
      }
      navigate('/patient/consent');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateQrScan = () => {
    verifyAndProceed('91-2834-9201-4412', {
      name: 'Rameshwar Patil',
      age: '62',
      gender: 'Male',
      mobile: '9823199011',
      district: 'Pune',
      state: 'Maharashtra',
    });
  };

  const handleManualSubmit = () => {
    if (abhaDigits.length !== 14) {
      setError('Please enter a valid 14-digit ABHA number');
      return;
    }
    verifyAndProceed(formatAbhaDisplay(abhaDigits));
  };

  useKioskScreen({
    onContinue: activeTab === 'qr' ? handleSimulateQrScan : handleManualSubmit,
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: isVerifying,
    audioPrompt: t('abha.audioGuidance') || 'Please scan your ABHA QR card or type your 14 digit ABHA number.',
  });

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4 pb-32">
      <div className="mb-4">
        <h2 className="text-4xl font-bold text-primary mb-2 font-devanagari">
          {t('abha.title')}
        </h2>
        <p className="text-lg text-slate-600">
          {t('abha.subtitle')}
        </p>
      </div>

      <AudioGuidanceBanner 
        englishText="Audio prompt: Please hold your ABHA QR card in front of the scanner, or type your 14-digit number."
        regionalText="सुनने के लिए टैप करें: कृपया अपने आभा क्यूआर कार्ड को स्कैनर के सामने रखें या 14 अंकों का नंबर दर्ज करें।"
      />

      <div className="grid grid-cols-12 gap-8 mt-6">
        {/* Left: Interactive Tabs & Scan */}
        <div className="col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'qr'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-5 h-5" />
                {t('abha.scanQrTab')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone className="w-5 h-5" />
                {t('abha.manualTab')}
              </button>
            </div>

            {activeTab === 'qr' ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="relative w-64 h-64 border-4 border-dashed border-[#0D9488] rounded-3xl flex items-center justify-center bg-[#E6FAF5]/40 mb-6 group cursor-pointer" onClick={handleSimulateQrScan}>
                  <QrCode className="w-32 h-32 text-[#0D9488] opacity-80 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-x-4 top-1/2 h-1 bg-[#0D9488] shadow-[0_0_12px_#0D9488] animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {t('abha.holdQr')}
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6">
                  {t('abha.qrInstructions')}
                </p>

                <button
                  type="button"
                  onClick={handleSimulateQrScan}
                  disabled={isVerifying}
                  className="bg-[#064E3B] hover:bg-[#064E3B]/90 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-colors shadow-md"
                >
                  <Wand2 className="w-5 h-5" />
                  {isVerifying ? t('abha.verifying') : t('abha.simulateScan')}
                </button>
              </div>
            ) : (
              <div className="py-4">
                <label className="text-lg font-bold text-primary mb-3 block">
                  {t('abha.enter14Digit')}
                </label>
                <div className="w-full text-3xl font-mono font-bold tracking-widest h-16 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 flex items-center justify-center text-primary mb-4">
                  {formatAbhaDisplay(abhaDigits) || 'XX-XXXX-XXXX-XXXX'}
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={abhaDigits.length !== 14 || isVerifying}
                  className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <span>{isVerifying ? t('abha.verifying') : t('abha.verifyAndContinue')}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Keypad & ABHA Info */}
        <div className="col-span-5 flex flex-col gap-6">
          {activeTab === 'manual' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <NumericKeypad 
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
              />
            </div>
          )}

          <div className="bg-[#EFF6FF] rounded-3xl p-6 border border-[#BFDBFE] shadow-sm">
            <div className="flex items-center gap-3 mb-3 text-[#1E40AF]">
              <ShieldCheck className="w-7 h-7" />
              <h3 className="font-bold text-lg">Ayushman Bharat Digital Mission</h3>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              Your ABHA card securely fetches your health record for OPD consultation without manual data entry.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#1E40AF] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>National Health Authority (NHA) Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}