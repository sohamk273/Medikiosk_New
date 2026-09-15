import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, Clock, User, FileText, ChevronRight, 
  Activity, Users, CheckCircle2, ShieldAlert, Monitor, ArrowRight, RefreshCw, FileSignature
} from 'lucide-react';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { useDoctorAuth } from '@/features/auth/DoctorAuthContext';
import { apiFetchSafe } from '@/services/api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useDoctorAuth();

  const [cases, setCases] = useState<DoctorCase[]>([]);
  const [attentionCases, setAttentionCases] = useState<DoctorCase[]>([]);
  const [activeConsultations, setActiveConsultations] = useState<DoctorCase[]>([]);
  const [completedCases, setCompletedCases] = useState<DoctorCase[]>([]);
  const [draftConsultations, setDraftConsultations] = useState<DoctorCase[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<DoctorCase[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await apiFetchSafe<any[]>('/queue/today');
      if (res.ok && Array.isArray(res.data)) {
        const mapped: DoctorCase[] = res.data.map((item) => {
          let uiStatus: 'waiting' | 'in-consultation' | 'completed' | 'closed' = 'waiting';
          const qs = (item.queue_status || '').toUpperCase();
          if (qs === 'CALLED' || qs === 'IN_CONSULTATION') {
            uiStatus = 'in-consultation';
          } else if (qs === 'COMPLETED') {
            uiStatus = 'completed';
          } else if (qs === 'CANCELLED' || qs === 'NO_SHOW') {
            uiStatus = 'closed';
          }

          return {
            caseId: item.encounter_id,
            patientName: item.patient_name,
            age: item.age ?? 0,
            gender: item.gender,
            mobile: item.mobile,
            chiefComplaint: item.chief_complaint,
            voiceResponses: [],
            ayushResponses: [],
            documents: [],
            redFlagTriggered: item.red_flag_triggered || item.priority === 'EMERGENCY',
            submittedAt: item.queued_at,
            status: uiStatus,
          };
        });

        // Use real backend queue data - NEVER fall back to mock cases
        setCases(mapped);
        setAttentionCases(mapped.filter(c => c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed'));
        setActiveConsultations(mapped.filter(c => c.status === 'in-consultation'));
        setCompletedCases(mapped.filter(c => c.status === 'completed' || c.status === 'closed'));
        setDraftConsultations([]);
        setRecentCompleted(mapped.filter(c => c.status === 'completed' || c.status === 'closed').slice(0, 3));
        setApiError(null);
      } else if (!res.ok) {
        // Do not silently load mock cases on failure
        setApiError(res.error || 'Failed to load OPD cases from server.');
        setCases([]);
        setAttentionCases([]);
        setActiveConsultations([]);
        setCompletedCases([]);
        setDraftConsultations([]);
        setRecentCompleted([]);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setApiError(err?.message || 'Unexpected error while loading dashboard.');
      setCases([]);
      setAttentionCases([]);
      setActiveConsultations([]);
      setCompletedCases([]);
      setDraftConsultations([]);
      setRecentCompleted([]);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const stats = {
    waiting: cases.filter(c => c.status === 'waiting').length,
    inConsultation: activeConsultations.length,
    completed: completedCases.length,
    attention: attentionCases.length,
    drafts: draftConsultations.length,
    totalRegistered: cases.length,
    started: cases.filter(c => c.status !== 'waiting').length,
    closed: cases.filter(c => c.status === 'closed').length
  };

  const getStatusDisplay = (status: DoctorCase['status']) => {
    switch (status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">COMPLETED</span>;
      case 'closed': return <span className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">CLOSED</span>;
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const doctorName = user?.display_name || 'Dr. Priya Sharma';

  // Latest kiosk handoff case
  let latestKioskCase: DoctorCase | null = null;
  if (cases.length > 0) {
    latestKioskCase = [...cases].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* A. PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Good morning, {doctorName}</h1>
          <p className="text-slate-500 font-medium mt-1">आज के ओपीडी का संक्षिप्त विवरण</p>
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

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span className="font-bold text-sm">{apiError}</span>
        </div>
      )}

      {/* B. KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          onClick={() => navigate('/doctor/queue')} 
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md">WAITING</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.waiting}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Patients waiting</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')} 
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">IN CONSULT.</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.inConsultation}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Active consultations</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')} 
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">COMPLETED</span>
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.completed}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Completed today</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')} 
          className={`bg-white border rounded-2xl p-4 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${stats.attention > 0 ? 'border-red-200 hover:border-red-300 bg-red-50/30' : 'border-slate-200 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${stats.attention > 0 ? 'text-red-700 bg-red-100' : 'text-slate-500 bg-slate-100'}`}>ATTENTION REQ.</span>
            <ShieldAlert className={`w-5 h-5 ${stats.attention > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <div>
            <span className={`text-4xl font-black ${stats.attention > 0 ? 'text-red-700' : 'text-slate-800'}`}>{stats.attention}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Safety alerts</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')} 
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-widest bg-purple-100 px-2 py-1 rounded-md">DRAFTS</span>
            <FileSignature className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{stats.drafts}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Consultations to resume</p>
          </div>
        </div>
      </div>

      {/* C. MAIN CONTENT — TWO COLUMN LAYOUT */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1 — ATTENTION REQUIRED */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">Attention Required</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">विशेष ध्यान आवश्यक</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {attentionCases.length > 0 ? (
                attentionCases.map(c => (
                  <div key={c.caseId} className="bg-red-50/30 border border-red-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-red-200">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">{c.caseId}</span>
                        {getStatusDisplay(c.status)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{c.patientName}</h3>
                          <p className="text-xs text-slate-500">{c.age} years • {c.gender.charAt(0).toUpperCase() + c.gender.slice(1)}</p>
                        </div>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-lg border border-red-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Today's Concern</p>
                        <p className="text-sm font-medium text-slate-800">{c.chiefComplaint || 'No information provided'}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-md text-xs font-bold w-fit">
                        <AlertCircle className="w-3 h-3" /> ATTENTION REQUIRED: Safety alert was triggered during patient intake.
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => navigate(`/doctor/case/${c.caseId}`)}
                        className="w-full md:w-auto bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Review Case
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-slate-600 font-bold">No active safety alerts</p>
                  <p className="text-sm text-slate-400 mt-1">All cases are proceeding normally.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2 — ACTIVE CONSULTATIONS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">Active Consultations</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">चल रही परामर्श प्रक्रिया</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {activeConsultations.length > 0 ? (
                activeConsultations.map(c => (
                  <div key={c.caseId} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 hover:shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{c.caseId}</span>
                        {getStatusDisplay(c.status)}
                        {c.consultation?.status === 'draft' && (
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">DRAFT SAVED</span>
                        )}
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(c.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{c.patientName}</h3>
                          <p className="text-sm text-slate-500 truncate max-w-[200px] md:max-w-[400px]">{c.chiefComplaint}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => navigate(`/doctor/consultation/${c.caseId}`)}
                        className="w-full md:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <p className="font-medium">No consultations currently in progress.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3 — TODAY'S OPD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">Today's OPD</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">आज की ओपीडी</p>
              </div>
              <button 
                onClick={() => navigate('/doctor/queue')}
                className="text-sm font-bold text-[#0D9488] hover:text-[#0B8070] flex items-center gap-1 transition-colors"
              >
                View Full Queue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {cases.slice(0, 5).map(c => (
                <div 
                  key={c.caseId}
                  onClick={() => navigate(`/doctor/case/${c.caseId}`)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                    c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed'
                      ? 'border-red-100 bg-red-50/30 hover:border-red-200'
                      : c.status === 'closed'
                      ? 'border-slate-50 bg-slate-50/30 hover:border-slate-100 opacity-80'
                      : 'border-slate-100 bg-white hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <div className="hidden sm:block">
                      {getStatusDisplay(c.status)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">{c.patientName}</span>
                        {c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed' && (
                          <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{c.caseId}</span>
                        <span>•</span>
                        <span className="truncate">{c.chiefComplaint}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-4 shrink-0">
                    <span className="text-xs font-medium text-slate-400 hidden md:block">
                      {new Date(c.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <p className="font-medium">No patients currently in the OPD.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* SECTION 4 — TODAY'S ACTIVITY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">Today's Activity</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">आज की गतिविधि</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-600">Patients Registered</span>
                    <span className="font-black text-slate-800">{stats.totalRegistered}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-slate-800 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-600">Consultations Started</span>
                    <span className="font-black text-slate-800">{stats.started}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.totalRegistered ? (stats.started / stats.totalRegistered) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-600">Consultations Completed</span>
                    <span className="font-black text-slate-800">{stats.completed}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-[#0D9488] h-2 rounded-full" style={{ width: `${stats.started ? (stats.completed / stats.started) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-600">Cases Closed</span>
                    <span className="font-black text-slate-800">{stats.closed}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${stats.completed ? (stats.closed / stats.completed) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5 — CONSULTATION DRAFTS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">Consultation Drafts</h2>
            </div>
            <div className="p-0">
              {draftConsultations.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {draftConsultations.map(c => (
                    <div key={c.caseId} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800">{c.patientName}</h3>
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">DRAFT</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mb-3">{c.caseId}</p>
                      <button 
                        onClick={() => navigate(`/doctor/consultation/${c.caseId}`)}
                        className="w-full bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                      >
                        Resume Consultation
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p className="text-sm font-medium">No pending consultation drafts.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6 — RECENTLY COMPLETED */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">Recently Completed</h2>
            </div>
            <div className="p-0">
              {recentCompleted.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentCompleted.map(c => (
                    <div key={c.caseId} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800">{c.patientName}</h3>
                        {getStatusDisplay(c.status)}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mb-3">{c.caseId}</p>
                      <button 
                        onClick={() => navigate(`/doctor/case/${c.caseId}/summary`)}
                        className="w-full bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 py-1.5 rounded-lg text-sm font-bold hover:bg-[#0D9488]/20 transition-colors"
                      >
                        View Summary
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p className="text-sm font-medium">No recently completed cases.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 7 — PATIENT KIOSK HANDOFF */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800">Patient Kiosk</h2>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected
              </span>
            </div>
            <div className="p-6">
              {latestKioskCase ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Registration</p>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800 text-lg">{latestKioskCase.patientName}</h3>
                      <span className="text-xs text-slate-400">{new Date(latestKioskCase.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{latestKioskCase.caseId}</span>
                      {getStatusDisplay(latestKioskCase.status)}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1 mb-4">{latestKioskCase.chiefComplaint}</p>
                    <button 
                      onClick={() => navigate(`/doctor/case/${latestKioskCase!.caseId}`)}
                      className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                    >
                      Open Case
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-sm font-medium">No active patient handoff.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 8 — SYSTEM STATUS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">System Status</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-400" /> EMR Connection
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" /> OPD Queue
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> Patient Kiosk
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Document Processing
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
