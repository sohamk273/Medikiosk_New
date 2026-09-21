import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  HeartPulse,
  Pill,
  ShieldAlert,
  FlaskConical,
  CheckCircle2,
  Edit3,
  ArrowLeft,
  FileText,
  Users
} from 'lucide-react';
import { useDemoIntelligence } from '../context/DemoIntelligenceContext';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { AttentionHeroCard } from '../components/AttentionHeroCard';
import { ClinicalTimeline } from '../components/ClinicalTimeline';
import { AyushProfileCard } from '../components/AyushProfileCard';
import { AuditTrailView } from '../components/AuditTrailView';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { QuickClarifyModal } from '../components/QuickClarifyModal';
import { DemoScannerModal } from '../components/DemoScannerModal';
import { DEMO_DOCTOR_PATIENTS, type DemoDoctorPatient } from '../data/demoDoctorDataset';
import { DemoDoctorProvider } from '../services/demoDoctorProvider';

export default function Doctor30SecondView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('patientId') || 'MEDI-OPD-2026-00010';

  const [activePatient, setActivePatient] = useState<DemoDoctorPatient>(() => {
    return DemoDoctorProvider.getPatientByCaseId(requestedId) || DEMO_DOCTOR_PATIENTS[0];
  });

  const {
    clinicalFacts,
    allLabs,
    auditTrail,
    openEvidenceDrawer,
    setIsDemoScannerOpen,
  } = useDemoIntelligence();

  const [activeTab, setActiveTab] = useState<'cockpit' | 'timeline' | 'ayush' | 'audit'>('cockpit');
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    const found = DemoDoctorProvider.getPatientByCaseId(requestedId);
    if (found) {
      setActivePatient(found);
    }
  }, [requestedId]);

  const handleSelectPatient = (caseId: string) => {
    setSearchParams({ patientId: caseId });
    const found = DemoDoctorProvider.getPatientByCaseId(caseId);
    if (found) {
      setActivePatient(found);
    }
  };
  const [editableSummary, setEditableSummary] = useState({
    hpi: '52-year-old male presenting with 5-day history of moderate epigastric burning and post-prandial fullness, aggravated after oily/spicy diet. Associated with mild nausea. Patient denies chest tightness, dysphagia, or melena.',
    pastHistory: 'Known Type 2 Diabetes Mellitus (since 2019) and Essential Hypertension (since 2021). History of Laparoscopic Cholecystectomy (Apollo Hospitals, 2023).',
    medications: '1. Tab. Metformin 500mg BD (Rx confirmed; patient compliance conflict flagged)\n2. Tab. Telmisartan 40mg OD (Confirmed)',
    allergies: 'CRITICAL: Penicillin group allergy (Severe urticaria & angioedema documented in IPD discharge summary). Beta-lactams contraindicated.',
    investigations: 'Suboptimal glycaemic control: HbA1c 8.2% [High], Fasting Plasma Glucose 158 mg/dL [High]. Normal renal profile (Creatinine 0.92 mg/dL).',
    ayushAssessment: 'Pitta-Vata Prakriti with Mandagni and Amlapitta (Vidagdha Pachana stage). Aggravated by Ushna-Tikshna Ahara & late nights.',
    plan: '1. Cap. Pantoprazole 40mg OD 30 min before breakfast for 14 days.\n2. Reinforce Metformin compliance & counsel regarding diet.\n3. Ayurveda: Takra with Jeeraka powder; avoid spicy/fried foods.\n4. Repeat Fasting Blood Sugar in 2 weeks.',
  });

  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const handleFinalizeCase = () => {
    setIsFinalized(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16 antialiased">
      {/* Top Clinical Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/doctor/queue')}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-700" />
                <span>30-Second Physician View</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                High-Density Cockpit
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Structured Clinical Intake • Evidence-Linked Records
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Patient Selector Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-teal-700" />
            <select
              value={activePatient.caseId}
              onChange={(e) => handleSelectPatient(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {DEMO_DOCTOR_PATIENTS.map((p) => (
                <option key={p.caseId} value={p.caseId}>
                  {p.tokenDisplay}: {p.patientName} ({p.age}Y {p.gender.charAt(0).toUpperCase()}) — {p.operationalState}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsDemoScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            <span>Scan Medical Document</span>
          </button>

          <button
            type="button"
            onClick={handleFinalizeCase}
            disabled={isFinalized}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs ${isFinalized
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
              }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFinalized ? 'Consultation Finalized' : 'Verify & Sign-Off Case'}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
        {/* 1. Patient Demographics & Snapshot Card */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-base shadow-2xs">
              {activePatient.patientName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">{activePatient.patientName}</h2>
                <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {activePatient.tokenDisplay}
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {activePatient.caseId}
                </span>
                {activePatient.redFlagTriggered && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Safety Alert
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                <span>{activePatient.age}Y • {activePatient.gender.charAt(0).toUpperCase() + activePatient.gender.slice(1)}</span>
                <span className="text-slate-300">•</span>
                <span>ABHA: <strong className="text-slate-800 font-mono">{activePatient.abhaId}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Mobile: {activePatient.mobile}</span>
              </p>
            </div>
          </div>

          {/* Right Snapshot Badges */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Completeness</span>
              <span className="text-xs font-bold text-slate-900">{activePatient.completenessScore}%</span>
            </div>
            <div className="text-right pl-3 border-l border-slate-200 hidden md:block">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Operational Status</span>
              <span className="text-xs font-bold text-slate-900">{activePatient.operationalState}</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('cockpit')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${activeTab === 'cockpit'
                ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
          >
            Clinical Overview Cockpit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${activeTab === 'timeline'
                ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
          >
            7-Year Patient Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ayush')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${activeTab === 'ayush'
                ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
          >
            AYUSH Case Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${activeTab === 'audit'
                ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
          >
            Audit Trail ({auditTrail.length})
          </button>
        </div>

        {/* Tab 1: Primary Cockpit */}
        {activeTab === 'cockpit' && (
          <div className="space-y-4">
            {/* ATTENTION REQUIRED HERO BOX */}
            <AttentionHeroCard />

            {/* 2-Column Clinical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Clinical Facts (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Chief Complaint & HPI Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-mediblue-600" />
                      <h3 className="text-sm font-extrabold text-navy-900">Current Complaint & HPI</h3>
                    </div>
                    <EvidenceBadge factId="fact-cc-01" evidence={clinicalFacts.find((f) => f.id === 'fact-cc-01')!.evidence} />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {editableSummary.hpi}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Associated Symptoms</span>
                      <span className="font-bold text-navy-900">Mild Nausea (Post-meals)</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Important Negatives</span>
                      <span className="font-bold text-emerald-700">No Chest Pain / No Dysphagia</span>
                    </div>
                  </div>
                </div>

                {/* Chronic Conditions & Past Medical History */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-extrabold text-navy-900">Past Medical & Surgical History</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">3 Documented Events</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy-900">Type 2 Diabetes Mellitus (6 Years)</p>
                        <p className="text-[11px] text-slate-500">Suboptimal control (HbA1c 8.2%)</p>
                      </div>
                      <EvidenceBadge factId="fact-cond-01" evidence={clinicalFacts.find((f) => f.id === 'fact-cond-01')!.evidence} compact />
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy-900">Essential Hypertension (4 Years)</p>
                        <p className="text-[11px] text-slate-500">Under medical management</p>
                      </div>
                      <EvidenceBadge factId="fact-cond-02" evidence={clinicalFacts.find((f) => f.id === 'fact-cond-02')!.evidence} compact />
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy-900">Laparoscopic Cholecystectomy (March 2023)</p>
                        <p className="text-[11px] text-slate-500">Apollo Hospitals • Uneventful recovery</p>
                      </div>
                      <EvidenceBadge factId="fact-surg-01" evidence={clinicalFacts.find((f) => f.id === 'fact-surg-01')!.evidence} compact />
                    </div>
                  </div>
                </div>

                {/* Active Medications & Allergies Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Medications */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-bold text-navy-900">Medications</h4>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 bg-amber-50/80 rounded-lg border border-amber-200">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-amber-950">Metformin 500mg BD</span>
                          <span className="text-[9px] font-black bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded">CONFLICT</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Scanned Rx Oct 2024</p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-bold text-navy-900">Telmisartan 40mg OD</span>
                        <p className="text-[10px] text-slate-500">Morning regular</p>
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <h4 className="text-xs font-bold text-slate-900">Drug Allergies</h4>
                      </div>
                    </div>
                    <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200 text-xs">
                      <p className="font-bold text-rose-900 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>PENICILLIN GROUP</span>
                      </p>
                      <p className="text-[11px] text-rose-800 mt-0.5">Severe Urticaria & Angioedema</p>
                      <p className="text-[10px] text-slate-500 mt-1">Source: Apollo Discharge Summary</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Labs & Summary Plan (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Recent Investigations Panel */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-teal-700" />
                      <h3 className="text-sm font-bold text-slate-900">Recent Investigations</h3>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Metropolis Lab (18 Nov 2025)
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                        <th className="pb-1.5">Test Name</th>
                        <th className="pb-1.5">Value</th>
                        <th className="pb-1.5 text-right">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allLabs.map((lab) => (
                        <tr
                          key={lab.id}
                          onClick={() => openEvidenceDrawer('fact-lab-01')}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-1.5 font-medium text-slate-900">{lab.testName}</td>
                          <td className="py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-xs ${lab.isAbnormal ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'text-slate-700'
                                }`}
                            >
                              {lab.value}
                            </span>
                          </td>
                          <td className="py-1.5 text-right text-slate-500 text-[11px]">{lab.referenceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Case Draft (SOAP Format) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <h3 className="text-sm font-bold text-slate-900">Case Draft (SOAP Format)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingSummary(!isEditingSummary)}
                      className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> {isEditingSummary ? 'Done' : 'Edit'}
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase block mb-1">
                        Assessment & Clinical Impression:
                      </span>
                      <p className="text-slate-800 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        Acute exacerbation of functional dyspepsia / Amlapitta in a patient with uncontrolled Type 2 Diabetes Mellitus and Essential Hypertension.
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase block mb-1">
                        Integrative Treatment Plan Draft:
                      </span>
                      {isEditingSummary ? (
                        <textarea
                          value={editableSummary.plan}
                          onChange={(e) => setEditableSummary({ ...editableSummary, plan: e.target.value })}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          rows={4}
                        />
                      ) : (
                        <p className="text-slate-800 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] leading-relaxed">
                          {editableSummary.plan}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Physician verification required before sign-off</span>
                    <button
                      type="button"
                      onClick={handleFinalizeCase}
                      className="text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Approve SOAP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Timeline */}
        {activeTab === 'timeline' && <ClinicalTimeline />}

        {/* Tab 3: AYUSH Profile */}
        {activeTab === 'ayush' && <AyushProfileCard />}

        {/* Tab 4: Audit Trail */}
        {activeTab === 'audit' && <AuditTrailView />}
      </main>

      {/* Slide-Over Evidence Drawer */}
      <EvidenceDrawer />

      {/* Quick Clarify Modal */}
      <QuickClarifyModal />

      {/* Simulated Scanner Modal */}
      <DemoScannerModal />
    </div>
  );
}
