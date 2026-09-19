import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Upload, ArrowRight, CheckCircle2, AlertCircle, Trash2, Eye, Sparkles } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { DocumentItem } from '../types/kiosk';

export const DocumentScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, documents, addDocument, removeDocument, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const [isScanning, setIsScanning] = useState(false);
  const [activePreview, setActivePreview] = useState<DocumentItem | null>(null);

  const handleSimulateScan = (type: 'prescription' | 'lab_report') => {
    playClickSound();
    setIsScanning(true);
    speakText(t.docScanning);

    setTimeout(() => {
      setIsScanning(false);

      const mockDoc: DocumentItem = type === 'prescription' ? {
        id: `doc-${Date.now()}`,
        fileName: 'Prescription_AIIMS_2026.jpg',
        docType: 'prescription',
        previewUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        ocrText: 'Tab Amlovas 5mg OD, Tab Metformin 500mg BD. Advice: Low salt diet, FBS/PPBS check.',
        entities: [
          { type: 'medication', name: 'Amlovas (Amlodipine)', value: '5 mg OD', isAbnormal: false },
          { type: 'medication', name: 'Metformin', value: '500 mg BD', isAbnormal: false },
          { type: 'diagnosis', name: 'Hypertension Stage-1', value: 'Diagnosed 2025', isAbnormal: false }
        ],
        uploadedAt: new Date().toLocaleTimeString()
      } : {
        id: `doc-${Date.now()}`,
        fileName: 'Blood_Report_Thyrocare.jpg',
        docType: 'lab_report',
        previewUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
        ocrText: 'HbA1c: 8.4% (Abnormal High), Fasting Blood Glucose: 168 mg/dL, Serum Creatinine: 0.9 mg/dL.',
        entities: [
          { type: 'lab_value', name: 'HbA1c Diabetes Test', value: '8.4 %', unit: '%', isAbnormal: true, date: '2026-08-15' },
          { type: 'lab_value', name: 'Fasting Blood Sugar', value: '168 mg/dL', unit: 'mg/dL', isAbnormal: true, date: '2026-08-15' },
          { type: 'lab_value', name: 'Serum Creatinine', value: '0.9 mg/dL', unit: 'mg/dL', isAbnormal: false, date: '2026-08-15' }
        ],
        uploadedAt: new Date().toLocaleTimeString()
      };

      addDocument(mockDoc);
      setActivePreview(mockDoc);
      speakText(`Document scanned. Extracted ${mockDoc.entities.length} clinical items.`);
    }, 2800);
  };

  const handleRemoveDoc = (id: string) => {
    playClickSound();
    removeDocument(id);
    if (activePreview?.id === id) setActivePreview(null);
  };

  const handleContinue = () => {
    playClickSound();
    speakText(t.docContinue);
    setTimeout(() => {
      navigate('/review');
    }, 300);
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/history/socrates"
      audioText={`${t.docTitle}. ${t.docSubtitle}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full font-bold text-sm mb-3 border border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>OCR Digitization • PaddleOCR Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.docTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500 max-w-2xl mx-auto">
            {t.docSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
          {/* Scanner Controls / Live Scanner Frame (Columns 1-6) */}
          <GlassCard className="lg:col-span-6 p-6 flex flex-col items-center justify-between min-h-[380px]">
            <div className="w-full text-center">
              <div className="w-full h-52 rounded-2xl bg-slate-900 border-4 border-dashed border-mediblue-500/40 relative overflow-hidden flex flex-col items-center justify-center text-white mb-6 shadow-inner">
                {isScanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-4 border-mediblue-500 border-t-transparent animate-spin" />
                    <p className="font-extrabold text-lg animate-pulse text-blue-300">
                      {t.docScanning}
                    </p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-14 h-14 text-mediblue-400 mb-2 animate-bounce" />
                    <p className="font-extrabold text-base px-6 text-slate-300">
                      {t.docInstructions}
                    </p>
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-mediblue-500 via-emerald-400 to-mediblue-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleSimulateScan('prescription')}
                  className="py-4 px-4 rounded-xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <FileText className="w-5 h-5" />
                  <span>Scan Prescription</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleSimulateScan('lab_report')}
                  className="py-4 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                  <span>Scan Lab Report</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Extracted Entities List (Columns 7-12) */}
          <GlassCard className="lg:col-span-6 p-6 min-h-[380px] flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-navy-900 mb-4 flex items-center justify-between">
                <span>{t.docExtractedHeader}</span>
                <span className="text-xs font-extrabold bg-blue-50 text-mediblue-700 px-3 py-1 rounded-full border border-blue-100">
                  {documents.length} File(s)
                </span>
              </h3>

              {documents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-200 rounded-2xl">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50 text-slate-400" />
                  <p>{t.docNoDocsUploaded}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-navy-900 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          {doc.fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Entities list */}
                      <div className="flex flex-wrap gap-1.5">
                        {doc.entities.map((ent, idx) => (
                          <span
                            key={idx}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                              ent.isAbnormal
                                ? 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {ent.isAbnormal && <AlertCircle className="w-3 h-3 text-rose-600" />}
                            {ent.name}: {ent.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Continue Action */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full max-w-xl py-5 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-2xl shadow-xl shadow-mediblue-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
          >
            <span>{t.docContinue}</span>
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
