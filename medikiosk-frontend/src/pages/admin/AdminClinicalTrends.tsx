import { useState } from 'react';
import { 
  Activity, Stethoscope, AlertTriangle, 
  ShieldCheck, Filter, Download
} from 'lucide-react';
import { MockAdminAnalyticsProvider } from '@/services/admin/MockAdminAnalyticsProvider';

export default function AdminClinicalTrends() {
  const [selectedSeason, setSelectedSeason] = useState('Current Quarter (Q3)');
  const diseaseCategories = MockAdminAnalyticsProvider.getDiseaseCategories();

  const topDiagnoses = [
    { rank: 1, diagnosis: 'Acid Peptic Disease / GERD & Dyspepsia', icd10: 'K21.9', count: 124, trend: '+4.2%', dept: 'General OPD / Ayurveda' },
    { rank: 2, diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)', icd10: 'J06.9', count: 98, trend: '+12.5%', dept: 'General OPD / Pediatrics' },
    { rank: 3, diagnosis: 'Degenerative Lumbar Spondylosis & Knee Osteoarthritis', icd10: 'M47.8', count: 83, trend: '+1.8%', dept: 'Orthopedics' },
    { rank: 4, diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension', icd10: 'E11.9', count: 71, trend: '-0.5%', dept: 'General Medicine' },
    { rank: 5, diagnosis: 'Allergic Contact Dermatitis & Eczematous Flare', icd10: 'L23.9', count: 48, trend: '+3.1%', dept: 'Dermatology' },
    { rank: 6, diagnosis: 'Chronic Rhinosinusitis & Allergic Rhinitis', icd10: 'J32.9', count: 38, trend: '+8.4%', dept: 'ENT Clinic' },
  ];

  const totalCases = diseaseCategories.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Disease &amp; Clinical Trend Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated epidemiological surveillance, ICD-10 diagnostic categories, and public health trend monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting epidemiological disease report CSV...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Trend Report
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
        <p className="text-xs text-slate-600">
          <strong>Privacy Compliance &amp; Aggregation:</strong> Clinical trend data is anonymized and aggregated at the hospital cohort level. No individual patient identifiable data (PII) is exposed in epidemiological reports.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Diagnoses Categorized</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCases} Cases</div>
          <p className="text-[11px] text-slate-500 mt-1">Classified in active EMR notes</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Primary Category</span>
            <Stethoscope className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800">Gastrointestinal</div>
          <p className="text-[11px] text-teal-700 mt-1">124 cases (26.8% of OPD intake)</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Fastest Rising</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800">Respiratory (+12.5%)</div>
          <p className="text-[11px] text-amber-700 mt-1">Seasonal weather-associated surge</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Chronic Conditions</span>
            <Activity className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-blue-800">33.2%</div>
          <p className="text-[11px] text-blue-700 mt-1">Diabetes, HTN, &amp; Arthritis follow-ups</p>
        </div>
      </div>

      {/* 2-Column: Broad Categories & Public Health Surveillance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Clinical Category Shares */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Clinical Category Distribution</h2>
              <p className="text-[11px] text-slate-500">Volume and percentage share by clinical specialty</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {diseaseCategories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{cat.category}</span>
                  <span className="font-bold text-slate-900">{cat.count} cases ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-800 h-2 rounded-full"
                    style={{ width: `${cat.percentage * 3.2}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400">{cat.commonCases}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Public Health Surveillance Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Public Health Surveillance Summary</h2>
              <p className="text-[11px] text-slate-500">Notifiable conditions and seasonal epidemiology</p>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>Seasonal Respiratory Cluster</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Monitored</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  98 acute bronchitis and allergic cough cases recorded in past 7 days. Pediatric and geriatric cohorts comprise 62% of presentations.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>Ayush &amp; Integrative Care Referrals</span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Optimal</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  84 patients opted for integrative Ayurveda/Prakriti assessments alongside standard medical care for chronic lifestyle and joint disorders.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">National Health Surveillance Sync:</span>
            <span className="font-mono font-bold text-teal-800">IHIP Portal Active</span>
          </div>
        </div>
      </div>

      {/* Top 6 Diagnostic Presenting Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Leading Clinical Diagnoses (ICD-10 Categorization)</h2>
            <p className="text-[11px] text-slate-500">Most frequent confirmed diagnoses recorded across all OPD consultations</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-700 focus:outline-none"
            >
              <option>Current Quarter (Q3)</option>
              <option>Previous Quarter (Q2)</option>
              <option>Year to Date</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4"># Rank</th>
              <th className="py-3 px-4">Diagnosis Description</th>
              <th className="py-3 px-4">ICD-10 Code</th>
              <th className="py-3 px-4">Encounter Count</th>
              <th className="py-3 px-4">Period Trend</th>
              <th className="py-3 px-4">Primary Department</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {topDiagnoses.map((d) => (
              <tr key={d.rank} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-500">0{d.rank}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{d.diagnosis}</td>
                <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{d.icd10}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.count}</td>
                <td className="py-3 px-4 font-mono font-semibold">
                  <span className={d.trend.startsWith('+') ? 'text-amber-700' : 'text-slate-600'}>
                    {d.trend}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">{d.dept}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
