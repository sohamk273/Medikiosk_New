import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Clock, User, FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { apiFetchSafe } from '@/services/api/client';

type FilterType = 'All' | 'Waiting' | 'In Consultation' | 'Completed' | 'Closed' | 'Attention Required';

export interface DoctorQueueItem {
  queueEntryId: string;
  encounterId: string;
  caseId: string;
  tokenNumber: number;
  encounterNumber: string;
  patientName: string;
  age: string | number;
  gender: string;
  chiefComplaint?: string;
  redFlagTriggered: boolean;
  submittedAt: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'closed';
  consultation?: { status: string };
}

export default function DoctorQueue() {
  const navigate = useNavigate();
  
  const [cases, setCases] = useState<DoctorQueueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchQueue = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await apiFetchSafe<any[]>('/queue/today');
      if (res.ok && Array.isArray(res.data)) {
        const mapped: DoctorQueueItem[] = res.data.map((item) => {
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
            queueEntryId: item.queue_entry_id,
            encounterId: item.encounter_id,
            caseId: item.encounter_id,
            tokenNumber: item.token_number,
            encounterNumber: item.encounter_number,
            patientName: item.patient_name,
            age: item.age ?? '—',
            gender: item.gender,
            chiefComplaint: item.chief_complaint,
            redFlagTriggered: item.red_flag_triggered || item.priority === 'EMERGENCY',
            submittedAt: item.queued_at,
            status: uiStatus,
          };
        });
        setCases(mapped);
        setApiError(null);
      } else if (!res.ok) {
        // If 401, client.ts handles session cleanup and dispatch
        setApiError(res.error || 'Failed to fetch OPD queue from server.');
      }
    } catch (err: any) {
      console.error('Failed to fetch OPD queue from backend:', err);
      setApiError(err?.message || 'Unexpected error while loading queue.');
    } finally {
      if (manual) setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(() => {
      fetchQueue();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filteredCases = useMemo(() => {
    let result = cases;

    // Apply Filter
    if (filter === 'Waiting') result = result.filter(c => c.status === 'waiting');
    if (filter === 'In Consultation') result = result.filter(c => c.status === 'in-consultation');
    if (filter === 'Completed') result = result.filter(c => c.status === 'completed');
    if (filter === 'Closed') result = result.filter(c => c.status === 'closed');
    if (filter === 'Attention Required') result = result.filter(c => c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed');

    // Apply Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.caseId.toLowerCase().includes(lowerSearch) ||
        (c.encounterNumber && c.encounterNumber.toLowerCase().includes(lowerSearch)) ||
        c.patientName.toLowerCase().includes(lowerSearch) ||
        (c.chiefComplaint && c.chiefComplaint.toLowerCase().includes(lowerSearch)) ||
        String(c.tokenNumber).includes(lowerSearch)
      );
    }

    return result;
  }, [cases, searchTerm, filter]);

  const stats = {
    waiting: cases.filter(c => c.status === 'waiting').length,
    inConsultation: cases.filter(c => c.status === 'in-consultation').length,
    completed: cases.filter(c => c.status === 'completed').length,
    closed: cases.filter(c => c.status === 'closed').length,
  };

  const getStatusDisplay = (status: DoctorQueueItem['status']) => {
    switch (status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">COMPLETED</span>;
      case 'closed': return <span className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">CLOSED</span>;
    }
  };

  const handleStartConsultation = async (e: React.MouseEvent, item: DoctorQueueItem) => {
    e.stopPropagation();
    try {
      const res = await apiFetchSafe(`/queue/${item.queueEntryId}/call`, {
        method: 'POST',
      });
      if (res.ok) {
        navigate(`/doctor/consultation/${item.encounterId}`);
      } else {
        setApiError(res.error || 'Failed to start consultation on server.');
      }
    } catch (err: any) {
      console.error('Failed to start consultation:', err);
      setApiError(err?.message || 'Failed to start consultation');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">OPD Queue</h1>
          <p className="text-slate-500 font-medium">ओपीडी कतार</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchQueue(true)}
            title="Refresh queue"
            className={`w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm ${isRefreshing ? 'animate-spin text-[#0D9488]' : 'text-slate-500'}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center min-w-28 shadow-sm">
            <span className="text-3xl font-black text-amber-500">{stats.waiting}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">WAITING</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center min-w-28 shadow-sm">
            <span className="text-3xl font-black text-blue-500">{stats.inConsultation}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">IN CONSULT.</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center min-w-24 shadow-sm">
            <span className="text-3xl font-black text-slate-600">{stats.completed}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">COMPLETED</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center min-w-24 shadow-sm">
            <span className="text-3xl font-black text-slate-400">{stats.closed}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">CLOSED</span>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span className="font-bold text-sm">{apiError}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Case ID, Token #, Patient Name, or Complaint..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(['All', 'Waiting', 'In Consultation', 'Completed', 'Closed', 'Attention Required'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  filter === f 
                    ? f === 'Attention Required' ? 'bg-red-100 text-red-700' : 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredCases.length > 0 ? (
            filteredCases.map(c => (
              <div 
                key={c.caseId}
                onClick={() => navigate(`/doctor/case/${c.caseId}`)}
                className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed'
                    ? 'border-red-200 bg-red-50/50 hover:border-red-300'
                    : c.status === 'closed'
                    ? 'border-slate-100 bg-slate-50/50 hover:border-slate-200 opacity-80'
                    : 'border-slate-200 bg-white hover:border-primary/30'
                }`}
              >
                <div className="flex-1 space-y-3 w-full">
                  
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">Token #{c.tokenNumber}</span>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{c.encounterNumber || c.caseId}</span>
                      {getStatusDisplay(c.status)}
                      {c.consultation?.status === 'draft' && c.status !== 'completed' && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">DRAFT SAVED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      {new Date(c.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.redFlagTriggered && c.status !== 'completed' ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{c.patientName}</h3>
                        <p className="text-sm text-slate-500">{c.age} years • {c.gender.charAt(0).toUpperCase() + c.gender.slice(1)}</p>
                      </div>
                    </div>

                    <div className="flex-1 border-l-2 border-slate-100 pl-4 py-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Today's Concern
                      </p>
                      <p className="text-slate-700 font-medium line-clamp-1">{c.chiefComplaint || 'No information provided'}</p>
                    </div>
                  </div>

                  {c.redFlagTriggered && c.status !== 'completed' && (
                    <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-bold w-fit mt-2">
                      <AlertCircle className="w-4 h-4" />
                      ATTENTION REQUIRED: Safety alert was triggered during intake.
                    </div>
                  )}

                </div>
                
                <div className="mt-4 md:mt-0 pl-4 flex items-center justify-end gap-2 w-full md:w-auto">
                  {c.status === 'waiting' && (
                    <button
                      onClick={(e) => handleStartConsultation(e, c)}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>Start Consultation</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {c.status === 'in-consultation' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/consultation/${c.encounterId}`);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>Resume</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {c.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/case/${c.encounterId}/summary`);
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5"
                    >
                      <span>Summary</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {c.status === 'closed' && (
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-lg font-medium">
                {apiError
                  ? 'Unable to load OPD queue due to a server error.'
                  : searchTerm
                  ? 'No matching cases found.'
                  : 'No patients currently in the OPD queue.'}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
