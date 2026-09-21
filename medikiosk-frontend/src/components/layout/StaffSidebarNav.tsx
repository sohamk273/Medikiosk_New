import { 
  LayoutDashboard, UserPlus, Calendar, Users, 
  CheckSquare, ArrowRightLeft, FileScan, CreditCard, Bell, Settings, LogOut 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const staffNavItems = [
  { path: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/staff/register', label: 'Patient Registration', icon: UserPlus },
  { path: '/staff/appointments', label: 'Appointments', icon: Calendar },
  { path: '/staff/queue', label: 'OPD Queue', icon: Users },
  { path: '/staff/check-in', label: 'Patient Check-In', icon: CheckSquare },
  { path: '/staff/movement', label: 'Patient Movement', icon: ArrowRightLeft },
  { path: '/staff/documents', label: 'Documents', icon: FileScan },
  { path: '/staff/billing', label: 'Payments & Billing', icon: CreditCard },
  { path: '/staff/alerts', label: 'Notifications', icon: Bell },
  { path: '/staff/settings', label: 'Hospital Settings', icon: Settings },
];

export function StaffSidebarNav() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center font-bold text-teal-800">MK</div>
          <div>
            <h1 className="font-bold text-base leading-tight text-slate-900">MediKiosk</h1>
            <p className="text-xs font-medium text-slate-500">Staff Operations Portal</p>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          EMR Connected
        </div>
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Synced</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-3">
          {staffNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                      ? 'bg-primary text-white font-bold shadow-2xs'
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
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Ananya Deshmukh</p>
              <p className="text-[10px] text-slate-500 truncate">Reception Desk 02</p>
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
