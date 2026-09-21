import React from 'react';
import { ShieldAlert, FlaskConical, CheckCircle2 } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';
import { DiscrepancyCard } from './DiscrepancyCard';

export const AttentionHeroCard: React.FC = () => {
  const { activeDiscrepancies, abnormalLabs, openEvidenceDrawer } = useDemoIntelligence();

  const totalAlerts = activeDiscrepancies.length + abnormalLabs.length;

  if (totalAlerts === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">No Active Clinical Discrepancies</h4>
            <p className="text-xs text-emerald-700 font-medium">All cross-source data points and lab investigations verified.</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
          CLEAR FOR CONSULTATION
        </span>
      </div>
    );
  }

  return (
    <div className="p-4.5 rounded-xl bg-rose-50/40 border border-rose-200 shadow-2xs space-y-3.5">
      {/* Alert Header */}
      <div className="flex items-center justify-between pb-3 border-b border-rose-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                Attention Required ({totalAlerts} Items)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Priority Triage Review</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Clinical Conflicts & Abnormal Findings Detected
            </h3>
          </div>
        </div>

        <span className="text-xs font-semibold text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-md border border-rose-200">
          Physician Verification Required
        </span>
      </div>

      {/* Discrepancy Cards List */}
      <div className="space-y-2.5">
        {activeDiscrepancies.map((disc) => (
          <DiscrepancyCard key={disc.id} discrepancy={disc} />
        ))}
      </div>

      {/* Abnormal Lab Findings Strip */}
      {abnormalLabs.length > 0 && (
        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
              <span>Abnormal Laboratory Results ({abnormalLabs.length} out of reference range)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Metropolis Lab Report (18 Nov 2025)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {abnormalLabs.map((lab) => (
              <div
                key={lab.id}
                onClick={() => openEvidenceDrawer('fact-lab-01')}
                className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between hover:border-slate-300 cursor-pointer transition-all"
              >
                <div>
                  <p className="font-bold text-slate-900">{lab.testName}</p>
                  <p className="text-[10px] text-slate-500">Ref: {lab.referenceRange}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {lab.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
