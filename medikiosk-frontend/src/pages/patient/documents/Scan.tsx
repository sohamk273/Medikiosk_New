import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { 
  Camera, FileText, CheckCircle2, Loader2, AlertCircle, FilePlus, Sparkles, 
  QrCode, Smartphone, RefreshCw, ArrowRight, ShieldCheck
} from 'lucide-react';
import type { DocumentType, PatientDocument } from '@/features/patient/PatientSessionContext';
import { validateDocumentFile } from '@/services/documents/documentService';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { 
  createKioskUploadSession, 
  createKioskEventSource, 
  consumeKioskSession, 
  type KioskUploadSession 
} from '@/services/api/kioskUploadClient';
import { apiFetchSafe } from '@/services/api/client';

interface DocTypeOption {
  id: DocumentType;
  label: string;
  labelHindi: string;
  icon: React.ReactNode;
}

const DOC_TYPES: DocTypeOption[] = [
  { id: 'prescription', label: 'Prescription', labelHindi: 'पुराना पर्चा / प्रिस्क्रिप्शन', icon: <FileText className="w-7 h-7" /> },
  { id: 'lab_report', label: 'Lab Report', labelHindi: 'जाँच रिपोर्ट / लैब रिपोर्ट', icon: <FileText className="w-7 h-7" /> },
  { id: 'discharge_summary', label: 'Discharge Summary', labelHindi: 'डिस्चार्ज सारांश', icon: <FileText className="w-7 h-7" /> },
  { id: 'opd_slip', label: 'OPD Slip', labelHindi: 'ओपीडी पर्ची', icon: <FileText className="w-7 h-7" /> },
  { id: 'other', label: 'Other', labelHindi: 'अन्य मेडिकल दस्तावेज़', icon: <FileText className="w-7 h-7" /> },
];

export default function Scan() {
  const navigate = useNavigate();
  const { language, addDocument, documentIntake, encounterId, patientId } = usePatientSession();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'qr' | 'kiosk'>('qr');
  const [selectedType, setSelectedType] = useState<DocumentType>('prescription');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // QR Session State
  const [qrSession, setQrSession] = useState<KioskUploadSession | null>(null);
  const [qrStatus, setQrStatus] = useState<string>('WAITING');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [lastUploadedDoc, setLastUploadedDoc] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize or Refresh QR Session
  const initializeQrSession = async () => {
    setIsGeneratingQR(true);
    setErrorMessage(null);
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const session = await createKioskUploadSession(600, {
        encounter_id: encounterId || undefined,
        patient_id: patientId || undefined,
        document_type: selectedType,
      });

      setQrSession(session);
      setQrStatus(session.status);

      // Subscribe to real-time status transitions via SSE
      const es = createKioskEventSource(session.session_id);
      eventSourceRef.current = es;

      es.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status) {
            setQrStatus(data.status);
          }

          if (data.status === 'UPLOADED') {
            // Auto-consume and link to encounter
            const consumed = await consumeKioskSession(session.session_id);
            const fileName = consumed.storage_reference?.file_name || data.file_metadata?.file_name || 'medical_report.pdf';
            const storageKey = consumed.storage_reference?.object_key || `kiosk-uploads/${session.session_id}_${fileName}`;
            const fileSize = consumed.storage_reference?.file_size || data.file_metadata?.file_size || 102400;
            const contentType = consumed.storage_reference?.content_type || data.file_metadata?.content_type || 'application/pdf';

            // Attach to backend encounter if available
            if (encounterId) {
              await apiFetchSafe(`/encounters/${encounterId}/documents/attach`, {
                method: 'POST',
                body: JSON.stringify({
                  file_name: fileName,
                  content_type: contentType,
                  file_size: fileSize,
                  storage_key: storageKey,
                  document_type: selectedType.toUpperCase(),
                }),
              });
            }

            const typeLabel = DOC_TYPES.find(d => d.id === selectedType)?.label || 'Medical Document';
            const typeLabelHi = DOC_TYPES.find(d => d.id === selectedType)?.labelHindi || 'मेडिकल दस्तावेज़';

            addDocument({
              id: 'doc_' + Date.now(),
              title: `${typeLabel}: ${fileName}`,
              titleHindi: `${typeLabelHi}: ${fileName}`,
              fileName: fileName,
              fileSize: fileSize,
              type: selectedType,
              status: 'uploaded',
              timestamp: new Date().toISOString(),
              storageKey: storageKey,
            });

            setLastUploadedDoc(fileName);
            es.close();
          }
        } catch (parseErr) {
          console.error('SSE event handling error:', parseErr);
        }
      };

      es.onerror = () => {
        // SSE disconnected or finished
        es.close();
      };
    } catch (err: any) {
      console.warn('Could not initialize QR upload microservice, falling back:', err);
      // Fallback local QR payload if upload service isn't running
      const fallbackUrl = `http://${window.location.hostname}:5174/upload/demo-token-${Date.now()}`;
      setQrSession({
        session_id: 'local_demo',
        status: 'WAITING',
        upload_url: fallbackUrl,
        expires_at: new Date(Date.now() + 600000).toISOString(),
        created_at: new Date().toISOString(),
      });
      setQrStatus('WAITING');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'qr') {
      initializeQrSession();
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [activeTab, selectedType]);

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
      const typeLabelHi = DOC_TYPES.find(d => d.id === selectedType)?.labelHindi || 'मेडिकल दस्तावेज़';

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
      const typeLabelHi = DOC_TYPES.find(d => d.id === selectedType)?.labelHindi || 'मेडिकल दस्तावेज़';

      const newDoc: PatientDocument = {
        id: 'doc_' + Date.now(),
        title: selectedType === 'prescription' ? 'Previous Prescription (Scanned)' : selectedType === 'lab_report' ? 'Blood Test Report (Scanned)' : `${typeLabel} (Scanned)`,
        titleHindi: selectedType === 'prescription' ? 'पिछला पर्चा (स्कैन किया हुआ)' : selectedType === 'lab_report' ? 'जाँच रिपोर्ट (स्कैन की गई)' : `${typeLabelHi} (स्कैन)`,
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
        navigate('/patient/review');
      }
    },
    onBack: () => navigate('/patient/allergies'),
    continueLabelKey: documentIntake.documents.length > 0 ? 'common.continue' : 'documents.skipBtn',
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
            englishText="Scan the QR code with your smartphone camera to upload reports, or use the kiosk file scanner below."
            regionalText={language === 'hi' ? 'रिपोर्ट अपलोड करने के लिए अपने मोबाइल से QR कोड स्कैन करें, या नीचे कियोस्क से अपलोड करें।' : undefined}
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
            {language === 'hi' ? 'दस्तावेज़ का प्रकार चुनें' : 'Select Document Category'}
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

        {/* Mode Selector Tabs: QR vs Kiosk */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl mb-6 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'qr'
                ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>{language === 'hi' ? 'फ़ोन से QR स्कैन करें' : 'Upload via Mobile (QR)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kiosk')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'kiosk'
                ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>{language === 'hi' ? 'कियोस्क स्कैनर / फ़ाइल' : 'Kiosk Scanner / File'}</span>
          </button>
        </div>

        {/* TAB 1: QR Upload Feature */}
        {activeTab === 'qr' && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl mb-6 border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Column: Instructions & Status */}
              <div className="flex flex-col justify-center text-left">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold w-fit mb-4 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Ephemeral Session</span>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 font-devanagari">
                  {language === 'hi' 
                    ? 'अपने फ़ोन से QR कोड स्कैन करें' 
                    : 'Scan QR with your Smartphone'}
                </h3>
                <p className="text-slate-300 text-sm mb-6 font-medium leading-relaxed">
                  {language === 'hi'
                    ? 'अपने मोबाइल कैमरे से यह QR स्कैन करें और अपनी पुरानी मेडिकल रिपोर्ट/पर्चा तुरंत अपलोड करें।'
                    : 'Open your phone camera to scan the code. No app install needed. Upload PDF, PNG, or JPG files.'}
                </p>

                {/* Status Indicator */}
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mb-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Session Status</div>
                  <div className="flex items-center gap-3">
                    {qrStatus === 'WAITING' && (
                      <>
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-bold text-emerald-300">
                          {language === 'hi' ? 'फ़ोन कनेक्ट होने की प्रतीक्षा है...' : 'Waiting for phone connection...'}
                        </span>
                      </>
                    )}
                    {qrStatus === 'CONNECTED' && (
                      <>
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        <span className="text-sm font-bold text-blue-300">
                          {language === 'hi' ? 'फ़ोन कनेक्ट हो गया! फ़ाइल चुनी जा रही है...' : 'Phone connected! Selecting document...'}
                        </span>
                      </>
                    )}
                    {qrStatus === 'UPLOADING' && (
                      <>
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                        <span className="text-sm font-bold text-amber-300">
                          {language === 'hi' ? 'दस्तावेज़ अपलोड हो रहा है...' : 'Uploading file from phone...'}
                        </span>
                      </>
                    )}
                    {qrStatus === 'UPLOADED' && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-300">
                          {language === 'hi' ? 'दस्तावेज़ सफलतापूर्वक प्राप्त हुआ!' : 'Document received successfully!'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {lastUploadedDoc && (
                  <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-emerald-200 text-xs font-semibold mb-4">
                    <span className="truncate">✓ {lastUploadedDoc}</span>
                    <button
                      type="button"
                      onClick={initializeQrSession}
                      className="text-emerald-400 underline hover:text-emerald-300 text-xs shrink-0 ml-2"
                    >
                      Upload Another
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={initializeQrSession}
                    disabled={isGeneratingQR}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQR ? 'animate-spin' : ''}`} />
                    <span>{language === 'hi' ? 'नया QR कोड बनाएँ' : 'Refresh QR Code'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: QR Code Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                {isGeneratingQR ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-emerald-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                    <span className="text-xs font-bold text-slate-400">Generating secure QR...</span>
                  </div>
                ) : qrSession?.upload_url ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                      <QRCodeDisplay text={qrSession.upload_url} size={210} />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-[11px] text-slate-400 font-mono">
                        Session: {qrSession.session_id.slice(0, 8)}...
                      </p>
                      <p className="text-[10px] text-emerald-400/80 mt-0.5">
                        Expires in 10 minutes • 0 PII Stored in QR
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 mb-2 opacity-50" />
                    <span>QR Unavailable</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Kiosk Dropzone & Scanner */}
        {activeTab === 'kiosk' && (
          <div>
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
                      {language === 'hi' ? 'दस्तावेज़ प्रोसेस हो रहा है...' : 'Processing Document...'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Preparing high resolution image & metadata...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-16 h-16 text-emerald-400 mb-3 opacity-90 animate-pulse" />
                    <p className="font-bold text-xl text-emerald-300 font-devanagari">
                      {language === 'hi' ? 'दस्तावेज़ फ़ाइल चुनें या स्कैनर पर रखें' : 'Upload Medical File or Scan Document'}
                    </p>
                    <p className="text-slate-300 text-xs mt-1.5 max-w-md">
                      {language === 'hi' 
                        ? 'PDF, PNG, JPG फ़ाइलें (अधिकतम 10MB) ड्रैग करें या नीचे बटन से चुनें' 
                        : 'Drag & drop PDF, PNG, or JPG files (up to 10MB) or browse your files'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all hover:scale-[1.02]"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>{language === 'hi' ? 'फ़ाइल चुनें (Browse File)' : 'Browse File / Photo'}</span>
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
              </div>
            </div>
          </div>
        )}

        {/* Attached Documents Counter & Review Navigation */}
        {docs.length > 0 && (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#064E3B]" />
              <span className="text-sm font-bold text-[#064E3B]">
                {docs.length} {language === 'hi' ? 'दस्तावेज़ सफलतापूर्वक जुड़े हैं' : 'document(s) currently attached'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/documents/review')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#064E3B] bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>{language === 'hi' ? 'दस्तावेज़ देखें' : 'View Documents'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
