import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Smartphone, FileCheck, RefreshCw, CheckCircle2, 
  AlertCircle, ArrowRight, Eye, ShieldCheck, Clock, ExternalLink, X
} from 'lucide-react';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { 
  createUploadSession, 
  consumeSession, 
  getPreviewUrl, 
  SessionCreated, 
  FileMetadata, 
  ConsumeResponse,
  API_BASE
} from '../services/api';

export const KioskView: React.FC = () => {
  const [session, setSession] = useState<SessionCreated | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
  const [consumedData, setConsumedData] = useState<ConsumeResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize a new upload session
  const startNewSession = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setLoading(true);
    setError(null);
    setFileMeta(null);
    setConsumedData(null);
    setPreviewUrl(null);

    try {
      const data = await createUploadSession(600, {
        kiosk_terminal: 'KIOSK-TERMINAL-01',
        created_by: 'OPD-Registration',
      });
      setSession(data);
      setStatus(data.status);
      setTimeLeft(data.ttl_seconds || 600);

      // Connect SSE
      connectSSE(data.session_id);
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Could not connect to upload service.');
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const connectSSE = (sessionId: string) => {
    const sse = new EventSource(`${API_BASE}/sessions/${sessionId}/events`);
    eventSourceRef.current = sse;

    sse.addEventListener('initial_state', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.status) setStatus(payload.status);
        if (payload.file_metadata) setFileMeta(payload.file_metadata);
      } catch (err) {
        console.error('SSE initial state parse error:', err);
      }
    });

    sse.addEventListener('status_change', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.status) {
          setStatus(payload.status);
          if (payload.file_metadata) {
            setFileMeta(payload.file_metadata);
          }
        }
      } catch (err) {
        console.error('SSE status change parse error:', err);
      }
    });

    sse.onerror = () => {
      console.warn('SSE connection interrupted, browser will auto-reconnect...');
    };
  };

  useEffect(() => {
    startNewSession();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!session || status === 'CONSUMED' || status === 'EXPIRED') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session, status]);

  const handleConsume = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await consumeSession(session.session_id);
      setConsumedData(res);
      setStatus('CONSUMED');
    } catch (err: any) {
      alert('Error finalizing document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPreview = async () => {
    if (!session) return;
    const res = await getPreviewUrl(session.session_id);
    if (res.url) {
      setPreviewUrl(res.url);
      setShowPreviewModal(true);
    } else {
      alert('Preview is not available for this document.');
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Kiosk Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
            K
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Kiosk Document Upload Station</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Independent Module Demo — Terminal #01</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            MinIO Object Storage Connected
          </div>

          <button
            onClick={startNewSession}
            disabled={loading}
            className="btn-secondary text-sm py-2 px-3"
            title="Generate new QR session"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            New Session
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col items-center justify-center">
        {/* Step Indicator */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
            <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">1</span>
            Scan QR Code
          </div>
          <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
          <div className={`flex items-center gap-2 font-bold text-sm ${status === 'CONNECTED' || status === 'UPLOADING' || status === 'UPLOADED' || status === 'CONSUMED' ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${status === 'CONNECTED' || status === 'UPLOADING' || status === 'UPLOADED' || status === 'CONSUMED' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            Capture / Upload
          </div>
          <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
          <div className={`flex items-center gap-2 font-bold text-sm ${status === 'UPLOADED' || status === 'CONSUMED' ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${status === 'UPLOADED' || status === 'CONSUMED' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            Review & Continue
          </div>
        </div>

        {/* Central Display Card */}
        <div className="card w-full max-w-2xl p-8 flex flex-col items-center text-center">
          
          {/* Status Badge */}
          <div className="mb-6">
            {status === 'WAITING' && (
              <span className="badge badge-waiting">
                <span className="pulse-dot" />
                Waiting for Phone Scan
              </span>
            )}
            {status === 'CONNECTED' && (
              <span className="badge badge-connected">
                <span className="pulse-dot" />
                Phone Connected — Awaiting File
              </span>
            )}
            {status === 'UPLOADING' && (
              <span className="badge badge-uploading">
                <span className="pulse-dot" />
                Receiving File from Phone...
              </span>
            )}
            {status === 'UPLOADED' && (
              <span className="badge badge-uploaded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Document Received in MinIO
              </span>
            )}
            {status === 'CONSUMED' && (
              <span className="badge badge-consumed">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session Consumed & Finalized
              </span>
            )}
            {status === 'EXPIRED' && (
              <span className="badge badge-expired">
                <AlertCircle className="w-3.5 h-3.5" />
                Session Expired
              </span>
            )}
            {status === 'FAILED' && (
              <span className="badge badge-failed">
                <AlertCircle className="w-3.5 h-3.5" />
                Upload Failed
              </span>
            )}
          </div>

          {/* Body State 1: WAITING or CONNECTED */}
          {(status === 'WAITING' || status === 'CONNECTED') && session && (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
                Scan with your smartphone camera
              </h2>
              <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                Open your personal mobile phone's standard camera app or QR scanner to upload a photo or document directly to this kiosk.
              </p>

              {/* QR Box */}
              <div className="relative p-2 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner mb-6">
                <QRCodeDisplay text={session.upload_url} size={240} />
                
                {status === 'CONNECTED' && (
                  <div className="absolute inset-0 bg-teal-900/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-white p-4 animate-in fade-in duration-300">
                    <Smartphone className="w-12 h-12 text-teal-300 mb-2 animate-bounce" />
                    <p className="font-bold text-base">Phone Connected!</p>
                    <p className="text-xs text-teal-200 mt-1 text-center">
                      Please take a photo or choose a document on your phone now.
                    </p>
                  </div>
                )}
              </div>

              {/* Timer info */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-full mb-4">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>QR Code valid for: <strong className="text-slate-800 font-mono text-sm">{formatTimer(timeLeft)}</strong></span>
              </div>

              {/* Manual Link Helper for Desktop Testing */}
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <span>Testing on this computer?</span>
                <a
                  href={session.upload_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  Open Phone Interface in New Tab <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Body State 2: UPLOADING */}
          {status === 'UPLOADING' && (
            <div className="py-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Receiving Document...</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                The mobile phone is transferring the file into MinIO object storage. Please hold on a moment.
              </p>
            </div>
          )}

          {/* Body State 3: UPLOADED (Ready for review & consume) */}
          {status === 'UPLOADED' && fileMeta && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <FileCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-1">Document Received!</h2>
              <p className="text-sm text-slate-500 mb-6">
                File successfully ingested and validated from the phone.
              </p>

              {/* File details card */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">File Name</span>
                    <p className="font-bold text-slate-800 break-all">{fileMeta.file_name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Size & Type</span>
                    <p className="font-bold text-slate-800">{formatSize(fileMeta.file_size)} • {fileMeta.content_type}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">SHA-256 Checksum</span>
                    <p className="font-mono text-xs text-slate-600 bg-white p-2 rounded border border-slate-200 break-all">
                      {fileMeta.sha256}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleFetchPreview}
                  className="btn-secondary flex-1 py-3"
                >
                  <Eye className="w-4 h-4" />
                  Preview Document
                </button>
                <button
                  onClick={handleConsume}
                  disabled={loading}
                  className="btn-primary flex-1 py-3"
                >
                  {loading ? 'Finalizing...' : 'Accept & Consume'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Body State 4: CONSUMED */}
          {status === 'CONSUMED' && consumedData && (
            <div className="w-full flex flex-col items-center py-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-1">Session Finalized</h2>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                The document has been consumed. The upload token is permanently invalidated and cannot be reused.
              </p>

              {/* Payload coordinates */}
              <div className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl text-left overflow-x-auto mb-6">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-2">Canonical Storage Reference Delivered to Parent App:</p>
                <pre>{JSON.stringify(consumedData.storage_reference, null, 2)}</pre>
              </div>

              <button
                onClick={startNewSession}
                className="btn-primary px-8 py-3"
              >
                <RefreshCw className="w-4 h-4" />
                Start Another Upload
              </button>
            </div>
          )}

          {/* Body State 5: EXPIRED */}
          {status === 'EXPIRED' && (
            <div className="py-8 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Upload Session Expired</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">
                For security reasons, upload QR codes expire after 10 minutes.
              </p>
              <button onClick={startNewSession} className="btn-primary">
                <RefreshCw className="w-4 h-4" />
                Generate New QR Code
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Eye className="w-5 h-5 text-teal-600" />
                Document Preview (MinIO Presigned Stream)
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-auto bg-slate-50 flex items-center justify-center min-h-[400px]">
              {fileMeta?.content_type === 'application/pdf' ? (
                <iframe src={previewUrl} className="w-full h-[500px] rounded-lg border border-slate-200" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Uploaded Document" className="max-h-[500px] max-w-full object-contain rounded-lg shadow-sm border border-slate-200" />
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowPreviewModal(false)} className="btn-secondary text-sm">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
