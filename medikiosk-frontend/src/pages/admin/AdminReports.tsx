import { useState } from 'react';
import { 
  FileText, Download, Calendar, 
  Search, Eye, Filter, CheckCircle2, 
  X, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { MockAdminAnalyticsProvider, type AdminReportItem } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminReports() {
  const [reports] = useState<AdminReportItem[]>(MockAdminAnalyticsProvider.getReports());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewReport, setPreviewReport] = useState<AdminReportItem | null>(null);

  const categories = ['All', 'OPD Operations', 'Clinical Analytics', 'Financial & Billing', 'Quality & Compliance'];

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive EMR &amp; Hospital Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated statutory registers, clinical throughput audits, and operational analytics exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Initiating comprehensive daily hospital audit report generation...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate Custom Audit Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Report Templates</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{reports.length} Reports</div>
          <p className="text-[11px] text-slate-500 mt-1">Pre-configured statutory formats</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Auto-Generated Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">4 Registers</div>
          <p className="text-[11px] text-emerald-700 mt-1">Archived to hospital DMS</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Next Scheduled Batch</span>
            <Calendar className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">02:00 PM</div>
          <p className="text-[11px] text-slate-500 mt-1">Mid-day OPD transition digest</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Compliance Sync</span>
            <ShieldCheck className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-blue-800">NABH / ABDM</div>
          <p className="text-[11px] text-blue-700 mt-1">Audited format standards</p>
        </div>
      </div>

      {/* Reports Directory Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by title, code, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Report Code</th>
              <th className="py-3 px-4">Report Title &amp; Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Frequency</th>
              <th className="py-3 px-4">Last Generated</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-teal-800">{report.reportCode}</td>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{report.title}</p>
                  <p className="text-[10px] text-slate-500">{report.fileSize}</p>
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">{report.category}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200">
                    {report.frequency}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">{report.lastGenerated}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                    {report.format === 'PDF' ? <FileText className="w-3.5 h-3.5 text-rose-700" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />}
                    {report.format}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setPreviewReport(report)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Preview Summary"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert(`Downloading ${report.title} (${report.format})...`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      Export
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPreviewReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-3 border-b border-slate-200">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                {previewReport.reportCode}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1.5">{previewReport.title}</h2>
              <p className="text-xs text-slate-500">{previewReport.category} • {previewReport.frequency} Schedule</p>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                This document contains official aggregated metrics compliant with state health mission requirements and ABDM interoperability guidelines.
              </p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Generated Timestamp:</span>
                  <span className="font-mono text-slate-800 font-semibold">{previewReport.lastGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Output Format:</span>
                  <span className="font-semibold text-slate-800">{previewReport.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Size on Storage:</span>
                  <span className="font-mono text-slate-800">{previewReport.fileSize}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setPreviewReport(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Downloading ${previewReport.title}...`);
                  setPreviewReport(null);
                }}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download {previewReport.format}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
