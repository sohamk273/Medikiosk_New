import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShieldCheck, CheckCircle2, AlertCircle, Wand2, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { apiFetch } from '@/services/api/client';
import { GlassCard } from '@/components/ui/GlassCard';

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
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [abhaDigits, setAbhaDigits] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleTabSwitch = (tab: 'qr' | 'manual') => {
    if (scanState === 'scanning') return;
    setActiveTab(tab);
    setScanState('idle');
    setError(null);
  };

  const handleKeyPress = (num: string) => {
    if (abhaDigits.length < 14 && scanState !== 'scanning' && scanState !== 'success') {
      setAbhaDigits(prev => prev + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (scanState !== 'scanning' && scanState !== 'success') {
      setAbhaDigits(prev => prev.slice(0, -1));
      setError(null);
    }
  };

  const handleClear = () => {
    if (scanState !== 'scanning' && scanState !== 'success') {
      setAbhaDigits('');
      setError(null);
    }
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
    setError(null);

    const pat = demoPatient || {
      name: 'Rameshwar Patil',
      age: '62',
      gender: 'Male',
      mobile: '9823199011',
      district: 'Pune',
      state: 'Maharashtra',
    };

    try {
      setAbhaId(idToVerify);
      setIdentificationMethod('abha');
      setPatient({
        name: pat.name,
        age: pat.age.toString(),
        gender: pat.gender,
        mobile: pat.mobile,
      });

      let res: any;
      try {
        res = await apiFetch<any>(`/patients/search?abha=${idToVerify}`, {
          method: 'GET',
        });
      } catch (lookupErr) {
        console.warn('ABHA lookup failed, falling back to register or mock:', lookupErr);
      }

      if (res) {
        setPatientId(res.id);
        setUhid(res.patient_uhid || 'UHID-MH-' + Math.floor(100000 + Math.random() * 900000));
        // We will create encounter on Submit
      } else {
        const patientData = await apiFetch<any>('/patients', {
          method: 'POST',
          body: JSON.stringify({
            full_name: pat.name,
            gender: pat.gender.toLowerCase(),
            age: parseInt(pat.age) || 62,
          }),
        });

        setPatientId(patientData.id);
        setUhid(patientData.uhid);

        let activeEncounterId = encounterId;
        if (!activeEncounterId) {
          const encRes = await apiFetch<any>('/encounters', {
            method: 'POST',
            body: JSON.stringify({
              patient_id: patientData.id,
              priority: 'NORMAL',
            }),
          });
          setEncounterId(encRes.id);
        }
      }

      setScanState('success');
    } catch (err: any) {
      console.warn('Backend unavailable, continuing with context state for demo:', err);
      setScanState('success');
    }
  };

  const handleSimulateQrScan = () => {
    if (scanState === 'scanning' || scanState === 'success') return;
    setScanState('scanning');
    
    // Simulate QR scanning delay
    setTimeout(() => {
      verifyAndProceed('91-2834-9201-4412', {
        name: 'Rameshwar Patil',
        age: '62',
        gender: 'Male',
        mobile: '9823199011',
        district: 'Pune',
        state: 'Maharashtra',
      });
    }, 2500);
  };

  const handleManualSubmit = () => {
    if (abhaDigits.length !== 14) {
      setError('Please enter a valid 14-digit ABHA number');
      return;
    }
    if (scanState === 'scanning' || scanState === 'success') return;
    setScanState('scanning');
    
    // Simulate network verification delay
    setTimeout(() => {
      verifyAndProceed(formatAbhaDisplay(abhaDigits));
    }, 2000);
  };

  useKioskScreen({
    onContinue: () => navigate('/patient/consent'),
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: scanState !== 'success',
    audioPrompt: t('abha.audioGuidance') || 'Please scan your ABHA QR card or type your 14 digit ABHA number.',
  });

  return (
    <div className="w-full max-w-4xl mx-auto py-1 flex flex-col justify-between">
      <style>{`
        @keyframes scanline {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          50% { top: 90%; opacity: 1; }
          90% { opacity: 1; }
          100% { top: 10%; opacity: 0; }
        }
      `}</style>

      {/* Title Header */}
      <div className="mb-3 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-1 font-devanagari">
          {t('abha.title')}
        </h2>
        <p className="text-sm text-slate-600 font-medium">
          {t('abha.subtitle')}
        </p>
      </div>

      <GlassCard className="p-5 sm:p-6 w-full shadow-lg border-mediblue-200/50">
        {/* Tab Switcher */}
        {scanState === 'idle' && (
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => handleTabSwitch('qr')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'qr'
                  ? 'bg-white text-navy-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              <QrCode className={`w-4 h-4 ${activeTab === 'qr' ? 'text-medigreen-600' : ''}`} />
              {t('abha.scanQrTab')}
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('manual')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-navy-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              <Phone className={`w-4 h-4 ${activeTab === 'manual' ? 'text-mediblue-600' : ''}`} />
              {t('abha.manualTab')}
            </button>
          </div>
        )}

        {/* Unified Scanning State */}
        {scanState === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-medigreen-500 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center bg-medigreen-50/50 rounded-full shadow-inner m-3">
                 <ShieldCheck className="w-12 h-12 text-medigreen-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-navy-900 mb-3 flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-medigreen-600 animate-spin" />
              Verifying ABHA identity...
            </h3>
            <p className="text-slate-500 font-medium text-sm animate-pulse tracking-wide">
              Connecting to ABHA records...
            </p>
          </div>
        )}

        {/* Global Success State: Patient Profile Card */}
        {scanState === 'success' && (
          <div className="flex flex-col items-center justify-center pt-2 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="w-full max-w-xl bg-white border border-medigreen-200/60 rounded-[20px] shadow-lg overflow-hidden">
              
              {/* Header section */}
              <div className="bg-gradient-to-r from-medigreen-50 to-emerald-50/60 px-4 py-3 border-b border-medigreen-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-medigreen-700" />
                  <span className="font-extrabold text-navy-900 text-xs uppercase tracking-widest">ABHA Identity Verified</span>
                </div>
                <div className="bg-medigreen-600 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </div>
              </div>

              {/* Profile section */}
              <div className="p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-mediblue-100 text-mediblue-700 flex items-center justify-center text-xl font-black shadow-inner border-2 border-white ring-2 ring-mediblue-50 shrink-0">
                    RP
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-navy-900 leading-tight mb-0.5">Rameshwar Patil</h3>
                    <p className="text-slate-500 font-bold text-sm">52 years • Male</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ABHA ID</p>
                    <p className="font-mono font-bold text-navy-900 text-sm tracking-widest">XX-XXXX-XXXX-XXXX</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</p>
                    <p className="font-mono font-bold text-navy-900 text-sm tracking-wider">+91 XXXXX XXXXX</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                    <p className="font-bold text-navy-900 text-sm">Pune, Maharashtra</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Health Records</p>
                    <p className="font-bold text-medigreen-700 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Available
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer strip */}
              <div className="bg-medigreen-600 px-5 py-3 text-white flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 opacity-90 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-snug">ABHA identity verified securely</span>
                  <span className="text-[11px] text-medigreen-100 font-medium mt-0.5">Ready to continue with patient registration</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* QR Tab */}
        {activeTab === 'qr' && scanState === 'idle' && (
          <div className="flex flex-col items-center py-1 text-center animate-in fade-in duration-300">
            <div 
              className="relative w-52 h-52 border-3 border-dashed border-medigreen-400 hover:border-medigreen-500 rounded-3xl flex items-center justify-center bg-medigreen-50/40 mb-4 group cursor-pointer transition-all hover:bg-medigreen-50/70 hover:shadow-lg" 
              onClick={handleSimulateQrScan}
            >
              <QrCode className="w-24 h-24 text-medigreen-600 opacity-80 group-hover:scale-105 transition-transform" />
              <div className="absolute inset-x-5 top-1/2 h-0.5 bg-medigreen-500 shadow-[0_0_12px_#10b981] animate-pulse opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">
              {t('abha.holdQr')}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {t('abha.qrInstructions')}
            </p>

            <button
              type="button"
              onClick={handleSimulateQrScan}
              className="bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white px-8 py-3 rounded-full font-bold text-base flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Wand2 className="w-5 h-5" />
              <span>{t('abha.simulateScan')}</span>
            </button>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && scanState === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center py-1 animate-in fade-in duration-300">
            <div className="flex flex-col">
              <label className="text-base font-extrabold text-navy-900 mb-2 block">
                {t('abha.enter14Digit')}
              </label>
              
              <div className="w-full text-2xl font-mono font-bold tracking-widest h-14 bg-slate-50 border-2 rounded-2xl px-4 flex items-center justify-center text-navy-900 mb-3 transition-colors border-slate-200 shadow-inner">
                {formatAbhaDisplay(abhaDigits) || 'XX-XXXX-XXXX-XXXX'}
              </div>

              {error && (
                <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={abhaDigits.length !== 14}
                className="w-full bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white py-3.5 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 mt-1"
              >
                <span>{t('abha.verifyAndContinue')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="transition-opacity duration-300 opacity-100">
              <NumericKeypad 
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
              />
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}