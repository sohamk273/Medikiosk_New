import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

interface Props {
  compact?: boolean;
}

export const CompletenessMeter: React.FC<Props> = ({ compact = false }) => {
  const { completeness, setIsQuickClarifyOpen } = useDemoIntelligence();
  const { score, completedFieldsCount, totalFieldsCount, missingFields } = completeness;

  const unresolvedCount = missingFields.filter((f) => !f.resolved).length;

  const getScoreColor = () => {
    if (score >= 95) return 'from-emerald-500 to-teal-600 text-emerald-700 border-emerald-300';
    if (score >= 85) return 'from-mediblue-500 to-teal-500 text-mediblue-700 border-mediblue-300';
    return 'from-amber-500 to-orange-500 text-amber-700 border-amber-300';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-mediblue-600" />
          <span className="text-xs font-bold text-navy-900">Case Completeness:</span>
        </div>
        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getScoreColor()} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs font-black text-navy-900">{score}%</span>
        {unresolvedCount > 0 && (
          <button
            type="button"
            onClick={() => setIsQuickClarifyOpen(true)}
            className="text-[10px] font-bold text-mediblue-700 bg-mediblue-50 hover:bg-mediblue-100 px-2 py-0.5 rounded-full border border-mediblue-200 cursor-pointer"
          >
            {unresolvedCount} Missing
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-teal-50/30 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-mediblue-50 flex items-center justify-center font-bold text-mediblue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900">Case Completeness & Safety Index</h4>
            <p className="text-[11px] text-slate-500 font-medium">Deterministic Information Intake Score</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-black bg-gradient-to-r from-mediblue-900 to-teal-700 bg-clip-text text-transparent">
            {score}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 block">
            {completedFieldsCount} of {totalFieldsCount} clinical fields verified
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden my-2.5 p-0.5 shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getScoreColor()} transition-all duration-700 shadow-xs`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Missing items pills & action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">Missing/Clarifications:</span>
          {unresolvedCount === 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> All Essential Fields Verified
            </span>
          ) : (
            missingFields
              .filter((f) => !f.resolved)
              .map((field) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>{field.field}</span>
                </span>
              ))
          )}
        </div>

        {unresolvedCount > 0 && (
          <button
            type="button"
            onClick={() => setIsQuickClarifyOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-mediblue-600 to-teal-600 hover:from-mediblue-700 hover:to-teal-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span>Quick-Clarify ({unresolvedCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
