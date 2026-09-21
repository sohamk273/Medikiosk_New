import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Mic,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';

export default function DemoHub() {
  const navigate = useNavigate();
  const { resetDemoData, activeDiscrepancies } = useDemoIntelligence();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 text-white p-6 sm:p-10 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hub Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-mediblue-500 flex items-center justify-center font-black text-xl shadow-lg shadow-teal-500/20">
              MK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  MediKiosk Hackathon Demo Hub
                </h1>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  5 Extra USP Differentiators
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Deterministic Simulated Clinical Intelligence & Provenance Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetDemoData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor/30s-view')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-mediblue-600 hover:from-teal-600 hover:to-mediblue-700 text-white font-black text-xs shadow-lg shadow-teal-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>Launch 30-Sec Doctor View</span>
            </button>
          </div>
        </div>

        {/* 5 USPs Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* USP 1 */}
          <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 hover:border-teal-500/50 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                MODULE 1
              </span>
              <h3 className="text-base font-bold text-white">Multimodal Clinical Interview</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adaptive follow-up questions in Hindi & English, simulated voice synthesis, and real-time "AI Understood" entity card with patient confirmation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/voice')}
              className="flex items-center justify-between text-xs font-bold text-teal-400 hover:text-teal-300 pt-3 border-t border-slate-700/60 cursor-pointer group"
            >
              <span>Test Multimodal Intake</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* USP 2 */}
          <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 hover:border-emerald-500/50 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                MODULE 2
              </span>
              <h3 className="text-base font-bold text-white">AYUSH-Native Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adaptive evaluation of Prakriti, Vikriti, Agni (Mandagni), Koshtha, Ahara-Vihara, and Dashavidha Pariksha with doctor verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/30s-view')}
              className="flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-3 border-t border-slate-700/60 cursor-pointer group"
            >
              <span>View AYUSH Profile Matrix</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* USP 3 */}
          <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 hover:border-mediblue-500/50 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-mediblue-500/20 text-mediblue-400 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-mediblue-400 bg-mediblue-500/10 px-2 py-0.5 rounded-full border border-mediblue-500/20">
                MODULE 3
              </span>
              <h3 className="text-base font-bold text-white">Evidence-Linked AI & Audit Trail</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every clinical fact links to its original source snippet (Voice, Scanned Prescription, Lab PDF) with confidence score and human-in-the-loop audit log.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/30s-view')}
              className="flex items-center justify-between text-xs font-bold text-mediblue-400 hover:text-mediblue-300 pt-3 border-t border-slate-700/60 cursor-pointer group"
            >
              <span>Inspect Evidence Drawer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* USP 4 */}
          <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 hover:border-amber-500/50 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                MODULE 4
              </span>
              <h3 className="text-base font-bold text-white">Clinical Consistency Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects cross-source medication discrepancies (Metformin), allergy conflicts (Penicillin), and abnormal lab values with dynamic case completeness scoring.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/30s-view')}
              className="flex items-center justify-between text-xs font-bold text-amber-400 hover:text-amber-300 pt-3 border-t border-slate-700/60 cursor-pointer group"
            >
              <span>Inspect Discrepancies ({activeDiscrepancies.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* USP 5 */}
          <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 hover:border-purple-500/50 transition-all space-y-3 flex flex-col justify-between shadow-lg md:col-span-2 lg:col-span-2">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                MODULE 5
              </span>
              <h3 className="text-base font-bold text-white">30-Second Doctor View & Timeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Physician-optimized cockpit showing high-priority alerts, interactive 7-year chronological timeline (2019-2026), AYUSH profile, and editable AI SOAP clinical summary.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
              <span className="text-xs text-slate-400 font-medium">Click to launch doctor view</span>
              <button
                type="button"
                onClick={() => navigate('/doctor/30s-view')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Open 30s Doctor View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
