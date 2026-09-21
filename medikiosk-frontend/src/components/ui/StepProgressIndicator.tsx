import React from 'react';

interface StepProgressIndicatorProps {
  current: number;
  total: number;
  title: React.ReactNode;
  badge?: React.ReactNode;
}

export function StepProgressIndicator({ current, total, title, badge }: StepProgressIndicatorProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  
  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 select-none">
      <div className="flex items-center gap-4 max-w-5xl mx-auto w-full">
        <div className="w-8 h-8 rounded-xl bg-mediblue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
          {current}
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex justify-between items-center text-xs font-bold text-navy-900 tracking-wider">
            <span className="flex items-center gap-2">
              <span className="text-slate-500 uppercase">Step {current} of {total}</span>
              <span className="text-slate-300">•</span>
              <span className="font-extrabold text-navy-900">{title}</span>
            </span>
            {badge && (
              <span className="bg-blue-50 text-mediblue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                {badge}
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
            <div 
              className="bg-gradient-to-r from-mediblue-600 to-sky-500 h-full transition-all duration-400 ease-out rounded-full" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
