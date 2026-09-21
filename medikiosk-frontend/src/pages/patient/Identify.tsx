import { useNavigate } from 'react-router-dom';
import { QrCode, FilePlus2, FileScan } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { ActionCard } from '@/components/kiosk/ActionCard';

export default function Identify() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setIdentificationMethod } = usePatientSession();

  const handleSelectMethod = (method: 'abha' | 'new' | 'opd', path: string) => {
    setIdentificationMethod(method);
    navigate(path);
  };

  useKioskScreen({
    onContinue: () => handleSelectMethod('abha', '/patient/abha'),
    onBack: () => navigate('/patient/language'),
    audioPrompt: t('identify.audioGuidance') || 'Choose how you want to start: Scan your ABHA card, register as a new patient, or scan your OPD slip.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-5 flex flex-col justify-between">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-1 font-devanagari">
          {t('identify.title')}
        </h2>
        <p className="text-sm text-slate-600 font-medium">
          {t('identify.subtitle')}
        </p>
      </div>

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Card 1: ABHA QR */}
        <ActionCard
          id="sahayak-target-abha"
          icon={QrCode}
          title={t('identify.abhaCard')}
          description={t('identify.abhaCardDesc')}
          badgeText={t('identify.fastest')}
          variant="green"
          onClick={() => handleSelectMethod('abha', '/patient/abha')}
        />

        {/* Card 2: New Registration */}
        <ActionCard
          id="sahayak-target-new-reg"
          icon={FilePlus2}
          title={t('identify.newRegistration')}
          description={t('identify.newRegistrationDesc')}
          badgeText="Direct Entry"
          variant="blue"
          onClick={() => handleSelectMethod('new', '/patient/register')}
        />

        {/* Card 3: OPD Slip */}
        <ActionCard
          id="sahayak-target-opd-slip"
          icon={FileScan}
          title={t('identify.opdSlip')}
          description={t('identify.opdSlipDesc')}
          badgeText="Existing Slip"
          variant="blue"
          onClick={() => handleSelectMethod('opd', '/patient/opd-slip')}
        />
      </div>

    </div>
  );
}