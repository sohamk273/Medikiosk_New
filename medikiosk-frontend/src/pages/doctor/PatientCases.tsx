import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Users, ShieldAlert, CheckCircle2, Clock, Activity, RefreshCw } from 'lucide-react';
import { MockPatientCaseProvider } from '@/services/doctor/MockPatientCaseProvider';
import type { PatientRecord } from '@/services/doctor/MockPatientCaseProvider';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import { useTranslation } from '@/i18n';

export default function PatientCases() {
  const navigate = useNavigate();
  const session = usePatientSession();
  const { language } = useTranslation();

  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PatientRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Completed' | 'Attention'>('All');

  const loadData = () => {
    MockDoctorCaseProvider.injectPatientSession(session);
    const allRecords = MockPatientCaseProvider.getPatientRecords();
    setRecords(allRecords);
    applyFilters(allRecords, searchQuery, activeFilter);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const applyFilters = (data: PatientRecord[], query: string, filterType: string) => {
    let result = data;

    // Apply Search
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(r => {
        const matchName = r.name.toLowerCase().includes(lowerQuery);
        const matchPatientId = r.patientId.toLowerCase().includes(lowerQuery);
        const matchAbha = r.abhaId?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(lowerQuery.replace(/[^a-zA-Z0-9]/g, ''));
        const matchMobile = r.mobile?.toLowerCase().includes(lowerQuery);
        const matchCaseId = r.encounters.some(e => e.caseId.toLowerCase().includes(lowerQuery));
        return matchName || matchPatientId || matchAbha || matchMobile || matchCaseId;
      });
    }

    // Apply Filter Tab
    if (filterType === 'Active') {
      result = result.filter(r => r.currentStatus === 'waiting' || r.currentStatus === 'in-consultation');
    } else if (filterType === 'Completed') {
      result = result.filter(r => r.currentStatus === 'completed' || r.currentStatus === 'closed');
    } else if (filterType === 'Attention') {
      result = result.filter(r => r.attentionRequired);
    }

    setFilteredRecords(result);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    applyFilters(records, e.target.value, activeFilter);
  };

  const handleFilter = (filterType: 'All' | 'Active' | 'Completed' | 'Attention') => {
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
    totalPatients: records.length,
    activeCases: records.filter(r => r.currentStatus === 'waiting' || r.currentStatus === 'in-consultation').length,
    completedCases: records.filter(r => r.currentStatus === 'completed' || r.currentStatus === 'closed').length,
    attention: records.filter(r => r.attentionRequired).length
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const maskMobile = (mobile?: string) => {
    if (!mobile) return 'N/A';
    if (mobile.length >= 10) return `${mobile.slice(0, 2)}••••${mobile.slice(-4)}`;
    return mobile;
  };

  const maskAbha = (abha?: string) => {
    if (!abha) return 'N/A';
    const clean = abha.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length === 14) return `XXXX XXXX ${clean.slice(-4)}`;
    return abha;
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">COMPLETED</span>;
      case 'closed': return <span className="bg-slate-100 text-slate-400 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">CLOSED</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Patient Cases</h1>
          {language !== 'en' && <p className="text-slate-500 font-medium mt-1">मरीज़ के मामले</p>}
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
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">TOTAL PATIENTS</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.totalPatients}</span>
          </div>
        </div>

        <div 
          onClick={() => handleFilter('Active')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'Active' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">ACTIVE CASES</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.activeCases}</span>
          </div>
        </div>

        <div 
          onClick={() => handleFilter('Completed')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'Completed' ? 'border-slate-400 ring-1 ring-slate-400' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">COMPLETED</span>
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.completedCases}</span>
          </div>
        </div>

        <div 
          onClick={() => handleFilter('Attention')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${activeFilter === 'Attention' ? 'border-red-500 ring-1 ring-red-500 bg-red-50/50' : 'border-slate-200 hover:border-red-300 hover:shadow-md'} ${stats.attention > 0 && activeFilter !== 'Attention' ? 'bg-red-50/30 border-red-200' : ''}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${stats.attention > 0 || activeFilter === 'Attention' ? 'text-red-700 bg-red-100' : 'text-slate-500 bg-slate-100'}`}>ATTENTION REQ.</span>
            <ShieldAlert className={`w-5 h-5 ${stats.attention > 0 || activeFilter === 'Attention' ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <div>
            <span className={`text-4xl font-black ${stats.attention > 0 || activeFilter === 'Attention' ? 'text-red-700' : 'text-slate-800'}`}>{stats.attention}</span>
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
          {(['All', 'Active', 'Completed', 'Attention'] as const).map(f => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                activeFilter === f
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* PATIENT LIST */}
      <div className="space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map(patient => (
            <div 
              key={patient.patientId} 
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                patient.attentionRequired 
                  ? 'border-red-200 bg-red-50/10 hover:border-red-300' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* PATIENT INFO */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 leading-tight mb-1">{patient.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{patient.age} years • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-mono">
                      <span>Mobile: {maskMobile(patient.mobile)}</span>
                      <span className="text-slate-300">•</span>
                      <span>ABHA: {maskAbha(patient.abhaId)}</span>
                    </div>
                  </div>
                </div>

                {/* LATEST VISIT / CONCERN */}
                <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Visit</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">{new Date(patient.latestVisit).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">{patient.activeCaseId || patient.encounters[0]?.caseId}</span>
                    {getStatusDisplay(patient.currentStatus)}
                    {patient.latestConcern?.includes('[EMERGENCY TRIGGERED]') && (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium truncate ${patient.latestConcern?.includes('[EMERGENCY TRIGGERED]') ? 'text-rose-700 font-bold' : 'text-slate-700'}`} title={patient.latestConcern}>
                    {patient.latestConcern?.replace('[EMERGENCY TRIGGERED]', '').trim() || 'No chief complaint recorded'}
                  </p>
                </div>

                {/* STATUS & ACTION */}
                <div className="flex flex-col md:items-end justify-between gap-4 shrink-0">
                  <div className="flex flex-col md:items-end gap-1">
                    <span className="text-xs font-bold text-slate-700">{patient.totalVisits} {patient.totalVisits === 1 ? 'visit' : 'visits'}</span>
                    {patient.attentionRequired && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        <ShieldAlert className="w-3 h-3" /> Attention Required
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/doctor/patient/${patient.patientId}`)}
                    className={`w-full md:w-auto px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                      patient.latestConcern?.includes('[EMERGENCY TRIGGERED]')
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/20'
                    }`}
                  >
                    View Record <FileText className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No patient records found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Try adjusting your search criteria or modifying your filters. You can search by patient name, ABHA ID, mobile number, or Case ID.
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
