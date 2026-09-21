import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';

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
    navigate('/patient/documents/scan');
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
      <div className="w-full max-w-3xl mx-auto py-4 flex flex-col justify-between">
        <GlassCard className="p-6 bg-rose-50/90 border-2 border-rose-400 shadow-xl">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-200 px-2.5 py-0.5 rounded-full">
                ALLERGY SAFETY ALERT
              </span>
              <h2 className="text-xl font-black text-rose-900 mt-0.5">
                {language === 'hi' ? 'गंभीर सांस या एलर्जी प्रतिक्रिया अलर्ट' : 'Severe Reaction / Breathing Alert'}
              </h2>
            </div>
          </div>

          <p className="text-rose-800 text-xs sm:text-sm leading-relaxed mb-4">
            You noted a severe allergy reaction involving breathing difficulties. Our clinical team has been alerted for your priority safety.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
            {!staffCalled ? (
              <button
                type="button"
                onClick={handleCallSahayak}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>{language === 'en' ? 'Call Sahayak Staff' : 'Call Sahayak Staff / सहायक बुलाएं'}</span>
              </button>
            ) : (
              <div className="flex-1 bg-medigreen-50 border border-medigreen-300 rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm text-medigreen-800 shadow-xs">
                <BellRing className="w-4 h-4 text-medigreen-600" />
                <span>{language === 'en' ? 'Staff Notified' : 'Staff Notified (सहायक सूचित झाले)'}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleContinueAfterRedFlag}
              className="flex-1 bg-white hover:bg-slate-50 text-navy-800 rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm transition-all border border-slate-200 active:scale-95 cursor-pointer"
            >
              <span>Continue with Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const allergyTypes = [
    { id: 'medicines', label: 'Medicines (Penicillin/Sulfa)', labelHindi: 'दवाइयाँ (पेनिसिलिन)', labelMarathi: 'औषधे (पेन्सिलिन)' },
    { id: 'food', label: 'Foods (Peanuts/Milk/Eggs)', labelHindi: 'खाद्य पदार्थ (दूध/अंडा)', labelMarathi: 'अन्नपदार्थ' },
    { id: 'dust', label: 'Dust / Pollen / Smoke', labelHindi: 'धूल / धुआँ', labelMarathi: 'धूळ / परागकण' },
    { id: 'other', label: 'Other / Insect Bites', labelHindi: 'अन्य', labelMarathi: 'इतर' },
  ];

  const reactions = [
    { id: 'rash', label: 'Skin Rash & Itching', labelHindi: 'खुजली / लाल दाने', labelMarathi: 'खाज / पुरळ', isRedFlag: false },
    { id: 'swelling', label: 'Swelling (Face/Lips)', labelHindi: 'चेहरे / होंठ पर सूजन', labelMarathi: 'ओठ / चेहऱ्यावर सूज', isRedFlag: false },
    { id: 'breathing', label: 'Breathing Difficulty', labelHindi: 'सांस लेने में तकलीफ', labelMarathi: 'श्वास घेण्यास त्रास (गंभीर)', isRedFlag: true },
    { id: 'mild', label: 'Mild Sneezing / Runny Nose', labelHindi: 'हल्की छींकें / जुकाम', labelMarathi: 'हलकी सर्दी / शिंका', isRedFlag: false },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-3 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {t('allergies.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {t('allergies.subtitle') || 'Let your doctor know about any drug, food, or seasonal allergies'}
        </p>
      </div>

      <GlassCard className="p-4 mb-3">
        <h3 className="text-sm font-bold text-navy-900 mb-2">
          {t('allergies.hasAllergies') || 'Do you have any known allergies?'}
        </h3>

        {/* 3 Primary Buttons */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { id: 'yes', label: 'Yes', labelHindi: 'हाँ', labelMarathi: 'होय' },
            { id: 'no', label: 'No', labelHindi: 'नहीं', labelMarathi: 'नाही' },
            { id: 'not_sure', label: 'Not Sure', labelHindi: 'पता नहीं', labelMarathi: 'माहित नाही' },
          ].map((opt) => {
            const isSelected = allergyHistory.hasAllergy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePrimarySelect(opt.id as any)}
                className={`py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${isSelected
                    ? 'border-medigreen-500 bg-medigreen-50/90 text-medigreen-900 font-extrabold shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 text-navy-800'
                  }`}
              >
                <span className="text-xs sm:text-sm font-bold font-devanagari">
                  {language === 'hi' ? opt.labelHindi : language === 'mr' ? opt.labelMarathi : opt.label}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-medigreen-600" />}
              </button>
            );
          })}
        </div>

        {/* If Yes: Allergy Type & Reaction */}
        {allergyHistory.hasAllergy === 'yes' && (
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-navy-900 block mb-1.5">
                {language === 'en'
                  ? 'What are you allergic to?'
                  : language === 'hi'
                    ? 'आपको किस चीज़ से एलर्जी है?'
                    : 'ऍलर्जी कशाची आहे?'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {allergyTypes.map((type) => {
                  const isSel = allergyHistory.allergyType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeSelect(type.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all active:scale-95 cursor-pointer ${isSel
                          ? 'border-medigreen-500 bg-medigreen-50 text-medigreen-900 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <p className="font-devanagari">{language === 'hi' ? type.labelHindi : language === 'mr' ? type.labelMarathi : type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-900 block mb-1.5">
                {language === 'en'
                  ? 'What reaction occurs?'
                  : language === 'hi'
                    ? 'क्या प्रतिक्रिया या लक्षण होते हैं?'
                    : 'काय त्रास होतो?'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {reactions.map((react) => {
                  const isSel = allergyHistory.reaction === react.id;
                  return (
                    <button
                      key={react.id}
                      type="button"
                      onClick={() => handleReactionSelect(react.id, react.isRedFlag)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all active:scale-95 cursor-pointer ${isSel
                          ? react.isRedFlag ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold' : 'border-medigreen-500 bg-medigreen-50 text-medigreen-900 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <p className="font-devanagari">{language === 'hi' ? react.labelHindi : language === 'mr' ? react.labelMarathi : react.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}