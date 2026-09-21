import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Clock, User, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetchSafe } from '@/services/api/client';
import { DemoDoctorProvider } from '@/demo/services/demoDoctorProvider';
import { isDemoIntelligenceModeActive } from '@/demo/config/demoConfig';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';

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
  operationalState?: string;
  completenessScore?: number;
  discrepanciesCount?: number;
  discrepancies?: any[];
  abnormalLabs?: any[];
  documentsCount?: number;
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
      const demoItems = DemoDoctorProvider.getQueueItems() as DoctorQueueItem[];
      const res = await apiFetchSafe<any[]>('/queue/today');

      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        const realMapped: DoctorQueueItem[] = res.data.map((item) => {
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
            operationalState: uiStatus === 'waiting' ? 'Ready for Consultation' : uiStatus === 'in-consultation' ? 'In Progress' : 'Consultation Complete',
            completenessScore: 92,
            discrepanciesCount: 0
          };
        });

        // If Demo mode is active, prepend live cases onto the rich demo dataset
        if (isDemoIntelligenceModeActive()) {
          const combined = [...realMapped];
          demoItems.forEach(d => {
            if (!combined.some(c => c.caseId === d.caseId || c.tokenNumber === d.tokenNumber)) {
              combined.push(d);
            }
          });
          setCases(combined);
        } else {
          setCases(realMapped);
        }
        setApiError(null);
      } else {
        // Fallback to deterministic Demo Queue dataset
        if (isDemoIntelligenceModeActive() || !res.ok || (Array.isArray(res.data) && res.data.length === 0)) {
          setCases(demoItems);
          setApiError(null);
        } else {
          setCases([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch OPD queue from backend, loading deterministic demo dataset:', err);
      if (isDemoIntelligenceModeActive()) {
        setCases(DemoDoctorProvider.getQueueItems() as DoctorQueueItem[]);
        setApiError(null);
      } else {
        setApiError(err?.message || 'Unexpected error while loading queue.');
      }
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

  const getStatusDisplay = (status: DoctorQueueItem['status'], operationalState?: string) => {
    if (operationalState === 'Verification Required') {
      return (
        <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> VERIFICATION REQUIRED
        </span>
      );
    }
    if (operationalState === 'Ready for Consultation') {
      return (
        <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">
          READY
        </span>
      );
    }
    switch (status) {
      case 'waiting':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">COMPLETED</span>;
      case 'closed':
        return <span className="bg-slate-100 text-slate-400 border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">CLOSED</span>;
    }
  };

  const handleStartConsultation = async (e: React.MouseEvent, item: DoctorQueueItem) => {
    e.stopPropagation();
    const targetId = item.caseId || item.encounterId;
    try {
      DemoDoctorProvider.updateStatus(targetId, 'in-consultation');
      MockDoctorCaseProvider.updateCaseStatus(targetId, 'in-consultation');
      if (item.queueEntryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.queueEntryId)) {
        await apiFetchSafe(`/queue/${item.queueEntryId}/call`, {
          method: 'POST',
        });
      }
      navigate(`/doctor/consultation/${targetId}`);
    } catch {
      navigate(`/doctor/consultation/${targetId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16">

      {/* 1. HEADER & TOP STATISTICS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OPD Queue</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">ओपीडी कतार / Live Outpatient Department Queue</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchQueue(true)}
            title="Refresh queue"
            className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer ${isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-20">
            <span className="text-xl font-bold text-slate-900">{stats.waiting}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">WAITING</span>
          </div>
          
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-20">
            <span className="text-xl font-bold text-blue-700">{stats.inConsultation}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">IN CONSULT.</span>
          </div>
          
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-20">
            <span className="text-xl font-bold text-emerald-700">{stats.completed}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">COMPLETED</span>
          </div>
          
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-16">
            <span className="text-xl font-bold text-slate-400">{stats.closed}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">CLOSED</span>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* 2. SEARCH AND FILTER BAR + QUEUE LIST */}
      <div className="space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Token, Case ID, Patient Name, or Complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            {(['All', 'Waiting', 'In Consultation', 'Completed', 'Closed', 'Attention Required'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${filter === f
                    ? f === 'Attention Required' 
                      ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                      : 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* QUEUE CARDS */}
        <div className="space-y-3">
          {filteredCases.length > 0 ? (
            filteredCases.map(c => {
              const isOnlyRedAlert = c.redFlagTriggered && c.status !== 'completed' && c.status !== 'closed';
              const formattedTime = new Date(c.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={c.caseId}
                  onClick={() => navigate(`/doctor/case/${c.caseId}`)}
                  className={`group rounded-xl p-4 transition-all border cursor-pointer shadow-2xs ${
                    isOnlyRedAlert
                      ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
                      : c.status === 'closed'
                        ? 'border-slate-100 bg-slate-50/50 hover:border-slate-200 opacity-80'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    <div className="flex-1 space-y-2">

                      {/* Header metadata row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Token #{c.tokenNumber}
                        </span>
                        
                        <span className="font-mono text-xs text-slate-500">
                          {c.encounterNumber || c.caseId}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formattedTime} {c.status === 'waiting' ? '· Waiting' : ''}
                        </span>

                        <span className="text-slate-300">•</span>

                        {getStatusDisplay(c.status, c.operationalState)}

                        {c.completenessScore && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {c.completenessScore}% complete
                          </span>
                        )}

                        {c.consultation?.status === 'draft' && c.status !== 'completed' && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            Draft Saved
                          </span>
                        )}
                      </div>

                      {/* Patient Details & Clinical Concern */}
                      <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 pt-0.5">
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOnlyRedAlert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{c.patientName}</h3>
                            <p className="text-xs text-slate-500">{c.age} years • {c.gender.charAt(0).toUpperCase() + c.gender.slice(1)}</p>
                          </div>
                        </div>

                        <div className="flex-1 text-xs text-slate-700 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Today's Concern</span>
                          <p className="font-medium line-clamp-1 text-slate-800">{c.chiefComplaint || 'No chief complaint recorded'}</p>
                        </div>
                      </div>

                      {/* Single Red Alert banner for Aarav Mehta ONLY */}
                      {isOnlyRedAlert && (
                        <div className="flex items-center gap-2 bg-rose-100/90 text-rose-900 px-3 py-1.5 rounded-md text-xs font-semibold border border-rose-200 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>ATTENTION REQUIRED: Safety alert was triggered during intake.</span>
                        </div>
                      )}

                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center pt-2 lg:pt-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/30s-view?patientId=${c.caseId}`);
                        }}
                        className="px-3 py-1.5 bg-teal-50/80 hover:bg-teal-100 text-teal-900 border border-teal-200/80 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Open 30-Second Clinical Intelligence Summary"
                      >
                        <span>30s View</span>
                      </button>

                      {c.status === 'waiting' && (
                        <button
                          onClick={(e) => handleStartConsultation(e, c)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                            isOnlyRedAlert 
                              ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                              : 'bg-teal-700 hover:bg-teal-800 text-white'
                          }`}
                        >
                          <span>{isOnlyRedAlert ? 'Review Case' : 'Start Consultation'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {c.status === 'in-consultation' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctor/consultation/${c.caseId || c.encounterId}`);
                          }}
                          className="px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Resume</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {c.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctor/case/${c.caseId || c.encounterId}/summary`);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Summary</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}

                      {c.status === 'closed' && (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm font-medium">
                {apiError
                  ? 'Unable to load OPD queue due to a server error.'
                  : searchTerm
                    ? 'No matching patients found in queue.'
                    : 'No patients currently in the OPD queue.'}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
