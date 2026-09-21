import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Search, FilePlus2, Eye, 
  Archive, X, Loader2,
  FileText, Pill, Activity, User, MoreVertical,
  Printer, Download, FileCheck,
  Droplets, ShieldCheck
} from 'lucide-react';
import { MockClinicalReportProvider, type ClinicalReportType, type ClinicalReport } from '@/services/doctor/MockClinicalReportProvider';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import { Modal } from '@/components/ui/Modal';

export default function ClinicalReports() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // Quick View Modal
  const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [activeMenuReportId, setActiveMenuReportId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Generate Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [reportType, setReportType] = useState<ClinicalReportType>('consultation-summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const allReports = useMemo(() => MockClinicalReportProvider.getReports(), []);
  const cases = useMemo(() => MockDoctorCaseProvider.getCases(), []);

  const stats = useMemo(() => {
    return {
      total: allReports.length,
      generated: allReports.filter(r => r.status === 'generated').length,
      reviewed: allReports.filter(r => r.status === 'reviewed').length,
      drafts: allReports.filter(r => r.status === 'draft' || r.status === 'generating').length,
      archived: allReports.filter(r => r.status === 'archived').length
    };
  }, [allReports]);

  const filteredReports = useMemo(() => {
    let result = allReports;

    if (activeFilter === 'Archived') {
      result = allReports.filter(r => r.status === 'archived');
    } else if (activeFilter !== 'All') {
      const typeMap: Record<string, string> = {
        'Consultation Summary': 'consultation-summary',
        'Prescription': 'prescription',
        'AYUSH Assessment': 'ayush-assessment',
        'Patient History': 'patient-history',
        'Case Summary': 'case-summary',
        'Lab Report': 'case-summary'
      };
      if (typeMap[activeFilter]) {
        result = result.filter(r => r.reportType === typeMap[activeFilter] || r.title === activeFilter);
      }
    } else {
      // In 'All' view, show active reports (or all 24)
      result = allReports;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        r.patientName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.caseId.toLowerCase().includes(q) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
        (r.chiefComplaint && r.chiefComplaint.toLowerCase().includes(q)) ||
        r.doctorName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allReports, activeFilter, searchQuery]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;

    setIsGenerating(true);
    setGenerationStep(1);
    
    setTimeout(() => setGenerationStep(2), 400);
    setTimeout(() => setGenerationStep(3), 800);
    
    try {
      const reportId = await MockClinicalReportProvider.generateReport(selectedCaseId, reportType);
      setGenerationStep(4);
      setTimeout(() => {
        setIsGenerating(false);
        setShowGenerateModal(false);
        setSelectedCaseId('');
        navigate(`/doctor/reports/${reportId}`);
      }, 400);
    } catch {
      setIsGenerating(false);
      alert('Unable to generate report.');
    }
  };

  const getReportIcon = (type: ClinicalReportType, title: string) => {
    if (title === 'Lab Report') {
      return (
        <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
      );
    }
    switch (type) {
      case 'consultation-summary':
        return (
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'prescription':
        return (
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Pill className="w-4 h-4" />
          </div>
        );
      case 'ayush-assessment':
        return (
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        );
      case 'patient-history':
        return (
          <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <User className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
            Reviewed
          </span>
        );
      case 'generated':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-xs font-semibold border border-sky-200">
            Generated
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
            Archived
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-200">
            <Loader2 className="w-3 h-3 animate-spin" /> Generating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const handleQuickDownload = (report: ClinicalReport) => {
    setDownloadNotice(`Downloading ${report.id} (${report.title})...`);
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const filters = [
    'All',
    'Consultation Summary',
    'Prescription',
    'AYUSH Assessment',
    'Patient History',
    'Case Summary',
    'Archived'
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Clinical Reports</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            क्लिनिकल रिपोर्ट्स / View and manage finalized reports
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">21 Sept 2026</p>
            <p className="text-[11px] text-slate-500 font-medium">OPD Room 4</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>EMR Connected</span>
          </div>
        </div>
      </div>

      {downloadNotice && (
        <div className="bg-teal-50 border border-teal-200 text-teal-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-600" />
            {downloadNotice}
          </span>
          <button onClick={() => setDownloadNotice(null)} className="text-teal-700 hover:text-teal-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

        {/* TOP SUMMARY CARDS (5 KPI BLOCKS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* TOTAL REPORTS */}
          <button 
            onClick={() => setActiveFilter('All')} 
            className={`bg-white p-4 rounded-xl border transition-all text-left shadow-2xs flex items-center justify-between cursor-pointer ${
              activeFilter === 'All' ? 'border-sky-500 ring-1 ring-sky-500' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL REPORTS</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <FileText className="w-5 h-5" />
            </div>
          </button>

          {/* GENERATED */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GENERATED</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.generated}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          {/* REVIEWED */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">REVIEWED</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.reviewed}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          {/* DRAFTS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DRAFTS</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.drafts}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* ARCHIVED */}
          <button 
            onClick={() => setActiveFilter('Archived')} 
            className={`bg-white p-4 rounded-xl border transition-all text-left shadow-2xs flex items-center justify-between cursor-pointer ${
              activeFilter === 'Archived' ? 'border-slate-500 ring-1 ring-slate-500' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ARCHIVED</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.archived}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <Archive className="w-5 h-5" />
            </div>
          </button>

        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          
          <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient name, report type, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex overflow-x-auto bg-white border border-slate-200 rounded-lg p-1 shadow-2xs hide-scrollbar gap-1">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeFilter === f 
                      ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

          </div>

          {/* Action Button */}
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>

        {/* CLINICAL REPORTS TABLE */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">REPORT</th>
                  <th className="py-3.5 px-5">PATIENT / CASE</th>
                  <th className="py-3.5 px-5">DIAGNOSIS / CONCERN</th>
                  <th className="py-3.5 px-5">GENERATED</th>
                  <th className="py-3.5 px-5">STATUS</th>
                  <th className="py-3.5 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <ClipboardList className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">No clinical reports found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try changing your search query or active filter tab.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors group">
                      
                      {/* 1. REPORT */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {getReportIcon(report.reportType, report.title)}
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{report.title}</p>
                            <p className="font-mono text-[11px] text-slate-400 mt-0.5">{report.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. PATIENT / CASE */}
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{report.patientName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {report.age} years • {report.gender}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            ABHA: {report.maskedAbhaId}
                          </p>
                        </div>
                      </td>

                      {/* 3. DIAGNOSIS / CONCERN */}
                      <td className="py-3.5 px-5 max-w-xs">
                        <p className="text-xs text-slate-800 font-medium truncate" title={report.diagnosis || report.chiefComplaint}>
                          {report.diagnosis || report.chiefComplaint || 'Clinical evaluation completed'}
                        </p>
                      </td>

                      {/* 4. GENERATED */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{report.formattedDate}</p>
                          <p className="text-[11px] text-slate-500">{report.formattedTime}</p>
                          <p className="text-[10px] text-slate-400">{report.doctorName}</p>
                        </div>
                      </td>

                      {/* 5. STATUS */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>

                      {/* 6. ACTION */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 relative">
                          <button
                            onClick={() => navigate(`/doctor/reports/${report.id}`)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                          >
                            View
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuReportId(activeMenuReportId === report.id ? null : report.id);
                            }}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {activeMenuReportId === report.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-9 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-left animate-in fade-in slide-in-from-top-1"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuReportId(null);
                                  setSelectedReport(report);
                                  setShowQuickView(true);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                Quick Preview
                              </button>
                              
                              <button
                                onClick={() => {
                                  setActiveMenuReportId(null);
                                  navigate(`/doctor/reports/${report.id}`);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                Full Report Page
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuReportId(null);
                                  handleQuickDownload(report);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                Download PDF
                              </button>

                              {report.status !== 'archived' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuReportId(null);
                                    MockClinicalReportProvider.archiveReport(report.id);
                                    navigate(0);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1.5"
                                >
                                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                                  Archive Report
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* QUICK PREVIEW MODAL */}
      <Modal open={showQuickView} onClose={() => setShowQuickView(false)} title="Clinical Report Preview">
        {selectedReport && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            
            {/* Header Box */}
            <div className="bg-slate-900 text-white rounded-xl p-4.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedReport.title}</h3>
                    <p className="font-mono text-xs text-teal-300">{selectedReport.id}</p>
                  </div>
                </div>
                <div>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">Patient</p>
                  <p className="font-semibold text-white">{selectedReport.patientName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">Age / Gender</p>
                  <p className="font-semibold text-white">{selectedReport.age} Yrs / {selectedReport.gender}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">ABHA ID</p>
                  <p className="font-mono font-semibold text-white">{selectedReport.maskedAbhaId}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">Generated</p>
                  <p className="font-semibold text-white">{selectedReport.formattedDate}</p>
                </div>
              </div>
            </div>

            {/* Clinical Content */}
            <div className="space-y-3 text-xs">
              
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Diagnosis / Clinical Impression</p>
                <p className="font-bold text-slate-900 text-sm">{selectedReport.diagnosis || 'Clinical evaluation completed'}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Chief Concern / Presenting Symptoms</p>
                <p className="text-slate-700 leading-relaxed">{selectedReport.chiefComplaint}</p>
              </div>

              {selectedReport.content.prescriptions && selectedReport.content.prescriptions.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-2">Prescribed Medications</p>
                  <div className="space-y-2">
                    {selectedReport.content.prescriptions.map((rx, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{rx.medicineName}</p>
                          <p className="text-[11px] text-slate-500">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                        </div>
                        {rx.instructions && <span className="text-[10px] text-slate-400 italic">"{rx.instructions}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.content.ayushAssessment && (
                <div className="bg-teal-50/50 rounded-xl p-3.5 border border-teal-100">
                  <p className="font-bold text-teal-900 uppercase text-[10px] mb-1">AYUSH Assessment Details</p>
                  <p className="text-slate-700 font-medium">Prakriti: <strong className="text-slate-900">{selectedReport.content.ayushAssessment.Prakriti || 'Vata-Pitta'}</strong></p>
                  <p className="text-slate-600 mt-1">{selectedReport.content.ayushAssessment.Notes || 'Holistic lifestyle and dietary regimen advised.'}</p>
                </div>
              )}

            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-4">
              <button
                onClick={() => {
                  setShowQuickView(false);
                  navigate(`/doctor/reports/${selectedReport.id}`);
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Open Full Report Page →
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setShowQuickView(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* GENERATE REPORT MODAL */}
      <Modal open={showGenerateModal} onClose={() => !isGenerating && setShowGenerateModal(false)} title="Generate Clinical Report">
        <form onSubmit={handleGenerate} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Patient Case
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              required
              disabled={isGenerating}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose active or completed case --</option>
              {cases.map(c => (
                <option key={c.caseId} value={c.caseId}>
                  {c.patientName} ({c.caseId}) - {c.chiefComplaint?.substring(0, 40) || 'General Consultation'}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ClinicalReportType)}
              disabled={isGenerating}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="consultation-summary">Consultation Summary</option>
              <option value="prescription">Prescription</option>
              <option value="ayush-assessment">AYUSH Assessment</option>
              <option value="patient-history">Patient History</option>
              <option value="case-summary">Complete Case Summary</option>
            </select>
          </div>

          {isGenerating && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                {generationStep === 1 && 'Collecting clinical data & consultation notes...'}
                {generationStep === 2 && 'Structuring EHR clinical findings...'}
                {generationStep === 3 && 'Finalizing clinical report documentation...'}
                {generationStep === 4 && 'Report ready!'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !selectedCaseId}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-2xs flex items-center gap-1.5"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Generate Report</span>
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
