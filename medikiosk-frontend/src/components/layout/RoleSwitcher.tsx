import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, UserCheck, Shield, ChevronDown } from 'lucide-react';

export function RoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const currentRole = location.pathname.startsWith('/admin')
    ? 'Admin'
    : location.pathname.startsWith('/staff')
    ? 'Staff'
    : 'Doctor';

  const roles = [
    {
      id: 'doctor',
      name: 'Doctor Portal',
      subtitle: 'Dr. Priya Sharma • OPD Room 4',
      path: '/doctor/queue',
      icon: Stethoscope,
      badge: 'Clinical',
    },
    {
      id: 'staff',
      name: 'Staff Portal',
      subtitle: 'Reception Desk 02 • Front Desk',
      path: '/staff/dashboard',
      icon: UserCheck,
      badge: 'Operations',
    },
    {
      id: 'admin',
      name: 'Admin Console',
      subtitle: 'Chief Hospital Administrator',
      path: '/admin/dashboard',
      icon: Shield,
      badge: 'Governance',
    },
  ];

  const handleSelectRole = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        title="Switch Portal Role"
      >
        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
        <span className="font-bold text-slate-800">{currentRole} View</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Role Access</p>
              <p className="text-xs text-slate-600">Switch workspace views</p>
            </div>
            <div className="space-y-1">
              {roles.map((r) => {
                const isSelected = currentRole.toLowerCase() === r.id;
                const Icon = r.icon;

                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold">{r.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{r.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase">
                      {r.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
