import { useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Wand2, Phone, AlertCircle } from 'lucide-react';

import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
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
  const { t } = useTranslation();
  const { setPatient, setPatientId, setUhid, setEncounterId, encounterId } = usePatientSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [activeField, setActiveField] = useState<'mobile' | 'age'>('mobile');

  const { control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      age: '30',
      gender: 'Male',
      mobile: '',
    }
  });

  const watchAge = useWatch({ control, name: 'age' });
  const watchMobile = useWatch({ control, name: 'mobile' });
  const watchGender = useWatch({ control, name: 'gender' });

  const handleKeyPress = (key: string) => {
    const current = getValues(activeField) || '';
    if (activeField === 'mobile' && current.length < 10) {
      setValue(activeField, current + key, { shouldValidate: true });
    } else if (activeField === 'age' && current.length < 3) {
      setValue(activeField, current + key, { shouldValidate: true });
    }
  };

  const handleBackspace = () => {
    const current = getValues(activeField) || '';
    setValue(activeField, current.slice(0, -1), { shouldValidate: true });
  };

  const handleClear = () => {
    setValue(activeField, '', { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    setPatient({
      name: data.name,
      age: data.age,
      gender: data.gender,
      mobile: data.mobile,
    });

    try {
      let patientData: any = null;
      try {
        patientData = await apiFetch<any>(
          `/patients/search?identity_type=PHONE&identity_value=${encodeURIComponent(data.mobile)}`
        );
      } catch (err: any) {
        if (err.status === 404) {
          patientData = await apiFetch<any>('/patients', {
            method: 'POST',
            body: JSON.stringify({
              full_name: data.name,
              age: parseInt(data.age, 10) || 30,
              gender: data.gender.toLowerCase(),
            }),
          });

          await apiFetch(`/patients/${patientData.id}/identities`, {
            method: 'POST',
            body: JSON.stringify({
              identity_type: 'MOBILE',
              identity_value: data.mobile,
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
      console.warn('Backend offline or unreachable during registration, continuing with local mock session:', err);
      const offlinePatId = 'pat-offline-' + Date.now();
      const offlineUhid = 'UHID-MH-' + Math.floor(100000 + Math.random() * 900000);
      setPatientId(offlinePatId);
      setUhid(offlineUhid);
      if (!encounterId) {
        setEncounterId('enc-offline-' + Date.now());
      }
      navigate('/patient/consent');
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

  useKioskScreen({
    onContinue: handleSubmit(onSubmit),
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: isSubmitting,
    audioPrompt: t('register.audioGuidance') || 'Please enter your full name, age, gender, and 10-digit mobile number.',
  });

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4 pb-32">
      {apiError && (
        <div className="bg-red-50 border-2 border-red-400 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span className="font-bold text-base">{apiError}</span>
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-primary mb-2 font-devanagari">
          {t('register.title')}
        </h2>
        <p className="text-lg text-slate-600">
          {t('register.subtitle')}
        </p>
      </div>

      <AudioGuidanceBanner 
        englishText="Please enter your full name, age, gender, and 10-digit mobile number."
        regionalText="कृपया अपना पूरा नाम, उम्र, लिंग और 10 अंकों का मोबाइल नंबर दर्ज करें।"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-8 mt-8">
        <div className="col-span-7 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <label className="text-lg font-bold text-primary mb-2 block">
              {t('register.fullName')}
            </label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder={t('register.fullNamePlaceholder') || 'Enter full name'}
                  className={`w-full text-2xl p-4 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-0 ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'}`}
                  onFocus={() => setActiveField('mobile')}
                />
              )}
            />
            {errors.name && <p className="text-red-500 text-sm font-bold mt-2">{errors.name.message}</p>}
            <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">i</span>
              As printed on your Aadhaar card or Voter ID / आधार कार्ड अनुसार नाम
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <label className="text-lg font-bold text-primary mb-1 block">
                {t('register.age')}
              </label>
              <p className="text-sm text-slate-500">
                {t('register.ageHint')}
              </p>
            </div>
            
            <div className={`flex items-center gap-6 p-2 rounded-2xl border-2 transition-colors ${activeField === 'age' ? 'border-primary bg-primary/5' : 'border-transparent'}`} onClick={() => setActiveField('age')}>
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const n = parseInt(watchAge || '0'); 
                  if (n > 0) setValue('age', (n - 1).toString(), { shouldValidate: true }); 
                }}
                className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary hover:bg-slate-50 active:bg-slate-100"
              >
                <Minus className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col items-center justify-center min-w-[80px]">
                <span className="text-4xl font-bold text-primary">{watchAge || '0'}</span>
                <span className="text-xs font-bold text-slate-400">{t('register.years')}</span>
              </div>
              
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const n = parseInt(watchAge || '0'); 
                  if (n < 120) setValue('age', (n + 1).toString(), { shouldValidate: true }); 
                }}
                className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary hover:bg-slate-50 active:bg-slate-100"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            {errors.age && <p className="text-red-500 text-sm font-bold absolute bottom-2">{errors.age.message}</p>}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <label className="text-lg font-bold text-primary mb-4 block">
              {t('register.gender')}
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue('gender', g, { shouldValidate: true })}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${watchGender === g ? 'border-[#34D399] bg-[#A7F3D0] text-primary shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                >
                  <span className="font-bold text-lg">{g}</span>
                  <span className="text-sm font-devanagari opacity-80">
                    {g === 'Male' ? t('register.male') : g === 'Female' ? t('register.female') : t('register.otherGender')}
                  </span>
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-red-500 text-sm font-bold mt-2">{errors.gender.message}</p>}
          </div>

          <div 
            className={`bg-white p-6 rounded-3xl border-2 shadow-sm transition-colors cursor-text ${activeField === 'mobile' ? 'border-primary' : 'border-slate-200'}`}
            onClick={() => setActiveField('mobile')}
          >
            <label className="text-lg font-bold text-primary flex justify-between items-center mb-4">
              {t('register.mobileNumber')}
              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded font-bold flex items-center gap-1">
                <Phone className="w-3 h-3" /> SMS Token Alert
              </span>
            </label>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-slate-400 mr-4">+91</span>
              <div className={`flex-1 text-4xl font-mono font-bold tracking-widest h-14 flex items-center ${watchMobile ? 'text-primary' : 'text-slate-300'}`}>
                {watchMobile || 'XXXXXXXXXX'}
              </div>
            </div>
            {errors.mobile && <p className="text-red-500 text-sm font-bold mt-2">{errors.mobile.message}</p>}
            <p className="text-sm text-slate-400 mt-4">
              {t('register.mobileHint')}
            </p>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary">
                {t('register.touchKeypad')}
              </h3>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                {activeField === 'mobile' ? 'Mobile' : 'Age'} Active
              </span>
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
                {t('register.sandboxHelper')}
              </h3>
              <span className="bg-white text-primary px-2 py-1 rounded text-xs font-bold">1-Click Test</span>
            </div>
            <p className="text-primary/80 text-sm mb-6">
              {t('register.sandboxDesc')}
            </p>
            <button 
              type="button"
              onClick={handleDemoFill}
              className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Wand2 className="w-5 h-5" />
              {t('register.fastDemoFill')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}