import { useState } from 'react';
import { AlertCircle, BellRing, HeartPulse } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/i18n';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

interface EmergencyHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmergencyHelpModal({ open, onClose }: EmergencyHelpModalProps) {
  const { t } = useTranslation();
  const session = usePatientSession();
  
  const [selectedReason, setSelectedReason] = useState<string>('Immediate Medical Assistance Requested');

  const handleTriggerEmergency = () => {
    session.triggerEmergency(selectedReason);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl border-2 border-destructive/20">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-destructive">
            {t('emergencyModal.title')}
          </h2>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('emergencyModal.alertBadge')}
          </p>
        </div>
      </div>

      <div className="py-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-bold text-red-900 text-sm mb-2">
            {t('emergencyModal.subtitle')}
          </p>
          <ul className="space-y-2 text-sm text-red-800">
            <li className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 shrink-0 text-red-600" />
              <span>{t('emergencyModal.warning1')}</span>
            </li>
            <li className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 shrink-0 text-red-600" />
              <span>{t('emergencyModal.warning2')}</span>
            </li>
            <li className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 shrink-0 text-red-600" />
              <span>{t('emergencyModal.warning3')}</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {t('emergencyModal.actionTitle')}
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            {t('emergencyModal.actionDesc')}
          </p>
          
          <select 
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="Severe Chest Pain">Severe Chest Pain</option>
            <option value="Breathing Difficulty">Breathing Difficulty</option>
            <option value="Severe Bleeding">Severe Bleeding</option>
            <option value="Unconsciousness / Fainting">Unconsciousness / Fainting</option>
            <option value="Immediate Medical Assistance Requested">Other Immediate Emergency</option>
          </select>
        </div>

        <button
          onClick={handleTriggerEmergency}
          className="w-full bg-destructive text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-lg hover:bg-destructive/90 transition-colors shadow-md"
        >
          <BellRing className="w-6 h-6" />
          {t('emergencyModal.alertStaffBtn')}
        </button>
      </div>

      <div className="border-t border-slate-100 pt-4 flex justify-end">
        <button
          onClick={onClose}
          className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
          {t('emergencyModal.close')}
        </button>
      </div>
    </Modal>
  );
}