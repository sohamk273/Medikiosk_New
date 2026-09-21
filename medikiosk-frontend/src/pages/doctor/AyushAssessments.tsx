import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Activity, Users, ShieldAlert, CheckCircle2, Clock, RefreshCw, FileText } from 'lucide-react';
import { MockAyushAssessmentProvider } from '@/services/doctor/MockAyushAssessmentProvider';
import type { AyushAssessmentRecord } from '@/services/doctor/MockAyushAssessmentProvider';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';

export default function AyushAssessments() {
  const navigate = useNavigate();
  const session = usePatientSession();

  const [records, setRecords] = useState<AyushAssessmentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AyushAssessmentRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Draft' | 'Completed' | 'Attention Required'>('All');

  const loadData = () => {
    MockDoctorCaseProvider.injectPatientSession(session);
    const allRecords = MockAyushAssessmentProvider.getAssessments();
    setRecords(allRecords);
    applyFilters(allRecords, searchQuery, activeFilter);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const applyFilters = (data: AyushAssessmentRecord[], query: string, filterType: string) => {
    let result = data;

    // Apply Search
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(r => {
        const matchName = r.patientName.toLowerCase().includes(lowerQuery);
        const matchCaseId = r.caseId.toLowerCase().includes(lowerQuery);
        const matchAbha = r.maskedAbhaId?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(lowerQuery.replace(/[^a-zA-Z0-9]/g, ''));
        const matchMobile = r.maskedMobile?.toLowerCase().includes(lowerQuery);
        return matchName || matchCaseId || matchAbha || matchMobile;
      });
    }

    // Apply Filter Tab
    if (filterType === 'Pending') result = result.filter(r => r.ayushStatus === 'pending');
    else if (filterType === 'In Progress') result = result.filter(r => r.ayushStatus === 'in-progress');
    else if (filterType === 'Draft') result = result.filter(r => r.ayushStatus === 'draft');
    else if (filterType === 'Completed') result = result.filter(r => r.ayushStatus === 'completed');
    else if (filterType === 'Attention Required') result = result.filter(r => r.redFlagTriggered);

    setFilteredRecords(result);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    applyFilters(records, e.target.value, activeFilter);
  };

  const handleFilter = (filterType: typeof activeFilter) => {
    setActiveFilter(filterType);
    applyFilters(records, searchQuery, filterType);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // KPI Calculations
  const stats = {
    total: records.length,
    pending: records.filter(r => r.ayushStatus === 'pending').length,
    inProgress: records.filter(r => r.ayushStatus === 'in-progress' || r.ayushStatus === 'draft').length,
    completed: records.filter(r => r.ayushStatus === 'completed').length,
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">PENDING</span>;
      case 'in-progress': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">IN PROGRESS</span>;
      case 'draft': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">DRAFT</span>;
      case 'completed': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">COMPLETED</span>;
      default: return null;
    }
  };

  const getCaseStatusDisplay = (status: string) => {
    switch (status) {
      case 'waiting': return <span className="text-amber-600 font-bold">WAITING</span>;
      case 'in-consultation': return <span className="text-blue-600 font-bold">IN CONSULTATION</span>;
      case 'completed': return <span className="text-emerald-600 font-bold">COMPLETED</span>;
      case 'closed': return <span className="text-slate-400 font-bold">CLOSED</span>;
      default: return <span className="text-slate-500 font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-[#0D9488] tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8" /> AYUSH Assessments
          </h1>
          <p className="text-slate-500 font-medium mt-1">आयुष मूल्यांकन</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4 text-slate-400" />
            {todayStr}
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
            <Activity className="w-4 h-4 text-[#0D9488]" />
            OPD Room 4
          </div>
          <button 
            onClick={handleRefresh}
            className={`w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all ${isRefreshing ? 'animate-spin text-[#0D9488]' : 'text-slate-500'}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => handleFilter('All')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'All' ? 'border-[#0D9488] ring-1 ring-[#0D9488]' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">TOTAL</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.total}</span>
          </div>
        </div>

        <div 
          onClick={() => handleFilter('Pending')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'Pending' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200 hover:border-amber-300 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md">PENDING</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.pending}</span>
          </div>
        </div>

        <div 
          onClick={() => handleFilter('In Progress')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'In Progress' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">IN PROGRESS</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.inProgress}</span>
          </div>
        </div>

        <div 
          onClick={() => handleFilter('Completed')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'Completed' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">COMPLETED</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ABHA ID, mobile, or case ID..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {(['All', 'Pending', 'In Progress', 'Draft', 'Completed', 'Attention Required'] as const).map(f => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                activeFilter === f
                  ? f === 'Attention Required' 
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : f === 'Attention Required'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {f === 'Attention Required' && <ShieldAlert className="w-4 h-4 inline-block mr-1" />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <div 
              key={record.assessmentId} 
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                record.redFlagTriggered && record.ayushStatus !== 'completed'
                  ? 'border-red-200 bg-red-50/10 hover:border-red-300' 
                  : 'border-slate-200 hover:border-[#0D9488]/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* PATIENT INFO */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">{record.caseId}</span>
                    <span className="text-xs font-bold text-slate-500">{new Date(record.lastUpdated).toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{record.patientName}</h3>
                  <p className="text-sm text-slate-500 font-medium">{record.age} years • {record.gender.charAt(0).toUpperCase() + record.gender.slice(1)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono text-slate-500">
                    <span>Mobile: {record.maskedMobile}</span>
                    <span className="text-slate-300">•</span>
                    <span>ABHA: {record.maskedAbhaId}</span>
                  </div>
                </div>

                {/* CLINICAL CONTEXT */}
                <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate mb-2" title={record.chiefComplaint}>
                    <span className="font-bold text-slate-500 text-xs uppercase tracking-wider block mb-0.5">Concern</span>
                    {record.chiefComplaint}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="bg-white px-2 py-1 rounded border border-slate-200">
                      <span className="text-slate-500 uppercase font-bold tracking-wider mr-1">Case:</span>
                      {getCaseStatusDisplay(record.caseStatus)}
                    </div>
                  </div>
                </div>

                {/* STATUS & ACTION */}
                <div className="flex flex-col md:items-end justify-between gap-4 shrink-0 md:w-48">
                  <div className="flex flex-col md:items-end gap-1.5 w-full">
                    {getStatusDisplay(record.ayushStatus)}
                    {record.redFlagTriggered && record.ayushStatus !== 'completed' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-100 px-2 py-1 rounded-full w-full justify-center md:justify-start md:w-auto">
                        <ShieldAlert className="w-3 h-3" /> Attention Required
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/doctor/ayush/${record.caseId}`)}
                    className={`w-full text-sm px-6 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                      record.ayushStatus === 'completed'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/20'
                    }`}
                  >
                    {record.ayushStatus === 'pending' && 'Start Assessment'}
                    {(record.ayushStatus === 'in-progress' || record.ayushStatus === 'draft') && 'Resume Assessment'}
                    {record.ayushStatus === 'completed' && 'View Assessment'}
                    <Activity className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              {activeFilter === 'Completed' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              ) : activeFilter === 'Pending' ? (
                <Clock className="w-8 h-8 text-amber-300" />
              ) : (
                <FileText className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {activeFilter === 'All' ? 'No assessments found' : `No ${activeFilter.toLowerCase()} assessments`}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {searchQuery ? 'Try adjusting your search criteria.' : 'There are currently no AYUSH assessments matching this status.'}
            </p>
            {(searchQuery || activeFilter !== 'All') && (
              <button 
                onClick={() => { setSearchQuery(''); handleFilter('All'); }}
                className="mt-6 text-[#0D9488] font-bold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
