import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ScanLine, FileSearch, CheckCircle2, Trash2, ShieldAlert, AlertCircle, UploadCloud } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import type { DocumentType } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { apiFetchSafe } from '@/services/api/client';

type ScanState = 'idle' | 'scanning' | 'processing' | 'scanned';

const DOCUMENT_OPTIONS: { id: DocumentType; label: string; labelHindi: string; icon: React.ReactNode }[] = [
  { id: 'prescription', label: 'Prescription', labelHindi: 'पिछली दवाई की पर्ची', icon: <FileText className="w-8 h-8" /> },
  { id: 'lab_report', label: 'Lab Report', labelHindi: 'जांच रिपोर्ट', icon: <FileSearch className="w-8 h-8" /> },
  { id: 'discharge_summary', label: 'Discharge Summary', labelHindi: 'डिस्चार्ज सारांश', icon: <FileText className="w-8 h-8" /> },
  { id: 'opd_slip', label: 'OPD Slip', labelHindi: 'पिछली ओपीडी पर्ची', icon: <FileText className="w-8 h-8" /> },
  { id: 'other', label: 'Other', labelHindi: 'अन्य', icon: <FileText className="w-8 h-8" /> },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export default function Scan() {
  const navigate = useNavigate();
  const {
    language,
    encounterId,
    patientId,
    documentIntake,
    setCurrentDocumentType,
    addDocument,
    removeDocument,
    completeDocumentIntake,
  } = usePatientSession();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedType = documentIntake.currentDocumentType;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setScanState('idle');
      setScanProgress(0);
    };
  }, []);

  const handleDocumentSelect = (type: DocumentType) => {
    if (scanState === 'idle' || scanState === 'scanned') {
      setCurrentDocumentType(type);
      setScanState('idle');
      setUploadError(null);
    }
  };

  const handleTriggerFileSelect = () => {
    if (scanState === 'scanning' || scanState === 'processing') return;
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = '';

    // Validate type
    const fileType = file.type.toLowerCase();
    const isAllowedType = ALLOWED_MIME_TYPES.includes(fileType) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg');

    if (!isAllowedType) {
      setUploadError(
        language === 'hi'
          ? 'अमान्य फ़ाइल प्रकार। केवल PDF, PNG या JPG दस्तावेज़ अनुमत हैं।'
          : 'Unsupported file type. Only PDF, PNG, or JPG documents are allowed.'
      );
      return;
    }

    // Validate size
    if (file.size === 0) {
      setUploadError(
        language === 'hi' ? 'चयनित फ़ाइल खाली है।' : 'Selected file is empty.'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        language === 'hi'
          ? 'फ़ाइल का आकार 10MB सीमा से अधिक है।'
          : 'File size exceeds 10MB limit.'
      );
      return;
    }

    // Determine active encounter ID
    let activeEncId = encounterId;
    if (!activeEncId) {
      // In sandbox/standalone navigation fallback, attempt to create encounter if patient exists
      if (patientId) {
        const encRes = await apiFetchSafe<any>('/encounters', {
          method: 'POST',
          body: JSON.stringify({ patient_id: patientId, priority: 'NORMAL' }),
        });
        if (encRes.ok && encRes.data?.id) {
          activeEncId = encRes.data.id;
        }
      }
    }

    if (!activeEncId) {
      setUploadError(
        language === 'hi'
          ? 'कृपया दस्तावेज़ अपलोड करने से पहले पंजीकरण पूरा करें।'
          : 'Please complete registration to establish an encounter before uploading documents.'
      );
      return;
    }

    // Start scanning / uploading animation
    setUploadError(null);
    setScanState('scanning');
    setScanProgress(20);

    const progressTimer = setInterval(() => {
      setScanProgress((prev) => (prev < 80 ? prev + 15 : prev));
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedType) {
        formData.append('document_type', selectedType.toUpperCase());
      }

      const res = await apiFetchSafe<any>(`/encounters/${activeEncId}/documents`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);

      if (!res.ok || !res.data) {
        setScanState('idle');
        setScanProgress(0);
        setUploadError(
          res.error ||
          (language === 'hi'
            ? 'सर्वर पर दस्तावेज़ सहेजने में विफल।'
            : 'Failed to upload document to server.')
        );
        return;
      }

      // Success
      setScanProgress(100);
      setScanState('processing');

      setTimeout(() => {
        const docOpt = DOCUMENT_OPTIONS.find((opt) => opt.id === selectedType);
        addDocument({
          id: res.data.id,
          type: selectedType || 'other',
          title: docOpt?.label || file.name,
          titleHindi: docOpt?.labelHindi || file.name,
          fileName: res.data.file_name,
          status: 'scanned',
          timestamp: res.data.uploaded_at,
        });

        setScanState('scanned');
        setCurrentDocumentType(null);
      }, 400);

    } catch (err: any) {
      clearInterval(progressTimer);
      setScanState('idle');
      setScanProgress(0);
      setUploadError(err?.message || 'Network error uploading document.');
    }
  };

  const handleRemove = async (docId: string) => {
    setIsDeletingId(docId);
    try {
      await apiFetchSafe(`/documents/${docId}`, { method: 'DELETE' });
      removeDocument(docId);
    } catch {
      // Still remove from UI session if server fails
      removeDocument(docId);
    } finally {
      setIsDeletingId(null);
    }
  };

  // BottomBar proxy methods
  const handleContinueProxy = () => {
    if (documentIntake.completed && documentIntake.documents.length === 0) {
      navigate('/patient/review');
    } else if (documentIntake.documents.length > 0) {
      navigate('/patient/documents/review');
    } else {
      navigate('/patient/review');
    }
  };

  const handleBackProxy = () => {
    navigate('/patient/allergies');
  };

  return (
    <div className="w-full">
      <button id="scan-continue-btn" className="hidden" onClick={handleContinueProxy} />
      <button id="scan-back-btn" className="hidden" onClick={handleBackProxy} />

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      <StepProgressIndicator
        current={15}
        total={24}
        title={language === 'hi' ? 'दस्तावेज़ स्कैन' : language === 'mr' ? 'कागदपत्रे स्कॅन' : 'DOCUMENT SCAN'}
      />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-32">
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary leading-tight mb-1">
              {language === 'hi' ? 'अपने पुराने दस्तावेज़ स्कैन करें' : 'Scan Your Previous Documents'}
            </h2>
            <p className="text-slate-500 text-base">
              {language === 'hi'
                ? 'अगर आपके पास पिछली पर्ची या जांच की रिपोर्ट है, तो उसे यहाँ अपलोड या स्कैन कर सकते हैं।'
                : 'If you have a previous prescription or medical report, you can upload or scan it here.'}
            </p>
          </div>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="flex-1 font-bold text-sm">{uploadError}</div>
            <button
              onClick={() => setUploadError(null)}
              className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-[1fr_380px] gap-8">
          {/* LEFT: Scanning & Upload Area */}
          <div className="space-y-6">
            {/* Document Types Selection */}
            <div className="grid grid-cols-3 gap-3">
              {DOCUMENT_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleDocumentSelect(opt.id)}
                    disabled={scanState === 'scanning' || scanState === 'processing'}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 text-center min-h-[120px]
                      ${
                        isSelected
                          ? 'border-[#0D9488] bg-[#F0FDF9]'
                          : 'border-slate-200 bg-white hover:border-[#0D9488]/30 hover:bg-slate-50'
                      }
                      ${(scanState === 'scanning' || scanState === 'processing') && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-[#0D9488]">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div className={`mb-2 ${isSelected ? 'text-[#0D9488]' : 'text-slate-500'}`}>
                      {opt.icon}
                    </div>
                    <span className={`text-sm font-bold mb-1 ${isSelected ? 'text-[#0D9488]' : 'text-slate-700'}`}>
                      {language === 'hi' ? opt.labelHindi : opt.label}
                    </span>
                    <span className={`text-xs ${isSelected ? 'text-[#0D9488]/80' : 'text-slate-500'}`}>
                      {language === 'hi' ? opt.label : opt.labelHindi}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Scanner / Upload Frame */}
            <div
              onClick={handleTriggerFileSelect}
              className={`relative w-full h-[400px] border-4 rounded-3xl overflow-hidden flex flex-col items-center justify-center transition-colors duration-300 cursor-pointer ${
                scanState === 'idle' || scanState === 'scanned'
                  ? 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-[#0D9488]/40'
                  : scanState === 'scanning'
                  ? 'border-solid border-[#0D9488] bg-[#F0FDF9]'
                  : 'border-solid border-primary bg-slate-100'
              }`}
            >
              {(scanState === 'idle' || scanState === 'scanned') && (
                <div className="text-center text-slate-500 space-y-4 px-6">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-[#0D9488]">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      {language === 'hi' ? 'दस्तावेज़ यहाँ रखें या फ़ाइल चुनें' : 'Place your document here or Browse File'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {language === 'hi'
                        ? 'PDF, PNG या JPG (अधिकतम 10MB)'
                        : 'PDF, PNG or JPG supported (Max 10MB)'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#0D9488]/10 text-[#0D9488] px-4 py-2 rounded-xl text-sm font-bold">
                    <ScanLine className="w-4 h-4" />
                    {language === 'hi' ? 'फ़ाइल चुनने के लिए क्लिक करें' : 'Click to select / scan file'}
                  </div>
                </div>
              )}

              {scanState === 'scanning' && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-24 h-24 text-slate-300" />
                  </div>
                  <div
                    className="absolute top-0 left-0 w-full h-1.5 bg-[#0D9488] shadow-[0_0_15px_#0D9488] transition-all duration-[100ms] ease-linear"
                    style={{ top: `${scanProgress}%` }}
                  />
                  <div className="absolute bottom-6 left-0 w-full text-center">
                    <div className="inline-block bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-sm text-[#0D9488] font-bold animate-pulse">
                      {language === 'hi' ? 'दस्तावेज़ अपलोड हो रहा है...' : 'Uploading document to storage...'}
                    </div>
                  </div>
                </>
              )}

              {scanState === 'processing' && (
                <div className="text-center text-primary space-y-4">
                  <div className="w-12 h-12 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="font-bold text-slate-700">
                    {language === 'hi' ? 'दस्तावेज़ रिकॉर्ड सुरक्षित किया जा रहा है...' : 'Securing document record...'}
                  </div>
                </div>
              )}
            </div>

            {/* Scan / Upload Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleTriggerFileSelect}
                disabled={scanState === 'scanning' || scanState === 'processing'}
                className={`
                  px-12 py-4 rounded-2xl font-bold text-xl flex items-center gap-3 transition-colors shadow-lg
                  ${
                    scanState === 'scanning' || scanState === 'processing'
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#0D9488] text-white hover:bg-[#0B8070]'
                  }
                `}
              >
                <ScanLine className="w-6 h-6" />
                {language === 'hi' ? 'दस्तावेज़ अपलोड / स्कैन करें' : 'Scan / Upload Document'}
              </button>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  completeDocumentIntake(true);
                  navigate('/patient/review');
                }}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                {language === 'hi' ? 'मेरे पास कोई दस्तावेज़ नहीं है' : "I don't have any documents"}
              </button>
            </div>
          </div>

          {/* RIGHT: Scanned Documents List */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col h-full max-h-[700px] overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
              {language === 'hi' ? 'स्कैन किए गए दस्तावेज़' : 'Scanned Documents'}
              <span className="ml-auto bg-white border border-slate-200 px-2 py-1 rounded-md text-sm text-slate-500">
                {documentIntake.documents.length}
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {documentIntake.documents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <FileSearch className="w-12 h-12 mb-3 opacity-50" />
                  <p className="font-medium text-sm">
                    {language === 'hi' ? 'अभी कोई दस्तावेज़ नहीं जोड़ा गया है' : 'No documents added yet'}
                  </p>
                </div>
              ) : (
                documentIntake.documents.map((doc) => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF9] text-[#0D9488] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {language === 'hi' ? doc.titleHindi : doc.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-1 mt-1 text-[#0D9488] text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Stored in MinIO
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(doc.id)}
                      disabled={isDeletingId === doc.id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Remove"
                      title="Delete document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Privacy notice */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-start gap-2 text-slate-500 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                {language === 'hi'
                  ? 'आपके दस्तावेज़ सुरक्षित रूप से संग्रहीत हैं और केवल परामर्श के लिए अधिकृत डॉक्टर द्वारा देखे जा सकते हैं।'
                  : 'Your documents are securely stored and accessible only to authorized clinical doctors.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
