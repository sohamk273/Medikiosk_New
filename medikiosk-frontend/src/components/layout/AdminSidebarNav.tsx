import { 
  LayoutDashboard, Users, BarChart3, Calendar, Clock, 
  Stethoscope, UserCheck, Activity, FileText, FileScan, 
  ShieldCheck, ScrollText, Settings, LogOut 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/patients', label: 'Patient Analytics', icon: Users },
  { path: '/admin/opd-analytics', label: 'OPD Analytics', icon: BarChart3 },
  { path: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { path: '/admin/queue-analytics', label: 'Queue & Waiting Time', icon: Clock },
  { path: '/admin/doctors', label: 'Doctor Performance', icon: Stethoscope },
  { path: '/admin/staff-operations', label: 'Staff Operations', icon: UserCheck },
  { path: '/admin/clinical-trends', label: 'Disease / Clinical Trends', icon: Activity },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/records', label: 'Documents & Records', icon: FileScan },
  { path: '/admin/users', label: 'User & Role Management', icon: ShieldCheck },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { path: '/admin/settings', label: 'Hospital Settings', icon: Settings },
];

export function AdminSidebarNav() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-xs">
            ADM
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-slate-900">MediKiosk</h1>
            <p className="text-xs font-medium text-slate-500">Admin Governance Console</p>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
          Hospital Administration
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-3">
          {adminNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3.5 border-t border-slate-200">
        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
              RV
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Rajesh Varma</p>
              <p className="text-[10px] text-slate-500 truncate">Hospital Administrator</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
