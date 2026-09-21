import { useState } from 'react';
import { 
  Bell, AlertTriangle, Clock, 
  CheckCircle2, UserCheck, Stethoscope, 
  Filter
} from 'lucide-react';
import { MockStaffProvider, type StaffAlertItem } from '@/services/staff/MockStaffProvider';

export default function StaffAlerts() {
  const [alerts, setAlerts] = useState<StaffAlertItem[]>(MockStaffProvider.getAlerts());
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const handleResolve = (id: string) => {
    MockStaffProvider.resolveAlert(id);
    setAlerts(MockStaffProvider.getAlerts());
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'active') return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true;
  });

  const activeCount = alerts.filter(a => !a.resolved).length;
  const resolvedCount = alerts.filter(a => a.resolved).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Notifications &amp; Alerts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time front-desk queue delays, doctor roster updates, and document verification flags
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {activeCount} Active Issues Pending
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{activeCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Requires reception desk attention</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Doctor Delays</span>
            <Stethoscope className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {alerts.filter(a => a.type === 'doctor' && !a.resolved).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">OPD consultations starting later than schedule</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Resolved Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{resolvedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Handled during morning shift</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter view:</span>
          {(['all', 'active', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'all' ? 'All Alerts' : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">Auto-refresh active</span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No operational alerts found</p>
            <p className="text-xs text-slate-500 mt-1">All OPD front-desk operations and doctor schedules are flowing smoothly.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-colors bg-white shadow-2xs ${
                alert.resolved
                  ? 'border-slate-200 opacity-60'
                  : alert.severity === 'high'
                  ? 'border-rose-200 bg-rose-50/20'
                  : alert.severity === 'medium'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    alert.severity === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : alert.severity === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {alert.type === 'doctor' && <Stethoscope className="w-4 h-4" />}
                    {alert.type === 'delay' && <Clock className="w-4 h-4" />}
                    {alert.type === 'document' && <UserCheck className="w-4 h-4" />}
                    {alert.type === 'capacity' && <AlertTriangle className="w-4 h-4" />}
                    {alert.type === 'token' && <Bell className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{alert.title}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full border border-slate-200">
                        {alert.department}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : alert.severity === 'medium'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}>
                        {alert.severity} priority
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">Logged at {alert.timestamp}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {alert.resolved ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      Acknowledge &amp; Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
