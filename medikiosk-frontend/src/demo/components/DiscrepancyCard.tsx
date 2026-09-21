import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, User, FileText, HelpCircle } from 'lucide-react';
import type { DiscrepancyItem } from '../types/demoTypes';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

interface Props {
  discrepancy: DiscrepancyItem;
}

export const DiscrepancyCard: React.FC<Props> = ({ discrepancy }) => {
  const { resolveDiscrepancy } = useDemoIntelligence();
  const [resolutionInput, setResolutionInput] = useState('');
  const [showResolveBox, setShowResolveBox] = useState(false);

  const isRedFlag = discrepancy.severity === 'red_flag';
  const isResolved = discrepancy.status === 'resolved';

  const handleResolve = () => {
    const note = resolutionInput.trim() || 'Verified with patient during consultation. Clarified discrepancies.';
    resolveDiscrepancy(discrepancy.id, note);
    setShowResolveBox(false);
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isResolved
          ? 'bg-slate-50/70 border-slate-200 opacity-80'
          : isRedFlag
          ? 'bg-white border-rose-200 shadow-2xs'
          : 'bg-white border-amber-200 shadow-2xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-white shrink-0 ${
              isResolved ? 'bg-slate-400' : isRedFlag ? 'bg-rose-600' : 'bg-amber-600'
            }`}
          >
            {isRedFlag ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  isResolved
                    ? 'bg-slate-100 text-slate-700'
                    : isRedFlag
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isResolved ? 'RESOLVED DISCREPANCY' : isRedFlag ? 'HIGH CLINICAL ALERT' : 'CROSS-SOURCE DISCREPANCY'}
              </span>
              <span className="text-[11px] text-slate-500 capitalize">{discrepancy.category} Conflict</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5">{discrepancy.title}</h4>
          </div>
        </div>

        {isResolved && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        )}
      </div>

      <p className="text-xs text-slate-700 font-medium mb-3 leading-relaxed">{discrepancy.description}</p>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
        {/* Left: Patient Statement */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 mb-1 uppercase">
            <User className="w-3 h-3" />
            <span>Patient Statement ({discrepancy.patientStatement.source})</span>
          </div>
          <p className="text-xs font-medium text-slate-900 italic">"{discrepancy.patientStatement.text}"</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Logged at {discrepancy.patientStatement.timestamp}</span>
        </div>

        {/* Right: Document Evidence */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 mb-1 uppercase">
            <FileText className="w-3 h-3" />
            <span>Document Evidence ({discrepancy.documentEvidence.documentTitle})</span>
          </div>
          <p className="text-xs font-semibold text-rose-900 font-mono bg-rose-50 p-1.5 rounded border border-rose-200">
            {discrepancy.documentEvidence.text}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Dated: {discrepancy.documentEvidence.date}</span>
        </div>
      </div>

      {/* Recommended Action & Doctor Resolver */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span className="text-slate-700 font-medium">{discrepancy.recommendedAction}</span>
        </div>

        {!isResolved && (
          <button
            type="button"
            onClick={() => setShowResolveBox(!showResolveBox)}
            className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            {showResolveBox ? 'Cancel' : 'Resolve Conflict'}
          </button>
        )}
      </div>

      {/* Resolution Input Box */}
      {showResolveBox && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-teal-300 space-y-2">
          <label className="text-[11px] font-bold text-slate-800 block">
            Physician Resolution Note / Verbal Verification Outcome:
          </label>
          <input
            type="text"
            placeholder="e.g. Patient confirmed omitting Metformin due to gastric distress. Re-educated."
            value={resolutionInput}
            onChange={(e) => setResolutionInput(e.target.value)}
            className="w-full p-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleResolve}
              className="px-3 py-1 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-2xs cursor-pointer"
            >
              Confirm & Save Resolution
            </button>
          </div>
        </div>
      )}

      {isResolved && discrepancy.resolvedResolution && (
        <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
          <span className="font-bold">Resolution Note:</span> {discrepancy.resolvedResolution}
        </div>
      )}
    </div>
  );
};
