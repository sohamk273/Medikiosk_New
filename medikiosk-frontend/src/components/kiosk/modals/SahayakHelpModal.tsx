import { useState } from 'react';
import { UserCheck, Volume2, Globe, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/i18n';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

interface SahayakHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function SahayakHelpModal({ open, onClose }: SahayakHelpModalProps) {
  const { t } = useTranslation();
  const { setAudioEnabled, setLanguage, language } = usePatientSession();
  const [sahayakCalled, setSahayakCalled] = useState(false);

  const handleCallSahayak = () => {
    setSahayakCalled(true);
  };

  const handleToggleAudio = () => {
    setAudioEnabled(true);
    onClose();
  };

  const handleSwitchLanguage = () => {
    const nextLang = language === 'en' ? 'hi' : language === 'hi' ? 'mr' : 'en';
    setLanguage(nextLang);
  };

  const handleClose = () => {
    setSahayakCalled(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-2xl">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-medical/10 text-medical flex items-center justify-center shrink-0">
          <HelpCircle className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {t('sahayakModal.title')}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            {t('sahayakModal.subtitle')}
          </p>
        </div>
      </div>

      <div className="py-6 space-y-4">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {t('sahayakModal.callAttendant')}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {t('sahayakModal.callAttendantDesc')}
              </p>
            </div>
            {sahayakCalled ? (
              <div className="bg-emerald-50 text-emerald-700 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Called</span>
              </div>
            ) : (
              <button
                onClick={handleCallSahayak}
                className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors shrink-0 shadow-sm"
              >
                {t('common.callSahayak')}
              </button>
            )}
          </div>
          {sahayakCalled && (
            <p className="text-xs font-bold text-emerald-700 mt-2">
              {t('sahayakModal.attendantNotified')}
            </p>
          )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {t('sahayakModal.howToTitle')}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {t('sahayakModal.howToDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleToggleAudio}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors flex items-center gap-3"
          >
            <Volume2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm text-slate-800">{t('sahayakModal.audioHelpTitle')}</div>
              <div className="text-xs text-slate-500">{t('sahayakModal.audioHelpDesc')}</div>
            </div>
          </button>

          <button
            onClick={handleSwitchLanguage}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors flex items-center gap-3"
          >
            <Globe className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <div className="font-bold text-sm text-slate-800">{t('sahayakModal.langHelpTitle')}</div>
              <div className="text-xs text-slate-500">Current: {language.toUpperCase()} (Tap to switch)</div>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 flex justify-end">
        <button
          onClick={handleClose}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          {t('sahayakModal.close')}
        </button>
      </div>
    </Modal>
  );
}