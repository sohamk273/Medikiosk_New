import { useState } from 'react';
import { 
  Building, Clock, ShieldCheck, 
  Save, CheckCircle2, Sliders
} from 'lucide-react';

export default function AdminSettings() {
  const [hospitalName, setHospitalName] = useState('Civil Hospital & Medical Research Institute');
  const [facilityId, setFacilityId] = useState('HFR-MH-PUN-004291');
  const [slotDuration, setSlotDuration] = useState('15');
  const [waitAlertThreshold, setWaitAlertThreshold] = useState('30');
  const [doctorLateThreshold, setDoctorLateThreshold] = useState('15');
  const [abdmEnabled, setAbdmEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Administration &amp; System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hospital facility registry, OPD operating parameters, queue SLA benchmarks, and ABDM bridges
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hospital Configurations Saved
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Facility Profile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">Hospital Facility Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Institute Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">National Health Facility ID (HFR / ABDM)</label>
              <input
                type="text"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Facility Tier</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none"
              >
                <option>District Hospital / Civil General (Tier-2)</option>
                <option>Sub-District Hospital (SDH)</option>
                <option>Community Health Center (CHC)</option>
                <option>Tertiary Medical College Hospital</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State &amp; Administrative Zone</label>
              <input
                type="text"
                disabled
                value="Maharashtra State Health Services — Pune Division"
                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: OPD Operational Parameters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">OPD Operating Hours &amp; Slot Duration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Slot Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="10">10 Minutes per Patient</option>
                <option value="15">15 Minutes per Patient (Recommended)</option>
                <option value="20">20 Minutes per Patient</option>
                <option value="30">30 Minutes (Specialty Consultations)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Morning Shift Hours</label>
              <input
                type="text"
                disabled
                value="08:00 AM – 02:00 PM (6 Hours)"
                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Evening Shift Hours</label>
              <input
                type="text"
                disabled
                value="02:00 PM – 08:00 PM (6 Hours)"
                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: SLA & Governance Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">Queue SLA Alerts &amp; Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient Waiting Alert Breach Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={waitAlertThreshold}
                  onChange={(e) => setWaitAlertThreshold(e.target.value)}
                  className="w-24 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                />
                <span className="text-xs text-slate-500 font-medium">minutes before front-desk alert triggers</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Late Arrival Alert Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={doctorLateThreshold}
                  onChange={(e) => setDoctorLateThreshold(e.target.value)}
                  className="w-24 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                />
                <span className="text-xs text-slate-500 font-medium">minutes past scheduled OPD start</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: ABDM & Interoperability Bridge */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">Ayushman Bharat Digital Mission (ABDM) Integration</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={abdmEnabled}
                onChange={(e) => setAbdmEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
              />
              <span className="text-xs font-medium text-slate-700">
                Enable ABDM Milestone 1, 2 &amp; 3 Gateway Sync (HIP/HIU Bridge, ABHA Verification, and FHIR Consent)
              </span>
            </label>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>NDHM Gateway Status: <strong>Production Connected (Latency: 42ms)</strong></span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save Hospital Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
