import { useState } from 'react';
import { 
  FileScan, ShieldCheck, CheckCircle2, 
  Search, Filter, Eye, Download, FileText
} from 'lucide-react';

interface RecordItem {
  id: string;
  recordNo: string;
  patientName: string;
  tokenDisplay: string;
  docType: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'ABHA ID Card' | 'PM-JAY E-Card';
  department: string;
  ocrStatus: 'Extracted' | 'Partial' | 'Manual Review';
  abhaLinked: boolean;
  uploadedAt: string;
  fileSize: string;
}

export default function AdminRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const records: RecordItem[] = [
    { id: 'REC-001', recordNo: 'DOC-2026-881', patientName: 'Aarav Mehta', tokenDisplay: 'OPD-010', docType: 'Lab Report', department: 'General OPD', ocrStatus: 'Extracted', abhaLinked: true, uploadedAt: 'Today 08:35 AM', fileSize: '1.4 MB' },
    { id: 'REC-002', recordNo: 'DOC-2026-882', patientName: 'Meera Deshmukh', tokenDisplay: 'OPD-011', docType: 'Prescription', department: 'Orthopedics', ocrStatus: 'Extracted', abhaLinked: true, uploadedAt: 'Today 08:42 AM', fileSize: '850 KB' },
    { id: 'REC-003', recordNo: 'DOC-2026-883', patientName: 'Rameshwar Patil', tokenDisplay: 'OPD-012', docType: 'ABHA ID Card', department: 'General OPD', ocrStatus: 'Extracted', abhaLinked: true, uploadedAt: 'Today 09:10 AM', fileSize: '420 KB' },
    { id: 'REC-004', recordNo: 'DOC-2026-884', patientName: 'Sunita Sharma', tokenDisplay: 'OPD-013', docType: 'Discharge Summary', department: 'Ayurveda OPD', ocrStatus: 'Extracted', abhaLinked: false, uploadedAt: 'Today 09:25 AM', fileSize: '2.8 MB' },
    { id: 'REC-005', recordNo: 'DOC-2026-885', patientName: 'Vikram Joshi', tokenDisplay: 'OPD-014', docType: 'PM-JAY E-Card', department: 'Orthopedics', ocrStatus: 'Extracted', abhaLinked: true, uploadedAt: 'Today 09:40 AM', fileSize: '610 KB' },
    { id: 'REC-006', recordNo: 'DOC-2026-886', patientName: 'Ananya Iyer', tokenDisplay: 'OPD-015', docType: 'Lab Report', department: 'Pediatrics', ocrStatus: 'Partial', abhaLinked: true, uploadedAt: 'Today 10:05 AM', fileSize: '1.9 MB' },
    { id: 'REC-007', recordNo: 'DOC-2026-887', patientName: 'Rajesh Gupta', tokenDisplay: 'OPD-016', docType: 'Prescription', department: 'General OPD', ocrStatus: 'Extracted', abhaLinked: true, uploadedAt: 'Today 10:20 AM', fileSize: '980 KB' },
  ];

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recordNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tokenDisplay.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || r.docType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Documents &amp; Health Records Archive</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hospital-wide document management, OCR pipeline audit, and ABDM repository integration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Storage Encrypted (AES-256)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Digital Records</span>
            <FileScan className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">2,840</div>
          <p className="text-[11px] text-slate-500 mt-1">Scanned &amp; linked documents</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>OCR Extraction Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800">94.2%</div>
          <p className="text-[11px] text-teal-700 mt-1">Structured medical entity parsing</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>ABHA Health Lockers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">1,109</div>
          <p className="text-[11px] text-emerald-700 mt-1">Synced to patient Ayushman accounts</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Storage Utilization</span>
            <FileText className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">18.4 GB</div>
          <p className="text-[11px] text-slate-500 mt-1">Of 500 GB local cluster pool</p>
        </div>
      </div>

      {/* Main Table Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search records by Patient, Token, ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Document Types</option>
              <option value="Prescription">Prescriptions</option>
              <option value="Lab Report">Lab Reports</option>
              <option value="Discharge Summary">Discharge Summaries</option>
              <option value="ABHA ID Card">ABHA Cards</option>
              <option value="PM-JAY E-Card">PM-JAY Cards</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Document ID</th>
              <th className="py-3 px-4">Patient &amp; Token</th>
              <th className="py-3 px-4">Document Type</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">OCR Status</th>
              <th className="py-3 px-4">ABHA Linked</th>
              <th className="py-3 px-4">Uploaded Time</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRecords.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.recordNo}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] px-1 bg-slate-100 rounded border border-slate-200">{r.tokenDisplay}</span>
                    <span className="font-bold text-slate-800">{r.patientName}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-slate-700 font-semibold">{r.docType}</span>
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">{r.department}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    r.ocrStatus === 'Extracted'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {r.ocrStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {r.abhaLinked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 font-semibold">
                      <ShieldCheck className="w-3 h-3 text-teal-700" />
                      Linked
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Unlinked</span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{r.uploadedAt}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => alert(`Opening preview of document ${r.recordNo}`)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="View Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert(`Downloading document ${r.recordNo}`)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Download Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
