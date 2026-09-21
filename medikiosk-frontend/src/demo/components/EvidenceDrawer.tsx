import React, { useState } from 'react';
import { X, CheckCircle2, Edit3, Sparkles, FileText, Mic, History } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';
import { ConfidenceBadge } from './ConfidenceBadge';
import { VerificationBadge } from './VerificationBadge';

export const EvidenceDrawer: React.FC = () => {
  const {
    activeEvidenceFact,
    isEvidenceDrawerOpen,
    closeEvidenceDrawer,
    documents,
    verifyFact,
    editFact,
    auditTrail,
  } = useDemoIntelligence();

  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState('');

  if (!isEvidenceDrawerOpen || !activeEvidenceFact) {
    return null;
  }

  const { evidence } = activeEvidenceFact;
  const linkedDoc = documents.find((d) => d.id === evidence.documentId);
  const factAuditLogs = auditTrail.filter((a) => a.factId === activeEvidenceFact.id);

  const handleStartEdit = () => {
    setEditedValue(activeEvidenceFact.value);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedValue.trim()) {
      editFact(activeEvidenceFact.id, editedValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-mediblue-100 text-mediblue-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-navy-900 leading-tight">Evidence & Provenance Inspector</h3>
              <p className="text-[11px] text-slate-500 font-medium">Deterministic Fact Traceability</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeEvidenceDrawer}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Fact Identity Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-mediblue-50/40 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {activeEvidenceFact.category.replace('_', ' ')}
              </span>
              <VerificationBadge status={activeEvidenceFact.status} />
            </div>
            <h4 className="text-base font-bold text-navy-900">{activeEvidenceFact.label}</h4>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  className="w-full p-2 text-xs border border-mediblue-400 rounded-lg focus:ring-2 focus:ring-mediblue-300 font-sans"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 rounded-md font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs text-white bg-mediblue-600 rounded-md font-bold hover:bg-mediblue-700"
                  >
                    Save Correction
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                {activeEvidenceFact.value}
              </p>
            )}

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-[11px]">
              <ConfidenceBadge confidence={evidence.confidence} score={evidence.confidenceScore} />
              <span className="text-slate-400 font-semibold">{evidence.extractedAt}</span>
            </div>
          </div>

          {/* Primary Evidence Source */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-navy-800 flex items-center gap-1.5">
              {evidence.sourceType === 'patient_voice' ? (
                <Mic className="w-3.5 h-3.5 text-mediblue-600" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Source Provenance & Extraction Snippet</span>
            </h5>

            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono border border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
                <span className="font-bold text-teal-400">{evidence.sourceLabel}</span>
                <span>ID: {activeEvidenceFact.id}</span>
              </div>
              <p className="text-teal-200 whitespace-pre-wrap leading-relaxed">{evidence.snippet}</p>

              {evidence.sourceType === 'patient_voice' && (
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <span className="w-1 h-3 bg-teal-400 rounded-full animate-pulse"></span>
                    <span className="w-1 h-5 bg-teal-400 rounded-full animate-pulse"></span>
                    <span className="w-1 h-2 bg-teal-400 rounded-full"></span>
                    <span className="w-1 h-4 bg-teal-400 rounded-full animate-pulse"></span>
                    <span className="w-1 h-2 bg-teal-400 rounded-full"></span>
                  </div>
                  <span className="text-[10px] text-slate-400">Audio Recorded • {evidence.audioTimestamp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Viewer Preview if linked */}
          {linkedDoc && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-navy-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Original Document Preview ({linkedDoc.facility})</span>
              </h5>
              <div
                className="rounded-xl overflow-hidden border border-slate-200 bg-white"
                dangerouslySetInnerHTML={{ __html: linkedDoc.visualHtmlPreview }}
              />
            </div>
          )}

          {/* AI Audit Trail */}
          <div className="space-y-2 pt-2">
            <h5 className="text-xs font-bold text-navy-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-mediblue-600" />
              <span>AI Audit Trail & Human-in-the-Loop Log</span>
            </h5>

            <div className="space-y-1.5">
              {factAuditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-[10px] mb-1 font-semibold">
                    <span
                      className={`px-1.5 py-0.2 rounded font-extrabold ${
                        log.action === 'DOCTOR_VERIFIED'
                          ? 'bg-blue-100 text-blue-800'
                          : log.action === 'DISCREPANCY_FLAGGED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 text-[11px]">{log.detail}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Actor: {log.userRole} • Source: {log.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Fact</span>
          </button>

          <button
            type="button"
            onClick={() => verifyFact(activeEvidenceFact.id)}
            disabled={activeEvidenceFact.status === 'doctor_verified'}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${
              activeEvidenceFact.status === 'doctor_verified'
                ? 'bg-blue-100 text-blue-800 border border-blue-200 cursor-default'
                : 'bg-gradient-to-r from-mediblue-600 to-teal-600 hover:from-mediblue-700 hover:to-teal-700 text-white active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{activeEvidenceFact.status === 'doctor_verified' ? 'Physician Verified' : 'Verify & Approve Fact'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
