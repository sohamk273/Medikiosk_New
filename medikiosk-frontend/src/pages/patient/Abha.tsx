import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, Wand2, QrCode } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { MockABHAProvider } from '@/services/auth/MockABHAProvider';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';

import { apiFetch } from '@/services/api/client';

export default function Abha() {
  const navigate = useNavigate();
  const { setAbhaId, setPatient, setPatientId, setUhid, setEncounterId } = usePatientSession();
  
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleKeyPress = (key: string) => {
    if (input.length < 14) {
      setInput(prev => prev + key);
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
    setStatus('idle');
    setErrorMessage('');
  };

  const handleClear = () => {
    setInput('');
    setStatus('idle');
    setErrorMessage('');
  };

  useEffect(() => {
    const verifyAbha = async (abha: string) => {
      setStatus('verifying');
      try {
        const cleanAbha = abha.replace(/\D/g, '');
        const patientData = await MockABHAProvider.verifyAbha(cleanAbha);

        // Query or register patient in backend
        let backendPatient: any;
        try {
          backendPatient = await apiFetch<any>(`/patients/search?abha=${cleanAbha}`);
        } catch (e: any) {
          if (e.status === 404) {
            backendPatient = await apiFetch<any>('/patients', {
              method: 'POST',
              body: JSON.stringify({
                full_name: patientData.name,
                age: parseInt(patientData.age) || 30,
                gender: patientData.gender,
                city: patientData.district || 'Pune',
                state: patientData.state || 'Maharashtra',
                identities: [
                  { identity_type: 'ABHA', identity_value: cleanAbha, is_verified: true },
                  { identity_type: 'MOBILE', identity_value: patientData.mobile, is_verified: true }
                ]
              }),
            });
          } else {
            throw e;
          }
        }

        // Create clinical encounter on backend
        const encounter = await apiFetch<any>('/encounters', {
          method: 'POST',
          body: JSON.stringify({ patient_id: backendPatient.id, priority: 'NORMAL' }),
        });

        setStatus('success');
        setAbhaId(abha);
        setPatient(patientData);
        setPatientId(backendPatient.id);
        setUhid(backendPatient.patient_uhid || backendPatient.uhid);
        setEncounterId(encounter.id);
        
        // Auto-navigate after success
        setTimeout(() => {
          navigate('/patient/consent');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Verification failed. Please check your ABHA Number.');
      }
    };

    if (input.length === 14 && status === 'idle') {
      verifyAbha(input);
    }
  }, [input, status, navigate, setAbhaId, setPatient, setPatientId, setUhid, setEncounterId]);

  // Format ABHA as XX-XXXX-XXXX-XXXX for display
  const formatAbha = (raw: string) => {
    const padded = raw.padEnd(14, '-');
    return `${padded.slice(0, 2)}-${padded.slice(2, 6)}-${padded.slice(6, 10)}-${padded.slice(10, 14)}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-3xl font-bold text-primary">
          ABHA Authentication / <span className="font-devanagari">आभा पहचान सत्यापन</span>
        </h2>
        <div className="bg-mint text-primary px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
          Simulated ABDM Sandbox v3.1
        </div>
      </div>

      <p className="text-lg text-slate-600 mb-6">
        Scan your physical ABHA card QR code, or enter your 14-digit ABHA ID using the large touch keypad below.
      </p>

      <AudioGuidanceBanner 
        englishText="Audio prompt playing in Hindi & English (Tap right to pause or switch language)"
        regionalText="बोलकर बताएं या कार्ड दिखाएं — सहायता के लिए नीचे 'Call Sahayak' दबाएं"
      />

      <div className="grid grid-cols-2 gap-8 mt-8">
        {/* Left Side: Scanner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full min-h-[550px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">METHOD 1 • त्वरित स्कैन</span><br/>
              Scan ABHA QR Code
            </h3>
            <span className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-bold">Recommended</span>
          </div>
          
          <div className="flex-1 bg-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            
            <div className="w-48 h-48 border-4 border-emerald-400/50 rounded-3xl relative flex items-center justify-center bg-white/5 backdrop-blur-sm z-10">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl -m-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl -m-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl -m-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl -m-1"></div>
              <QrCode className="w-24 h-24 text-white opacity-80" />
            </div>
            
            <p className="text-white mt-8 text-lg font-medium z-10">Hold card 15cm from camera lens below</p>
            <p className="text-white/60 font-devanagari text-sm z-10">कैमरे के सामने अपना आभा कार्ड या मोबाइल क्यूआर रखें</p>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 animate-[scan_2s_ease-in-out_infinite]">
              <div className="absolute inset-0 bg-emerald-400 shadow-[0_0_20px_4px_rgba(52,211,153,0.5)]"></div>
            </div>
          </div>
          
          <button className="mt-6 w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl text-xl font-bold shadow-md flex items-center justify-center gap-3 transition-colors">
            <Camera className="w-6 h-6" />
            Tap to Activate Scanner / स्कैन शुरू करें
          </button>
        </div>

        {/* Right Side: Keypad Input */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full min-h-[550px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-primary">
              <span className="text-sm font-bold text-slate-400">METHOD 2 • संख्या दर्ज करें</span><br/>
              Enter 14-Digit ABHA
            </h3>
            
            <button 
              onClick={() => { setInput('91440299821049'); setStatus('idle'); }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Demo Fill
            </button>
          </div>
          
          <div className={`w-full p-6 rounded-2xl border-2 mb-6 flex flex-col items-center transition-colors ${
            status === 'error' ? 'bg-red-50 border-red-200' :
            status === 'success' ? 'bg-green-50 border-green-400' :
            'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">Ayushman Health Account Number</span>
            <div className={`text-4xl font-mono font-bold tracking-[0.2em] h-12 flex items-center justify-center ${
              status === 'error' ? 'text-red-600' :
              status === 'success' ? 'text-green-700' :
              'text-slate-800'
            }`}>
              {formatAbha(input)}
            </div>
            
            <div className="mt-4 w-full flex justify-between items-center text-sm font-semibold">
              <span className={`flex items-center gap-1 ${
                status === 'error' ? 'text-red-500' :
                status === 'success' ? 'text-green-600' :
                'text-primary'
              }`}>
                {status === 'verifying' && <span className="animate-pulse">Verifying via ABDM Sandbox...</span>}
                {status === 'success' && '✓ Verification Successful'}
                {status === 'error' && <><AlertCircle className="w-4 h-4" /> {errorMessage}</>}
                {status === 'idle' && 'Secure Aadhaar Vault Connected'}
              </span>
              <span className="text-slate-400">{input.length} / 14 Digits Entered</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end pt-4">
            <NumericKeypad 
              onKeyPress={handleKeyPress} 
              onBackspace={handleBackspace} 
              onClear={handleClear}
              disabled={status === 'verifying' || status === 'success'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
