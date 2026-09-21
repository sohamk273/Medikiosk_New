import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';
import { useTranslation } from '@/i18n';

export function SahayakExitModal() {
  const { 
    isExitModalOpen, 
    confirmExitGuidedAssist, 
    cancelExitGuidedAssist 
  } = useSahayakAssist();
  
  const { language } = useTranslation();

  if (!isExitModalOpen) return null;

  const title = language === 'hi' 
    ? 'सहायक असिस्ट बंद करें?' 
    : language === 'mr' 
    ? 'सहायक असिस्ट बंद करायची का?' 
    : 'Exit Sahayak Assist?';

  const desc = language === 'hi' 
    ? 'आपका पंजीकरण सामान्य रूप से जारी रहेगा। दर्ज की गई कोई भी जानकारी नष्ट नहीं होगी।' 
    : language === 'mr' 
    ? 'आपली नोंदणी नेहमीप्रमाणे सुरू राहील. भरलेली कोणतीही माहिती नष्ट होणार नाही.' 
    : 'Your registration will continue normally. All entered information is preserved.';

  const continueLabel = language === 'hi' 
    ? 'असिस्ट जारी रखें' 
    : language === 'mr' 
    ? 'मदत चालू ठेवा' 
    : 'Continue Assist';

  const exitLabel = language === 'hi' 
    ? 'हाँ, असिस्ट बंद करें' 
    : language === 'mr' 
    ? 'होय, बंद करा' 
    : 'Exit Assist';

  return (
    <Modal open={isExitModalOpen} onClose={cancelExitGuidedAssist} className="max-w-md">
      <div className="p-2 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3 border border-slate-200">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        
        <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-sm mx-auto">
          {desc}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={cancelExitGuidedAssist}
            className="flex-1 py-2.5 px-4 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            {continueLabel}
          </button>

          <button
            type="button"
            onClick={confirmExitGuidedAssist}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            {exitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
