import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileScan, ArrowLeft, CheckCircle2, Clock, 
  Search, FileText 
} from 'lucide-react';
import { MockStaffProvider, type StaffDocumentCheckItem } from '@/services/staff/MockStaffProvider';

export default function StaffDocuments() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<StaffDocumentCheckItem[]>(MockStaffProvider.getDocuments());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleVerify = (docId: string) => {
    MockStaffProvider.verifyDocument(docId, 'Ananya Deshmukh (Desk 02)');
    setDocs(MockStaffProvider.getDocuments());
  };

  const filteredDocs = docs.filter(d => {
    const matchSearch = searchTerm.trim() === '' ||
      d.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tokenDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileScan className="w-5 h-5 text-teal-800" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Front-Desk Document Collection & Verification</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">Verify Aadhaar, ABHA cards, and diagnostic records prior to clinic triage</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          {docs.filter(d => d.status === 'Verified').length} of {docs.length} Verified
        </span>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient Name, Token, or Document Type..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {['All', 'Verified', 'Pending', 'Uploaded'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-teal-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Token</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Document Category</th>
                <th className="py-3.5 px-4">Uploaded Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verified By</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      {doc.tokenDisplay}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {doc.patientName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.documentType}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {doc.uploadedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.status === 'Verified' ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : doc.status === 'Pending' ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      ) : (
                        <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                          Uploaded
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {doc.verifiedBy || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {doc.status !== 'Verified' ? (
                        <button
                          onClick={() => handleVerify(doc.id)}
                          className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          Verify Now
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">Done</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No matching document records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
