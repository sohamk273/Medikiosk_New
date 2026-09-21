import { useState } from 'react';
import { 
  Printer, Tv, 
  Save, CheckCircle2, Building, ShieldCheck
} from 'lucide-react';

export default function StaffSettings() {
  const [desk, setDesk] = useState('Desk 02 - General Reception');
  const [shift, setShift] = useState('Morning Shift (08:00 AM - 02:00 PM)');
  const [autoPrintTokens, setAutoPrintTokens] = useState(true);
  const [soundChime, setSoundChime] = useState(true);
  const [defaultDepartment, setDefaultDepartment] = useState('General OPD');
  const [printerModel, setPrinterModel] = useState('EPSON TM-T82X (Thermal 80mm)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Front-Desk &amp; Workstation Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure reception counter assignments, thermal slip printers, and OPD queue broadcast settings
          </p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Preferences Saved Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Counter & Shift Assignment */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">Counter &amp; Operator Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Active Reception Counter</label>
              <select
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option>Desk 01 - Emergency &amp; Triage Reception</option>
                <option>Desk 02 - General Reception</option>
                <option>Desk 03 - Ayushman Bharat / PM-JAY Helpdesk</option>
                <option>Desk 04 - Pediatric &amp; Maternity Wing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Duty Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option>Morning Shift (08:00 AM - 02:00 PM)</option>
                <option>Evening Shift (02:00 PM - 08:00 PM)</option>
                <option>Night Emergency (08:00 PM - 08:00 AM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default OPD Routing</label>
              <select
                value={defaultDepartment}
                onChange={(e) => setDefaultDepartment(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option>General OPD</option>
                <option>Pediatrics</option>
                <option>Orthopedics</option>
                <option>Ayurveda OPD</option>
                <option>ENT</option>
                <option>Dermatology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Logged In Staff Member</label>
              <input
                type="text"
                disabled
                value="Ananya Deshmukh (Emp #STF-402)"
                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hardware & Token Slip Printer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Printer className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">Slip Printer &amp; Hardware</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Connected Thermal Slip Printer</label>
                <select
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                >
                  <option>EPSON TM-T82X (Thermal 80mm - USB 01)</option>
                  <option>TVS RP-3200 Plus (Ethernet)</option>
                  <option>Citizen CT-S310II (Network Printer)</option>
                  <option>System Default PDF Virtual Printer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slip Print Format</label>
                <select
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                >
                  <option>Standard MediKiosk Token + QR Code (80mm)</option>
                  <option>Compact Receipt Only (58mm)</option>
                  <option>Bilingual (English + Marathi/Hindi)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintTokens}
                  onChange={(e) => setAutoPrintTokens(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-700"
                />
                <span className="text-xs font-medium text-slate-700">
                  Automatically print paper token immediately upon registration &amp; check-in
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Waiting Hall Screen & Audio Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Tv className="w-4 h-4 text-teal-800" />
            <h2 className="text-sm font-bold text-slate-900">Waiting Hall Display &amp; Audio Broadcast</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={soundChime}
                onChange={(e) => setSoundChime(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-700"
              />
              <span className="text-xs font-medium text-slate-700">
                Play hospital audio chime when doctor calls next token from OPD room
              </span>
            </label>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Connected OPD Hall Screen: <strong>Main Lobby Screen #01 (Synced)</strong></span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
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
            Save Workstation Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
