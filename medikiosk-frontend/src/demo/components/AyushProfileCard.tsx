import React from 'react';
import { Sparkles, HeartPulse, Flame, Activity, Compass } from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';
import { VerificationBadge } from './VerificationBadge';

export const AyushProfileCard: React.FC = () => {
  const { ayushProfile, verifyAyushParameter } = useDemoIntelligence();
  const { prakriti, vikriti, agni, koshtha, aharaVihara, samprapti, dashavidhaPariksha } = ayushProfile;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-navy-900">AYUSH Case Profile & Dosha Assessment</h4>
            <p className="text-[11px] text-slate-500 font-medium">Integrative Diagnostic Framework (Ayurveda)</p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Dashavidha Matrix Attached
        </span>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Prakriti */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>{prakriti.parameter}</span>
            </div>
            <VerificationBadge status={prakriti.status} />
          </div>
          <p className="text-xs font-bold text-emerald-950 font-devanagari">{prakriti.value}</p>
          <p className="text-[11px] text-slate-600 leading-snug">{prakriti.description}</p>
          {prakriti.status !== 'doctor_verified' && (
            <button
              type="button"
              onClick={() => verifyAyushParameter('prakriti')}
              className="mt-1 text-[10px] font-bold text-mediblue-700 hover:text-mediblue-900 underline cursor-pointer"
            >
              Verify Prakriti
            </button>
          )}
        </div>

        {/* 2. Vikriti */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>{vikriti.parameter}</span>
            </div>
            <VerificationBadge status={vikriti.status} />
          </div>
          <p className="text-xs font-bold text-amber-950 font-devanagari">{vikriti.value}</p>
          <p className="text-[11px] text-slate-600 leading-snug">{vikriti.description}</p>
          {vikriti.status !== 'doctor_verified' && (
            <button
              type="button"
              onClick={() => verifyAyushParameter('vikriti')}
              className="mt-1 text-[10px] font-bold text-mediblue-700 hover:text-mediblue-900 underline cursor-pointer"
            >
              Verify Vikriti
            </button>
          )}
        </div>

        {/* 3. Agni */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>{agni.parameter}</span>
            </div>
            <VerificationBadge status={agni.status} />
          </div>
          <p className="text-xs font-bold text-rose-950 font-devanagari">{agni.value}</p>
          <p className="text-[11px] text-slate-600 leading-snug">{agni.description}</p>
          {agni.status !== 'doctor_verified' && (
            <button
              type="button"
              onClick={() => verifyAyushParameter('agni')}
              className="mt-1 text-[10px] font-bold text-mediblue-700 hover:text-mediblue-900 underline cursor-pointer"
            >
              Verify Agni
            </button>
          )}
        </div>

        {/* 4. Koshtha & Ahara-Vihara */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{koshtha.parameter}</span>
            </div>
            <VerificationBadge status={koshtha.status} />
          </div>
          <p className="text-xs font-bold text-teal-950 font-devanagari">{koshtha.value}</p>
          <p className="text-[11px] text-slate-600 leading-snug">{aharaVihara.value}</p>
        </div>
      </div>

      {/* Pathogenesis (Samprapti) Strip */}
      <div className="p-3 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/70 rounded-xl border border-emerald-200 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AYUSH Integrative Pathogenesis (Samprapti):</span>
        </div>
        <p className="text-slate-700 font-devanagari">{samprapti.value}</p>
      </div>

      {/* Dashavidha Pariksha Table/Grid */}
      <div className="pt-2 border-t border-slate-100">
        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
          Dashavidha Pariksha Summary Matrix
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-bold text-[9px] uppercase">1. Dushya</span>
            <span className="font-semibold text-navy-900 truncate block">{dashavidhaPariksha.dushya}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-bold text-[9px] uppercase">2. Desha</span>
            <span className="font-semibold text-navy-900 truncate block">{dashavidhaPariksha.desha}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-bold text-[9px] uppercase">3. Bala</span>
            <span className="font-semibold text-navy-900 truncate block">{dashavidhaPariksha.bala}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-bold text-[9px] uppercase">4. Kala</span>
            <span className="font-semibold text-navy-900 truncate block">{dashavidhaPariksha.kala}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-bold text-[9px] uppercase">5. Anala</span>
            <span className="font-semibold text-navy-900 truncate block">{dashavidhaPariksha.anala}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
