import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Search, ArrowLeft, 
  CheckCircle2 
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment } from '@/services/staff/MockStaffProvider';

export default function StaffCheckIn() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<StaffAppointment | null>(null);
  const [checkedInResult, setCheckedInResult] = useState<StaffAppointment | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const appointments = MockStaffProvider.getAppointments();
    const found = appointments.find(a => 
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.mobile.includes(searchTerm) ||
      a.tokenDisplay.toLowerCase() === searchTerm.toLowerCase() ||
      a.id.toLowerCase() === searchTerm.toLowerCase() ||
      (a.abhaId && a.abhaId.includes(searchTerm))
    );

    if (found) {
      setSelectedPatient(found);
      setCheckedInResult(null);
    } else {
      setSelectedPatient(null);
    }
  };

  const handlePerformCheckIn = () => {
    if (!selectedPatient) return;
    const res = MockStaffProvider.checkInPatient(selectedPatient.id);
    if (res) {
      setCheckedInResult(res);
      setSelectedPatient(res);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Arrival & Check-In</h1>
            <p className="text-xs text-slate-500 font-medium">Verify arrival, assign live queue position, and print token receipt</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Desk 02
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Search Scheduled Patient</h2>
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Mobile (e.g. 9876543210), ABHA ID, Token (OPD-010), or Name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Lookup Patient
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          Tip: You can scan the QR code on the patient's appointment slip or type their 10-digit registered mobile number.
        </p>
      </div>

      {/* Check In Success Box */}
      {checkedInResult && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-sm">Check-In Successful — Patient Routed to OPD Queue</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Token Number</span>
              <span className="font-mono font-black text-teal-800 text-base">{checkedInResult.tokenDisplay}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Clinic Room</span>
              <span className="font-bold text-slate-800">{checkedInResult.roomNumber} ({checkedInResult.opdDepartment})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Doctor</span>
              <span className="font-semibold text-slate-800">{checkedInResult.doctorName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Est. Waiting</span>
              <span className="font-bold text-amber-700">~ 15 mins</span>
            </div>
          </div>
        </div>
      )}

      {/* Patient Result Card */}
      {selectedPatient ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900">{selectedPatient.patientName}</h3>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {selectedPatient.tokenDisplay}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPatient.age} years • {selectedPatient.gender} • Mobile: {selectedPatient.mobile}
              </p>
            </div>

            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
              selectedPatient.status === 'Waiting'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : selectedPatient.status === 'In Consultation'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {selectedPatient.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Appointment Schedule</span>
              <p className="font-bold text-slate-800">{selectedPatient.appointmentTime}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{selectedPatient.appointmentType}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Assigned Clinic & Doctor</span>
              <p className="font-bold text-slate-800">{selectedPatient.doctorName}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{selectedPatient.opdDepartment} • {selectedPatient.roomNumber}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Payment & Documents</span>
              <p className="font-bold text-slate-800">{selectedPatient.paymentStatus}</p>
              <p className="text-emerald-700 text-[11px] mt-0.5 font-semibold">Documents Verified</p>
            </div>
          </div>

          {/* Action Button */}
          {selectedPatient.status === 'Scheduled' && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handlePerformCheckIn}
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Confirm Patient Arrival & Check In</span>
              </button>
            </div>
          )}
        </div>
      ) : searchTerm && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 text-xs">
          No scheduled appointment found matching "{searchTerm}".
          <div className="mt-3">
            <button
              onClick={() => navigate('/staff/register')}
              className="text-teal-800 font-bold hover:underline cursor-pointer"
            >
              Click here to create a New Walk-In Registration
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
