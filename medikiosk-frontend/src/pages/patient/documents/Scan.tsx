import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useTranslation } from '@/i18n';
import { useKioskScreen } from '@/context/KioskScreenContext';
import {
  Camera, FileText, CheckCircle2, Loader2, AlertCircle,
  Smartphone, RefreshCw, ArrowRight, Upload
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
import { GlassCard } from '@/components/ui/GlassCard';
import { useDemoIntelligence } from '@/demo/context/DemoIntelligenceContext';
import { DemoScannerModal } from '@/demo/components/DemoScannerModal';

interface DocTypeOption {
  id: DocumentType;
  label: string;
  labelHindi: string;
  labelMarathi: string;
  icon: React.ReactNode;
}

const DOC_TYPES: DocTypeOption[] = [
  { id: 'prescription', label: 'Prescription', labelHindi: 'पर्चा / डॉक्टर की पर्ची', labelMarathi: 'प्रिस्क्रिप्शन / औषध चिठ्ठी', icon: <FileText className="w-5 h-5" /> },
  { id: 'lab_report', label: 'Lab Report', labelHindi: 'जांच रिपोर्ट (Blood/X-Ray)', labelMarathi: 'लॅब रिपोर्ट (रक्त / एक्स-रे)', icon: <FileText className="w-5 h-5" /> },
  { id: 'discharge_summary', label: 'Discharge Summary', labelHindi: 'डिस्चार्ज सारांश', labelMarathi: 'डिस्चार्ज समरी', icon: <FileText className="w-5 h-5" /> },
  { id: 'opd_slip', label: 'OPD Slip', labelHindi: 'पुरानी ओपीडी पर्ची', labelMarathi: 'मागील ओपीडी पावती', icon: <FileText className="w-5 h-5" /> },
  { id: 'other', label: 'Other', labelHindi: 'अन्य मेडिकल दस्तावेज', labelMarathi: 'इतर वैद्यकीय कागदपत्रे', icon: <FileText className="w-5 h-5" /> },
];

export default function Scan() {
  const navigate = useNavigate();
  const { language, addDocument, documentIntake, encounterId, patientId } = usePatientSession();
  const { setIsDemoScannerOpen } = useDemoIntelligence();
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
            const consumed = await consumeKioskSession(session.session_id);
            const fileName = consumed.storage_reference?.file_name || data.file_metadata?.file_name || 'medical_report.pdf';
            const storageKey = consumed.storage_reference?.object_key || `kiosk-uploads/${session.session_id}_${fileName}`;
            const fileSize = consumed.storage_reference?.file_size || data.file_metadata?.file_size || 102400;
            const contentType = consumed.storage_reference?.content_type || data.file_metadata?.content_type || 'application/pdf';

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
        es.close();
      };
    } catch (err: any) {
      console.warn('Could not initialize QR upload microservice, falling back:', err);
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

  const handleDragLeave = () => {
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
    setIsScanning(true);
    setTimeout(() => {
      const typeLabel = DOC_TYPES.find(d => d.id === selectedType)?.label || 'Medical Document';
      const typeLabelHi = DOC_TYPES.find(d => d.id === selectedType)?.labelHindi || 'मेडिकल दस्तावेज़';

      const newDoc: PatientDocument = {
        id: 'doc_' + Date.now(),
        title: `${typeLabel}: Sample_Prescription.pdf`,
        titleHindi: `${typeLabelHi}: Sample_Prescription.pdf`,
        fileName: 'Sample_Prescription.pdf',
        fileSize: 245000,
        type: selectedType,
        status: 'scanned',
        timestamp: new Date().toISOString(),
      };

      addDocument(newDoc);
      setIsScanning(false);
      navigate('/patient/documents/review');
    }, 1200);
  };

  const handleSkipOrContinue = () => {
    if (documentIntake.documents.length > 0) {
      navigate('/patient/documents/review');
    } else {
      navigate('/patient/review');
    }
  };

  const handleBack = () => {
    navigate('/patient/allergies');
  };

  useKioskScreen({
    onContinue: handleSkipOrContinue,
    onBack: handleBack,
    continueLabelKey: documentIntake.documents.length > 0 ? 'documents.reviewTitle' : 'documents.skipBtn',
    audioPrompt: t('documents.audioGuidance') || 'Scan your prior prescriptions or test reports, or scan the QR on your phone to upload.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-2 flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-devanagari">
          {t('documents.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {t('documents.subtitle')}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {DOC_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${selectedType === type.id
                  ? 'border-medigreen-500 bg-medigreen-50 text-medigreen-900 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
            >
              {type.icon}
              <span className="font-devanagari">{language === 'hi' ? type.labelHindi : language === 'mr' ? type.labelMarathi : type.label}</span>
            </button>
          ))}
        </div>

        {/* Demo Scanner Trigger */}
        <button
          type="button"
          onClick={() => setIsDemoScannerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold bg-gradient-to-r from-mediblue-600 to-teal-600 hover:from-mediblue-700 hover:to-teal-700 text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>⚡ Launch Mock Scanner (OCR)</span>
        </button>
      </div>

      <DemoScannerModal />

      {errorMessage && (
        <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dual Tab Content: QR (Mobile) vs Direct Kiosk Scanner */}
      <GlassCard className="p-4 mb-3">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'qr'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-navy-900'
              }`}
          >
            <Smartphone className="w-4 h-4 text-medigreen-600" />
            <span>Scan QR with Phone</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kiosk')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'kiosk'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-navy-900'
              }`}
          >
            <Camera className="w-4 h-4 text-mediblue-600" />
            <span>Kiosk Hardware Scanner</span>
          </button>
        </div>

        {activeTab === 'qr' ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* Left: QR Code Box */}
            <div className="flex flex-col items-center">
              {isGeneratingQR ? (
                <div className="w-48 h-48 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-medigreen-600 animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Generating QR...</span>
                </div>
              ) : qrSession?.upload_url ? (
                <div className="p-3 bg-white rounded-2xl border-2 border-medigreen-300 shadow-md">
                  <QRCodeDisplay
                    text={qrSession.upload_url}
                    size={180}
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={initializeQrSession}
                className="mt-2 text-[11px] text-slate-500 hover:text-medigreen-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh QR Code
              </button>
            </div>

            {/* Right: Instructions & Status */}
            <div className="max-w-sm text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-medigreen-100 text-medigreen-800 border border-medigreen-200">
                Live Mobile Upload
              </span>
              <h3 className="text-lg font-bold text-navy-900 mt-1 mb-1 font-devanagari">
                {language === 'en'
                  ? 'Scan QR with your phone camera'
                  : language === 'hi'
                    ? 'फोन का कैमरा उपयोग कर QR स्कैन करें'
                    : 'फोनचा कॅमेरा वापरून QR स्कॅन करा'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Scan this QR code with any smartphone camera or UPI scanner to open the mobile upload page. Your photos will automatically appear here.
              </p>

              <div className="p-2.5 rounded-xl border flex items-center gap-2.5 bg-slate-50 text-xs">
                {qrStatus === 'UPLOADED' || lastUploadedDoc ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-medigreen-600" />
                    <div>
                      <p className="font-bold text-medigreen-800">Document Received!</p>
                      <p className="text-[10px] text-slate-500">{lastUploadedDoc || 'Linked to consultation'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 text-mediblue-600 animate-spin" />
                    <div>
                      <p className="font-bold text-navy-900">Waiting for phone scan...</p>
                      <p className="text-[10px] text-slate-500">SSE Live synchronization active</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Kiosk Scanner & Dropzone */
          <div className="flex flex-col items-center py-2 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-md p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging
                  ? 'border-medigreen-500 bg-medigreen-50'
                  : 'border-slate-300 hover:border-medigreen-400 bg-slate-50/50'
                }`}
            >
              <Upload className="w-8 h-8 text-medigreen-600 mb-2" />
              <p className="text-sm font-bold text-navy-900 mb-0.5">
                Place Document on Glass or Drag &amp; Drop File
              </p>
              <p className="text-xs text-slate-500">Supports PDF, PNG, JPG (up to 15MB)</p>
            </div>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="bg-gradient-to-r from-medigreen-600 to-emerald-700 hover:from-medigreen-700 hover:to-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'Scanning Document...' : 'Scan Now (Simulator)'}</span>
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Footer document count indicator */}
      {documentIntake.documents.length > 0 && (
        <div className="flex items-center justify-between bg-medigreen-50 border border-medigreen-200 px-4 py-2 rounded-xl text-xs font-bold text-medigreen-800">
          <span>{documentIntake.documents.length} document(s) attached</span>
          <button
            type="button"
            onClick={() => navigate('/patient/documents/review')}
            className="text-medigreen-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Review Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}