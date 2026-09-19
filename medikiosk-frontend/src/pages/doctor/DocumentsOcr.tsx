import React, { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileScan, Search, Upload, Clock, 
  CheckCircle2, AlertCircle, Eye, X, FilePlus, Loader2, RefreshCw, FileText
} from 'lucide-react';
import { MockDocumentProvider } from '@/services/doctor/MockDocumentProvider';
import { MockDoctorCaseProvider, type DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { apiFetchSafe } from '@/services/api/client';
import { 
  uploadEncounterDocument, 
  fetchDocumentPresignedUrl, 
  validateDocumentFile 
} from '@/services/documents/documentService';

interface LiveEncounterOption {
  encounterId: string;
  encounterNumber: string;
  patientName: string;
  tokenNumber?: number;
  uhid?: string;
}

export default function DocumentsOcr() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('LAB_REPORT');
  const [selectedEncounterId, setSelectedEncounterId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real encounters for dropdown
  const [liveEncounters, setLiveEncounters] = useState<LiveEncounterOption[]>([]);

  // Real documents from PostgreSQL / MinIO
  const [realDocs, setRealDocs] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBackendDocuments = async () => {
    setIsRefreshing(true);
    try {
      const queueRes = await apiFetchSafe<any[]>('/queue/today');
      if (queueRes.ok && Array.isArray(queueRes.data)) {
        // Collect live encounters
        const encs: LiveEncounterOption[] = queueRes.data.map((entry) => ({
          encounterId: entry.encounter?.id || entry.encounter_id,
          encounterNumber: entry.encounter?.encounter_number || entry.encounter_number || `TOKEN-${entry.token_number}`,
          patientName: entry.patient?.full_name || entry.patient_name || 'Patient',
          tokenNumber: entry.token_number,
          uhid: entry.patient?.patient_uhid || entry.patient?.uhid,
        }));
        setLiveEncounters(encs);

        const docPromises = queueRes.data.map(async (entry) => {
          const encId = entry.encounter?.id || entry.encounter_id;
          if (!encId) return [];
          const dRes = await apiFetchSafe<any[]>(`/encounters/${encId}/documents`);
          if (dRes.ok && Array.isArray(dRes.data)) {
            return dRes.data.map((d: any) => ({
              id: d.id,
              documentType: d.document_type || 'DOCUMENT',
              fileName: d.file_name,
              patientName: entry.patient?.full_name || entry.patient_name || 'Patient',
              maskedMobile: entry.patient?.patient_uhid || entry.patient?.mobile || '',
              caseId: entry.encounter?.encounter_number || entry.encounter_number || encId,
              uploadedAt: d.uploaded_at,
              ocrStatus: d.processing_status || 'UPLOADED',
              status: 'reviewed',
              fileSize: d.file_size,
              isReal: true,
              encounterId: encId,
            }));
          }
          return [];
        });
        const nested = await Promise.all(docPromises);
        const flattened = nested.flat();
        setRealDocs(flattened);
      }
    } catch (err) {
      console.error('Failed to fetch backend documents:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBackendDocuments();
  }, []);

  const allDocs = useMemo(() => {
    return [...realDocs, ...MockDocumentProvider.getDocuments()];
  }, [realDocs]);

  const mockCases = MockDoctorCaseProvider.getCases();

  const handleViewDoc = async (doc: any) => {
    if (doc.isReal || (doc.id && doc.id.includes('-') && doc.id.length >= 32)) {
      const urlRes = await fetchDocumentPresignedUrl(doc.id);
      if (urlRes.ok && urlRes.data?.url) {
        window.open(urlRes.data.url, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    navigate(`/doctor/documents/${doc.id}`);
  };

  const stats = useMemo(() => {
    return {
      total: allDocs.length,
      pending: allDocs.filter(d => d.ocrStatus === 'not-started' || d.ocrStatus === 'processing').length,
      reviewRequired: allDocs.filter(d => d.status === 'review-required').length,
      reviewed: allDocs.filter(d => d.status === 'reviewed' || d.ocrStatus === 'UPLOADED').length,
    };
  }, [allDocs]);

  const filteredDocs = useMemo(() => {
    let result = activeFilter === 'Archived' 
      ? MockDocumentProvider.getArchivedDocuments() 
      : allDocs;

    if (activeFilter !== 'All' && activeFilter !== 'Archived') {
      if (activeFilter === 'OCR Pending') {
        result = result.filter(d => d.ocrStatus === 'not-started' || d.ocrStatus === 'processing');
      } else if (activeFilter === 'Reviewed') {
        result = result.filter(d => d.status === 'reviewed' || d.ocrStatus === 'UPLOADED');
      } else {
        result = result.filter(d => d.status === activeFilter.toLowerCase().replace(' ', '-'));
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.patientName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.caseId.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allDocs, activeFilter, searchQuery]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedEncounterId) {
      setUploadError('Please select a target patient case/encounter.');
      return;
    }

    if (!selectedFile) {
      setUploadError('Please select a valid document file (PDF, PNG, JPG).');
      return;
    }

    setIsUploading(true);

    try {
      // Check if selectedEncounterId is a UUID from backend
      const isBackendEnc = selectedEncounterId.includes('-');
      if (isBackendEnc) {
        const res = await uploadEncounterDocument(selectedEncounterId, selectedFile, uploadType);
        if (!res.ok) {
          throw new Error(res.error || 'Backend failed to upload document to MinIO.');
        }
      } else {
        // Fallback mock provider
        const targetCase = MockDoctorCaseProvider.getCaseById(selectedEncounterId);
        if (targetCase) {
          MockDocumentProvider.uploadMockDocument(
            `PAT-GEN-${targetCase.patientName}-${targetCase.age}`.replace(/\s+/g, '-').toUpperCase(),
            targetCase.caseId,
            targetCase.patientName,
            uploadType,
            selectedFile
          );
        }
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        setSelectedFile(null);
        setSelectedEncounterId('');
        fetchBackendDocuments();
      }, 1000);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <FileScan className="w-6 h-6 text-teal-600" />
            <h1 className="text-xl font-bold">Documents & OCR</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            कागदपत्र व्यवस्थापन / Digitized Patient Records (PostgreSQL + MinIO)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchBackendDocuments()}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-slate-500">OPD Room 4</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold">EMR Connected</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveFilter('All')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-teal-500 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-slate-500">TOTAL DOCUMENTS</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-slate-400">
              <FileScan className="w-6 h-6" />
            </div>
          </button>
          
          <button onClick={() => setActiveFilter('OCR Pending')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-teal-500 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-slate-500">OCR PENDING</p>
              <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
          </button>

          <button onClick={() => setActiveFilter('Review Required')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-teal-500 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-slate-500">REVIEW REQUIRED</p>
              <p className="text-2xl font-bold text-slate-800">{stats.reviewRequired}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-red-500">
              <AlertCircle className="w-6 h-6" />
            </div>
          </button>

          <button onClick={() => setActiveFilter('Reviewed')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-teal-500 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-slate-500">REVIEWED / STORED</p>
              <p className="text-2xl font-bold text-slate-800">{stats.reviewed}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by patient, document type, file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-teal-500"
            />
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Medical Document
          </button>
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Document Details</th>
                <th className="px-6 py-3.5">Patient Info</th>
                <th className="px-6 py-3.5">Encounter / Date</th>
                <th className="px-6 py-3.5">Storage / Status</th>
                <th className="px-6 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <FileScan className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-base font-medium text-slate-700">No documents found</p>
                      <p className="text-sm mt-1">Try uploading a document or adjusting search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-teal-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.documentType}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {doc.fileName} {doc.fileSize ? `• ${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{doc.patientName}</p>
                      <p className="text-xs text-slate-500 font-mono">{doc.maskedMobile}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{doc.caseId}</p>
                      <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {doc.isReal || doc.ocrStatus === 'UPLOADED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            STORED (MinIO)
                          </span>
                        ) : doc.status === 'review-required' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                            <AlertCircle className="w-3.5 h-3.5" />
                            REVIEW REQUIRED
                          </span>
                        ) : doc.status === 'reviewed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            REVIEWED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            PROCESSED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDoc(doc)}
                        className="flex items-center gap-2 text-teal-600 font-bold hover:text-teal-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View File
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Real Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <Upload className="w-5 h-5" />
                Upload Patient Medical Document
              </div>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadError(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6">
              {uploadError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2 items-center">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex gap-2 items-center">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>Document uploaded to MinIO and recorded in PostgreSQL successfully!</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Target Patient / Encounter */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Patient Encounter *</label>
                  <select 
                    required
                    value={selectedEncounterId}
                    onChange={(e) => setSelectedEncounterId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm font-medium"
                  >
                    <option value="">Select a live patient encounter...</option>
                    {liveEncounters.length > 0 ? (
                      liveEncounters.map((enc) => (
                        <option key={enc.encounterId} value={enc.encounterId}>
                          Token #{enc.tokenNumber || '—'} : {enc.patientName} ({enc.encounterNumber})
                        </option>
                      ))
                    ) : (
                      mockCases.map((c: DoctorCase) => (
                        <option key={c.caseId} value={c.caseId}>
                          {c.caseId} - {c.patientName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Document Category</label>
                  <select 
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm font-medium"
                  >
                    <option value="LAB_REPORT">Lab Report (रक्त/लघवी तपासणी)</option>
                    <option value="PRESCRIPTION">Prescription (वैद्यकीय पर्ची)</option>
                    <option value="DISCHARGE_SUMMARY">Discharge Summary (डिस्चार्ज सारांश)</option>
                    <option value="OPD_SLIP">OPD Slip (ओपीडी स्लिप)</option>
                    <option value="DIAGNOSTIC_REPORT">Diagnostic Report (क्ष-किरण / सोनोग्राफी)</option>
                    <option value="OTHER">Other Medical Document</option>
                  </select>
                </div>

                {/* File Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Select File (PDF, PNG, JPG - Max 10MB) *</label>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-teal-50/50 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-teal-600 shrink-0" />
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm truncate max-w-xs">{selectedFile.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FilePlus className="w-8 h-8 text-slate-400 mb-1" />
                        <p className="text-sm font-bold text-slate-700">Click to choose a file</p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF, PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadError(null);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedEncounterId || !selectedFile || isUploading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to MinIO...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Store</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
