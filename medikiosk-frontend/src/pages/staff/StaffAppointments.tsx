import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Search, CheckSquare, 
  XCircle, RefreshCw, UserPlus 
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment } from '@/services/staff/MockStaffProvider';

export default function StaffAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = (manual = false) => {
    if (manual) setIsRefreshing(true);
    setAppointments(MockStaffProvider.getAppointments());
    if (manual) setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckIn = (id: string) => {
    MockStaffProvider.checkInPatient(id);
    loadData();
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to mark this appointment as cancelled?')) {
      MockStaffProvider.updateAppointmentStatus(id, 'Cancelled');
      loadData();
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = searchTerm.trim() === '' || 
        a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.mobile.includes(searchTerm) ||
        a.tokenDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.abhaId && a.abhaId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchDept = deptFilter === 'All' || a.opdDepartment === deptFilter;

      return matchSearch && matchStatus && matchDept;
    });
  }, [appointments, searchTerm, statusFilter, deptFilter]);

  const departments = ['All', 'General OPD', 'Ayurveda', 'Orthopedics', 'Pediatrics', 'Gynecology'];
  const statuses = ['All', 'Scheduled', 'Checked In', 'Waiting', 'In Consultation', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-800" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Appointment Schedule</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage scheduled patient visits, token allocation, arrivals, and cancellations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/staff/register')}
            className="h-9 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-2 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient Name, Token #, Mobile, or ABHA..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d}>Specialty: {d}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s} value={s}>Status: {s}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Status Quick Counts Pill Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Quick Filter:</span>
          {['All', 'Scheduled', 'Checked In', 'Waiting', 'In Consultation', 'Completed'].map(st => {
            const count = st === 'All' ? appointments.length : appointments.filter(a => a.status === st).length;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-teal-900 text-teal-100' : 'bg-white text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Token</th>
                <th className="py-3.5 px-4">Patient Details</th>
                <th className="py-3.5 px-4">Doctor & Room</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {a.appointmentTime}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      {a.tokenDisplay}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{a.patientName}</p>
                      <p className="text-[10px] text-slate-500">{a.age}y • {a.gender} • {a.mobile}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{a.doctorName}</p>
                      <p className="text-[10px] text-slate-500">{a.opdDepartment} • {a.roomNumber}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {a.appointmentType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {a.status === 'Scheduled' && (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Scheduled
                        </span>
                      )}
                      {a.status === 'Checked In' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Checked In
                        </span>
                      )}
                      {a.status === 'Waiting' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Waiting ({a.waitingMinutes}m)
                        </span>
                      )}
                      {a.status === 'In Consultation' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          In Consult.
                        </span>
                      )}
                      {a.status === 'Completed' && (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Completed
                        </span>
                      )}
                      {a.status === 'Cancelled' && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === 'Scheduled' && (
                          <button
                            onClick={() => handleCheckIn(a.id)}
                            className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Check In</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => navigate(`/staff/movement?patientId=${a.id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Movement
                        </button>

                        {a.status === 'Scheduled' && (
                          <button
                            onClick={() => handleCancel(a.id)}
                            title="Cancel Appointment"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No matching appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>Showing {filteredAppointments.length} appointment records</span>
          <span>Hospital Shift 08:00 - 16:00</span>
        </div>
      </div>

    </div>
  );
}
