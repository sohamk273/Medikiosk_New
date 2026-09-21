import { UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';
import { useTranslation } from '@/i18n';

export function SahayakCallModal() {
  const { 
    isCallModalOpen, 
    cancelCallSahayak 
  } = useSahayakAssist();
  
  const { language } = useTranslation();

  if (!isCallModalOpen) return null;

  const title = language === 'hi' 
    ? 'सहायक को सूचित किया गया' 
    : language === 'mr' 
    ? 'सहायकाला सूचित केले आहे' 
    : 'Sahayak Requested';

  const subtitle = language === 'hi' 
    ? 'अस्पताल के कर्मचारी को सूचित कर दिया गया है और वे शीघ्र ही आपकी सहायता करेंगे।' 
    : language === 'mr' 
    ? 'रुग्णालय कर्मचाऱ्यांना सूचित करण्यात आले आहे आणि ते लवकरच आपल्या मदतीसाठी येतील.' 
    : 'Hospital staff has been notified and will assist you shortly.';

  return (
    <Modal open={isCallModalOpen} onClose={cancelCallSahayak} className="max-w-md">
      <div className="p-2 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-700" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
          {subtitle}
        </p>

        {/* Status Box */}
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Terminal Location:</span>
            <span className="font-bold text-slate-800">OPD Kiosk #02 (Main Lobby)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Estimated Arrival:</span>
            <span className="font-bold text-teal-800 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              Within 2 minutes
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Assigned Staff:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              Ananya Deshmukh (Staff Desk 02)
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={cancelCallSahayak}
            className="flex-1 py-2.5 px-4 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            Continue Registration
          </button>

          <button
            type="button"
            onClick={cancelCallSahayak}
            className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel Request
          </button>
        </div>
      </div>
    </Modal>
  );
}
