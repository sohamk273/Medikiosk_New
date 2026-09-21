import { useState } from 'react';
import { 
  Users, UserCheck, ShieldCheck, 
  Languages, Filter
} from 'lucide-react';

export default function AdminPatientAnalytics() {
  const [timeRange, setTimeRange] = useState('Month');

  const ageGroups = [
    { label: '< 18 Years (Pediatric)', count: 218, percentage: 17 },
    { label: '18 – 35 Years (Young Adults)', count: 398, percentage: 31 },
    { label: '36 – 50 Years (Middle Age)', count: 346, percentage: 27 },
    { label: '51 – 65 Years (Senior)', count: 231, percentage: 18 },
    { label: '> 65 Years (Geriatric)', count: 91, percentage: 7 },
  ];

  const languageStats = [
    { language: 'Marathi', percentage: 44, count: 565 },
    { language: 'Hindi', percentage: 38, count: 488 },
    { language: 'English', percentage: 18, count: 231 },
  ];

  const postalZones = [
    { zone: 'Zone A - Central City & Market', count: 432, percentage: 34, primaryOpd: 'General OPD' },
    { zone: 'Zone B - North Suburbs & Industrial', count: 380, percentage: 30, primaryOpd: 'Orthopedics' },
    { zone: 'Zone C - Rural Outreach & Taluka', count: 294, percentage: 23, primaryOpd: 'Ayurveda / Medicine' },
    { zone: 'Zone D - Transit / Interstate', count: 178, percentage: 13, primaryOpd: 'Pediatrics' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Demographic &amp; Registration Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hospital-wide population statistics, age-gender distribution, and ABHA digital identity adoption
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {['Today', 'Week', 'Month', 'Quarter'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Registered</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">1,284</div>
          <p className="text-[11px] text-slate-500 mt-1">Unique patients this period</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>New Walk-ins</span>
            <UserCheck className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">742 <span className="text-xs font-normal text-teal-700">(58%)</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Direct kiosk &amp; counter registrations</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Pre-Scheduled</span>
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">542 <span className="text-xs font-normal text-blue-700">(42%)</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Online &amp; referral appointments</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>ABHA Linked</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">86.4%</div>
          <p className="text-[11px] text-emerald-700 mt-1">1,109 verified digital health IDs</p>
        </div>
      </div>

      {/* 2-Column Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Age Demographics Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Age Distribution</h2>
              <p className="text-[11px] text-slate-500">Patient cohort breakdown across clinical departments</p>
            </div>
          </div>

          <div className="space-y-4">
            {ageGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{group.label}</span>
                  <span className="font-bold text-slate-900">{group.count} pts ({group.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-800 h-2 rounded-full"
                    style={{ width: `${group.percentage * 2.5}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender & Language Adoption */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-6">
          {/* Gender Ratio */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Gender Ratio</h2>
              <span className="text-[11px] text-slate-500">1,284 Total</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Male</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">668</p>
                <span className="text-[11px] text-slate-500 font-mono">52.0%</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Female</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">591</p>
                <span className="text-[11px] text-slate-500 font-mono">46.0%</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Other / Minor</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">25</p>
                <span className="text-[11px] text-slate-500 font-mono">2.0%</span>
              </div>
            </div>
          </div>

          {/* Preferred Language for Voice & Kiosk Intake */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-teal-800" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Intake Language Selection</h2>
              </div>
              <span className="text-[11px] text-slate-500">Kiosk &amp; Audio</span>
            </div>

            <div className="space-y-2">
              {languageStats.map((item) => (
                <div key={item.language} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.language}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-teal-700 h-1.5 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-slate-900 font-bold w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Regional Zone Catchment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Geographic Catchment &amp; Outreach Zones</h2>
          <p className="text-[11px] text-slate-500">Origin of patient registrations presenting at MediKiosk terminals</p>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Catchment Region</th>
              <th className="py-3 px-4">Total Patients</th>
              <th className="py-3 px-4">Share (%)</th>
              <th className="py-3 px-4">Primary OPD Demand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {postalZones.map((zone) => (
              <tr key={zone.zone} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{zone.zone}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{zone.count}</td>
                <td className="py-3 px-4 font-mono">{zone.percentage}%</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-semibold border border-slate-200">
                    {zone.primaryOpd}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
