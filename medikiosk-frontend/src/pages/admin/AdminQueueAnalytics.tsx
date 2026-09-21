import { useState } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, 
  Users, Filter
} from 'lucide-react';
import { MockAdminAnalyticsProvider } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminQueueAnalytics() {
  const [selectedShift, setSelectedShift] = useState('All Shifts');
  const opdDist = MockAdminAnalyticsProvider.getOpdDistribution();

  const hourlyWait = [
    { hour: '08:00 AM', avgWait: 8, queueLength: 14 },
    { hour: '09:00 AM', avgWait: 14, queueLength: 28 },
    { hour: '10:00 AM', avgWait: 26, queueLength: 42 },
    { hour: '11:00 AM', avgWait: 28, queueLength: 48 },
    { hour: '12:00 PM', avgWait: 21, queueLength: 34 },
    { hour: '01:00 PM', avgWait: 15, queueLength: 20 },
    { hour: '02:00 PM', avgWait: 11, queueLength: 16 },
    { hour: '03:00 PM', avgWait: 9, queueLength: 12 },
    { hour: '04:00 PM', avgWait: 7, queueLength: 8 },
  ];

  const maxWait = Math.max(...opdDist.map(o => o.avgWaitTime));
  const maxHourlyWait = Math.max(...hourlyWait.map(h => h.avgWait));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Queue &amp; Waiting Time Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time waiting duration benchmarks, peak queue congestion curves, and room bottlenecks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option>All Shifts (Full Day)</option>
            <option>Morning Shift (08:00 - 14:00)</option>
            <option>Evening Shift (14:00 - 20:00)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Overall Avg Wait</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">18.2 <span className="text-xs font-normal text-slate-500">min</span></div>
          <p className="text-[11px] text-slate-500 mt-1">From token issue to consultation</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Fastest OPD</span>
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800">11 min</div>
          <p className="text-[11px] text-teal-700 mt-1">Dermatology Clinic</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Peak Congestion Wait</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800">28 min</div>
          <p className="text-[11px] text-amber-700 mt-1">Occurs 11:00 AM – 11:30 AM</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Queue SLA Adherence</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">92.4%</div>
          <p className="text-[11px] text-emerald-700 mt-1">Seen within &lt; 30 min benchmark</p>
        </div>
      </div>

      {/* 2-Column: Department Wait Comparison & Hourly Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department Average Wait Times */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Average Wait Time by Department</h2>
            <p className="text-[11px] text-slate-500">Benchmark target: &le; 20 minutes across all services</p>
          </div>

          <div className="space-y-3.5">
            {opdDist.map((item) => {
              const barWidth = Math.round((item.avgWaitTime / maxWait) * 100);
              const isOverBenchmark = item.avgWaitTime > 20;

              return (
                <div key={item.department} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.department}</span>
                    <span className={`font-mono font-bold ${isOverBenchmark ? 'text-amber-800' : 'text-slate-900'}`}>
                      {item.avgWaitTime} min
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isOverBenchmark ? 'bg-amber-600' : 'bg-teal-700'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Congestion Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Hourly Waiting Profile &amp; Queue Depth</h2>
            <p className="text-[11px] text-slate-500">Average patient wait time per arrival hour</p>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-2">
            {hourlyWait.map((h) => {
              const heightPct = Math.round((h.avgWait / maxHourlyWait) * 100);
              const isPeak = h.avgWait === maxHourlyWait;

              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <span className="text-[10px] font-mono font-bold text-slate-700 mb-1">{h.avgWait}m</span>
                  <div className="w-full max-w-[24px] bg-slate-100 rounded-t-sm h-full flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 ${
                        isPeak ? 'bg-amber-600' : 'bg-slate-700'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-2 font-mono whitespace-nowrap">{h.hour.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue SLA & Threshold Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Department Queue Clearance &amp; SLA Breakdown</h2>
          <p className="text-[11px] text-slate-500">Detailed adherence statistics for front-desk monitoring</p>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Avg Wait</th>
              <th className="py-3 px-4">&lt; 15 min (% of Pts)</th>
              <th className="py-3 px-4">15 – 30 min</th>
              <th className="py-3 px-4">&gt; 30 min (Breaches)</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {opdDist.map((opd) => {
              const under15 = Math.max(20, Math.round(100 - opd.avgWaitTime * 3));
              const breaches = opd.avgWaitTime > 20 ? 4 : opd.avgWaitTime > 15 ? 2 : 0;
              const midRange = 100 - under15 - (breaches > 0 ? 5 : 2);

              return (
                <tr key={opd.department} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{opd.department}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{opd.avgWaitTime} min</td>
                  <td className="py-3 px-4 font-mono text-teal-800 font-semibold">{under15}%</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{midRange}%</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-700">{breaches} pts</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      breaches === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {breaches === 0 ? 'Optimal' : 'Attention'}
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
