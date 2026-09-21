import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { FileText, FileImage, Trash2, Eye, CheckCircle2, Plus } from 'lucide-react';
import type { PatientDocument } from '@/features/patient/PatientSessionContext';
import { Modal } from '@/components/ui/Modal';
import { GlassCard } from '@/components/ui/GlassCard';

export default function DocumentReview() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { documentIntake, removeDocument } = usePatientSession();
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const hasDocuments = documentIntake.documents.length > 0;

  useEffect(() => {
    if (previewDoc?.file) {
      const url = URL.createObjectURL(previewDoc.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [previewDoc]);

  const handleContinue = () => {
    navigate('/patient/review');
  };

  const handleBack = () => {
    navigate('/patient/documents/scan');
  };

  useKioskScreen({
    onContinue: handleContinue,
    onBack: handleBack,
    audioPrompt: t('documents.reviewAudio') || 'Please review your uploaded documents or tap Continue to see your complete intake summary.',
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '140 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-3 flex flex-col justify-between">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
            {t('documents.reviewTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {hasDocuments
              ? `${documentIntake.documents.length} document(s) attached`
              : 'No documents attached'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/patient/documents/scan')}
          className="px-3.5 py-2 bg-medigreen-50 hover:bg-medigreen-100 text-medigreen-800 border border-medigreen-300 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('documents.addMore')}</span>
        </button>
      </div>

      <GlassCard className="p-4 mb-3">
        {!hasDocuments ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl mb-2">
            <p className="text-slate-500 text-xs mb-3 font-devanagari">
              {language === 'en'
                ? 'No documents attached (You may proceed)'
                : language === 'hi'
                  ? 'कोई दस्तावेज़ संलग्न नहीं है (आप आगे बढ़ सकते हैं)'
                  : 'कोणतीही कागदपत्रे जोडलेली नाहीत (आपण पुढे जाऊ शकता)'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/patient/documents/scan')}
              className="bg-medigreen-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-medigreen-700 transition-colors"
            >
              Scan or Upload Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
            {documentIntake.documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-slate-200/80 rounded-xl p-3 flex items-center justify-between bg-slate-50/50 hover:bg-white hover:border-medigreen-300 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {doc.fileName?.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <FileImage className="w-5 h-5 text-medigreen-600" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-navy-900 text-xs truncate font-devanagari">
                      {language === 'hi' ? doc.titleHindi || doc.title : doc.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="truncate">{doc.fileName || 'document.pdf'}</span>
                      <span>·</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-medigreen-50 border border-medigreen-200 rounded-xl p-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-medigreen-600 shrink-0" />
          <p className="text-medigreen-800 text-xs font-bold font-devanagari">
            {t('documents.doctorReviewNote')}
          </p>
        </div>
      </GlassCard>

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title="Document Preview"
        >
          <div className="flex flex-col items-center p-3 text-center">
            <div className="w-full mb-3 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-left">
                <h4 className="font-bold text-navy-900 text-xs font-devanagari">
                  {previewDoc.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  {previewDoc.fileName} · {formatFileSize(previewDoc.fileSize)}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-medigreen-100 text-medigreen-800 text-[10px] font-bold rounded uppercase">
                {previewDoc.type.replace('_', ' ')}
              </span>
            </div>

            {previewUrl ? (
              <div className="w-full max-h-[350px] overflow-auto rounded-xl border border-slate-200 mb-3 bg-slate-900 flex items-center justify-center p-2">
                {previewDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    className="w-full h-[320px] rounded-lg bg-white"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewDoc.title}
                    className="max-h-[300px] max-w-full object-contain rounded-lg"
                  />
                )}
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 text-left whitespace-pre-wrap font-mono mb-3 min-h-[100px]">
                {previewDoc.mockOcrText || 'Scanned medical record saved for attending doctor consultation.'}
              </div>
            )}

            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="bg-mediblue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-mediblue-700 transition-colors text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}