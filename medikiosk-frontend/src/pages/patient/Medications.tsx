import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Pill, CheckCircle2 } from 'lucide-react';

export default function Medications() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { medicationHistory, setMedicationHistory } = usePatientSession();

  const [medicinesText, setMedicinesText] = useState(medicationHistory.medicines || '');

  const handlePrimarySelect = (status: 'yes_daily' | 'yes_sometimes' | 'no' | 'not_sure') => {
    setMedicationHistory({
      ...medicationHistory,
      takingMedicines: status,
      medicines: (status === 'no' || status === 'not_sure') ? '' : medicinesText,
      timestamp: new Date().toISOString(),
    });
    if (status === 'no' || status === 'not_sure') {
      setMedicinesText('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMedicinesText(e.target.value);
    setMedicationHistory({
      ...medicationHistory,
      medicines: e.target.value,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAddPreset = (med: string) => {
    const current = medicinesText ? `${medicinesText}, ${med}` : med;
    setMedicinesText(current);
    setMedicationHistory({
      ...medicationHistory,
      medicines: current,
      timestamp: new Date().toISOString(),
    });
  };

  const showFollowUp = medicationHistory.takingMedicines === 'yes_daily' || medicationHistory.takingMedicines === 'yes_sometimes';

  const handleContinue = () => {
    if (medicationHistory.takingMedicines) {
      navigate('/patient/allergies');
    }
  };

  const handleBack = () => {
    navigate('/patient/ayush');
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: handleBack,
    isContinueDisabled: !medicationHistory.takingMedicines,
    audioPrompt: t('medications.audioGuidance') || 'Are you currently taking any medicines regularly or as needed?',
  });

  const options = [
    { id: 'yes_daily', label: 'Yes, every day', labelHindi: 'हाँ, रोज़ाना', labelMarathi: 'होय, दररोज' },
    { id: 'yes_sometimes', label: 'Yes, sometimes', labelHindi: 'हाँ, कभी-कभी', labelMarathi: 'होय, कधीकधी' },
    { id: 'no', label: 'No', labelHindi: 'नहीं', labelMarathi: 'नाही' },
    { id: 'not_sure', label: 'Not sure', labelHindi: 'याद नहीं / पता नहीं', labelMarathi: 'माहित नाही' },
  ] as const;

  const presets = language === 'en'
    ? ['BP / Blood Pressure', 'Diabetes / Sugar', 'Thyroid', 'Painkiller', 'Acidity / Gas']
    : language === 'hi'
      ? ['BP / रक्तचाप', 'Diabetes / शुगर', 'Thyroid / थायरॉइड', 'Painkiller / दर्द निवारक', 'Acidity / एसिडिटी']
      : ['BP / रक्तदाब', 'Diabetes / साखर', 'Thyroid / थायरॉईड', 'Painkiller / वेदनाशामक', 'Acidity / ऍसिडिटी'];

  return (
    <div className="w-full max-w-4xl mx-auto py-3 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {t('medications.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {t('medications.subtitle') || 'Let your doctor know about any regular prescriptions or daily pills'}
        </p>
      </div>

      <GlassCard className="p-4 mb-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-medigreen-50 text-medigreen-600 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900 leading-tight">
              {t('medications.takingMedicines')}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'यह जानकारी आपके उपस्थित डॉक्टर को दिखाई जाएगी'
                : 'This information will be shared directly with your attending doctor.'}
            </p>
          </div>
        </div>

        {/* 4 Primary Choice Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {options.map((opt) => {
            const isSelected = medicationHistory.takingMedicines === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePrimarySelect(opt.id)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all active:scale-95 cursor-pointer ${isSelected
                    ? 'border-medigreen-500 bg-medigreen-50/90 text-medigreen-900 font-extrabold shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-navy-800'
                  }`}
              >
                <span className="text-xs sm:text-sm font-bold font-devanagari">
                  {language === 'hi' ? opt.labelHindi : language === 'mr' ? opt.labelMarathi : opt.label}
                </span>
                {language !== 'en' && (
                  <span className="text-[10px] text-slate-500 mt-0.5">{opt.label}</span>
                )}
                {isSelected && <CheckCircle2 className="w-4 h-4 text-medigreen-600 mt-1" />}
              </button>
            );
          })}
        </div>

        {/* Follow-up: Medicine text & quick chips */}
        {showFollowUp && (
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs font-bold text-navy-900 block mb-1">
              Medicine Names or Quick Presets (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-mediblue-50 text-mediblue-700 hover:bg-mediblue-100 border border-mediblue-200 transition-all active:scale-95 cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
            <textarea
              value={medicinesText}
              onChange={handleTextChange}
              placeholder="Type or tap presets above (e.g., Metformin 500mg, Telmisartan 40mg)"
              rows={2}
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-medigreen-500 resize-none"
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}