import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BellRing, ArrowRight } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Allergies() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { allergyHistory, setAllergyHistory } = usePatientSession();
  
  const [staffCalled, setStaffCalled] = useState(false);

  const handlePrimarySelect = (status: 'yes' | 'no' | 'not_sure') => {
    setAllergyHistory({
      ...allergyHistory,
      hasAllergy: status,
      allergyType: status === 'yes' ? allergyHistory.allergyType : undefined,
      reaction: status === 'yes' ? allergyHistory.reaction : undefined,
      breathingDifficulty: status === 'yes' ? allergyHistory.breathingDifficulty : undefined,
      timestamp: new Date().toISOString(),
    });
  };

  const handleTypeSelect = (type: string) => {
    setAllergyHistory({
      ...allergyHistory,
      allergyType: type,
      timestamp: new Date().toISOString(),
    });
  };

  const handleReactionSelect = (reaction: string, isRedFlag: boolean = false) => {
    setAllergyHistory({
      ...allergyHistory,
      reaction,
      breathingDifficulty: isRedFlag,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCallSahayak = () => {
    setStaffCalled(true);
  };

  const handleContinueAfterRedFlag = () => {
    setAllergyHistory({
      ...allergyHistory,
      breathingDifficulty: false,
    });
    navigate('/patient/documents/scan');
  };

  const handleContinue = () => {
    if (allergyHistory.hasAllergy === 'no' || allergyHistory.hasAllergy === 'not_sure') {
      navigate('/patient/documents/scan');
    } else if (allergyHistory.hasAllergy === 'yes' && allergyHistory.allergyType && allergyHistory.reaction) {
      navigate('/patient/documents/scan');
    } else if (allergyHistory.hasAllergy === 'yes') {
      navigate('/patient/documents/scan');
    }
  };

  const handleBack = () => {
    navigate('/patient/medications');
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: handleBack,
    isContinueDisabled: !allergyHistory.hasAllergy,
    audioPrompt: t('allergies.audioGuidance') || 'Do you have any known allergies to medicines, foods, or dust?',
  });

  if (allergyHistory.breathingDifficulty) {
    return (
      <div className="w-full">
        <StepProgressIndicator
          current={14}
          total={24}
          title="SAFETY ALERT"
          badge="Breathing Reaction Alert"
        />

        <div className="max-w-4xl mx-auto px-6 pt-6 pb-32">
          <div className="bg-red-50 border-2 border-red-400 rounded-3xl p-8 mb-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-9 h-9 text-red-600" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider bg-red-200 text-red-800 px-3 py-1 rounded-full">
                  ALLERGY RED FLAG
                </span>
                <h2 className="text-2xl font-bold text-red-800 mt-1">
                  {language === 'hi' ? 'सांस लेने में कठिनाई की सूचना' : 'Breathing Difficulty Alert'}
                </h2>
              </div>
            </div>

            <p className="text-red-700 text-base leading-relaxed mb-6">
              {language === 'hi'
                ? 'आपने बताया कि आपको सांस लेने में तकलीफ होती है। यह एक गंभीर प्रतिक्रिया हो सकती है। कृपया हमारे सहायक को सूचित करें।'
                : 'You reported breathing difficulty as an allergic reaction. A medical staff member is available to assist immediately.'}
            </p>

            <div className="flex flex-col gap-3">
              {!staffCalled ? (
                <button
                  type="button"
                  onClick={handleCallSahayak}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-xl transition-colors shadow-md"
                >
                  <AlertTriangle className="w-6 h-6" />
                  {language === 'hi' ? 'सहायक को अभी बुलाएं / Call Sahayak Now' : 'Call Sahayak Now / सहायक को अभी बुलाएं'}
                </button>
              ) : (
                <div className="w-full bg-[#F0FDF4] border-2 border-[#0D9488] rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-xl text-[#0D9488]">
                  <BellRing className="w-6 h-6" />
                  {language === 'hi' ? 'सहायक को सूचित किया गया है।' : 'Staff has been notified.'}
                </div>
              )}

              <button
                type="button"
                onClick={handleContinueAfterRedFlag}
                className="w-full bg-slate-100 text-slate-700 rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <ArrowRight className="w-5 h-5" />
                {language === 'hi' ? 'पंजीकरण जारी रखें' : 'Continue with intake'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <StepProgressIndicator
        current={14}
        total={24}
        title={t('allergies.title')}
      />

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-32">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold">⚠️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {t('allergies.hasAllergies')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { id: 'yes', label: 'Yes', labelHindi: 'हाँ' },
              { id: 'no', label: 'No', labelHindi: 'नहीं' },
              { id: 'not_sure', label: 'Not sure', labelHindi: 'पता नहीं' },
            ].map((opt) => {
              const isSelected = allergyHistory.hasAllergy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePrimarySelect(opt.id as any)}
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

          {allergyHistory.hasAllergy === 'yes' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  {t('allergies.whatAllergicTo')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'medicines', label: 'Medicines', labelHindi: 'दवाइयाँ' },
                    { id: 'food', label: 'Food', labelHindi: 'भोजन' },
                    { id: 'dust', label: 'Dust', labelHindi: 'धूल' },
                    { id: 'other', label: 'Other', labelHindi: 'अन्य' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeSelect(opt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        allergyHistory.allergyType === opt.id 
                          ? 'border-[#0D9488] bg-[#F0FDF9] text-[#0D9488]' 
                          : 'border-slate-200 bg-white hover:border-[#0D9488]/30'
                      }`}
                    >
                      <div className="font-bold text-lg">{language === 'hi' ? opt.labelHindi : opt.label}</div>
                      <div className="text-sm opacity-80">{language === 'hi' ? opt.label : opt.labelHindi}</div>
                    </button>
                  ))}
                </div>
              </div>

              {allergyHistory.allergyType && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    {t('allergies.whatHappens')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'rash', label: 'Skin rash', labelHindi: 'त्वचा पर दाने', redFlag: false },
                      { id: 'swelling', label: 'Swelling', labelHindi: 'सूजन', redFlag: false },
                      { id: 'breathing', label: 'Breathing difficulty', labelHindi: 'सांस लेने में कठिनाई', redFlag: true },
                      { id: 'other', label: 'Other reaction', labelHindi: 'अन्य प्रतिक्रिया', redFlag: false },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleReactionSelect(opt.id, opt.redFlag)}
                        className={`p-4 rounded-xl border-2 text-left transition-colors ${
                          allergyHistory.reaction === opt.id 
                            ? 'border-[#0D9488] bg-[#F0FDF9] text-[#0D9488]' 
                            : 'border-slate-200 bg-white hover:border-[#0D9488]/30'
                        }`}
                      >
                        <div className="font-bold text-lg">{language === 'hi' ? opt.labelHindi : opt.label}</div>
                        <div className="text-sm opacity-80">{language === 'hi' ? opt.label : opt.labelHindi}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
