import React, { useState } from 'react';
import { X, Camera, ScanLine, CheckCircle2, Loader2 } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import type { DocumentType } from '@/features/patient/PatientSessionContext';

export const DemoScannerModal: React.FC = () => {
  const { documents, isDemoScannerOpen, setIsDemoScannerOpen } = useDemoIntelligence();
  const { addDocument } = usePatientSession();

  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || 'doc-rx-001');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'ocr_extracting' | 'complete'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  if (!isDemoScannerOpen) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleStartScan = () => {
    setScanState('scanning');
    setScanProgress(20);

    setTimeout(() => {
      setScanState('ocr_extracting');
      setScanProgress(70);
    }, 1200);

    setTimeout(() => {
      setScanProgress(100);
      setScanState('complete');

      // Add to patient session
      if (currentDoc) {
        const docType: DocumentType =
          currentDoc.type === 'consultation_note' ? 'other' : (currentDoc.type as DocumentType);

        addDocument({
          id: `demo-doc-${Date.now()}`,
          type: docType,
          title: currentDoc.title,
          titleHindi: currentDoc.titleHindi,
          fileName: `${currentDoc.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileSize: 245000,
          status: 'scanned',
          timestamp: new Date().toISOString(),
          mockOcrText: currentDoc.extractedOcrSnippet,
        });
      }
    }, 2400);
  };

  const handleReset = () => {
    setScanState('idle');
    setScanProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-mediblue-50 via-white to-teal-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mediblue-600 text-white flex items-center justify-center font-bold shadow-md shadow-mediblue-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-mediblue-800 bg-mediblue-100 px-2.5 py-0.5 rounded-full">
                Simulated Optical Document Scanner
              </span>
              <h3 className="text-lg font-bold text-navy-900 mt-0.5">High-Precision OCR & Fact Extractor</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDemoScannerOpen(false)}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Document Picker Tabs */}
          {scanState === 'idle' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Select Document to Scan:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDocId === doc.id
                        ? 'border-mediblue-500 bg-mediblue-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{doc.type.replace('_', ' ')}</span>
                      {selectedDocId === doc.id && <CheckCircle2 className="w-3.5 h-3.5 text-mediblue-600" />}
                    </div>
                    <p className="text-xs font-bold text-navy-900 leading-tight">{doc.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{doc.date}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scanner Viewport / Visual Simulation */}
          <div className="relative h-64 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 flex items-center justify-center shadow-inner">
            {scanState === 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Laser Scanning Bar */}
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-lg shadow-teal-400/80 animate-bounce top-1/4"></div>
                <div className="absolute border-2 border-dashed border-teal-400/60 rounded-xl inset-6 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-teal-300 bg-slate-900/80 px-3 py-1 rounded-full border border-teal-500/40">
                    ALIGNING DOCUMENT BOUNDARIES...
                  </span>
                </div>
              </div>
            )}

            {scanState === 'ocr_extracting' && (
              <div className="p-4 w-full h-full bg-slate-950/90 text-teal-400 font-mono text-xs overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[10px] text-slate-400">
                  <span>OCR TEXT EXTRACTION PIPELINE</span>
                  <span className="animate-pulse text-teal-400">PROCESSING...</span>
                </div>
                <p className="text-[11px] whitespace-pre-wrap leading-relaxed text-slate-300 opacity-90">
                  {currentDoc.extractedOcrSnippet.slice(0, 220)}...
                </p>
                <div className="flex items-center gap-2 text-[10px] text-teal-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting structured clinical entities & linking evidence...</span>
                </div>
              </div>
            )}

            {scanState === 'complete' && (
              <div className="p-4 w-full h-full bg-emerald-950/80 text-white flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-emerald-200">Scan Complete & Facts Linked!</h4>
                <p className="text-xs text-emerald-100 max-w-sm">
                  {currentDoc.extractedFactsCount} clinical facts and evidence citations were extracted from "{currentDoc.title}".
                </p>
              </div>
            )}

            {scanState === 'idle' && (
              <div className="p-4 text-center text-slate-400 space-y-2">
                <ScanLine className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
                <p className="text-xs font-medium">Ready to scan {currentDoc.title}</p>
                <p className="text-[10px] text-slate-500">Document feeder loaded • Multi-page OCR enabled</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {scanState !== 'idle' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>{scanState === 'complete' ? 'Extraction Finished' : 'Scanning & Processing OCR...'}</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mediblue-600 to-teal-500 transition-all duration-500"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            disabled={scanState === 'idle' || scanState === 'scanning'}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
          >
            Scan Another Document
          </button>

          {scanState === 'idle' ? (
            <button
              type="button"
              onClick={handleStartScan}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-mediblue-600 to-teal-600 hover:from-mediblue-700 hover:to-teal-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Initiate Optical Scan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDemoScannerOpen(false)}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Done & View Linked Evidence
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
