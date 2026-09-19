import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

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
    { id: 'yes_daily', label: 'Yes, every day', labelHindi: 'हाँ, रोज़' },
    { id: 'yes_sometimes', label: 'Yes, sometimes', labelHindi: 'हाँ, कभी-कभी' },
    { id: 'no', label: 'No', labelHindi: 'नहीं' },
    { id: 'not_sure', label: 'Not sure', labelHindi: 'पता नहीं' },
  ] as const;

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={13}
        total={24}
        title={t('medications.title')}
      />

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-32">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold">💊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {t('medications.takingMedicines')}
              </h2>
              <p className="text-slate-500">
                {language === 'hi'
                  ? 'यह जानकारी आपके डॉक्टर के साथ साझा की जाएगी।'
                  : 'This information will be shared with the attending doctor.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {options.map((opt) => {
              const isSelected = medicationHistory.takingMedicines === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePrimarySelect(opt.id)}
                  className={`
                    relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 text-center min-h-[120px]
                    ${isSelected 
                      ? 'border-[#0D9488] bg-[#F0FDF9]' 
                      : 'border-slate-200 bg-slate-50 hover:border-[#0D9488]/30 hover:bg-slate-100'}
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-[#0D9488] rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <span className={`text-xl font-bold mb-2 ${isSelected ? 'text-[#0D9488]' : 'text-slate-700'}`}>
                    {language === 'hi' ? opt.labelHindi : opt.label}
                  </span>
                  <span className={`text-base ${isSelected ? 'text-[#0D9488]/80' : 'text-slate-500'}`}>
                    {language === 'hi' ? opt.label : opt.labelHindi}
                  </span>
                </button>
              );
            })}
          </div>

          {showFollowUp && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {t('medications.whichMedicines')}
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                {t('medications.medicinesHint')}
              </p>
              
              <textarea
                value={medicinesText}
                onChange={handleTextChange}
                placeholder={t('medications.medicinesPlaceholder') || 'Medicine name or what you take it for'}
                className="w-full min-h-[120px] p-4 rounded-xl border-2 border-slate-200 focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/20 outline-none transition-all resize-none text-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
