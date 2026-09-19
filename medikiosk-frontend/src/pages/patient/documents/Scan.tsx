import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { 
  Camera, FileText, CheckCircle2,   Loader2, AlertCircle, FilePlus, Sparkles 
} from 'lucide-react';
import type { DocumentType, PatientDocument } from '@/features/patient/PatientSessionContext';
import { validateDocumentFile } from '@/services/documents/documentService';

interface DocTypeOption {
  id: DocumentType;
  label: string;
  labelHindi: string;
  icon: React.ReactNode;
}

const DOC_TYPES: DocTypeOption[] = [
  { id: 'prescription', label: 'Prescription', labelHindi: 'पुराना पर्चा / प्रिस्क्रिप्शन', icon: <FileText className="w-7 h-7" /> },
  { id: 'lab_report', label: 'Lab Report', labelHindi: 'जांच रिपोर्ट / खून टेस्ट', icon: <FileText className="w-7 h-7" /> },
  { id: 'discharge_summary', label: 'Discharge Summary', labelHindi: 'डिस्चार्ज सारांश', icon: <FileText className="w-7 h-7" /> },
  { id: 'opd_slip', label: 'OPD Slip', labelHindi: 'ओपीडी पर्ची', icon: <FileText className="w-7 h-7" /> },
  { id: 'other', label: 'Other', labelHindi: 'अन्य मेडिकल दस्तावेज', icon: <FileText className="w-7 h-7" /> },
];

export default function Scan() {
  const navigate = useNavigate();
  const { language, addDocument, documentIntake } = usePatientSession();
  const { t } = useTranslation();

  const [selectedType, setSelectedType] = useState<DocumentType>('prescription');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid document file.');
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      const typeLabel = DOC_TYPES.find(d => d.id === selectedType)?.label || 'Medical Document';
      const typeLabelHi = DOC_TYPES.find(d => d.id === selectedType)?.labelHindi || 'मेडिकल दस्तावेज';

      const newDoc: PatientDocument = {
        id: 'doc_' + Date.now(),
        title: `${typeLabel}: ${file.name}`,
        titleHindi: `${typeLabelHi}: ${file.name}`,
        fileName: file.name,
        fileSize: file.size,
        type: selectedType,
        status: 'scanned',
        timestamp: new Date().toISOString(),
        file: file,
      };

      addDocument(newDoc);
      setIsScanning(false);
      navigate('/patient/documents/review');
    }, 800);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSimulateScan = () => {
    setErrorMessage(null);
    setIsScanning(true);
    setTimeout(() => {
      const typeLabel = DOC_TYPES.find(d => d.id === selectedType)?.label || 'Medical Document';
      const typeLabelHi = DOC_TYPES.find(d => d.id === selectedType)?.labelHindi || 'मेडिकल दस्तावेज';

      const newDoc: PatientDocument = {
        id: 'doc_' + Date.now(),
        title: selectedType === 'prescription' ? 'Previous Prescription (Scanned)' : selectedType === 'lab_report' ? 'Blood Test Report (Scanned)' : `${typeLabel} (Scanned)`,
        titleHindi: selectedType === 'prescription' ? 'पुराना पर्चा (स्कैन किया हुआ)' : selectedType === 'lab_report' ? 'जांच रिपोर्ट (स्कैन की गई)' : `${typeLabelHi} (स्कैन)`,
        fileName: `${selectedType}_scan_${Date.now()}.pdf`,
        fileSize: 142850,
        type: selectedType,
        status: 'scanned',
        timestamp: new Date().toISOString(),
        mockOcrText: `OPTICAL SCAN RECORD\nType: ${typeLabel}\nTimestamp: ${new Date().toLocaleString()}\nExtracted: Routine OPD Medical Record`,
      };
      addDocument(newDoc);
      setIsScanning(false);
      navigate('/patient/documents/review');
    }, 1200);
  };

  useKioskScreen({
    onContinue: () => {
      if (documentIntake.documents.length > 0) {
        navigate('/patient/documents/review');
      } else {
        handleSimulateScan();
      }
    },
    onBack: () => navigate('/patient/allergies'),
    continueLabelKey: documentIntake.documents.length > 0 ? 'common.continue' : 'documents.scanNow',
    audioPrompt: t('documents.audioGuidance') || 'You can scan previous prescriptions or reports, or skip this step.',
  });

  const docs = documentIntake.documents || [];

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-32">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-primary tracking-tight mb-1 font-devanagari">
            {t('documents.title')}
          </h2>
          <p className="text-slate-600 font-medium">
            {t('documents.subtitle')}
          </p>
        </div>

        <div className="mb-6">
          <AudioGuidanceBanner
            englishText="You can upload or scan any previous medical documents (PDF, PNG, JPG), or skip this step."
            regionalText={language === 'hi' ? 'आप पुराने पर्चे या टेस्ट रिपोर्ट (PDF/फोटो) अपलोड कर सकते हैं, या आगे बढ़ सकते हैं।' : undefined}
          />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 animate-in fade-in">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-500" />
            <div className="text-sm font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Document Type Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            {language === 'hi' ? 'दस्तावेज की श्रेणी चुनें' : 'Select Document Category'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DOC_TYPES.map((opt) => {
              const isSelected = selectedType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(opt.id);
                    setErrorMessage(null);
                  }}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                    isSelected
                      ? 'border-[#064E3B] bg-emerald-50 text-[#064E3B] shadow-sm ring-2 ring-emerald-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="mb-1.5 text-[#064E3B]">{opt.icon}</div>
                  <div className="font-bold text-xs font-devanagari">
                    {language === 'hi' ? opt.labelHindi : opt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'hi' ? opt.label : opt.labelHindi}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Interactive Dropzone / Scanner Hardware Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-slate-900 rounded-3xl p-8 text-center text-white relative overflow-hidden shadow-xl mb-6 transition-all ${
            isDragging ? 'ring-4 ring-emerald-400 bg-slate-800' : ''
          }`}
        >
          <div className="border-2 border-dashed border-emerald-400/50 rounded-2xl h-64 flex flex-col items-center justify-center relative p-4">
            {isScanning ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-14 h-14 text-emerald-400 animate-spin mb-3" />
                <p className="text-emerald-300 font-bold text-lg font-devanagari">
                  {language === 'hi' ? 'दस्तावेज प्रोसेस हो रहा है...' : 'Processing Document...'}
                </p>
                <p className="text-slate-400 text-xs mt-1">Preparing high resolution image & metadata...</p>
              </div>
            ) : (
              <>
                <Camera className="w-16 h-16 text-emerald-400 mb-3 opacity-90 animate-pulse" />
                <p className="font-bold text-xl text-emerald-300 font-devanagari">
                  {language === 'hi' ? 'दस्तावेज अपलोड करें या स्कैनर पर रखें' : 'Upload Medical File or Scan Document'}
                </p>
                <p className="text-slate-300 text-xs mt-1.5 max-w-md">
                  {language === 'hi' 
                    ? 'PDF, PNG, JPG फाइलें (अधिकतम 10MB) ड्रैग करें या नीचे बटन पर क्लिक करें' 
                    : 'Drag & drop PDF, PNG, or JPG files (up to 10MB) or browse your files'}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all hover:scale-[1.02]"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>{language === 'hi' ? 'फाइल चुनें (Browse File)' : 'Browse File / Photo'}</span>
                  </button>
                </div>
              </>
            )}

            {/* Viewfinder corner guides */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
          </div>

          <div className="mt-6 flex items-center justify-center flex-wrap gap-4">
            <button
              type="button"
              disabled={isScanning}
              onClick={handleSimulateScan}
              className="bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold px-7 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('documents.scanNow')} (Hardware Scan Demo)</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/patient/review')}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-2xl border border-white/20 text-sm transition-all"
            >
              <span>{t('documents.skipBtn')}</span>
            </button>
          </div>
        </div>

        {docs.length > 0 && (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#064E3B]" />
              <span className="text-sm font-bold text-[#064E3B]">
                {docs.length} {language === 'hi' ? 'दस्तावेज संलग्न किए गए' : 'document(s) currently attached'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/documents/review')}
              className="text-xs font-bold text-[#064E3B] underline hover:text-[#053F30]"
            >
              {language === 'hi' ? 'दस्तावेज देखें →' : 'View Documents →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
