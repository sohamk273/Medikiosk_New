import { useState } from 'react';
import { 
  UserCheck, Users, Clock, 
  Search, Building
} from 'lucide-react';
import { MockAdminAnalyticsProvider } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminStaffOperations() {
  const [searchTerm, setSearchTerm] = useState('');
  const staffList = MockAdminAnalyticsProvider.getStaffOperations();

  const filteredStaff = staffList.filter((s) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.counter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHandled = staffList.reduce((acc, curr) => acc + curr.patientsHandledToday, 0);
  const avgCheckinSec = Math.round(staffList.reduce((acc, curr) => acc + curr.averageCheckInSeconds, 0) / staffList.length);
  const activeStaff = staffList.filter(s => s.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Operations &amp; Front-Desk Throughput</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Reception counter efficiency, check-in velocity, and shift roster management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {activeStaff} Front-Desk Desks Operational
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Operational Staff</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{staffList.length} Operators</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 6 hospital service desks</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Patients Processed</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{totalHandled}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Assisted check-ins &amp; registrations</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Avg Check-In Time</span>
            <Clock className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgCheckinSec} sec</div>
          <p className="text-[11px] text-slate-500 mt-1">Per assisted patient encounter</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Self-Kiosk Share</span>
            <Building className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-blue-800">58.2%</div>
          <p className="text-[11px] text-blue-700 mt-1">Autonomous kiosk completions</p>
        </div>
      </div>

      {/* Main Staff Operations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff, counter, or desk role..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">Morning Shift Active</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Counter / Desk</th>
              <th className="py-3 px-4">Role &amp; Responsibility</th>
              <th className="py-3 px-4">Shift</th>
              <th className="py-3 px-4">Patients Handled</th>
              <th className="py-3 px-4">Avg Check-in Velocity</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-[10px]">
                    {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p>{staff.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">ID: {staff.id}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{staff.counter}</td>
                <td className="py-3 px-4 text-slate-600">{staff.role}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{staff.shift}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{staff.patientsHandledToday} pts</td>
                <td className="py-3 px-4 font-mono font-semibold text-teal-800">{staff.averageCheckInSeconds} sec</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    staff.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : staff.status === 'On Break'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {staff.status}
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
