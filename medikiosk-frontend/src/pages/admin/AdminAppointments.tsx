import { useState } from 'react';
import { 
  Calendar, CheckCircle2, 
  XCircle, AlertCircle, Filter, Download
} from 'lucide-react';

export default function AdminAppointments() {
  const [selectedOpd, setSelectedOpd] = useState('All');

  const stats = {
    total: 542,
    completed: 456,
    completedPct: 84.1,
    pending: 48,
    pendingPct: 8.9,
    cancelled: 24,
    cancelledPct: 4.4,
    noShow: 14,
    noShowPct: 2.6,
  };

  const channelBreakdown = [
    { channel: 'Online Patient Web Portal', count: 228, percentage: 42 },
    { channel: 'Front-Desk / Kiosk Walk-in Booking', count: 195, percentage: 36 },
    { channel: 'Physician & Tele-referral', count: 119, percentage: 22 },
  ];

  const appointmentSummaryRows = [
    { opd: 'General OPD', total: 180, completed: 152, pending: 16, cancelled: 8, noShow: 4, adherence: '84.4%' },
    { opd: 'Pediatrics', total: 95, completed: 83, pending: 7, cancelled: 3, noShow: 2, adherence: '87.3%' },
    { opd: 'Ayurveda OPD', total: 84, completed: 72, pending: 8, cancelled: 3, noShow: 1, adherence: '85.7%' },
    { opd: 'Orthopedics', total: 72, completed: 59, pending: 7, cancelled: 4, noShow: 2, adherence: '81.9%' },
    { opd: 'ENT Clinic', total: 45, completed: 37, pending: 4, cancelled: 3, noShow: 1, adherence: '82.2%' },
    { opd: 'Dermatology', total: 40, completed: 33, pending: 4, cancelled: 2, noShow: 1, adherence: '82.5%' },
    { opd: 'Gynecology & Antenatal', total: 26, completed: 20, pending: 2, cancelled: 1, noShow: 3, adherence: '76.9%' },
  ];

  const filteredRows = selectedOpd === 'All' 
    ? appointmentSummaryRows 
    : appointmentSummaryRows.filter(r => r.opd === selectedOpd);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointment Analytics &amp; Adherence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hospital scheduling efficiency, no-show trends, and slot completion rates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting appointments summary report CSV...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Schedule Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Scheduled</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <p className="text-[11px] text-slate-500 mt-1">Booked across all sessions</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{stats.completed} <span className="text-xs font-normal text-emerald-700">({stats.completedPct}%)</span></div>
          <p className="text-[11px] text-emerald-700 mt-1">Attended consultation</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-2xl font-bold text-rose-800">{stats.cancelled} <span className="text-xs font-normal text-rose-700">({stats.cancelledPct}%)</span></div>
          <p className="text-[11px] text-rose-700 mt-1">Cancelled prior to slot</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>No-Show Rate</span>
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.noShow} <span className="text-xs font-normal text-amber-700">({stats.noShowPct}%)</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Did not report to check-in</p>
        </div>
      </div>

      {/* 2-Column: Booking Channels & Slot Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Booking Channels */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Booking Channels</h2>
            <p className="text-[11px] text-slate-500">Distribution of intake channels used by patients</p>
          </div>

          <div className="space-y-4">
            {channelBreakdown.map((item) => (
              <div key={item.channel} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.channel}</span>
                  <span className="font-bold text-slate-900">{item.count} slots ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-700 h-2 rounded-full"
                    style={{ width: `${item.percentage * 2}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Attendance Quality Note */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-3 pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Appointment Adherence Standard</h2>
              <p className="text-[11px] text-slate-500">Quality benchmarks and SLA performance</p>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Hospital OPD scheduling adheres to a <strong>15-minute staggered time slot</strong> system. 84.1% of patients complete their consultation within 30 minutes of scheduled arrival.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Average Time to Check-in:</span>
                  <span className="text-slate-900 font-mono">6 min before slot</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Average Delay on Doctor Call:</span>
                  <span className="text-slate-900 font-mono">11 min past slot</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Auto-reminder SMS Delivered:</span>
            <span className="font-mono font-bold text-teal-800">96.8% Success</span>
          </div>
        </div>
      </div>

      {/* OPD-wise Appointment Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">OPD Department Appointment Breakdown</h2>
            <p className="text-[11px] text-slate-500">Scheduled vs completed consultations by clinical specialty</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedOpd}
              onChange={(e) => setSelectedOpd(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All OPDs</option>
              {appointmentSummaryRows.map(r => (
                <option key={r.opd} value={r.opd}>{r.opd}</option>
              ))}
            </select>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Scheduled</th>
              <th className="py-3 px-4">Completed</th>
              <th className="py-3 px-4">Pending</th>
              <th className="py-3 px-4">Cancelled</th>
              <th className="py-3 px-4">No-Show</th>
              <th className="py-3 px-4">Adherence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRows.map((row) => (
              <tr key={row.opd} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{row.opd}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.total}</td>
                <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{row.completed}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{row.pending}</td>
                <td className="py-3 px-4 font-mono text-rose-700">{row.cancelled}</td>
                <td className="py-3 px-4 font-mono text-amber-700">{row.noShow}</td>
                <td className="py-3 px-4 font-mono font-bold text-teal-800">{row.adherence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
