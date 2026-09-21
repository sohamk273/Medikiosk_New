import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, CheckSquare, Calendar, Clock, 
  ArrowRight, RefreshCw, AlertTriangle, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment, type StaffAlertItem } from '@/services/staff/MockStaffProvider';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [alerts, setAlerts] = useState<StaffAlertItem[]>([]);
  const [metrics, setMetrics] = useState(MockStaffProvider.getOverviewMetrics());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const loadData = (manual = false) => {
    if (manual) setIsRefreshing(true);
    setAppointments(MockStaffProvider.getAppointments());
    setAlerts(MockStaffProvider.getAlerts());
    setMetrics(MockStaffProvider.getOverviewMetrics());
    if (manual) setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickCheckIn = (id: string) => {
    MockStaffProvider.checkInPatient(id);
    loadData();
  };

  const filteredQueue = appointments
    .filter(a => selectedDept === 'All' || a.opdDepartment === selectedDept)
    .filter(a => a.status === 'Waiting' || a.status === 'In Consultation' || a.status === 'Checked In');

  const upcomingAppointments = appointments
    .filter(a => a.status === 'Scheduled' || a.status === 'Checked In')
    .slice(0, 5);

  const recentlyCompleted = appointments
    .filter(a => a.status === 'Completed')
    .slice(0, 4);

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. TOP HEADER & REFRESH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Front Desk Operations</h1>
            <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">
              Reception Desk 02
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Live patient intake, check-in queue management, and daily appointment movement
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            className={`h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer ${isRefreshing ? 'opacity-70' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/staff/register')}
            className="h-9 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-2 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patients Today</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.patientsToday}</span>
            <span className="text-[11px] text-slate-400 font-medium">Daily Census</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Checked In</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-teal-800">{metrics.checkedIn}</span>
            <span className="text-[11px] text-teal-700 font-semibold">Triage Ready</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waiting</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-700">{metrics.waiting}</span>
            <span className="text-[11px] text-amber-700 font-semibold">In Waiting Area</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Consultation</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-700">{metrics.inConsultation}</span>
            <span className="text-[11px] text-blue-700 font-semibold">Active in OPDs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-700">{metrics.completed}</span>
            <span className="text-[11px] text-slate-400 font-medium">Finished Visit</span>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL ALERTS (IF ANY) */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Operational Attention Required</h3>
            </div>
            <button 
              onClick={() => navigate('/staff/alerts')}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Alerts ({activeAlerts.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {activeAlerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="bg-white p-3 rounded-xl border border-amber-200 flex items-start justify-between gap-3 shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{alert.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE: LIVE OPD QUEUE (LEFT) + APPOINTMENTS & ACTIONS (RIGHT) */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* LIVE OPD QUEUE TABLE */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-800" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live OPD Queue</h2>
                <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  {filteredQueue.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time waiting and in-consultation tracker</p>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
              {['All', 'General OPD', 'Ayurveda', 'Orthopedics'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    selectedDept === dept
                      ? 'bg-teal-800 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">OPD & Room</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waiting</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {item.tokenDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div>
                          <span>{item.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-normal block">{item.age}y • {item.gender}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-semibold">{item.opdDepartment}</span>
                        <span className="text-[10px] text-slate-400 block">{item.roomNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.doctorName}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'Waiting' && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                            Waiting
                          </span>
                        )}
                        {item.status === 'In Consultation' && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                            In Consult.
                          </span>
                        )}
                        {item.status === 'Checked In' && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                            Checked In
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                        {item.waitingMinutes > 0 ? `${item.waitingMinutes}m` : 'Just arrived'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/staff/movement?patientId=${item.id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          View Track
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No active patients in this OPD queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Showing live triage queue</span>
            <button
              onClick={() => navigate('/staff/queue')}
              className="text-teal-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Dedicated Queue View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: TODAY'S APPOINTMENTS & RECENT ACTIVITY */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* TODAY'S APPOINTMENTS / QUICK CHECK-IN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-800" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scheduled Today</h3>
              </div>
              <button 
                onClick={() => navigate('/staff/appointments')}
                className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                        {apt.appointmentTime}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">{apt.patientName}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {apt.opdDepartment} • {apt.doctorName}
                    </p>
                  </div>

                  {apt.status === 'Scheduled' ? (
                    <button
                      onClick={() => handleQuickCheckIn(apt.id)}
                      className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>Check In</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                      Arrived
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RECENTLY COMPLETED VISITS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recently Completed</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Morning Shift</span>
            </div>

            <div className="space-y-2">
              {recentlyCompleted.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{c.patientName}</p>
                    <p className="text-[10px] text-slate-500">{c.opdDepartment} • {c.tokenDisplay}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Discharged
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK FRONT-DESK ACTIONS */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Desk Shortcuts</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/staff/check-in')}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-left text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-teal-700 mb-1" />
                <span>Search & Check In</span>
              </button>
              <button
                onClick={() => navigate('/staff/movement')}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-left text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-teal-700 mb-1" />
                <span>Patient Flow Track</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
