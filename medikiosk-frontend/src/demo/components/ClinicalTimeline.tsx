import React from 'react';
import { Clock, Activity, Pill, ShieldAlert, HeartPulse, FileText, Sparkles } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';
import { EvidenceBadge } from './EvidenceBadge';

export const ClinicalTimeline: React.FC = () => {
  const { timelineEvents, selectedTimelineEvent, setSelectedTimelineEvent } = useDemoIntelligence();

  const getEventIcon = (name: string) => {
    switch (name) {
      case 'Activity':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Pill':
        return <Pill className="w-4 h-4 text-amber-600" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4 text-emerald-600" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-mediblue-50 text-mediblue-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-navy-900">Interactive Patient Chronology</h4>
            <p className="text-[11px] text-slate-500 font-medium">Click any year/event to reveal source clinical evidence</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-400">2019 — 2026 (7 Year Trajectory)</span>
      </div>

      {/* Horizontal Interactive Year Nodes */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 pt-1 px-1">
        {timelineEvents.map((evt, idx) => {
          const isSelected = selectedTimelineEvent?.id === evt.id;
          return (
            <React.Fragment key={evt.id}>
              <button
                type="button"
                onClick={() => setSelectedTimelineEvent(evt)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[76px] cursor-pointer ${isSelected
                    ? 'bg-gradient-to-b from-mediblue-50 to-teal-50/70 border-2 border-mediblue-500 shadow-xs scale-105'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${isSelected ? 'bg-mediblue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                >
                  {getEventIcon(evt.iconName)}
                </div>
                <span className={`text-xs font-black ${isSelected ? 'text-mediblue-900 font-extrabold' : 'text-slate-700'}`}>
                  {evt.year}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[68px]">
                  {evt.category}
                </span>
              </button>

              {idx < timelineEvents.length - 1 && (
                <div className="h-0.5 flex-1 min-w-[12px] bg-slate-200"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Event Details Box */}
      {selectedTimelineEvent && (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold text-white bg-navy-900 px-2.5 py-0.5 rounded-full">
                  {selectedTimelineEvent.date}
                </span>
                <span className="text-xs font-bold text-mediblue-700 uppercase tracking-wider">
                  Category: {selectedTimelineEvent.category}
                </span>
              </div>
              <h5 className="text-sm font-bold text-navy-900">{selectedTimelineEvent.title}</h5>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedTimelineEvent.description}</p>
            </div>
          </div>

          {/* Linked Facts & Evidence Chips */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Extracted Facts & Provenance:</span>
            {selectedTimelineEvent.clinicalFacts.map((fact) => (
              <EvidenceBadge key={fact.id} factId={fact.id} evidence={fact.evidence} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
