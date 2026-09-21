import { LayoutDashboard, Users, FileText, Activity, FileScan, ClipboardList, Settings, LogOut, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/doctor/30s-view', label: '30-Sec Doctor View', icon: Zap },
  { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/doctor/queue', label: 'Patient Queue', icon: Users },
  { path: '/doctor/cases', label: 'Patient Cases', icon: FileText },
  { path: '/doctor/ayush', label: 'AYUSH Assessments', icon: Activity },
  { path: '/doctor/documents', label: 'Documents & OCR', icon: FileScan },
  { path: '/doctor/reports', label: 'Clinical Reports', icon: ClipboardList },
  { path: '/doctor/settings', label: 'Hospital Settings', icon: Settings },
];

export function SidebarNav() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center font-bold">MK</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">MediKiosk</h1>
            <p className="text-xs font-medium text-slate-500">EMR OPD Suite</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          NIC EMR Connected
        </div>
        <span className="text-xs text-primary font-medium">Synced</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) && item.path !== '#';
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              PS
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Dr. Priya Sharma</p>
              <p className="text-xs text-slate-500">MD (Ayu) • Room 4</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
