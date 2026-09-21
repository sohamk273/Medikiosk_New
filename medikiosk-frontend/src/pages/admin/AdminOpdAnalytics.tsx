import { useState } from 'react';
import { 
  BarChart3, Stethoscope, Clock, 
  Building, Filter
} from 'lucide-react';
import { MockAdminAnalyticsProvider } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminOpdAnalytics() {
  const [filterOpd, setFilterOpd] = useState('All');
  const opdList = MockAdminAnalyticsProvider.getOpdDistribution();

  const filteredList = filterOpd === 'All' 
    ? opdList 
    : opdList.filter(o => o.department === filterOpd);

  const totalPatients = opdList.reduce((acc, curr) => acc + curr.count, 0);
  const avgHospitalWait = Math.round(opdList.reduce((acc, curr) => acc + curr.avgWaitTime, 0) / opdList.length);
  const avgUtilization = Math.round(opdList.reduce((acc, curr) => acc + curr.utilization, 0) / opdList.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">OPD Department &amp; Clinic Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capacity utilization, doctor allocation, and patient queue metrics across all clinical wings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterOpd}
            onChange={(e) => setFilterOpd(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="All">All Departments ({opdList.length})</option>
            {opdList.map((opd) => (
              <option key={opd.department} value={opd.department}>{opd.department}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total OPD Patients</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalPatients.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 7 specialized wings</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Average Utilization</span>
            <BarChart3 className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800">{avgUtilization}%</div>
          <p className="text-[11px] text-teal-700 mt-1">Nominal operational threshold</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Hospital Avg Wait</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgHospitalWait} min</div>
          <p className="text-[11px] text-slate-500 mt-1">From token to consultation</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Active Doctors</span>
            <Stethoscope className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">18 Doctors</div>
          <p className="text-[11px] text-slate-500 mt-1">On duty this morning shift</p>
        </div>
      </div>

      {/* Main Department Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">OPD Department Operational Metrics</h2>
            <p className="text-[11px] text-slate-500">Real-time throughput, capacity thresholds, and average consultation times</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Synced</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Department / Wing</th>
              <th className="py-3 px-4">Patients Today</th>
              <th className="py-3 px-4">Share (%)</th>
              <th className="py-3 px-4">Active Doctors</th>
              <th className="py-3 px-4">Capacity Load</th>
              <th className="py-3 px-4">Avg Wait</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredList.map((opd) => {
              const isHigh = opd.utilization >= 85;
              const isMedium = opd.utilization >= 70 && opd.utilization < 85;

              return (
                <tr key={opd.department} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{opd.department}</p>
                    <p className="text-[10px] text-slate-400">Wing {opd.department.slice(0, 3).toUpperCase()}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{opd.count}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{opd.percentage}%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                      {opd.activeDoctors} On Duty
                    </span>
                  </td>
                  <td className="py-3 px-4 w-48">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">{opd.count} / {opd.capacity} slots</span>
                        <span className={`font-bold ${isHigh ? 'text-amber-700' : 'text-slate-800'}`}>{opd.utilization}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            isHigh ? 'bg-amber-600' : isMedium ? 'bg-teal-700' : 'bg-slate-700'
                          }`}
                          style={{ width: `${opd.utilization}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">{opd.avgWaitTime} min</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isHigh
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isHigh ? 'High Load' : 'Normal Flow'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
