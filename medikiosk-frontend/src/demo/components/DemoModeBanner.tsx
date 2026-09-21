import React from 'react';
import { Sparkles, Activity, RefreshCw, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

export const DemoModeBanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isDemoMode,
    setDemoMode,
    resetDemoData,
    setIsDemoScannerOpen,
  } = useDemoIntelligence();

  if (!isDemoMode) {
    return (
      <div className="bg-slate-800 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-700 select-none z-50">
        <span className="font-medium text-[11px]">Production Baseline Mode Active</span>
        <button
          type="button"
          onClick={() => setDemoMode(true)}
          className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 text-[11px] underline cursor-pointer"
        >
          <Sparkles className="w-3 h-3" /> Enable Hackathon Demo Intelligence Mode
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Demo Mode Controls" className="bg-gradient-to-r from-navy-950 via-slate-900 to-mediblue-950 text-white px-3 sm:px-6 py-2 border-b border-teal-500/40 shadow-lg relative z-40 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Indicator & Mode Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="font-extrabold text-[11px] tracking-wide">DEMO INTELLIGENCE MODE</span>
          </div>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            Rajesh Sharma (52M) • Token #42
          </span>
        </div>

        {/* Center: Direct Navigation Fast-Jumps */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/patient/voice')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${location.pathname.startsWith('/patient')
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Patient Kiosk Flow</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/doctor/30s-view')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${location.pathname === '/doctor/30s-view'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-teal-900/60 hover:bg-teal-900/80 text-teal-200 border border-teal-500/40'
              }`}
          >
            <Zap className="w-3.5 h-3.5 text-teal-300" />
            <span>30-Sec Doctor View</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDemoScannerOpen(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            <span>Scan Mock Doc</span>
          </button>
        </div>

        {/* Right: Reset & Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetDemoData}
            title="Reset demo case back to baseline"
            className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoMode(false)}
            className="text-[10px] text-slate-400 hover:text-rose-300 px-1.5 py-0.5 rounded cursor-pointer"
          >
            Disable
          </button>
        </div>
      </div>
    </aside>
  );
};
