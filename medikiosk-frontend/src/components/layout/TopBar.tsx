import { useState } from 'react';
import { Search, Bell, RefreshCw, User, LogOut, Building2 } from 'lucide-react';
import { useDoctorAuth } from '@/features/auth/DoctorAuthContext';
import { RoleSwitcher } from './RoleSwitcher';

export function TopBar() {
  const { user, logout } = useDoctorAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ABHA ID, Token #, or Patient Name (Press / to search)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <div className="bg-slate-50 text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-200">
          <Building2 className="w-3.5 h-3.5 text-teal-700" />
          <span>OPD Room 4 - {user?.display_name || 'Dr. Priya Sharma, MD (Ayu)'}</span>
        </div>

        <RoleSwitcher />

        <div className="flex items-center gap-2 ml-2 relative">
          <button className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-white"></span>
          </button>

          <button className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user?.display_name || 'Doctor Account'}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white ml-2 shadow-sm transition-colors"
          >
            <User className="w-5 h-5" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Signed in as</p>
                <p className="font-bold text-slate-800 truncate">{user?.display_name || 'Dr. Priya Sharma'}</p>
                <p className="text-xs text-slate-500 truncate font-mono">{user?.username}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
