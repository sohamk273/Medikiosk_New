import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, CheckCircle2, ArrowRight, User, FileText, Activity, ShieldCheck, Leaf } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const PatientReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    verifiedPatient,
    chiefComplaint,
    historyEntries,
    ayushEntries,
    documents,
    setOpdToken,
    playClickSound,
    playSuccessSound,
    speakText,
  } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleReadAloud = () => {
    playClickSound();
    const summaryText = `${t.reviewTitle}. ${t.reviewPatientCard}: ${verifiedPatient?.firstName || 'Patient'} ${verifiedPatient?.lastName || ''}, Age ${verifiedPatient?.age || 35}. ${t.reviewCCCard}: ${chiefComplaint || 'Fever and weakness'}. Total ${historyEntries.length} symptoms documented.`;
    speakText(summaryText);
  };

  const handleConfirmAndGenerateToken = () => {
    playClickSound();
    playSuccessSound();

    const mockToken = {
      tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
      department: 'General Medicine & OPD',
      doctorName: 'Dr. Ananya Sharma (MD)',
      roomNumber: 'Room 204 (First Floor)',
      queuePosition: Math.floor(2 + Math.random() * 5),
      estimatedWaitMinutes: 12,
      qrCodeData: `MEDIKIOSK-TOKEN-${Date.now()}`,
    };

    setOpdToken(mockToken);
    speakText(t.reviewConfirmBtn);

    setTimeout(() => {
      navigate('/complete');
    }, 500);
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/documents"
      audioText={`${t.reviewTitle}. ${t.reviewSubtitle}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.reviewTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500 mb-4">
            {t.reviewSubtitle}
          </p>

          <button
            type="button"
            onClick={handleReadAloud}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-mediblue-600 text-mediblue-700 font-extrabold text-sm shadow-sm hover:bg-blue-50 transition-all"
          >
            <Volume2 className="w-5 h-5 text-mediblue-600 animate-pulse" />
            <span>{t.reviewReadAloud}</span>
          </button>
        </div>

        {/* Summary Sections */}
        <div className="space-y-4 mb-8">
          {/* Patient Card */}
          <GlassCard className="p-5 border-l-8 border-l-mediblue-600">
            <h3 className="text-lg font-extrabold text-navy-900 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-mediblue-600" />
              {t.reviewPatientCard}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-400 font-bold">Name</p>
                <p className="font-extrabold text-navy-900">{verifiedPatient?.firstName || 'Ramesh'} {verifiedPatient?.lastName || 'Kumar'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Age / Gender</p>
                <p className="font-extrabold text-navy-900">{verifiedPatient?.age || 42} Yrs / {verifiedPatient?.gender || 'Male'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Phone</p>
                <p className="font-extrabold text-navy-900">{verifiedPatient?.phone || '+91 98765 43210'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">ABHA Status</p>
                <span className="inline-block bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-md text-xs border border-emerald-200">
                  Verified ABHA
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Chief Complaint */}
          <GlassCard className="p-5 border-l-8 border-l-indigo-600">
            <h3 className="text-lg font-extrabold text-navy-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              {t.reviewCCCard}
            </h3>
            <p className="text-lg font-bold text-navy-900">
              "{chiefComplaint || 'High Fever and body pain since 2 days'}"
            </p>
          </GlassCard>

          {/* Captured History Entries */}
          <GlassCard className="p-5 border-l-8 border-l-purple-600">
            <h3 className="text-lg font-extrabold text-navy-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              {t.reviewHistoryCard} ({historyEntries.length || 6} Items)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {historyEntries.length > 0 ? (
                historyEntries.map((ent, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">{ent.section}</span>
                    <span className="font-extrabold text-navy-900">{ent.answer}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400">Duration & Severity</span>
                    <p className="font-extrabold text-navy-900">2-3 days (Moderate 6/10)</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400">Past History</span>
                    <p className="font-extrabold text-navy-900">Hypertension Stage-1</p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Attached Documents */}
          {documents.length > 0 && (
            <GlassCard className="p-5 border-l-8 border-l-amber-500">
              <h3 className="text-lg font-extrabold text-navy-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                {t.reviewDocsCard} ({documents.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {documents.map((d) => (
                  <span key={d.id} className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg">
                    {d.fileName} ({d.entities.length} OCR entities)
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* AYUSH Notes */}
          {ayushEntries.length > 0 && (
            <GlassCard className="p-5 border-l-8 border-l-emerald-600">
              <h3 className="text-lg font-extrabold text-navy-900 mb-2 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                AYUSH Assessment Notes
              </h3>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {ayushEntries.map((a, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg">
                    {a.label}: {a.value}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Confirm Action */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleConfirmAndGenerateToken}
            className="w-full max-w-xl py-5 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-2xl shadow-xl shadow-mediblue-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
          >
            <span>{t.reviewConfirmBtn}</span>
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
