import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Camera, FileUp, CheckCircle2, AlertCircle, 
  UploadCloud, FileText, ArrowLeft, Loader2, ShieldCheck, Lock
} from 'lucide-react';
import { mobileHandshake, uploadFileWithProgress, HandshakeResponse } from '../services/api';

export const MobileUploadView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  
  const [sessionInfo, setSessionInfo] = useState<HandshakeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // File selection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Uploading state
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid link. No upload token was provided.');
      setLoading(false);
      return;
    }

    mobileHandshake(token)
      .then((data) => {
        setSessionInfo(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Session expired or token invalid.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size against session constraints
    if (sessionInfo && file.size > sessionInfo.max_size_mb * 1024 * 1024) {
      alert(`File exceeds the allowed ${sessionInfo.max_size_mb} MB limit.`);
      return;
    }

    setSelectedFile(file);

    // Create client-side preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !token) return;
    setUploading(true);
    setProgress(0);

    try {
      await uploadFileWithProgress(token, selectedFile, (pct) => {
        setProgress(pct);
      });
      setUploadSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between max-w-md mx-auto border-x border-slate-800 shadow-2xl">
      {/* Mobile Header */}
      <header className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-900 flex items-center justify-center font-black text-sm">
            K
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Kiosk Document Upload</h1>
            <div className="flex items-center gap-1 text-[11px] text-teal-400 font-medium">
              <Lock className="w-3 h-3" />
              Secure Anonymous Link
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
            One-time Token
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 flex flex-col justify-center">
        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
            <p className="text-base font-semibold text-slate-200">Connecting to Kiosk...</p>
            <p className="text-xs text-slate-500 mt-1">Verifying temporary upload token</p>
          </div>
        )}

        {/* Error / Expired State */}
        {error && !loading && (
          <div className="py-12 flex flex-col items-center text-center bg-red-950/30 border border-red-900/50 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-900/50 text-red-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Session Unavailable</h2>
            <p className="text-xs text-red-200 leading-relaxed max-w-xs mb-4">
              {error}
            </p>
            <p className="text-xs text-slate-500">
              Please check the physical kiosk display and scan a fresh QR code.
            </p>
          </div>
        )}

        {/* Success State */}
        {uploadSuccess && (
          <div className="py-10 flex flex-col items-center text-center bg-emerald-950/30 border border-emerald-900/50 rounded-3xl p-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Upload Complete!</h2>
            <p className="text-sm text-emerald-200/90 leading-relaxed mb-6">
              Your document was safely transferred to the kiosk. You can now look back at the kiosk screen to continue.
            </p>

            <div className="w-full bg-slate-800/80 rounded-xl p-4 text-left border border-slate-700 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">File Name:</span>
                <span className="font-semibold text-slate-200">{selectedFile?.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-emerald-400">Received by MinIO</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              This upload session is now closed and cannot be re-used. You may safely close this browser tab.
            </p>
          </div>
        )}

        {/* Ready to Select & Upload */}
        {!loading && !error && !uploadSuccess && (
          <div className="flex flex-col gap-6">
            {!selectedFile ? (
              <div className="flex flex-col gap-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-black text-white">Upload to Kiosk</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Take a photo with your camera or choose a file from your phone storage.
                  </p>
                </div>

                {/* Option 1: Take Photo */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full p-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98] shadow-lg shadow-teal-900/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center shrink-0">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-extrabold">Take Photo</div>
                    <div className="text-xs text-teal-100 font-normal">Use phone camera to capture document</div>
                  </div>
                </button>

                {/* Option 2: Choose File / Gallery */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                    <FileUp className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-extrabold">Choose from Device</div>
                    <div className="text-xs text-slate-400 font-normal">Select image or PDF from storage</div>
                  </div>
                </button>

                {/* Constraints note */}
                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Supported: JPEG, PNG, PDF</span>
                  <span>Max size: {sessionInfo?.max_size_mb || 15} MB</span>
                </div>
              </div>
            ) : (
              /* Review & Submit Selected File */
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={resetSelection}
                    disabled={uploading}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change file
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium">Ready to transfer</span>
                </div>

                {/* Preview Box */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center">
                  {previewUrl ? (
                    <div className="w-full max-h-64 overflow-hidden rounded-xl bg-black mb-3 flex items-center justify-center border border-slate-700">
                      <img src={previewUrl} alt="Preview" className="max-h-64 object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center text-teal-400 mb-3">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  <p className="font-bold text-sm text-white break-all max-w-xs">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)} • {selectedFile.type}</p>
                </div>

                {/* Progress bar if uploading */}
                {uploading && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Uploading to MinIO...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-teal-500 transition-all duration-150 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  onClick={handleUploadSubmit}
                  disabled={uploading}
                  className="w-full py-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-base transition-all active:scale-[0.98] shadow-lg shadow-teal-900/40 mt-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      Send to Kiosk
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Footer */}
      <footer className="p-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-500/80" />
        <span>End-to-End Encrypted Handshake • Anonymous Session</span>
      </footer>
    </div>
  );
};
