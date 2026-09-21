import { useState } from 'react';
import { 
  Search, Filter, 
  Download, CheckCircle2, AlertTriangle, 
  XCircle, ShieldCheck
} from 'lucide-react';
import { MockAdminAnalyticsProvider, type AdminAuditLog } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminAuditLogs() {
  const [logs] = useState<AdminAuditLog[]>(MockAdminAnalyticsProvider.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Doctor' | 'Staff' | 'Admin' | 'System'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Warning' | 'Failed'>('All');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || log.actorRole === roleFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital EMR Audit Logs &amp; Security Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable trace of all patient check-ins, consultation notes, document accesses, and administrative changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting full EMR immutable audit log CSV...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <p className="text-xs text-slate-600">
            <strong>EHR Standards &amp; DISHA Compliance:</strong> All access events are cryptographically stamped with role identifiers, network origin, and UTC timestamps.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase whitespace-nowrap">
          Log Retention: 7 Years
        </span>
      </div>

      {/* Main Table Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search action, actor, entity, department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Doctor">Doctors</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admins</option>
              <option value="System">System</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Log ID &amp; Time</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Action Event</th>
              <th className="py-3 px-4">Target Entity</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No audit log records match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-slate-800">{log.id}</span>
                    <span className="block text-[10px] text-slate-400">{log.timestamp}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.actorName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.actorRole === 'Admin'
                        ? 'bg-slate-900 text-white'
                        : log.actorRole === 'Doctor'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : log.actorRole === 'Staff'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{log.entity}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{log.department}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      log.status === 'Success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : log.status === 'Warning'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {log.status === 'Success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {log.status === 'Warning' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {log.status === 'Failed' && <XCircle className="w-3 h-3 text-rose-600" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
