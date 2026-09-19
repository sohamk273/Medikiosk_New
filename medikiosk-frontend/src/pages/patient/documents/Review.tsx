import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Trash2, CheckCircle2, FileImage } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import type { PatientDocument } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';

export default function Review() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, documentIntake, updateDocument, removeDocument } = usePatientSession();

  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewDoc && previewDoc.file) {
      const objectUrl = URL.createObjectURL(previewDoc.file);
      setPreviewUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [previewDoc]);

  const handleConfirm = () => {
    documentIntake.documents.forEach((doc) => {
      updateDocument(doc.id, { status: 'reviewed' });
    });
    navigate('/patient/review');
  };

  const handleBack = () => {
    navigate('/patient/documents/scan');
  };

  const hasDocuments = documentIntake.documents.length > 0;

  useKioskScreen({
    onContinue: handleConfirm,
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
    <div className="w-full">
      <StepProgressIndicator
        current={16}
        total={24}
        title={t('documents.reviewTitle')}
      />

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-32">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center shrink-0">
                <FileText className="w-8 h-8 text-[#0D9488]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1 font-devanagari">
                  {t('documents.reviewTitle')}
                </h2>
                <p className="text-slate-500 text-sm">
                  {hasDocuments 
                    ? `${documentIntake.documents.length} ${language === 'hi' ? 'दस्तावेज संलग्न' : 'document(s) attached'}` 
                    : language === 'hi' ? 'कोई दस्तावेज संलग्न नहीं है' : 'No documents attached'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/patient/documents/scan')}
              className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
            >
              + {t('documents.addMore')}
            </button>
          </div>

          {!hasDocuments ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl mb-8">
              <p className="text-slate-500 mb-4 font-devanagari">
                {language === 'hi' ? 'कोई दस्तावेज स्कैन या अपलोड नहीं किया गया है।' : 'No documents were scanned or uploaded.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/patient/documents/scan')}
                className="bg-[#0D9488] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0B8070] transition-colors"
              >
                {language === 'hi' ? 'दस्तावेज स्कैन / अपलोड करें' : 'Scan or Upload Document'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {documentIntake.documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between bg-slate-50 hover:bg-white hover:border-[#0D9488]/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {doc.fileName?.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="w-6 h-6 text-red-500" />
                      ) : (
                        <FileImage className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-800 text-sm truncate font-devanagari">
                        {language === 'hi' ? doc.titleHindi || doc.title : doc.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="truncate">{doc.fileName || 'document.pdf'}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2.5 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            <p className="text-[#059669] text-sm font-bold font-devanagari">
              {t('documents.doctorReviewNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title="Document Preview"
        >
          <div className="flex flex-col items-center p-4 text-center">
            <div className="w-full mb-3 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm font-devanagari">
                  {previewDoc.title}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {previewDoc.fileName} • {formatFileSize(previewDoc.fileSize)}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-[#064E3B] text-xs font-bold rounded-lg uppercase">
                {previewDoc.type.replace('_', ' ')}
              </span>
            </div>

            {/* Binary Preview If Real File Attached */}
            {previewUrl ? (
              <div className="w-full max-h-[420px] overflow-auto rounded-xl border border-slate-200 mb-4 bg-slate-900 flex items-center justify-center p-2">
                {previewDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={previewUrl} 
                    title="PDF Preview" 
                    className="w-full h-[400px] rounded-lg bg-white" 
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewDoc.title}
                    className="max-h-[380px] max-w-full object-contain rounded-lg"
                  />
                )}
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 text-left whitespace-pre-wrap font-mono mb-4 min-h-[140px]">
                {previewDoc.mockOcrText || 'Scanned medical record saved for attending doctor consultation.'}
              </div>
            )}

            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
