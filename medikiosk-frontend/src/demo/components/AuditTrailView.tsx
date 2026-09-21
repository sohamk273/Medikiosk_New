import React from 'react';
import { History, CheckCircle2, AlertTriangle, UserCheck, Bot, User } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

export const AuditTrailView: React.FC = () => {
  const { auditTrail } = useDemoIntelligence();

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DOCTOR_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Doctor Verified</span>
          </span>
        );
      case 'PATIENT_CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
            <UserCheck className="w-3 h-3 text-teal-600" />
            <span>Patient Confirmed</span>
          </span>
        );
      case 'DISCREPANCY_FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Discrepancy Flagged</span>
          </span>
        );
      case 'FIELD_EDITED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
            <User className="w-3 h-3 text-purple-600" />
            <span>Direct Edit</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            <Bot className="w-3 h-3 text-slate-500" />
            <span>AI Extracted</span>
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-mediblue-50 text-mediblue-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-navy-900">AI Clinical Audit Trail</h4>
            <p className="text-[11px] text-slate-500 font-medium">Deterministic Transparency & Provenance Log</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-400">{auditTrail.length} Logged Events</span>
      </div>

      {/* Audit Log Items */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {auditTrail.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs transition-colors space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getActionBadge(log.action)}
                <span className="font-bold text-navy-900">{log.factLabel}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{log.timestamp}</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">{log.detail}</p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-medium">
              <span>Actor: {log.userRole}</span>
              <span>Source: {log.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
