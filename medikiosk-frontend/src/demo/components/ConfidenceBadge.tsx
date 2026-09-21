import React from 'react';
import type { ConfidenceLevel } from '../types/demoTypes';

interface Props {
  confidence: ConfidenceLevel;
  score?: number;
  showScore?: boolean;
}

export const ConfidenceBadge: React.FC<Props> = ({ confidence, score, showScore = true }) => {
  if (confidence === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>High Confidence {showScore && score ? `(${score}%)` : ''}</span>
      </span>
    );
  }

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>Med Confidence {showScore && score ? `(${score}%)` : ''}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-300">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      <span>Low Confidence</span>
    </span>
  );
};
