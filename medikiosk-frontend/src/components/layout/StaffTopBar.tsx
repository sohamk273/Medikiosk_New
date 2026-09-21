import { useState } from 'react';
import { Search, Bell, RefreshCw, User, LogOut, Clock } from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';

export function StaffTopBar() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Patient Name, Mobile, ABHA ID, or Token #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {/* Desk & Shift Info */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-teal-700" />
          <span>Reception Desk 02 • Morning Shift</span>
        </div>

        {/* Date */}
        <div className="hidden md:block text-xs font-medium text-slate-500 bg-slate-50/70 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          21 Sep 2026
        </div>

        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Action icons */}
        <div className="flex items-center gap-1.5 ml-1">
          <button className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          </button>

          <button className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-lg bg-teal-800 hover:bg-teal-900 flex items-center justify-center text-white shadow-2xs transition-colors ml-1"
              title="Staff Profile"
            >
              <User className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as Staff</p>
                    <p className="font-bold text-slate-800 text-sm">Ananya Deshmukh</p>
                    <p className="text-xs text-slate-500">Reception Desk 02</p>
                  </div>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
