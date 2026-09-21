import { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Wand2, Phone, AlertCircle, User, Info } from 'lucide-react';

import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { NumericKeypad } from '@/components/kiosk/NumericKeypad';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { apiFetch } from '@/services/api/client';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';

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
  const { t, language } = useTranslation();
  const { setPatient, setPatientId, setUhid, setEncounterId, encounterId } = usePatientSession();
  const { guidedAssistMode, setCustomTarget } = useSahayakAssist();
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

  const watchName = useWatch({ control, name: 'name' });
  const watchAge = useWatch({ control, name: 'age' });
  const watchMobile = useWatch({ control, name: 'mobile' });
  const watchGender = useWatch({ control, name: 'gender' });

  // Dynamic Sahayak guidance based on user input state
  useEffect(() => {
    if (!guidedAssistMode) return;

    if (!watchMobile || watchMobile.length < 10) {
      setCustomTarget(
        'sahayak-target-mobile',
        {
          en: 'First, enter your 10-digit mobile number using the keypad.',
          hi: 'पहले कीपैड का उपयोग करके अपना 10 अंकों का मोबाइल नंबर दर्ज करें।',
          mr: 'प्रथम कीपॅड वापरून आपला 10 अंकी मोबाइल क्रमांक प्रविष्ट करा.',
        },
        undefined,
        'right'
      );
    } else if (!watchName || watchName.length < 2) {
      setCustomTarget(
        'sahayak-target-name',
        {
          en: 'Now tap here to enter your full name.',
          hi: 'अब अपना पूरा नाम दर्ज करने के लिए यहाँ टैप करें।',
          mr: 'आता आपले पूर्ण नाव प्रविष्ट करण्यासाठी येथे टॅप करा.',
        },
        undefined,
        'bottom'
      );
    } else {
      setCustomTarget(
        'sahayak-target-continue',
        {
          en: 'Details complete! Now tap Continue at the bottom right.',
          hi: 'विवरण पूर्ण हुआ! अब नीचे दाईं ओर आगे बढ़ें (Continue) पर टैप करें।',
          mr: 'तपशील भरून झाले! आता खाली उजवीकडे पुढे जा (Continue) वर टॅप करा.',
        },
        undefined,
        'top'
      );
    }
  }, [guidedAssistMode, watchMobile, watchName, setCustomTarget]);

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
    if (current.length > 0) {
      setValue(activeField, current.slice(0, -1), { shouldValidate: true });
    }
  };

  const handleClear = () => {
    setValue(activeField, '', { shouldValidate: true });
  };

  const handleDemoFill = () => {
    setValue('name', 'Anand Rao', { shouldValidate: true });
    setValue('age', '45', { shouldValidate: true });
    setValue('gender', 'Male', { shouldValidate: true });
    setValue('mobile', '9822012345', { shouldValidate: true });
    setApiError(null);
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

      const parts = data.name.trim().split(' ');
      const firstName = parts[0] || 'Unknown';
      const lastName = parts.slice(1).join(' ') || 'Patient';

      try {
        const patientData = await apiFetch<any>('/patients', {
          method: 'POST',
          body: JSON.stringify({
            full_name: `${firstName} ${lastName}`.trim(),
            gender: data.gender.toLowerCase(),
            age: parseInt(data.age),
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
          activeEncounterId = encRes.id;
          setEncounterId(encRes.id);
        }
      } catch (err: any) {
        console.warn('Backend unavailable, continuing with context state. Submit will retry:', err);
        // Do not set mock offline IDs so Submit.tsx can attempt to register if needed.
      }

      navigate('/patient/consent');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setApiError(err.message || 'Registration failed. Please check details or ask for assistance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useKioskScreen({
    onContinue: handleSubmit(onSubmit),
    onBack: () => navigate('/patient/identify'),
    isContinueDisabled: isSubmitting,
    audioPrompt: t('register.audioGuidance') || 'Please enter your name, age, gender, and mobile number.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-1 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {t('register.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {t('register.subtitle')}
        </p>
      </div>

      {apiError && (
        <div className="mb-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-5 items-start">
        {/* Left: Patient Form Inputs */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
          {/* Full Name */}
          <GlassCard id="sahayak-target-name" className="p-3.5">
            <label className="text-xs font-bold text-navy-900 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-mediblue-600" />
              <span>{t('register.fullName')}</span>
            </label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder={t('register.fullNamePlaceholder') || 'Enter full name'}
                  className={`w-full text-lg p-2.5 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-medigreen-500'
                  }`}
                  onFocus={() => setActiveField('mobile')}
                />
              )}
            />
            {errors.name && <p className="text-rose-500 text-xs font-bold mt-1">{errors.name.message}</p>}
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>
                {language === 'en'
                  ? 'As on Aadhaar or Voter ID'
                  : language === 'hi'
                    ? 'जैसा कि आधार या पहचान पत्र पर है'
                    : 'आधार कार्ड किंवा ओळखपत्राप्रमाणे'}
              </span>
            </p>
          </GlassCard>

          {/* Age & Gender in a compact row */}
          <div id="sahayak-target-age-gender" className="grid grid-cols-12 gap-3">
            {/* Age Stepper */}
            <GlassCard 
              className={`col-span-5 p-3.5 flex flex-col justify-between cursor-pointer border-2 transition-colors ${
                activeField === 'age' ? 'border-medigreen-500 bg-medigreen-50/20' : 'border-slate-200/80'
              }`}
              onClick={() => setActiveField('age')}
            >
              <label className="text-xs font-bold text-navy-900 block">
                {t('register.age')}
              </label>
              
              <div className="flex items-center justify-between my-1">
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const n = parseInt(watchAge || '0'); 
                    if (n > 0) setValue('age', (n - 1).toString(), { shouldValidate: true }); 
                  }}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center text-navy-900 hover:bg-slate-50 active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-navy-900">{watchAge || '0'}</span>
                  <span className="text-[10px] font-bold text-slate-400">{t('register.years')}</span>
                </div>
                
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const n = parseInt(watchAge || '0'); 
                    if (n < 120) setValue('age', (n + 1).toString(), { shouldValidate: true }); 
                  }}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center text-navy-900 hover:bg-slate-50 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.age && <p className="text-rose-500 text-[10px] font-bold">{errors.age.message}</p>}
            </GlassCard>

            {/* Gender Selection */}
            <GlassCard className="col-span-7 p-3.5">
              <label className="text-xs font-bold text-navy-900 mb-1.5 block">
                {t('register.gender')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setValue('gender', g, { shouldValidate: true })}
                    className={`py-2 px-1 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                      watchGender === g 
                        ? 'border-medigreen-500 bg-medigreen-50 text-medigreen-800 font-extrabold shadow-xs' 
                        : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-600 font-medium'
                    }`}
                  >
                    <span className="text-xs">{g}</span>
                    {language !== 'en' && (
                      <span className="text-[10px] opacity-75 font-devanagari">
                        {g === 'Male' ? t('register.male') : g === 'Female' ? t('register.female') : t('register.otherGender')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-rose-500 text-[10px] font-bold mt-1">{errors.gender.message}</p>}
            </GlassCard>
          </div>

          {/* Mobile Number Field */}
          <GlassCard 
            id="sahayak-target-mobile"
            className={`p-3.5 cursor-pointer border-2 transition-colors ${
              activeField === 'mobile' ? 'border-medigreen-500 bg-medigreen-50/10' : 'border-slate-200/80'
            }`}
            onClick={() => setActiveField('mobile')}
          >
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-navy-900">
                {t('register.mobileNumber')}
              </label>
              <span className="text-[10px] bg-medigreen-50 text-medigreen-700 border border-medigreen-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> SMS Token Alert
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-lg font-bold text-slate-400 mr-2.5">+91</span>
              <div className={`flex-1 text-2xl font-mono font-bold tracking-widest h-10 flex items-center ${
                watchMobile ? 'text-navy-900' : 'text-slate-300'
              }`}>
                {watchMobile || 'XXXXXXXXXX'}
              </div>
            </div>
            {errors.mobile && <p className="text-rose-500 text-xs font-bold mt-1">{errors.mobile.message}</p>}
          </GlassCard>
        </div>

        {/* Right: Touch Keypad & Quick Demo Helper */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-2">
          {/* Compact Demo Fill Button */}
          <div className="flex justify-end w-full">
            <button 
              type="button"
              id="sahayak-target-demo-fill"
              onClick={handleDemoFill}
              className="text-medigreen-700 bg-white hover:bg-medigreen-50 border border-medigreen-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Demo Fill</span>
            </button>
          </div>

          <GlassCard id="sahayak-target-keypad" className="p-3.5 border-slate-200/80">
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="text-xs font-bold text-navy-900 flex items-center gap-2">
                On-screen Keypad
              </h3>
              <span className="bg-mediblue-50 text-mediblue-700 border border-mediblue-200 px-2.5 py-1 rounded-md text-[10px] font-bold">
                {activeField === 'mobile' ? 'Mobile' : 'Age'} Input Active
              </span>
            </div>
            
            <NumericKeypad 
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
            />
          </GlassCard>
        </div>
      </form>
    </div>
  );
}