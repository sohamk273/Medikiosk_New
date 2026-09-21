import { useState } from 'react';
import { 
  Stethoscope, Clock, Users, 
  Search, Filter
} from 'lucide-react';
import { MockAdminAnalyticsProvider } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminDoctorPerformance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  const doctors = MockAdminAnalyticsProvider.getDoctorPerformance();

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(doctors.map(d => d.department)));

  const totalConsultations = doctors.reduce((acc, curr) => acc + curr.consultationsToday, 0);
  const avgDuration = Math.round(
    doctors.reduce((acc, curr) => acc + curr.averageConsultationMinutes, 0) / doctors.length
  );
  const activeNow = doctors.filter(d => d.status === 'In Consultation' || d.status === 'Available').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Doctor &amp; Physician Roster Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational consultation metrics, room occupancy, and duty roster status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {activeNow} Active on Duty
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Roster Active</span>
            <Stethoscope className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{doctors.length} Doctors</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 7 OPD departments</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Consultations Concluded</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{totalConsultations}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Total completed patient encounters</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Avg Examination Time</span>
            <Clock className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgDuration} min</div>
          <p className="text-[11px] text-slate-500 mt-1">Standard clinical benchmark: 12-18 min</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Current In-Consultation</span>
            <Clock className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {doctors.filter(d => d.status === 'In Consultation').length} Active
          </div>
          <p className="text-[11px] text-blue-700 mt-1">Currently examining patients</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Doctor Name, Room, Specialty..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Doctor</th>
              <th className="py-3 px-4">Department &amp; Room</th>
              <th className="py-3 px-4">Consultations Today</th>
              <th className="py-3 px-4">Avg Consultation Duration</th>
              <th className="py-3 px-4">Queue Depth</th>
              <th className="py-3 px-4">Roster Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredDoctors.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-[10px]">
                    {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p>{doc.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">ID: {doc.id}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-800">{doc.department}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{doc.roomNumber}</p>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{doc.consultationsToday} pts</td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-700">{doc.averageConsultationMinutes} min</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200">
                    {doc.waitingQueueCount} Waiting
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    doc.status === 'In Consultation'
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : doc.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : doc.status === 'On Break'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
