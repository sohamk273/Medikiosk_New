import { useState } from 'react';
import { 
  Users, CheckCircle2, Clock, 
  Stethoscope, Activity
} from 'lucide-react';
import { MockAdminAnalyticsProvider } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  
  const kpi = MockAdminAnalyticsProvider.getKpiMetrics();
  const opdDist = MockAdminAnalyticsProvider.getOpdDistribution();
  const hourlyLoad = MockAdminAnalyticsProvider.getHourlyLoad();
  const diseaseCategories = MockAdminAnalyticsProvider.getDiseaseCategories();
  const recentLogs = MockAdminAnalyticsProvider.getAuditLogs().slice(0, 5);

  const maxOpdPatients = Math.max(...opdDist.map(d => d.count));
  const maxHourlyPatients = Math.max(...hourlyLoad.map(h => h.patients));

  return (
    <div className="space-y-6">
      {/* Top Header Banner & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Executive &amp; Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hospital-wide OPD patient throughput, live queue distribution, clinical trends, and doctor roster metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {(['today', 'yesterday', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  dateRange === range
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : range === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Level KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Patients</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.totalPatients.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-1">Hospital-wide registrations</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Completed Visits</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.consultationsCompleted.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">73% of daily total</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Completion Rate</span>
            <Activity className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.appointmentCompletionRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Scheduled vs attended</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Avg Wait Time</span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.averageWaitingTimeMinutes} <span className="text-xs font-normal text-slate-500">min</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Check-in to doctor call</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Avg Consultation</span>
            <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.averageConsultationMinutes} <span className="text-xs font-normal text-slate-500">min</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Clinical examination time</p>
        </div>
      </div>

      {/* Live Hospital Operations Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Hospital Status</h2>
            <p className="text-sm font-bold text-white">Central OPD Complex &amp; Specialized Wings</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs flex-wrap">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">In Hospital</span>
            <span className="font-bold text-base text-white">47</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Waiting in Lobby</span>
            <span className="font-bold text-base text-amber-400">12</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">In Consultation</span>
            <span className="font-bold text-base text-teal-400">5</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Active Doctors</span>
            <span className="font-bold text-base text-white">18</span>
          </div>
        </div>
      </div>

      {/* Main Analytical Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: OPD Distribution & Hourly Load (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* OPD Distribution - Horizontal Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Patients by OPD Department</h2>
                <p className="text-[11px] text-slate-500">Distribution of patient volume across all active wings</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">Total: 1,284</span>
            </div>

            <div className="space-y-3">
              {opdDist.map((item) => {
                const barWidth = Math.round((item.count / maxOpdPatients) * 100);
                return (
                  <div key={item.department} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.department}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-normal">{item.avgWaitTime}m avg wait</span>
                        <span className="font-bold text-slate-900">{item.count} pts ({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-teal-700 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Patient Load Histogram */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Hourly Patient Volume (08:00 - 17:00)</h2>
                <p className="text-[11px] text-slate-500">Peak arrival hours at registration kiosks &amp; front-desk</p>
              </div>
              <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Peak: 10:00 - 11:00 AM
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-2">
              {hourlyLoad.map((item) => {
                const heightPercent = Math.round((item.patients / maxHourlyPatients) * 100);
                const isPeak = item.patients === maxHourlyPatients;

                return (
                  <div key={item.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                      {item.patients} patients
                    </div>

                    <span className="text-[10px] font-bold text-slate-700 mb-1">{item.patients}</span>
                    <div className="w-full max-w-[28px] bg-slate-100 rounded-t-sm h-full flex items-end">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          isPeak ? 'bg-teal-800' : 'bg-slate-700'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 font-mono">{item.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Patient Journey Funnel, Disease Categories & Audit Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Patient Journey Progression Flow */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Average Patient Journey Time</h2>
              <p className="text-[11px] text-slate-500">End-to-end OPD turnaround velocity</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[11px]">1</span>
                  <span className="font-semibold text-slate-800">Registration → Check-in</span>
                </div>
                <span className="font-mono font-bold text-slate-900">4 min</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-[11px]">2</span>
                  <span className="font-semibold text-slate-800">Check-in → Doctor Call</span>
                </div>
                <span className="font-mono font-bold text-amber-900">18 min</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-teal-50/50 rounded-lg border border-teal-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-200 text-teal-900 font-bold flex items-center justify-center text-[11px]">3</span>
                  <span className="font-semibold text-slate-800">Doctor Consultation</span>
                </div>
                <span className="font-mono font-bold text-teal-900">14 min</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-[11px]">4</span>
                  <span className="font-semibold text-slate-800">Diagnostics / Pharmacy → Exit</span>
                </div>
                <span className="font-mono font-bold text-emerald-900">8 min</span>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-100">
                <span>Total Average Visit Duration</span>
                <span className="font-mono text-sm text-teal-800">44 min</span>
              </div>
            </div>
          </div>

          {/* Disease / Clinical Categories Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Clinical Case Categories</h2>
                <p className="text-[11px] text-slate-500">Aggregated diagnosis distribution</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {diseaseCategories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="block text-[10px] text-slate-400">{cat.commonCases}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-900">{cat.count}</span>
                    <span className="text-[10px] text-slate-400 block">({cat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Governance Audit Log Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Operational Activity</h2>
              <span className="text-[11px] text-slate-400 font-mono">Live Feed</span>
            </div>

            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="text-xs flex items-start gap-2.5 pb-2 border-b border-slate-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 font-semibold truncate">
                      {log.action} <span className="font-normal text-slate-500">— {log.entity}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{log.actorName} ({log.actorRole})</span>
                      <span>•</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
