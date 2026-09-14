import { useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Wand2, Phone, AlertCircle } from 'lucide-react';

import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { apiFetch } from '@/services/api/client';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  age: z.string().regex(/^\d+$/, 'Age must be numeric').refine(val => {
    const n = parseInt(val);
    return n >= 0 && n <= 120;
  }, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Other'] as const, { message: 'Gender is required' }),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { setPatient, setPatientId, setUhid, setEncounterId, encounterId } = usePatientSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [activeField, setActiveField] = useState<'mobile' | 'age'>('mobile');

  const { control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      age: '30',
      mobile: '',
    }
  });

  const watchAge = useWatch({ control, name: 'age' });
  const watchMobile = useWatch({ control, name: 'mobile' });
  const watchGender = useWatch({ control, name: 'gender' });

  const handleKeyPress = (key: string) => {
    const current = getValues(activeField);
    if (activeField === 'mobile' && current.length < 10) {
      setValue(activeField, current + key, { shouldValidate: true });
    } else if (activeField === 'age' && current.length < 3) {
      setValue(activeField, current + key, { shouldValidate: true });
    }
  };

  const handleBackspace = () => {
    const current = getValues(activeField);
    setValue(activeField, current.slice(0, -1), { shouldValidate: true });
  };

  const handleClear = () => {
    setValue(activeField, '', { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      setPatient({
        name: data.name,
        age: data.age,
        gender: data.gender,
        mobile: data.mobile,
      });

      // 1. Search for existing patient by phone
      let patientData: any = null;
      try {
        patientData = await apiFetch<any>(
          `/patients/search?identity_type=PHONE&identity_value=${encodeURIComponent(data.mobile)}`
        );
      } catch (err: any) {
        if (err.status === 404) {
          // CASE B: Patient does not exist -> Register new patient master record
          patientData = await apiFetch<any>('/patients', {
            method: 'POST',
            body: JSON.stringify({
              full_name: data.name,
              age: parseInt(data.age, 10) || 30,
              gender: data.gender.toLowerCase(),
            }),
          });

          // Associate MOBILE identity
          await apiFetch(`/patients/${patientData.id}/identities`, {
            method: 'POST',
            body: JSON.stringify({
              identity_type: 'MOBILE',
              identity_value: data.mobile,
              is_verified: true,
            }),
          });
        } else {
          // CASE C: Any other network or server error
          throw err;
        }
      }

      if (!patientData || !patientData.id) {
        throw new Error('Failed to retrieve or create patient master record.');
      }

      setPatientId(patientData.id);
      setUhid(patientData.uhid || patientData.patient_uhid);

      // 2. Create an encounter for this visit
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

      // Successfully synced with backend -> proceed to consent
      navigate('/patient/consent');
    } catch (err: any) {
      console.error('Failed to sync patient with backend:', err);
      setApiError(err?.message || 'Failed to sync patient record with server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setValue('name', 'Rameshwar Patil', { shouldValidate: true });
    setValue('age', '62', { shouldValidate: true });
    setValue('gender', 'Male', { shouldValidate: true });
    setValue('mobile', '9823199011', { shouldValidate: true });
  };

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4">
      {apiError && (
        <div className="bg-red-50 border-2 border-red-400 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span className="font-bold text-base">{apiError}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-3xl font-bold text-primary">
          New Patient Registration / <span className="font-devanagari">नया पंजीकरण</span>
        </h2>
        <div className="bg-mint text-primary px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
          Simulated Prototype Sandbox
        </div>
      </div>

      <p className="text-lg text-slate-600 mb-6">
        Enter a few details so we can create your hospital visit record. / अस्पताल पर्ची और रिकॉर्ड के लिए बुनियादी जानकारी दर्ज करें।
      </p>

      <AudioGuidanceBanner 
        englishText="Audio Guidance / आवाज़ निर्देश"
        regionalText="कृपया अपना नाम, उम्र, लिंग और मोबाइल नंबर दर्ज करें या बोलकर बताएं"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-8 mt-8">
        {/* Left Side: Form Fields */}
        <div className="col-span-7 flex flex-col gap-6 pb-20">
          {/* Full Name */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <label className="text-lg font-bold text-primary flex justify-between items-center mb-4">
              Full Name / पूरा नाम
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Mandatory / अनिवार्य</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Enter full name"
                  className={`w-full text-2xl p-4 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-0 ${
                    errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'
                  }`}
                  onFocus={() => setActiveField('mobile')} // Keyboard will pop up native for name, not keypad
                />
              )}
            />
            {errors.name && <p className="text-red-500 text-sm font-bold mt-2">{errors.name.message}</p>}
            <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">i</span>
              As printed on your Aadhaar card or Voter ID / आधार कार्ड अनुसार नाम
            </p>
          </div>

          {/* Age */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <label className="text-lg font-bold text-primary mb-1 block">Age / उम्र</label>
              <p className="text-sm text-slate-500">Tap (+) or (-) to set age / उम्र चुनने के लिए दबाएं</p>
            </div>
            
            <div className={`flex items-center gap-6 p-2 rounded-2xl border-2 transition-colors ${
              activeField === 'age' ? 'border-primary bg-primary/5' : 'border-transparent'
            }`} onClick={() => setActiveField('age')}>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); const n = parseInt(watchAge||'0'); if(n>0) setValue('age', (n-1).toString(), {shouldValidate:true}); }}
                className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary hover:bg-slate-50 active:bg-slate-100"
              >
                <Minus className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col items-center justify-center min-w-[80px]">
                <span className="text-4xl font-bold text-primary">{watchAge || '0'}</span>
                <span className="text-xs font-bold text-slate-400">Years / वर्ष</span>
              </div>
              
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); const n = parseInt(watchAge||'0'); if(n<120) setValue('age', (n+1).toString(), {shouldValidate:true}); }}
                className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary hover:bg-slate-50 active:bg-slate-100"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            {errors.age && <p className="text-red-500 text-sm font-bold absolute bottom-2">{errors.age.message}</p>}
          </div>

          {/* Gender */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <label className="text-lg font-bold text-primary mb-4 block">Gender / लिंग</label>
            <div className="grid grid-cols-3 gap-4">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue('gender', g as any, { shouldValidate: true })}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                    watchGender === g 
                      ? 'border-[#34D399] bg-[#A7F3D0] text-primary shadow-sm' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-bold text-lg">{g}</span>
                  <span className="text-sm font-devanagari opacity-80">
                    {g === 'Male' ? 'पुरुष' : g === 'Female' ? 'महिला' : 'अन्य'}
                  </span>
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-red-500 text-sm font-bold mt-2">{errors.gender.message}</p>}
          </div>

          {/* Mobile Number */}
          <div 
            className={`bg-white p-6 rounded-3xl border-2 shadow-sm transition-colors cursor-text ${
              activeField === 'mobile' ? 'border-primary' : 'border-slate-200'
            }`}
            onClick={() => setActiveField('mobile')}
          >
            <label className="text-lg font-bold text-primary flex justify-between items-center mb-4">
              Mobile Number / मोबाइल नंबर
              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded font-bold flex items-center gap-1">
                <Phone className="w-3 h-3" /> SMS Token Alert
              </span>
            </label>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-slate-400 mr-4">+91</span>
              <div className={`flex-1 text-4xl font-mono font-bold tracking-widest h-14 flex items-center ${
                watchMobile ? 'text-primary' : 'text-slate-300'
              }`}>
                {watchMobile || 'XXXXXXXXXX'}
              </div>
            </div>
            {errors.mobile && <p className="text-red-500 text-sm font-bold mt-2">{errors.mobile.message}</p>}
            <p className="text-sm text-slate-400 mt-4">
              Used for OPD Token SMS & WhatsApp demo updates / परामर्श पर्ची और कतार संख्या हेतु
            </p>
          </div>
          
          {/* Hidden Submit to allow imperative submission from bottom bar */}
          <button type="submit" id="register-submit-btn" disabled={isSubmitting} className="hidden">Submit</button>
        </div>

        {/* Right Side: Keypad & Sandbox Helper */}
        <div className="col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary">
                Touch Keypad / <span className="font-devanagari">नंबर पैड</span>
              </h3>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">Touch to type</span>
            </div>
            
            <NumericKeypad 
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
            />
          </div>

          <div className="bg-[#A7F3D0] rounded-3xl p-6 border border-[#34D399] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                Prototype Sandbox Helper
              </h3>
              <span className="bg-white text-primary px-2 py-1 rounded text-xs font-bold">1-Click Test</span>
            </div>
            <p className="text-primary/80 text-sm mb-6">
              Click below to populate standard test patient credentials for instant kiosk simulation demonstration.
            </p>
            <button 
              type="button"
              onClick={handleDemoFill}
              className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Wand2 className="w-5 h-5" />
              Fast Demo Fill / डेमो भरें
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
