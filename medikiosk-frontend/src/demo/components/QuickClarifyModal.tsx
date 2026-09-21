import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

export const QuickClarifyModal: React.FC = () => {
  const { completeness, resolveMissingField, isQuickClarifyOpen, setIsQuickClarifyOpen } = useDemoIntelligence();
  const { missingFields, score } = completeness;

  const unresolvedFields = missingFields.filter((f) => !f.resolved);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isQuickClarifyOpen) return null;

  const currentField = unresolvedFields[currentIndex] || null;

  const handleSelectOption = (optionLabel: string) => {
    if (!currentField) return;
    resolveMissingField(currentField.id, optionLabel);

    if (currentIndex >= unresolvedFields.length - 1) {
      setTimeout(() => {
        setIsQuickClarifyOpen(false);
      }, 500);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-mediblue-50 via-white to-teal-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mediblue-600 text-white flex items-center justify-center font-bold shadow-md shadow-mediblue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-mediblue-800 bg-mediblue-100 px-2.5 py-0.5 rounded-full">
                Completeness Clarification Engine
              </span>
              <h3 className="text-lg font-bold text-navy-900 mt-0.5">Quick Clinical Verification</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickClarifyOpen(false)}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {currentField ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                  Category: {currentField.category}
                </span>
                <span className="font-bold text-mediblue-700 bg-mediblue-50 px-2 py-0.5 rounded-full border border-mediblue-200">
                  Step {currentIndex + 1} of {unresolvedFields.length}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-base font-bold text-navy-900 leading-snug">{currentField.question}</h4>
                <p className="text-xs text-slate-500 mt-1 font-devanagari">{currentField.questionHindi}</p>
              </div>

              {/* Selectable Options */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Select Clarified Response:</p>
                {currentField.options?.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.label)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-mediblue-400 hover:bg-mediblue-50/50 bg-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-navy-900 group-hover:text-mediblue-900">{opt.label}</p>
                      <p className="text-[11px] text-slate-500 font-devanagari mt-0.5">{opt.labelHindi}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mediblue-600 transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center border border-emerald-200 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-navy-900">Case Intake 100% Complete!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                All identified discrepancies and missing fields have been successfully clarified. Your case profile is fully ready for physician consultation.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Current Case Completeness: <strong className="text-navy-900 font-black">{score}%</strong></span>
          <button
            type="button"
            onClick={() => setIsQuickClarifyOpen(false)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
