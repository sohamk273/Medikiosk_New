import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { VirtualNumpad } from '../components/ui/VirtualNumpad';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const DemographicFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setVerifiedPatient, phoneNumber, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [emergencyPhone, setEmergencyPhone] = useState(phoneNumber || '');
  const [activeField, setActiveField] = useState<'age' | 'phone' | null>('age');

  const handleFieldFocus = (field: 'age' | 'phone', promptText: string) => {
    playClickSound();
    setActiveField(field);
    speakText(promptText);
  };

  const handleDigitPress = (digit: string) => {
    playClickSound();
    if (activeField === 'age') {
      if (age.length < 3) setAge(prev => prev + digit);
    } else if (activeField === 'phone') {
      if (emergencyPhone.length < 10) setEmergencyPhone(prev => prev + digit);
    }
  };

  const handleDeletePress = () => {
    playClickSound();
    if (activeField === 'age') {
      setAge(prev => prev.slice(0, -1));
    } else if (activeField === 'phone') {
      setEmergencyPhone(prev => prev.slice(0, -1));
    }
  };

  const handleClearPress = () => {
    playClickSound();
    if (activeField === 'age') setAge('');
    if (activeField === 'phone') setEmergencyPhone('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const profile = {
      status: 1,
      firstName: firstName || 'Patient',
      lastName: lastName || 'User',
      phone: emergencyPhone || phoneNumber || '9876543210',
      gender,
      age: parseInt(age, 10) || 35,
    };

    setVerifiedPatient(profile);
    speakText(`${t.demographicsTitle} saved. Proceeding to consent.`);

    setTimeout(() => {
      navigate('/consent');
    }, 400);
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/auth"
      audioText={`${t.demographicsTitle}. ${t.demographicsSubtitle}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.demographicsTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500">
            {t.demographicsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Area */}
          <GlassCard className="lg:col-span-7 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-navy-900 mb-1.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-mediblue-600" />
                    {t.firstName}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-mediblue-600 text-lg font-bold text-navy-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-navy-900 mb-1.5">
                    {t.lastName}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-mediblue-600 text-lg font-bold text-navy-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-navy-900 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-mediblue-600" />
                    {t.age}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={age}
                    onClick={() => handleFieldFocus('age', `${t.age}`)}
                    placeholder="e.g. 45"
                    className={`w-full px-4 py-3.5 rounded-xl border-2 text-lg font-bold text-navy-900 cursor-pointer outline-none transition-all ${
                      activeField === 'age'
                        ? 'border-mediblue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                        : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-navy-900 mb-1.5">
                    {t.gender}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Male', 'Female', 'Other'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setGender(g);
                          speakText(g === 'Male' ? t.male : g === 'Female' ? t.female : t.other);
                        }}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          gender === g
                            ? 'bg-mediblue-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {g === 'Male' ? t.male : g === 'Female' ? t.female : t.other}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emergency Phone */}
              <div>
                <label className="block text-sm font-extrabold text-navy-900 mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-mediblue-600" />
                  {t.emergencyPhone}
                </label>
                <input
                  type="text"
                  readOnly
                  value={emergencyPhone}
                  onClick={() => handleFieldFocus('phone', `${t.emergencyPhone}`)}
                  placeholder="10-digit mobile"
                  className={`w-full px-4 py-3.5 rounded-xl border-2 text-lg font-bold text-navy-900 cursor-pointer outline-none transition-all ${
                    activeField === 'phone'
                      ? 'border-mediblue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                      : 'border-slate-200'
                  }`}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4.5 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-xl shadow-lg shadow-mediblue-600/25 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[60px]"
              >
                <span>{t.submitDemographics}</span>
                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
              </button>
            </form>
          </GlassCard>

          {/* Right Numpad */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <GlassCard className="w-full p-4 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <ShieldCheck className="w-8 h-8 text-mediblue-600 shrink-0" />
              <div>
                <p className="font-extrabold text-navy-900 text-sm">{t.dataSafeBadge}</p>
                <p className="text-xs font-medium text-slate-500">Tap input boxes to type numbers</p>
              </div>
            </GlassCard>

            <VirtualNumpad
              onDigitPress={handleDigitPress}
              onDeletePress={handleDeletePress}
              onClearPress={handleClearPress}
            />
          </div>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
