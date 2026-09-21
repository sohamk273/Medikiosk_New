import React from 'react';
import { Mic, FileText, FileCheck, FlaskConical, ExternalLink, Sparkles } from 'lucide-react';
import type { EvidenceMetadata } from '../types/demoTypes';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

interface Props {
  factId: string;
  evidence: EvidenceMetadata;
  compact?: boolean;
}

export const EvidenceBadge: React.FC<Props> = ({ factId, evidence, compact = false }) => {
  const { openEvidenceDrawer } = useDemoIntelligence();

  const getIcon = () => {
    switch (evidence.sourceType) {
      case 'patient_voice':
        return <Mic className="w-3 h-3 text-mediblue-600" />;
      case 'scanned_prescription':
        return <FileText className="w-3 h-3 text-amber-700" />;
      case 'lab_report':
        return <FlaskConical className="w-3 h-3 text-purple-600" />;
      case 'discharge_summary':
        return <FileCheck className="w-3 h-3 text-rose-600" />;
      case 'consultation_note':
        return <Sparkles className="w-3 h-3 text-emerald-600" />;
      default:
        return <FileText className="w-3 h-3 text-slate-600" />;
    }
  };

  const getBgClass = () => {
    switch (evidence.sourceType) {
      case 'patient_voice':
        return 'bg-mediblue-50 hover:bg-mediblue-100 text-mediblue-900 border-mediblue-200';
      case 'scanned_prescription':
        return 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200';
      case 'lab_report':
        return 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200';
      case 'discharge_summary':
        return 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200';
      case 'consultation_note':
        return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200';
      default:
        return 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openEvidenceDrawer(factId);
      }}
      title={`Click to inspect evidence provenance (${evidence.sourceLabel})`}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${getBgClass()} ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {getIcon()}
      <span className="truncate max-w-[140px]">{evidence.sourceLabel}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
    </button>
  );
};
