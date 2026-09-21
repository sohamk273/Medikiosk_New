import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRightLeft, ArrowLeft, CheckCircle2, 
  RefreshCw, ChevronRight 
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment } from '@/services/staff/MockStaffProvider';

const STAGES: StaffAppointment['stage'][] = [
  'Registration',
  'Waiting',
  'Doctor Consultation',
  'Diagnostics / Documents',
  'Pharmacy / Billing',
  'Completed',
];

export default function StaffPatientMovement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialId = searchParams.get('patientId');

  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string>(initialId || '');

  const loadData = () => {
    const list = MockStaffProvider.getAppointments();
    setAppointments(list);
    if (!selectedAptId && list.length > 0) {
      setSelectedAptId(list[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPatient = appointments.find(a => a.id === selectedAptId) || appointments[0];

  const handleStageChange = (newStage: StaffAppointment['stage']) => {
    if (!selectedPatient) return;
    MockStaffProvider.updatePatientStage(selectedPatient.id, newStage);
    loadData();
  };

  const currentStageIndex = selectedPatient ? STAGES.indexOf(selectedPatient.stage) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-teal-800" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Movement & Workflow Tracker</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">Track and transition patient movement across OPD triage stages</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PATIENT LIST SELECTOR (LEFT 4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Active Patient</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {appointments.map((a) => {
              const isSelected = selectedPatient?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAptId(a.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-500/20 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold text-teal-800">{a.tokenDisplay}</span>
                    <span className="text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                      {a.stage}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-800">{a.patientName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{a.opdDepartment} • {a.doctorName}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKFLOW TRACKER DETAIL (RIGHT 8 COLS) */}
        {selectedPatient && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
            
            {/* Patient Snapshot Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedPatient.patientName}</h2>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    {selectedPatient.tokenDisplay}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPatient.age}y • {selectedPatient.gender} • Mobile: {selectedPatient.mobile}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stage</span>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                  {selectedPatient.stage}
                </span>
              </div>
            </div>

            {/* Visual Movement Funnel (Horizontal Stage Progression) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hospital Visit Stages</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STAGES.map((stageName, idx) => {
                  const isCurrent = selectedPatient.stage === stageName;
                  const isPast = idx < currentStageIndex;

                  return (
                    <button
                      key={stageName}
                      onClick={() => handleStageChange(stageName)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-900 text-white border-teal-900 shadow-2xs'
                          : isPast
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${isCurrent ? 'text-teal-200' : 'text-slate-400'}`}>
                          Step 0{idx + 1}
                        </span>
                        {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></span>}
                      </div>
                      <p className={`font-bold text-xs ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                        {stageName}
                      </p>
                      <p className={`text-[10px] mt-1 ${isCurrent ? 'text-teal-200' : 'text-slate-400'}`}>
                        {isPast ? 'Completed' : isCurrent ? 'Active Now' : 'Pending'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Transition Quick Actions */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <p className="text-xs font-bold text-slate-800">Operational Movement Actions</p>
              <div className="flex flex-wrap gap-2">
                {currentStageIndex < STAGES.length - 1 && (
                  <button
                    onClick={() => handleStageChange(STAGES[currentStageIndex + 1])}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Advance to Next: {STAGES[currentStageIndex + 1]}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                
                {selectedPatient.stage !== 'Completed' && (
                  <button
                    onClick={() => handleStageChange('Completed')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    Mark Visit Completed / Discharged
                  </button>
                )}
              </div>
            </div>

            {/* Visit Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Check-In Timestamp</span>
                <span className="font-semibold text-slate-800">{selectedPatient.checkedInAt || selectedPatient.registeredAt}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Clinic Room</span>
                <span className="font-semibold text-slate-800">{selectedPatient.opdDepartment} • {selectedPatient.roomNumber}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Status</span>
                <span className="font-semibold text-emerald-700">{selectedPatient.paymentStatus}</span>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
