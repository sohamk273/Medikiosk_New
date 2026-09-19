import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ScanLine,
  FileSearch,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  AlertCircle,
  UploadCloud,
  QrCode,
  Smartphone,
  RefreshCw,
  Clock,
  Loader2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import type { DocumentType } from '@/features/patient/PatientSessionContext';
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator';
import { apiFetchSafe } from '@/services/api/client';
import {
  createUploadSession,
  consumeUploadSession,
  cancelUploadSession,
  subscribeToSessionEvents,
  type KioskUploadSession,
  type StorageReference,
  type SSEEventData,
} from '@/services/api/kioskUploadClient';

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
    setEncounterId,
    setPatientId,
  } = usePatientSession();

  // Legacy/local scan state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // QR upload session state
  const [activeSession, setActiveSession] = useState<KioskUploadSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('WAITING');
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isAttaching, setIsAttaching] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [pendingStorage, setPendingStorage] = useState<StorageReference | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSessionRef = useRef<KioskUploadSession | null>(null);
  const sseUnsubscribeRef = useRef<(() => void) | null>(null);

  const selectedType = documentIntake.currentDocumentType;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sseUnsubscribeRef.current) {
        sseUnsubscribeRef.current();
        sseUnsubscribeRef.current = null;
      }
      if (activeSessionRef.current && activeSessionRef.current.status !== 'CONSUMED') {
        cancelUploadSession(activeSessionRef.current.id);
      }
    };
  }, []);

  // Countdown timer for active QR session
  useEffect(() => {
    if (!activeSession || timeLeft <= 0 || sessionStatus === 'CONSUMED') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, timeLeft, sessionStatus]);

  // Resolves active encounter ID or creates a fallback encounter
  const getActiveEncounterId = useCallback(async (): Promise<string | null> => {
    if (encounterId) return encounterId;
    let pid = patientId;
    if (!pid) {
      const pRes = await apiFetchSafe<any>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Kiosk Walk-in Patient',
          age: 38,
          gender: 'Male',
        }),
      });
      if (pRes.ok && pRes.data?.id) {
        pid = pRes.data.id;
        setPatientId(pRes.data.id);
      }
    }
    if (pid) {
      const encRes = await apiFetchSafe<any>('/encounters', {
        method: 'POST',
        body: JSON.stringify({ patient_id: pid, priority: 'NORMAL' }),
      });
      if (encRes.ok && encRes.data?.id) {
        setEncounterId(encRes.data.id);
        return encRes.data.id;
      }
    }
    return null;
  }, [encounterId, patientId, setEncounterId, setPatientId]);

  // Attach an uploaded MinIO document to the Medikiosk backend
  const attachDocumentToMedikiosk = useCallback(
    async (storageRef: StorageReference, docType: DocumentType, targetEncId?: string) => {
      const encId = targetEncId || (await getActiveEncounterId());
      if (!encId) {
        throw new Error(
          language === 'hi'
            ? 'कृपया दस्तावेज़ जोड़ने से पहले विज़िट स्थापित करें।'
            : 'Active encounter is required to link document metadata.'
        );
      }

      setIsAttaching(true);
      try {
        const payload = {
          storage_key: storageRef.object_key,
          file_name: storageRef.file_name,
          content_type: storageRef.content_type,
          file_size: storageRef.file_size,
          document_type: (docType || 'other').toUpperCase(),
          bucket: storageRef.bucket || 'kiosk-uploads',
        };

        const res = await apiFetchSafe<any>(`/encounters/${encId}/documents/attach`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!res.ok || !res.data) {
          throw new Error(res.error || 'Failed to save document metadata in database.');
        }

        // Attach succeeded! Update Medikiosk session context
        const docOpt = DOCUMENT_OPTIONS.find((opt) => opt.id === docType);
        addDocument({
          id: res.data.id,
          type: docType || 'other',
          title: docOpt?.label || storageRef.file_name,
          titleHindi: docOpt?.labelHindi || storageRef.file_name,
          fileName: res.data.file_name,
          status: 'scanned',
          timestamp: res.data.uploaded_at,
        });

        // Cleanup current session listeners and state
        if (sseUnsubscribeRef.current) {
          sseUnsubscribeRef.current();
          sseUnsubscribeRef.current = null;
        }
        activeSessionRef.current = null;
        setActiveSession(null);
        setQrDataUrl(null);
        setPendingStorage(null);
        setUploadError(null);
        setCurrentDocumentType(null);
        setScanState('scanned');
      } finally {
        setIsAttaching(false);
      }
    },
    [getActiveEncounterId, language, addDocument, setCurrentDocumentType]
  );

  // Initialize a fresh upload session and QR code for a selected category
  const initUploadSession = useCallback(
    async (type: DocumentType) => {
      // Clean up previous in-flight session
      if (activeSessionRef.current && activeSessionRef.current.status !== 'CONSUMED') {
        cancelUploadSession(activeSessionRef.current.id);
      }
      if (sseUnsubscribeRef.current) {
        sseUnsubscribeRef.current();
        sseUnsubscribeRef.current = null;
      }

      setIsLoadingSession(true);
      setUploadError(null);
      setPendingStorage(null);
      setScanState('idle');

      try {
        const activeEncId = await getActiveEncounterId();

        // 1. Create domain-agnostic session (NO patient_id per requirement 1)
        const session = await createUploadSession(
          type.toUpperCase(),
          activeEncId || undefined
        );

        setActiveSession(session);
        activeSessionRef.current = session;
        setSessionStatus(session.status);
        setTimeLeft(session.expires_in_seconds || 600);

        // 2. Render QR Code
        const qr = await QRCode.toDataURL(session.upload_url, {
          width: 260,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(qr);

        // 3. Connect SSE event stream
        const unsubscribe = subscribeToSessionEvents(
          session.id,
          async (event: SSEEventData) => {
            if (event.status) {
              setSessionStatus(event.status);
            }

            if (event.status === 'UPLOADED') {
              // Phone has finished uploading to MinIO!
              try {
                // Consume idempotently per requirement 2
                const consumeRes = await consumeUploadSession(session.id);
                const storageRef = consumeRes.storage_reference;
                setPendingStorage(storageRef);

                // Register document into Medikiosk PostgreSQL
                await attachDocumentToMedikiosk(storageRef, type, activeEncId || undefined);
              } catch (err: any) {
                console.error('Document consume/attach error:', err);
                setUploadError(
                  err.message ||
                    (language === 'hi'
                      ? 'दस्तावेज़ प्राप्त हुआ पर सहेजने में विफल रहा। कृपया पुनः प्रयास करें।'
                      : 'Document was received, but failed to link to your record. Please click Retry.')
                );
              }
            } else if (event.status === 'EXPIRED') {
              setSessionStatus('EXPIRED');
            }
          },
          (err) => {
            console.warn('SSE notification notice:', err);
          }
        );

        sseUnsubscribeRef.current = unsubscribe;
      } catch (err: any) {
        console.error('Failed to create upload session:', err);
        setUploadError(err.message || 'Failed to initialize QR code session.');
      } finally {
        setIsLoadingSession(false);
      }
    },
    [getActiveEncounterId, attachDocumentToMedikiosk, language]
  );

  // Handle category button click
  const handleDocumentSelect = (type: DocumentType) => {
    if (isAttaching || scanState === 'scanning' || scanState === 'processing') return;
    setCurrentDocumentType(type);
    initUploadSession(type);
  };

  // Local fallback: Trigger kiosk file picker
  const handleTriggerFileSelect = () => {
    if (isAttaching || scanState === 'scanning' || scanState === 'processing') return;
    setUploadError(null);
    fileInputRef.current?.click();
  };

  // Local fallback: Handle file chosen directly on kiosk machine
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const fileType = file.type.toLowerCase();
    const isAllowedType =
      ALLOWED_MIME_TYPES.includes(fileType) ||
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

    const activeEncId = await getActiveEncounterId();
    if (!activeEncId) {
      setUploadError(
        language === 'hi'
          ? 'कृपया दस्तावेज़ अपलोड करने से पहले पंजीकरण पूरा करें।'
          : 'Please complete registration to establish an encounter before uploading documents.'
      );
      return;
    }

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
        setActiveSession(null);
        setQrDataUrl(null);
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
      removeDocument(docId);
    } finally {
      setIsDeletingId(null);
    }
  };

  // BottomBar proxy navigation
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

      {/* Hidden native file input for optional direct kiosk upload */}
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

        {/* Upload/Attach error banner */}
        {uploadError && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="flex-1 font-bold text-sm">{uploadError}</div>
            {pendingStorage ? (
              <button
                onClick={() => attachDocumentToMedikiosk(pendingStorage, selectedType || 'other')}
                disabled={isAttaching}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isAttaching ? 'Attaching...' : 'Retry Attach'}
              </button>
            ) : null}
            <button
              onClick={() => setUploadError(null)}
              className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-[1fr_380px] gap-8">
          {/* LEFT: Category Selection + QR Acquisition Area */}
          <div className="space-y-6">
            {/* Document Types Selection Cards */}
            <div className="grid grid-cols-3 gap-3">
              {DOCUMENT_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleDocumentSelect(opt.id)}
                    disabled={isAttaching || scanState === 'scanning' || scanState === 'processing'}
                    className={`
                      relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 text-center min-h-[96px]
                      ${
                        isSelected
                          ? 'border-[#0D9488] bg-[#F0FDF9] shadow-sm'
                          : 'border-slate-200 bg-white hover:border-[#0D9488]/30 hover:bg-slate-50'
                      }
                      ${(isAttaching || scanState === 'scanning' || scanState === 'processing') && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
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

            {/* Central File Acquisition / QR Scanner Frame */}
            <div
              className={`relative w-full min-h-[350px] border-4 rounded-3xl overflow-hidden flex flex-col items-center justify-center transition-colors duration-300 ${
                !selectedType
                  ? 'border-dashed border-slate-300 bg-slate-50'
                  : sessionStatus === 'CONNECTED'
                  ? 'border-solid border-teal-500 bg-teal-50/40'
                  : sessionStatus === 'UPLOADING' || isAttaching
                  ? 'border-solid border-[#0D9488] bg-[#F0FDF9]'
                  : 'border-solid border-[#0D9488]/40 bg-slate-50'
              }`}
            >
              {/* STATE 0: No Category Selected */}
              {!selectedType && scanState === 'idle' && (
                <div className="text-center text-slate-500 space-y-4 px-6 py-8">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-[#0D9488]">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      {language === 'hi'
                        ? 'दस्तावेज़ स्कैन करने के लिए ऊपर कोई श्रेणी चुनें'
                        : 'Select a document category above to scan'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      {language === 'hi'
                        ? 'दवाई की पर्ची, जांच रिपोर्ट या अन्य दस्तावेज़ चुनने पर आपके फ़ोन के लिए एक QR कोड दिखाई देगा।'
                        : 'Choosing Prescription, Lab Report, or OPD Slip will generate a fresh QR code for your mobile phone.'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#0D9488]/10 text-[#0D9488] px-4 py-2 rounded-xl text-sm font-bold">
                    <ScanLine className="w-4 h-4" />
                    {language === 'hi' ? 'श्रेणी चुनें' : 'Select a Category Above'}
                  </div>
                </div>
              )}

              {/* STATE 1: Loading Session */}
              {selectedType && isLoadingSession && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                  <Loader2 className="w-12 h-12 text-[#0D9488] animate-spin" />
                  <p className="text-slate-700 font-bold">
                    {language === 'hi' ? 'नया QR कोड तैयार किया जा रहा है...' : 'Generating fresh QR upload code...'}
                  </p>
                </div>
              )}

              {/* STATE 2: Waiting for Phone (QR Display) */}
              {selectedType && !isLoadingSession && !isAttaching && sessionStatus === 'WAITING' && (
                <div className="flex flex-col items-center justify-center p-4 space-y-3 text-center max-w-md mx-auto animate-fade-in">
                  <div className="bg-white p-2.5 rounded-2xl shadow-md border-2 border-[#0D9488]/30">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Scan QR code with phone" className="w-36 h-36 object-contain rounded-xl" />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-xl">
                        <QrCode className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 bg-[#0D9488]/10 text-[#0D9488] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                      <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
                      {language === 'hi' ? 'फ़ोन कैमरे से स्कैन करें' : 'Scan with Mobile Camera'}
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {language === 'hi' ? 'फ़ोन से फ़ोटो खींचें या चुनें' : 'Scan to upload photo from your phone'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {language === 'hi'
                        ? 'फ़ोन ब्राउज़र में तुरंत खुलेगा • किसी ऐप की आवश्यकता नहीं'
                        : 'Opens in mobile browser • No app download required'}
                    </p>
                  </div>

                  {/* Timer & Refresh */}
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => initUploadSession(selectedType)}
                      className="inline-flex items-center gap-1 text-[#0D9488] hover:underline font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {language === 'hi' ? 'नया QR कोड' : 'New QR Code'}
                    </button>
                  </div>

                  {/* Kiosk Local File Fallback */}
                  <div className="pt-2 border-t border-slate-200/80 w-full text-center">
                    <button
                      type="button"
                      onClick={handleTriggerFileSelect}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                    >
                      {language === 'hi' ? 'या इस कियोस्क से सीधे फ़ाइल चुनें' : 'Or choose file directly from kiosk'}
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: Phone Connected */}
              {selectedType && !isLoadingSession && !isAttaching && sessionStatus === 'CONNECTED' && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-fade-in">
                  <div className="w-20 h-20 bg-teal-100 border-2 border-teal-500 rounded-3xl flex items-center justify-center shadow-inner relative">
                    <Smartphone className="w-10 h-10 text-teal-600 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-600"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">
                      {language === 'hi' ? 'फ़ोन कनेक्ट हो गया!' : 'Phone Connected!'}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1 max-w-sm">
                      {language === 'hi'
                        ? 'कृपया अपने फ़ोन पर दस्तावेज़ की फ़ोटो लें या फ़ाइल का चयन करें।'
                        : 'Please take a photo or choose a document on your phone now.'}
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 4: Uploading from Phone */}
              {selectedType && !isLoadingSession && !isAttaching && sessionStatus === 'UPLOADING' && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-fade-in">
                  <div className="w-20 h-20 bg-[#F0FDF9] rounded-3xl flex items-center justify-center border-2 border-[#0D9488]">
                    <UploadCloud className="w-10 h-10 text-[#0D9488] animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">
                      {language === 'hi' ? 'फ़ोन से दस्तावेज़ प्राप्त हो रहा है...' : 'Receiving document from phone...'}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {language === 'hi'
                        ? 'दस्तावेज़ सुरक्षित रूप से स्थानांतरित हो रहा है।'
                        : 'Uploading file directly to object storage.'}
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 5: Securing Document to PostgreSQL */}
              {isAttaching && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-fade-in">
                  <div className="w-14 h-14 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">
                      {language === 'hi' ? 'दस्तावेज़ रिकॉर्ड सुरक्षित किया जा रहा है...' : 'Securing clinical document record...'}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {language === 'hi'
                        ? 'दस्तावेज़ आपकी मेडिकल विज़िट से जोड़ा जा रहा है।'
                        : 'Linking document metadata to encounter in PostgreSQL.'}
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 6: Session Expired */}
              {selectedType && !isLoadingSession && !isAttaching && sessionStatus === 'EXPIRED' && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-fade-in">
                  <AlertCircle className="w-14 h-14 text-amber-500" />
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">
                      {language === 'hi' ? 'QR कोड सत्र समाप्त हो गया' : 'QR Session Expired'}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">
                      {language === 'hi'
                        ? 'सुरक्षा के लिए QR कोड की समय सीमा समाप्त हो गई है। नया कोड जनरेट करें।'
                        : 'The QR session has timed out. Tap below to generate a fresh QR code.'}
                    </p>
                  </div>
                  <button
                    onClick={() => initUploadSession(selectedType)}
                    className="px-6 py-2.5 bg-[#0D9488] text-white font-bold rounded-xl hover:bg-[#0B8070] transition-colors"
                  >
                    {language === 'hi' ? 'नया QR कोड बनाएँ' : 'Generate New QR Code'}
                  </button>
                </div>
              )}

              {/* STATE 7: Attach Retry Box (Protects against consume-before-attach failure) */}
              {pendingStorage && !isAttaching && (
                <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center max-w-md animate-fade-in bg-white/95 rounded-2xl border-2 border-amber-300 m-4 shadow-md">
                  <AlertCircle className="w-10 h-10 text-amber-600" />
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      {language === 'hi' ? 'दस्तावेज़ रिकॉर्ड से जोड़ना बाकी है' : 'Save Document to Visit'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {language === 'hi'
                        ? `फ़ाइल (${pendingStorage.file_name}) सुरक्षित रूप से प्राप्त हो गई है। इसे अपने रिकॉर्ड में जोड़ने के लिए 'पुनः प्रयास' दबाएँ।`
                        : `File (${pendingStorage.file_name}) is uploaded safely to MinIO. Click Retry to link it to your visit.`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => attachDocumentToMedikiosk(pendingStorage, selectedType || 'other')}
                      className="px-5 py-2 bg-[#0D9488] text-white text-sm font-bold rounded-xl hover:bg-[#0B8070] transition-colors shadow-sm"
                    >
                      {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry Attach'}
                    </button>
                    <button
                      onClick={() => {
                        setPendingStorage(null);
                        initUploadSession(selectedType || 'prescription');
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              )}

              {/* Native scanning animation overlay during local file upload */}
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
            </div>

            {/* Bottom Action Trigger */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (selectedType) {
                    initUploadSession(selectedType);
                  } else {
                    handleDocumentSelect('prescription');
                  }
                }}
                disabled={isAttaching || scanState === 'scanning' || scanState === 'processing'}
                className={`
                  px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2.5 transition-colors shadow-md
                  ${
                    isAttaching || scanState === 'scanning' || scanState === 'processing'
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#0D9488] text-white hover:bg-[#0B8070]'
                  }
                `}
              >
                <ScanLine className="w-6 h-6" />
                {selectedType
                  ? language === 'hi'
                    ? 'नया QR कोड बनाएँ'
                    : 'Generate Fresh QR'
                  : language === 'hi'
                  ? 'दस्तावेज़ स्कैन शुरू करें'
                  : 'Start Document Scan'}
              </button>
            </div>

            {/* "I don't have any documents" button */}
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

          {/* RIGHT: Scanned Documents List Panel */}
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
