import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileScan, Search, Upload, Clock, 
  CheckCircle2, AlertCircle, Eye, X
} from 'lucide-react';
import { MockDocumentProvider } from '@/services/doctor/MockDocumentProvider';
import { MockDoctorCaseProvider, type DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { apiFetchSafe } from '@/services/api/client';

export default function DocumentsOcr() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('Lab Report');
  const [selectedCaseId, setSelectedCaseId] = useState('');

  // Real documents from PostgreSQL / MinIO
  const [realDocs, setRealDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchBackendDocuments = async () => {
      try {
        const queueRes = await apiFetchSafe<any[]>('/queue/today');
        if (queueRes.ok && Array.isArray(queueRes.data)) {
          const docPromises = queueRes.data.map(async (entry) => {
            const encId = entry.encounter?.id || entry.encounter_id;
            if (!encId) return [];
            const dRes = await apiFetchSafe<any[]>(`/encounters/${encId}/documents`);
            if (dRes.ok && Array.isArray(dRes.data)) {
              return dRes.data.map((d: any) => ({
                id: d.id,
                documentType: d.document_type || 'DOCUMENT',
                fileName: d.file_name,
                patientName: entry.patient?.full_name || 'Patient',
                maskedMobile: entry.patient?.patient_uhid || entry.patient?.mobile || '',
                caseId: entry.encounter?.encounter_number || encId,
                uploadedAt: d.uploaded_at,
                ocrStatus: d.processing_status || 'UPLOADED',
                status: 'reviewed',
                fileSize: d.file_size,
                isReal: true,
              }));
            }
            return [];
          });
          const nested = await Promise.all(docPromises);
          const flattened = nested.flat();
          if (flattened.length > 0) {
            setRealDocs(flattened);
          }
        }
      } catch (err) {
        console.error('Failed to fetch backend documents:', err);
      }
    };

    fetchBackendDocuments();
  }, []);

  const allDocs = useMemo(() => {
    return [...realDocs, ...MockDocumentProvider.getDocuments()];
  }, [realDocs]);

  const cases = MockDoctorCaseProvider.getCases(); // For dropdown in upload modal

  const handleViewDoc = async (doc: any) => {
    if (doc.isReal || (doc.id && doc.id.includes('-'))) {
      const urlRes = await apiFetchSafe<any>(`/documents/${doc.id}/url`);
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
      reviewed: allDocs.filter(d => d.status === 'reviewed').length,
    };
  }, [allDocs]);

  const filteredDocs = useMemo(() => {
    let result = activeFilter === 'Archived' 
      ? MockDocumentProvider.getArchivedDocuments() 
      : allDocs;

    if (activeFilter !== 'All' && activeFilter !== 'Archived') {
      if (activeFilter === 'OCR Pending') {
        result = result.filter(d => d.ocrStatus === 'not-started' || d.ocrStatus === 'processing');
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
        d.documentType.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allDocs, activeFilter, searchQuery]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCase = MockDoctorCaseProvider.getCaseById(selectedCaseId);
    if (!targetCase) return;

    MockDocumentProvider.uploadMockDocument(
      `PAT-GEN-${targetCase.patientName}-${targetCase.age}`.replace(/\s+/g, '-').toUpperCase(),
      targetCase.caseId,
      targetCase.patientName,
      uploadType,
      null
    );
    setShowUploadModal(false);
    setSelectedCaseId('');
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
            आज के दस्तावेज़ / Document Management
          </p>
        </div>
        <div className="flex items-center gap-4">
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
            <div className="bg-orange-50 p-3 rounded-lg text-orange-500">
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
              <p className="text-sm font-medium text-slate-500">REVIEWED</p>
              <p className="text-2xl font-bold text-slate-800">{stats.reviewed}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, case ID, or document type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden p-1 shadow-sm">
              {['All', 'OCR Pending', 'Review Required', 'Reviewed', 'Archived'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeFilter === f 
                      ? 'bg-teal-50 text-teal-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Case ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">OCR Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <FileScan className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-700">No documents found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <FileScan className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.documentType}</p>
                          <p className="text-xs text-slate-500">
                            {doc.fileName} {doc.fileSize ? `• ${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{doc.patientName}</p>
                      <p className="text-xs text-slate-500">UHID: {doc.maskedMobile}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{doc.caseId}</p>
                      <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {doc.ocrStatus === 'UPLOADED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            UPLOADED (MinIO)
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
                        ) : doc.ocrStatus === 'not-started' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            PENDING OCR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            PROCESSED
                          </span>
                        )}
                        {doc.ocrConfidence && (
                          <span className="text-xs font-medium text-slate-500">
                            {doc.ocrConfidence}% confidence
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
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Upload Modal Simulation */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <Upload className="w-5 h-5" />
                Upload Synthetic Document
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6">
              <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p><strong>Demo Mode:</strong> This simulates uploading a document to a patient case. No real files are uploaded.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Case</label>
                  <select 
                    required
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm font-medium"
                  >
                    <option value="">Select a case...</option>
                    {cases.map((c: DoctorCase) => (
                      <option key={c.caseId} value={c.caseId}>
                        {c.caseId} - {c.patientName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Document Type</label>
                  <select 
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm font-medium"
                  >
                    <option>Lab Report</option>
                    <option>Prescription</option>
                    <option>Discharge Summary</option>
                    <option>Diagnostic Report</option>
                    <option>Previous Consultation</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCaseId}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Simulate Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
