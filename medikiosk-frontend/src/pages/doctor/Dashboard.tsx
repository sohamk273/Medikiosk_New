import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, 
  User, 
  ChevronRight,
  Activity, 
  Users, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw, 
  Calendar,
  Sparkles
} from 'lucide-react';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { useDoctorAuth } from '@/features/auth/DoctorAuthContext';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { apiFetchSafe } from '@/services/api/client';
import { DemoDoctorProvider } from '@/demo/services/demoDoctorProvider';
import { isDemoIntelligenceModeActive } from '@/demo/config/demoConfig';

interface QueuePatientItem {
  caseId: string;
  tokenNumber: number;
  tokenDisplay: string;
  time: string;
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  chiefComplaint: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'closed' | 'scheduled';
  waitingTime?: string;
  isRedFlag: boolean;
  redFlagReason?: string;
  startedAt?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useDoctorAuth();
  const session = usePatientSession();

  const [cases, setCases] = useState<DoctorCase[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const demoCasesMap = DemoDoctorProvider.getAllDoctorCases();
      const demoCasesList = Object.values(demoCasesMap);

      const res = await apiFetchSafe<any[]>('/queue/today');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        const realMapped: DoctorCase[] = res.data.map((item) => {
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

        if (isDemoIntelligenceModeActive()) {
          const combined = [...realMapped];
          demoCasesList.forEach(d => {
            if (!combined.some(c => c.caseId === d.caseId)) {
              combined.push(d);
            }
          });
          setCases(combined);
        } else {
          setCases(realMapped);
        }
        setApiError(null);
      } else {
        if (isDemoIntelligenceModeActive() || !res.ok || (Array.isArray(res.data) && res.data.length === 0)) {
          setCases(demoCasesList);
          setApiError(null);
        } else {
          setCases([]);
        }
      }
    } catch (err: any) {
      if (isDemoIntelligenceModeActive()) {
        const demoCasesList = Object.values(DemoDoctorProvider.getAllDoctorCases());
        setCases(demoCasesList);
        setApiError(null);
      } else {
        setApiError(err?.message || 'Unexpected error while loading dashboard.');
      }
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const doctorName = user?.display_name || 'Dr. Priya Sharma';

  // Structured Live Queue Items
  // Rule: ONLY Aarav Mehta is the red alert patient.
  // All other patients are neutral/clean white cards.
  const queueItems: QueuePatientItem[] = useMemo(() => {
    const list: QueuePatientItem[] = [
      {
        caseId: 'MEDI-OPD-2026-00010',
        tokenNumber: 1,
        tokenDisplay: '#01',
        time: '09:30 AM',
        patientName: 'Aarav Mehta',
        age: 42,
        gender: 'male',
        chiefComplaint: 'Severe post-prandial burning sensation in epigastrium and acid regurgitation for 3 weeks',
        status: 'waiting',
        waitingTime: '8 min',
        isRedFlag: true,
        redFlagReason: 'Safety alert was triggered during patient intake.'
      },
      {
        caseId: 'MEDI-OPD-2026-00012',
        tokenNumber: 2,
        tokenDisplay: '#02',
        time: '10:00 AM',
        patientName: 'Rajesh Sharma',
        age: 52,
        gender: 'male',
        chiefComplaint: 'Severe lower back pain radiating down posterior left thigh and calf for 4 months, aggravated by bending',
        status: 'in-consultation',
        startedAt: '10:02 AM',
        isRedFlag: false
      },
      {
        caseId: 'MEDI-OPD-2026-00014',
        tokenNumber: 3,
        tokenDisplay: '#03',
        time: '10:30 AM',
        patientName: 'Harish Chandra',
        age: 64,
        gender: 'male',
        chiefComplaint: 'Bilateral knee joint stiffness and morning pain for 6 months, difficulty climbing stairs',
        status: 'waiting',
        waitingTime: '2 min',
        isRedFlag: false
      },
      {
        caseId: 'MEDI-OPD-2026-00020',
        tokenNumber: 4,
        tokenDisplay: '#04',
        time: '11:00 AM',
        patientName: 'Kavita Iyer',
        age: 38,
        gender: 'female',
        chiefComplaint: 'Fasting Blood Glucose review & episodic migraine follow-up',
        status: 'scheduled',
        isRedFlag: false
      }
    ];

    // Inject dynamic session patient if available
    if (session.patient && session.tokenNumber) {
      const isAlreadyInList = list.some(item => item.tokenNumber === session.tokenNumber);
      if (!isAlreadyInList) {
        list.push({
          caseId: session.encounterId || `ENC-2026-00${session.tokenNumber}`,
          tokenNumber: session.tokenNumber,
          tokenDisplay: `#${session.tokenNumber < 10 ? '0' + session.tokenNumber : session.tokenNumber}`,
          time: session.appointment?.timeSlot || '03:30 PM',
          patientName: session.patient.name,
          age: parseInt(session.patient.age || '45', 10),
          gender: (session.patient.gender as any) || 'male',
          chiefComplaint: session.chiefComplaint?.primaryComplaint || 'Patient Intake via Kiosk',
          status: 'waiting',
          waitingTime: 'Just now',
          isRedFlag: false
        });
      }
    }

    return list;
  }, [session]);

  // Active consultation patient (Rajesh Sharma)
  const currentConsultation = queueItems.find(p => p.status === 'in-consultation') || queueItems[1];

  // Schedule list
  const scheduleList = [
    { time: '09:30 AM', name: 'Aarav Mehta', status: 'Waiting', token: '#01' },
    { time: '10:00 AM', name: 'Rajesh Sharma', status: 'In Consultation', token: '#02' },
    { time: '10:30 AM', name: 'Harish Chandra', status: 'Waiting', token: '#03' },
    { time: '11:00 AM', name: 'Kavita Iyer', status: 'Scheduled', token: '#04' },
    { time: '11:30 AM', name: 'Priya Patel', status: 'Scheduled', token: '#05' },
    ...(session.patient ? [{ time: session.appointment?.timeSlot || '03:30 PM', name: session.patient.name, status: 'Waiting', token: `#${session.tokenNumber || 42}` }] : [])
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
      case 'Waiting':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation':
      case 'In Consultation':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed':
      case 'Completed':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">COMPLETED</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">SCHEDULED</span>;
    }
  };

  const metrics = useMemo(() => {
    const total = cases.length > 0 ? Math.max(cases.length, 8) : 8;
    const waiting = cases.length > 0 ? cases.filter(c => c.status === 'waiting').length : 2;
    const inConsultation = cases.length > 0 ? cases.filter(c => c.status === 'in-consultation').length || 1 : 1;
    const completed = cases.length > 0 ? cases.filter(c => c.status === 'completed' || c.status === 'closed').length || 5 : 5;
    return { total, waiting, inConsultation, completed };
  }, [cases]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16">
      
      {/* 1. TOP HEADER SUMMARY */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Good Morning, {doctorName}
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Monday, 21 September</span>
            <span className="text-slate-300">•</span>
            <span className="text-teal-700 font-semibold">OPD Room 4</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/doctor/30s-view')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>30-Sec Clinical View</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/demo-hub')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            <span>Demo Hub</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh OPD data"
            className={`w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer ${isRefreshing ? 'animate-spin text-teal-600' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {apiError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-semibold">
          {apiError}
        </div>
      )}

      {/* 2. COMPACT METRICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => navigate('/doctor/queue')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Schedule</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.total}</p>
            <p className="text-[11px] text-slate-500">{Math.max(0, metrics.total - metrics.completed)} remaining today</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Waiting</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.waiting}</p>
            <p className="text-[11px] text-slate-500">~8 min avg wait</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">In Consultation</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.inConsultation}</p>
            <p className="text-[11px] text-slate-500">Room 4 Active</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/doctor/queue')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.completed}</p>
            <p className="text-[11px] text-slate-500">{Math.round((metrics.completed / metrics.total) * 100)}% of schedule</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. NOW IN CONSULTATION CARD */}
      {currentConsultation && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-base flex items-center justify-center shrink-0">
                {currentConsultation.tokenDisplay}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    NOW IN CONSULTATION
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {currentConsultation.time} appointment • Started {currentConsultation.startedAt || '10:02 AM'}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-900">
                  {currentConsultation.patientName} <span className="text-xs font-normal text-slate-500">({currentConsultation.age} years • Male)</span>
                </h3>
                
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                  {currentConsultation.chiefComplaint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={() => navigate(`/doctor/case/${currentConsultation.caseId}`)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <span>Open Case</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN WORKFLOW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT COLUMN (2/3 width): LIVE OPD QUEUE */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* LIVE OPD QUEUE SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Live OPD Queue
                </h2>
              </div>
              <button 
                onClick={() => navigate('/doctor/queue')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
              >
                Full Board <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {queueItems.map((item) => {
                // Rule 1: ONLY Aarav Mehta gets subtle red alert styling
                const isRedAlert = item.isRedFlag;

                return (
                  <div
                    key={item.caseId}
                    className={`rounded-xl p-4 transition-all border ${
                      isRedAlert
                        ? 'border-rose-300 bg-rose-50/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      
                      {/* Patient Details & Time */}
                      <div className="space-y-2 flex-1">
                        
                        {/* Meta strip */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            {item.tokenDisplay}
                          </span>
                          
                          {/* PROMINENT APPOINTMENT TIME */}
                          <span className="flex items-center gap-1 font-bold text-xs text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {item.time}
                          </span>

                          <span className="font-mono text-[11px] text-slate-400">
                            {item.caseId}
                          </span>

                          {getStatusBadge(item.status)}

                          {item.waitingTime && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Waiting: {item.waitingTime}
                            </span>
                          )}
                        </div>

                        {/* Patient Name & Age */}
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isRedAlert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {item.patientName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {item.age} years • {item.gender === 'male' ? 'Male' : item.gender === 'female' ? 'Female' : 'Other'}
                            </p>
                          </div>
                        </div>

                        {/* Chief Complaint / Today's Concern */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Clinical Concern</p>
                          <p className="text-slate-800 font-medium leading-relaxed">
                            {item.chiefComplaint}
                          </p>
                        </div>

                        {/* Single Red Alert banner for Aarav Mehta ONLY */}
                        {isRedAlert && item.redFlagReason && (
                          <div className="flex items-center gap-2 bg-rose-100/90 text-rose-900 px-3 py-1.5 rounded-md text-xs font-semibold border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>ATTENTION REQUIRED: {item.redFlagReason}</span>
                          </div>
                        )}

                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 sm:self-center mt-2 sm:mt-0">
                        {isRedAlert ? (
                          <button
                            onClick={() => navigate(`/doctor/case/${item.caseId}`)}
                            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <span>Review Case</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : item.status === 'in-consultation' ? (
                          <button
                            onClick={() => navigate(`/doctor/case/${item.caseId}`)}
                            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <span>Open Case</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/doctor/case/${item.caseId}`)}
                            className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <span>Open Case</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* TODAY'S SCHEDULE TIMELINE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Today's Schedule Overview
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Monday, 21 September</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {scheduleList.map((slot, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-md px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 w-16 font-mono text-xs">
                      {slot.time}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {slot.token}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {slot.name}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(slot.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width): SECONDARY & PROGRESS */}
        <div className="space-y-5">
          
          {/* 1. TODAY'S PROGRESS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Today's Progress
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Patients Registered</span>
                  <span className="text-slate-900 font-bold">8</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Consultations Started</span>
                  <span className="text-blue-700 font-bold">5</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Completed</span>
                  <span className="text-teal-700 font-bold">3</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Cases Closed</span>
                  <span className="text-slate-700 font-bold">1</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. UPCOMING APPOINTMENTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Upcoming
              </h3>
              <span className="text-xs font-semibold text-slate-500">Next 2 hours</span>
            </div>

            <div className="space-y-2.5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Harish Chandra</span>
                  <span className="font-mono text-teal-700 font-bold">10:30 AM</span>
                </div>
                <p className="text-slate-500 text-[11px]">Bilateral knee joint stiffness</p>
                <span className="inline-block mt-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                  Waiting in Lobby (2 min)
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Kavita Iyer</span>
                  <span className="font-mono text-slate-700 font-bold">11:00 AM</span>
                </div>
                <p className="text-slate-500 text-[11px]">Fasting Blood Glucose review</p>
                <span className="inline-block mt-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                  Scheduled Check-in
                </span>
              </div>
            </div>
          </div>

          {/* 3. RECENTLY COMPLETED */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recently Completed
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900">Kavita Iyer</h4>
                  <p className="text-[11px] text-slate-500">Completed • 09:15 AM</p>
                </div>
                <button
                  onClick={() => navigate('/doctor/reports')}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  View Summary
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900">Sunita Verma</h4>
                  <p className="text-[11px] text-slate-500">Completed • 08:45 AM</p>
                </div>
                <button
                  onClick={() => navigate('/doctor/reports')}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  View Summary
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
