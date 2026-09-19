import { User, Activity, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/i18n';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

interface ProfileSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSessionModal({ open, onClose }: ProfileSessionModalProps) {
  const { t } = useTranslation();
  const { patient, abhaId, chiefComplaint, documentIntake } = usePatientSession();

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('profileModal.title')}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            {t('profileModal.kioskId')}
          </p>
        </div>
      </div>

      <div className="py-6 space-y-4">
        {patient ? (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">{t('profileModal.name')}</span>
              <span className="font-bold text-slate-800 text-base">{patient.name || 'Anonymous Patient'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">{t('profileModal.ageGender')}</span>
              <span className="font-semibold text-slate-700">{patient.age} Yrs • {patient.gender}</span>
            </div>
            {patient.mobile && (
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('profileModal.mobile')}</span>
                <span className="font-semibold text-slate-700">{patient.mobile}</span>
              </div>
            )}
            {abhaId && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('profileModal.abha')}</span>
                <span className="font-mono text-sm text-slate-700">{abhaId}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
            <p className="text-slate-600 font-medium text-sm">
              {t('profileModal.noPatient')}
            </p>
          </div>
        )}

        {chiefComplaint.primaryComplaint && (
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-slate-700">Complaint: </span>
              <span className="text-slate-600">{chiefComplaint.primaryComplaint}</span>
            </div>
          </div>
        )}

        {documentIntake.documents.length > 0 && (
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm font-semibold text-emerald-800">
              {documentIntake.documents.length} document(s) attached
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4 flex justify-end">
        <button
          onClick={onClose}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
        >
          {t('profileModal.close')}
        </button>
      </div>
    </Modal>
  );
}